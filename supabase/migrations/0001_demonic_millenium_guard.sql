CREATE TABLE IF NOT EXISTS "player_instance" (
	"player_instance_id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"season_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"shots_left" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "players" (
	"player_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tier_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seasons" (
	"season_id" serial PRIMARY KEY NOT NULL,
	"season_name" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"shot_total" integer NOT NULL,
	"rules" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shots" (
	"shot_id" serial PRIMARY KEY NOT NULL,
	"instance_id" integer NOT NULL,
	"shot_date" timestamp NOT NULL,
	"result" text NOT NULL,
	"tier_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
	"team_id" serial PRIMARY KEY NOT NULL,
	"team_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tiers" (
	"tier_id" serial PRIMARY KEY NOT NULL,
	"tier_name" text NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'General' NOT NULL,
	"status" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DROP TABLE "posts_table";--> statement-breakpoint
DROP TABLE "users_table";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_instance" ADD CONSTRAINT "player_instance_player_id_players_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("player_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_instance" ADD CONSTRAINT "player_instance_season_id_seasons_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("season_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_instance" ADD CONSTRAINT "player_instance_team_id_teams_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("team_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_tier_id_tiers_tier_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."tiers"("tier_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shots" ADD CONSTRAINT "shots_instance_id_player_instance_player_instance_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."player_instance"("player_instance_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shots" ADD CONSTRAINT "shots_tier_id_tiers_tier_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."tiers"("tier_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
