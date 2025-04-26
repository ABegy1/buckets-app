-- player_instance
ALTER TABLE IF EXISTS public.player_instance DROP COLUMN team_id;

ALTER TABLE IF EXISTS public.player_instance ADD COLUMN score integer DEFAULT 0;

ALTER TABLE IF EXISTS public.player_instance ALTER COLUMN player_instance_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.player_instance ALTER COLUMN player_instance_id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE IF EXISTS public.player_instance DROP CONSTRAINT player_instance_player_id_players_player_id_fk;
ALTER TABLE IF EXISTS public.player_instance ADD CONSTRAINT player_instance_player_id_players_player_id_fk FOREIGN KEY (player_id) REFERENCES public.players (player_id) ON DELETE cascade ON UPDATE cascade;

ALTER TABLE IF EXISTS public.player_instance DROP CONSTRAINT player_instance_season_id_seasons_season_id_fk;
ALTER TABLE IF EXISTS public.player_instance ADD CONSTRAINT player_instance_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.seasons (season_id) ON DELETE restrict ON UPDATE cascade;

-- players
ALTER TABLE IF EXISTS public.players ADD COLUMN is_hidden boolean DEFAULT False;

ALTER TABLE IF EXISTS public.players ADD COLUMN is_free_agent boolean;

ALTER TABLE IF EXISTS public.players ADD COLUMN team_id integer;
ALTER TABLE IF EXISTS public.players ADD CONSTRAINT fk_players_teams FOREIGN KEY (team_id) REFERENCES public.teams (team_id) ON DELETE SET NULL ON UPDATE cascade;

ALTER TABLE IF EXISTS public.players ALTER COLUMN player_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.players ALTER COLUMN player_id TYPE integer;
ALTER TABLE IF EXISTS public.players ALTER COLUMN player_id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE IF EXISTS public.players ALTER COLUMN tier_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.players DROP CONSTRAINT players_tier_id_tiers_tier_id_fk;
ALTER TABLE IF EXISTS public.players ADD CONSTRAINT players_tier_id_tiers_tier_id_fk FOREIGN KEY (tier_id) REFERENCES public.tiers (tier_id) ON DELETE SET NULL ON UPDATE cascade;


-- seasons
ALTER TABLE IF EXISTS public.seasons ALTER COLUMN season_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.seasons ALTER COLUMN season_id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE IF EXISTS public.seasons ALTER COLUMN start_date TYPE timestamptz;

ALTER TABLE IF EXISTS public.seasons ALTER COLUMN end_date TYPE timestamptz;
ALTER TABLE IF EXISTS public.seasons ALTER COLUMN end_date DROP NOT NULL;

-- shots
ALTER TABLE IF EXISTS public.shots ALTER COLUMN shot_id DROP DEFAULT;

ALTER TABLE IF EXISTS public.shots DROP CONSTRAINT shots_instance_id_player_instance_player_instance_id_fk;
ALTER TABLE IF EXISTS public.shots ADD CONSTRAINT shots_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.player_instance (player_instance_id) ON DELETE cascade ON UPDATE cascade;

ALTER TABLE IF EXISTS public.shots ALTER COLUMN shot_date DROP NOT NULL;

ALTER TABLE IF EXISTS public.shots ALTER COLUMN result TYPE integer USING (result::integer);
ALTER TABLE IF EXISTS public.shots ALTER COLUMN result SET DEFAULT 0;

ALTER TABLE IF EXISTS public.shots DROP CONSTRAINT shots_tier_id_tiers_tier_id_fk;
ALTER TABLE IF EXISTS public.shots ADD CONSTRAINT shots_tier_id_tiers_tier_id_fk FOREIGN KEY (tier_id) REFERENCES public.tiers (tier_id) ON DELETE SET NULL ON UPDATE cascade;

ALTER TABLE IF EXISTS public.shots ALTER COLUMN shot_date DROP NOT NULL;

-- -- teams
ALTER TABLE IF EXISTS public.teams ADD COLUMN team_score integer;

ALTER TABLE IF EXISTS public.teams ALTER COLUMN team_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.teams ALTER COLUMN team_id ADD GENERATED ALWAYS AS IDENTITY;

-- -- tiers
ALTER TABLE IF EXISTS public.tiers ALTER COLUMN tier_id DROP DEFAULT;

-- -- users
ALTER TABLE IF EXISTS public.users ADD PRIMARY KEY (id);


CREATE TABLE IF NOT EXISTS public.stats (
	stat_id         integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
	player_id       integer DEFAULT 0,
	total_score     integer DEFAULT 0,
	total_shots     integer DEFAULT 0,
	team_wins       integer DEFAULT 0,
	mvp_awards      integer DEFAULT 0,
    seasons_played  integer DEFAULT 0,
    high            integer DEFAULT 0,
    low             integer DEFAULT 0,
    CONSTRAINT stats_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players (player_id) ON DELETE cascade ON UPDATE cascade
);

CREATE TABLE IF NOT EXISTS public.tier_stats (
    id              bigint  PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
    player_id       integer NOT NULL,
    tier_id         integer NOT NULL,
    total_score     integer DEFAULT 0,
    total_shots     integer DEFAULT 0,
    high            integer DEFAULT 0,
    low             integer DEFAULT 0,
    CONSTRAINT tier_stats_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players (player_id) ON DELETE cascade ON UPDATE cascade,
    CONSTRAINT tier_stats_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.tiers (tier_id) ON DELETE cascade ON UPDATE cascade
);