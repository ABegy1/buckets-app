import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/index';
import { usersTable, SelectUser } from '@/db/schema';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const users: SelectUser[] = await db.select().from(usersTable).execute();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export default handler;