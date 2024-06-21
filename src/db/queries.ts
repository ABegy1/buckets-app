import { eq } from 'drizzle-orm';
import { db } from './index';
import { InsertUser,  SelectUser,  usersTable } from './schema';

export async function createUser(data: InsertUser) {
  await db.insert(usersTable).values(data);
}

export async function fetchUsers(): Promise<InsertUser[]> {
  return await db.select().from(usersTable).execute();
}


export async function hasAdmin(): Promise<boolean> {
  const result = await db
    .select({
      role: usersTable.role,
    })
    .from(usersTable)
    .where(eq(usersTable.role, 'Admin'))
    .limit(1)
    .execute();

  return result.length > 0;
}