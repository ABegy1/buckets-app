import React from 'react';
import { supabase } from './supabaseClient'; // Import the Supabase client for authentication

/**
 * Login Component
 *
 * This component provides a simple interface for logging in with Google using Supabase's OAuth integration.
 */
const Login = () => {
  /**
   * Handles the Google login process.
   * - Initiates the Google OAuth login flow using Supabase.
   * - Logs the user and session information upon successful login.
   * - Handles and logs any errors that occur during the login process.
   */
  const handleGoogleLogin = async () => {
    try {
      // Initiate Google OAuth login
      const { user, session, error } = await supabase.auth.signInWithOAuth({
        provider: 'google', // Specify Google as the OAuth provider
      });

      // Handle any errors returned by Supabase
      if (error) {
        console.error('Error logging in with Google:', error);
      } else {
        // Log user and session details on successful login
        console.log('User:', user);
        console.log('Session:', session);
      }
    } catch (err) {
      // Catch and log unexpected errors
      console.error('Unexpected error during Google login:', err);
    }
  };

  return (
    <div>
      {/* Button to trigger the Google login process */}
      <button onClick={handleGoogleLogin}>Login with Google</button>
    </div>
  );
};

export default Login;
