import { db } from './index';
import { InsertUser,  usersTable } from './schema';

export async function createUser(data: InsertUser) {
  await db.insert(usersTable).values(data);
}

export async function fetchUsers(): Promise<InsertUser[]> {
  return await db.select().from(usersTable).execute();
}

import { SelectUser } from '@/db/schema';

export const isAdmin = (user: SelectUser): boolean => {
  return user.role === 'Admin';
};

