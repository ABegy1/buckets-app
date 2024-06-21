import { NextRequest, NextResponse } from 'next/server';
import { createUser, hasAdmin } from '@/db/queries';


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
  try {
    const adminExists = await hasAdmin();
    return NextResponse.json({ hasAdmin: adminExists }, { status: 200 });
  } catch (error) {
    console.error('Failed to check for admin:', error);
    return NextResponse.json({ error: 'Failed to check for admin' }, { status: 500 });
  }
}