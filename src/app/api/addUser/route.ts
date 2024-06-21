import { NextRequest, NextResponse } from 'next/server';
import { createUser, getRoleByName } from '@/db/queries';


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
  const { searchParams } = new URL(req.url);
  const fullName = searchParams.get('full_name');

  if (!fullName) {
    return NextResponse.json({ error: 'Full name not provided' }, { status: 400 });
  }

  try {
    const role = await getRoleByName(fullName);
    if (!role) {
      return NextResponse.json({ error: 'User not found or no role assigned' }, { status: 404 });
    }
    return NextResponse.json({ role }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch user role:', error);
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
  }
}