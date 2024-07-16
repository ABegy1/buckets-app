import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Retaining the old users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('General')
});

// New schema definitions
export const tiersTable = pgTable('tiers', {
  tierId: serial('tier_id').primaryKey(),
  tierName: text('tier_name').notNull(),
  color: text('color').notNull()
});

export const playersTable = pgTable('players', {
  playerId: serial('player_id').primaryKey(),
  name: text('name').notNull(),
  tierId: integer('tier_id')
    .notNull()
    .references(() => tiersTable.tierId, { onDelete: 'cascade' })
});

export const teamsTable = pgTable('teams', {
  teamId: serial('team_id').primaryKey(),
  teamName: text('team_name').notNull()
});

export const seasonsTable = pgTable('seasons', {
  seasonId: serial('season_id').primaryKey(),
  seasonName: text('season_name').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  shotTotal: integer('shot_total').notNull(),
  rules: text('rules').notNull()
});

export const playerInstanceTable = pgTable('player_instance', {
  playerInstanceId: serial('player_instance_id').primaryKey(),
  playerId: integer('player_id')
    .notNull()
    .references(() => playersTable.playerId, { onDelete: 'cascade' }),
  seasonId: integer('season_id')
    .notNull()
    .references(() => seasonsTable.seasonId, { onDelete: 'cascade' }),
  teamId: integer('team_id')
    .notNull()
    .references(() => teamsTable.teamId, { onDelete: 'cascade' }),
  shotsLeft: integer('shots_left').notNull()
});

export const shotsTable = pgTable('shots', {
  shotId: serial('shot_id').primaryKey(),
  instanceId: integer('instance_id')
    .notNull()
    .references(() => playerInstanceTable.playerInstanceId, { onDelete: 'cascade' }),
  shotDate: timestamp('shot_date').notNull(),
  result: text('result').notNull(),
  tierId: integer('tier_id')
    .notNull()
    .references(() => tiersTable.tierId, { onDelete: 'cascade' })
});

// Types for inferred insert and select
export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export type InsertTier = typeof tiersTable.$inferInsert;
export type SelectTier = typeof tiersTable.$inferSelect;

export type InsertPlayer = typeof playersTable.$inferInsert;
export type SelectPlayer = typeof playersTable.$inferSelect;

export type InsertTeam = typeof teamsTable.$inferInsert;
export type SelectTeam = typeof teamsTable.$inferSelect;

export type InsertSeason = typeof seasonsTable.$inferInsert;
export type SelectSeason = typeof seasonsTable.$inferSelect;

export type InsertPlayerInstance = typeof playerInstanceTable.$inferInsert;
export type SelectPlayerInstance = typeof playerInstanceTable.$inferSelect;

export type InsertShot = typeof shotsTable.$inferInsert;
export type SelectShot = typeof shotsTable.$inferSelect;
