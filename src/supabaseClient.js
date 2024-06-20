import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or anon key not found');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function loginWithGoogle() {supabase.auth.signInWithOAuth({
    provider: 'google',
  })
  
};

 


export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error logging out:', error.message);
  }
}
