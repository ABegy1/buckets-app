-- Match record_shot to production schemas where public.shots.result is integer.
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
