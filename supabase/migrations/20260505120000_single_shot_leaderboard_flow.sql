-- Record shots and refresh standings through a single server-side path.

-- Ensure shots can be inserted without client-generated identifiers.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND n.nspname = 'public'
      AND c.relname = 'shots_shot_id_seq'
  ) THEN
    CREATE SEQUENCE public.shots_shot_id_seq OWNED BY public.shots.shot_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shots'
      AND column_name = 'shot_id'
      AND is_identity = 'NO'
      AND column_default IS NULL
  ) THEN
    ALTER TABLE public.shots ALTER COLUMN shot_id SET DEFAULT nextval('public.shots_shot_id_seq');
  END IF;

  PERFORM setval(
    'public.shots_shot_id_seq',
    GREATEST(COALESCE((SELECT max(shot_id) FROM public.shots), 0), 1),
    COALESCE((SELECT max(shot_id) FROM public.shots), 0) > 0
  );
END $$;

CREATE OR REPLACE FUNCTION public.record_shot(
  p_instance_id integer,
  p_tier_id integer,
  p_result integer,
  p_use_dash boolean DEFAULT false
)
RETURNS TABLE (
  shot_id integer,
  shot_date timestamptz,
  player_instance_id integer,
  score integer,
  shots_left integer,
  shots_left_dashes integer,
  shots_taken_today integer,
  todays_score integer,
  current_make_streak integer,
  current_miss_streak integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_shot public.shots%ROWTYPE;
  updated_player public.player_instance%ROWTYPE;
BEGIN
  INSERT INTO public.shots (instance_id, shot_date, result, tier_id)
  VALUES (p_instance_id, now(), p_result, p_tier_id)
  RETURNING * INTO inserted_shot;

  UPDATE public.player_instance pi
  SET
    score = COALESCE(pi.score, 0) + p_result,
    shots_left = GREATEST(COALESCE(pi.shots_left, 0) - 1, 0),
    shots_left_dashes = GREATEST(COALESCE(pi.shots_left_dashes, 0) - CASE WHEN p_use_dash THEN 1 ELSE 0 END, 0)
  WHERE pi.player_instance_id = p_instance_id
  RETURNING * INTO updated_player;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player instance % not found', p_instance_id USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
  WITH ordered_shots AS (
    SELECT
      s.result::integer AS shot_result,
      bool_or(s.result::integer = 0) OVER (
        ORDER BY s.shot_date DESC NULLS LAST, s.shot_id DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ) AS had_newer_miss,
      bool_or(s.result::integer <> 0) OVER (
        ORDER BY s.shot_date DESC NULLS LAST, s.shot_id DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ) AS had_newer_make
    FROM public.shots s
    WHERE s.instance_id = p_instance_id
  ), todays_shots AS (
    SELECT
      count(*)::integer AS shots_taken_today,
      COALESCE(sum(s.result::integer), 0)::integer AS todays_score
    FROM public.shots s
    WHERE s.instance_id = p_instance_id
      AND s.shot_date >= date_trunc('day', now())
      AND s.shot_date < date_trunc('day', now()) + interval '1 day'
  )
  SELECT
    inserted_shot.shot_id,
    inserted_shot.shot_date::timestamptz,
    updated_player.player_instance_id,
    COALESCE(updated_player.score, 0),
    COALESCE(updated_player.shots_left, 0),
    COALESCE(updated_player.shots_left_dashes, 0),
    todays_shots.shots_taken_today,
    todays_shots.todays_score,
    COALESCE(count(*) FILTER (WHERE ordered_shots.shot_result <> 0 AND NOT COALESCE(ordered_shots.had_newer_miss, false)), 0)::integer AS current_make_streak,
    COALESCE(count(*) FILTER (WHERE ordered_shots.shot_result = 0 AND NOT COALESCE(ordered_shots.had_newer_make, false)), 0)::integer AS current_miss_streak
  FROM todays_shots
  LEFT JOIN ordered_shots ON true
  GROUP BY
    todays_shots.shots_taken_today,
    todays_shots.todays_score;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_season_id integer)
RETURNS TABLE (
  team_id integer,
  team_name text,
  player_id integer,
  player_instance_id integer,
  player_name text,
  player_score integer,
  shots_left integer,
  shots_left_dashes integer,
  shots_taken integer,
  pps numeric,
  tier_color text,
  shots_made_in_row integer,
  shots_missed_in_row integer,
  reached_score_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH season_row AS (
    SELECT s.season_id, s.shot_total
    FROM public.seasons s
    WHERE s.season_id = p_season_id
  ), visible_players AS (
    SELECT
      t.team_id,
      t.team_name,
      p.player_id,
      p.name AS player_name,
      pi.player_instance_id,
      COALESCE(pi.score, 0) AS player_score,
      COALESCE(pi.shots_left, 0) AS shots_left,
      GREATEST(0, LEAST(2, COALESCE(pi.shots_left_dashes, 0))) AS shots_left_dashes,
      GREATEST(0, COALESCE(sr.shot_total, 0) - COALESCE(pi.shots_left, 0)) AS shots_taken,
      COALESCE(tiers.color, '#000') AS tier_color
    FROM season_row sr
    JOIN public.player_instance pi ON pi.season_id = sr.season_id
    JOIN public.players p ON p.player_id = pi.player_id
    JOIN public.teams t ON t.team_id = p.team_id
    LEFT JOIN public.tiers ON tiers.tier_id = p.tier_id
    WHERE COALESCE(p.is_hidden, false) = false
      AND COALESCE(t.is_hidden, false) = false
  ), ordered_shots AS (
    SELECT
      s.instance_id,
      s.shot_date,
      s.shot_id,
      s.result::integer AS shot_result,
      sum(s.result::integer) OVER (
        PARTITION BY s.instance_id
        ORDER BY s.shot_date ASC NULLS LAST, s.shot_id ASC
      ) AS cumulative_score,
      bool_or(s.result::integer = 0) OVER (
        PARTITION BY s.instance_id
        ORDER BY s.shot_date DESC NULLS LAST, s.shot_id DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ) AS had_newer_miss,
      bool_or(s.result::integer <> 0) OVER (
        PARTITION BY s.instance_id
        ORDER BY s.shot_date DESC NULLS LAST, s.shot_id DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ) AS had_newer_make
    FROM public.shots s
    JOIN visible_players vp ON vp.player_instance_id = s.instance_id
  ), shot_stats AS (
    SELECT
      vp.player_instance_id,
      COALESCE(count(*) FILTER (WHERE os.shot_result <> 0 AND NOT COALESCE(os.had_newer_miss, false)), 0)::integer AS shots_made_in_row,
      COALESCE(count(*) FILTER (WHERE os.shot_result = 0 AND NOT COALESCE(os.had_newer_make, false)), 0)::integer AS shots_missed_in_row,
      min(os.shot_date) FILTER (WHERE os.cumulative_score >= vp.player_score AND vp.player_score > 0) AS reached_score_at
    FROM visible_players vp
    LEFT JOIN ordered_shots os ON os.instance_id = vp.player_instance_id
    GROUP BY vp.player_instance_id
  )
  SELECT
    vp.team_id,
    vp.team_name,
    vp.player_id,
    vp.player_instance_id,
    vp.player_name,
    vp.player_score,
    vp.shots_left,
    vp.shots_left_dashes,
    vp.shots_taken,
    CASE WHEN vp.shots_taken > 0 THEN vp.player_score::numeric / vp.shots_taken ELSE 0 END AS pps,
    vp.tier_color,
    COALESCE(ss.shots_made_in_row, 0) AS shots_made_in_row,
    COALESCE(ss.shots_missed_in_row, 0) AS shots_missed_in_row,
    ss.reached_score_at
  FROM visible_players vp
  LEFT JOIN shot_stats ss ON ss.player_instance_id = vp.player_instance_id
  ORDER BY
    vp.team_name ASC,
    vp.player_score DESC,
    CASE WHEN vp.shots_taken > 0 THEN vp.player_score::numeric / vp.shots_taken ELSE 0 END DESC,
    ss.reached_score_at ASC NULLS LAST,
    vp.player_name ASC;
$$;

CREATE INDEX IF NOT EXISTS shots_instance_id_shot_date_desc_idx
  ON public.shots (instance_id, shot_date DESC, shot_id DESC);

CREATE INDEX IF NOT EXISTS player_instance_season_id_player_id_idx
  ON public.player_instance (season_id, player_id);

CREATE INDEX IF NOT EXISTS players_team_id_idx
  ON public.players (team_id);

CREATE INDEX IF NOT EXISTS seasons_end_date_idx
  ON public.seasons (end_date);
