import { createClient } from '@supabase/supabase-js'; // Import the Supabase client creation function

/**
 * Supabase Configuration
 * 
 * The Supabase project URL and anonymous key are retrieved from environment variables.
 * These values are necessary for connecting to the Supabase backend.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Supabase project URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Supabase public anonymous key

// Error handling: Log a warning if Supabase URL or anon key is missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or anon key not found'); // Warn developers about missing environment variables
}

/**
 * Supabase Client
 * 
 * Creates and exports a Supabase client instance, which can be used for interacting
 * with the Supabase backend (e.g., authentication, database operations).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey); // Initialize Supabase client

/**
 * loginWithGoogle Function
 * 
 * Initiates the Google OAuth sign-in process using Supabase's authentication service.
 * This function can be called to allow users to log in with their Google account.
 */
export async function loginWithGoogle() {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'google', // Specify Google as the OAuth provider
    });
  } catch (error) {
    console.error('Error during Google login:', error.message); // Log any errors during login
  }
}

/**
 * logout Function
 * 
 * Signs out the currently authenticated user. If an error occurs during the logout process,
 * it logs the error message to the console.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut(); // Call Supabase's sign-out method

  if (error) {
    console.error('Error logging out:', error.message); // Log the error if logout fails
  }
}
