import { NextRequest, NextResponse } from 'next/server';
import { createUser, isAdmin } from '@/db/queries';
import { db } from '@/db';
import { SelectUser, usersTable } from '@/db/schema';
import { NextApiRequest, NextApiResponse } from 'next';

export async function POST(req: NextRequest) {
  const userData = await req.json();

  try {
    console.log('Received user data:', userData);
    await createUser(userData);
    return NextResponse.json({ message: 'User added successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to add user:', error);
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
  }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.cookies['user_id']; // Assuming user_id is stored in cookies

  if (!userId) {
    return res.status(401).json({ error: 'User ID not found' });
  }

  try {
    const adminStatus = await isAdmin(Number(userId));
    return res.status(200).json({ isAdmin: adminStatus });
  } catch (error) {
    console.error('Failed to check admin status:', error);
    return res.status(500).json({ error: 'Failed to check admin status' });
  }
}