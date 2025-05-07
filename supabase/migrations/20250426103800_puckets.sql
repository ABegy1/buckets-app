-- Create a new schema to put all the puckets tables in
CREATE SCHEMA puckets;
GRANT USAGE ON SCHEMA puckets TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA puckets TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA puckets TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA puckets TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA puckets GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA puckets GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA puckets GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;


-- Table: puckets.tiers
CREATE TABLE IF NOT EXISTS puckets.tiers
(
    tier_id integer NOT NULL,
    tier_name text NOT NULL,
    tier_rating integer NOT NULL,
    color text NOT NULL,
    CONSTRAINT tiers_PK PRIMARY KEY (tier_id)
);


-- Table: puckets.players
CREATE TABLE IF NOT EXISTS puckets.players
(
    player_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    name text NOT NULL,
    is_hidden boolean DEFAULT false,
    is_inactive boolean DEFAULT false,
    CONSTRAINT players_PK PRIMARY KEY (player_id)
);

-- Table: puckets.seasons
CREATE TABLE IF NOT EXISTS puckets.seasons
(
    season_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    season_name text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    rules text NOT NULL,
    CONSTRAINT seasons_PK PRIMARY KEY (season_id)
);

-- Table: puckets.player_instance
CREATE TABLE IF NOT EXISTS puckets.player_instance
(
    player_instance_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    player_id integer NOT NULL,
    season_id integer NOT NULL,
    rating integer NOT NULL,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    draws integer DEFAULT 0,
    highest_rating integer,
    lowest_rating integer,
    successive_wins integer DEFAULT 0,
    successive_loss integer DEFAULT 0,
    CONSTRAINT player_instance_PK PRIMARY KEY (player_instance_id),
    CONSTRAINT player_instance_player_id_players_player_id_fk FOREIGN KEY (player_id)
        REFERENCES puckets.players (player_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT player_instance_season_id_FK FOREIGN KEY (season_id)
        REFERENCES puckets.seasons (season_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- Table: puckets.users
CREATE TABLE IF NOT EXISTS puckets.users
(
    email text NOT NULL,
    role text NOT NULL DEFAULT 'General'::text,
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    name text NOT NULL,
    "View" text NOT NULL DEFAULT 'Standings'::text,
    CONSTRAINT users_PK PRIMARY KEY (id),
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Table: puckets.shots
CREATE TABLE IF NOT EXISTS puckets.matches
(
    match_id integer NOT NULL,
    season_id integer NOT NULL,
    player1_instance_id integer NOT NULL,
    player1_rating integer NOT NULL,
    player2_instance_id integer NOT NULL,
    player2_rating integer NOT NULL,
    match_date timestamp without time zone,
    player1_score integer NOT NULL,
    player1_rating_result integer NOT NULL,
    player2_score integer NOT NULL,
    player2_rating_result integer NOT NULL,
    CONSTRAINT matches_PK PRIMARY KEY (match_id),
    CONSTRAINT matches_season_id_FK FOREIGN KEY (season_id)
        REFERENCES puckets.seasons (season_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT matches_player1_instance_id_FK FOREIGN KEY (player1_instance_id)
        REFERENCES puckets.player_instance (player_instance_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT matches_player2_instance_id_FK FOREIGN KEY (player2_instance_id)
        REFERENCES puckets.player_instance (player_instance_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    UNIQUE (player1_instance_id, player2_instance_id)
);

-- Table: puckets.stats
CREATE TABLE IF NOT EXISTS puckets.player_stats
(
    player_id integer,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    draws integer DEFAULT 0,
    highest_rating integer,
    lowest_rating integer,
    mvp_awards integer DEFAULT 0,
    seasons_played integer DEFAULT 0,
    CONSTRAINT stats_player_id_FK FOREIGN KEY (player_id)
        REFERENCES puckets.players (player_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- View: puckets.match_details
-- Combines the match table with player names from the players tabls
CREATE OR REPLACE VIEW puckets.match_details
 AS
 SELECT m.match_id,
    m.season_id,
	pi1.player_instance_id as player1_instance_id,
    pl1.name AS player1_name,
    m.player1_rating,
	pi2.player_instance_id as player2_instance_id,
    pl2.name AS player2_name,
    m.player2_rating,
    m.match_date,
    m.player1_score,
    m.player1_rating_result,
    m.player2_score,
    m.player2_rating_result
   FROM puckets.matches m
     JOIN puckets.player_instance pi1 ON m.player1_instance_id = pi1.player_instance_id
     JOIN puckets.players pl1 ON pi1.player_instance_id = pl1.player_id
     JOIN puckets.player_instance pi2 ON m.player2_instance_id = pi2.player_instance_id
     JOIN puckets.players pl2 ON pi2.player_instance_id = pl2.player_id;
