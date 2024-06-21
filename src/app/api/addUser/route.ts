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


export async function GET(req: NextRequest) {
  const userId = req.cookies.get('user_id'); // Assuming user_id is stored in cookies

  if (!userId) {
    return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
  }

  try {
    const adminStatus = await isAdmin(Number(userId));
    return NextResponse.json({ isAdmin: adminStatus }, { status: 200 });
  } catch (error) {
    console.error('Failed to check admin status:', error);
    return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 });
  }
}