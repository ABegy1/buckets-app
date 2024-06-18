import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/db/queries';

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