import { eq } from 'drizzle-orm';
import { db } from './index';
import {
  InsertUser,
  SelectUser,
  usersTable,
  InsertTier,
  SelectTier,
  tiersTable,
  InsertPlayer,
  SelectPlayer,
  playersTable,
  InsertTeam,
  SelectTeam,
  teamsTable,
  InsertSeason,
  SelectSeason,
  seasonsTable,
  InsertPlayerInstance,
  SelectPlayerInstance,
  playerInstanceTable,
  InsertShot,
  SelectShot,
  shotsTable
} from './schema';
 /**
   * (drizzle schema queries)
   */
// User related queries
export async function createUser(data: InsertUser) {
  await db.insert(usersTable).values(data).execute();
}

export async function fetchUsers(): Promise<SelectUser[]> {
  return await db.select().from(usersTable).execute();
}

export async function getRoleByName(fullName: string): Promise<string | null> {
  const result = await db
    .select({
      role: usersTable.role,
    })
    .from(usersTable)
    .where(eq(usersTable.name, fullName))
    .limit(1)
    .execute();

  const user = result[0];
  return user ? user.role : null;
}

export async function getViewByName(fullName: string): Promise<string | null> {
  const result = await db
    .select({
      view: usersTable.View,
    })
    .from(usersTable)
    .where(eq(usersTable.name, fullName))
    .limit(1)
    .execute();

  const user = result[0];
  return user ? user.view : null;
}

export async function updateUserView(fullName: string, view: string): Promise<void> {
  console.log('Updating user view:', { fullName, view });
  const result = await db
    .update(usersTable)
    .set({
      View: view,
    })
    .where(eq(usersTable.name, fullName))
    .execute();

  console.log('Update result:', result);
  if (!result) {
    throw new Error('Failed to update user view in the database');
  }
}
// Tier related queries
export async function createTier(data: InsertTier) {
  await db.insert(tiersTable).values(data).execute();
}

export async function fetchTiers(): Promise<SelectTier[]> {
  return await db.select().from(tiersTable).execute();
}

// Player related queries
export async function createPlayer(data: InsertPlayer) {
  await db.insert(playersTable).values(data).execute();
}

export async function fetchPlayers(): Promise<SelectPlayer[]> {
  return await db.select().from(playersTable).execute();
}

// Team related queries
export async function createTeam(data: InsertTeam) {
  await db.insert(teamsTable).values(data).execute();
}

export async function fetchTeams(): Promise<SelectTeam[]> {
  return await db.select().from(teamsTable).execute();
}

// Season related queries
export async function createSeason(data: InsertSeason) {
  await db.insert(seasonsTable).values(data).execute();
}

export async function fetchSeasons(): Promise<SelectSeason[]> {
  return await db.select().from(seasonsTable).execute();
}

// Player Instance related queries
export async function createPlayerInstance(data: InsertPlayerInstance) {
  await db.insert(playerInstanceTable).values(data).execute();
}

export async function fetchPlayerInstances(): Promise<SelectPlayerInstance[]> {
  return await db.select().from(playerInstanceTable).execute();
}

// Shot related queries
export async function createShot(data: InsertShot) {
  await db.insert(shotsTable).values(data).execute();
}

export async function fetchShots(): Promise<SelectShot[]> {
  return await db.select().from(shotsTable).execute();
}
