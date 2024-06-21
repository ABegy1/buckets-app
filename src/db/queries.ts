import { eq } from 'drizzle-orm';
import { db } from './index';
import { InsertUser,  SelectUser,  usersTable } from './schema';

export async function createUser(data: InsertUser) {
  await db.insert(usersTable).values(data);
}

export async function fetchUsers(): Promise<InsertUser[]> {
  return await db.select().from(usersTable).execute();
}


export async function isAdmin(userId: number): Promise<boolean> {
  const result = await db
    .select({
      role: usersTable.role
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .execute();

  const user = result[0];
  return user ? user.role === 'Admin' : false;
}

