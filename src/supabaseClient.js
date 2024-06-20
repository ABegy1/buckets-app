import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or anon key not found');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function loginWithGoogle() {
    const { user, session, error } = await supabase.auth.signIn({
      provider: 'google',
    });
  
    if (error) {
      console.error('Error logging in:', error.message);
    } else {
      console.log('Logged in user:', user);
      console.log('Session:', session);
    }
  }
  
  export async function logout() {
    const { error } = await supabase.auth.signOut();
  
    if (error) {
      console.error('Error logging out:', error.message);
    }
  }
