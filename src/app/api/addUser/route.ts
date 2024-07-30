import { NextRequest, NextResponse } from 'next/server';
import { createUser, getRoleByName, getViewByName, updateUserView } from '@/db/queries';

export async function POST(req: NextRequest) {
  const { name, view } = await req.json();
  console.log('Received request to update user view:', { name, view });

  if (!name || !view) {
    console.error('Name or view not provided:', { name, view });
    return NextResponse.json({ error: 'Name or view not provided' }, { status: 400 });
  }

  try {
    await updateUserView(name, view);
    console.log('User view updated successfully:', { name, view });
    return NextResponse.json({ message: 'User view updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to update user view:', error);
    return NextResponse.json({ error: 'Failed to update user view' }, { status: 500 });
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
    const view = await getViewByName(fullName);
    if (!role || !view) {
      return NextResponse.json({ error: 'User not found or no role/view assigned' }, { status: 404 });
    }
    return NextResponse.json({ role, view }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch user role/view:', error);
    return NextResponse.json({ error: 'Failed to fetch user role/view' }, { status: 500 });
  }
}
