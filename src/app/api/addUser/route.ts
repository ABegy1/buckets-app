import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
/**
 * route.ts
 * 
 * in earlier iterations of the app i was working directly with the vercel postgres database using drizzle as the orm to interact with the database.
 * various queries were written through this path but most of the functionality has been replaced by the supabase api.
 *
 */
export async function POST(req: NextRequest) {
  const { name, view } = await req.json();
  console.log('Received request to update user view:', { name, view });

  if (!name || !view) {
    console.error('Name or view not provided:', { name, view });
    return NextResponse.json({ error: 'Name or view not provided' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { error } = await supabase
      .from('profiles')
      .update({ view_pref: view })
      .eq('display_name', name);

    if (error) {
      throw error;
    }

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
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, view_pref')
      .eq('display_name', fullName)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: 'User not found or no role/view assigned' }, { status: 404 });
    }

    const role = data.is_admin ? 'admin' : 'user';
    return NextResponse.json({ role, view: data.view_pref }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch user role/view:', error);
    return NextResponse.json({ error: 'Failed to fetch user role/view' }, { status: 500 });
  }
}

function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or key is not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}
