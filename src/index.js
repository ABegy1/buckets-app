// Import global styles
import './index.css'; // Global CSS file for styling the application

// Import React hooks for state management and lifecycle methods
import { useState, useEffect } from 'react';

// Import Supabase client creation function
import { createClient } from '@supabase/supabase-js';

// Import Supabase authentication components and theme
import { Auth } from '@supabase/auth-ui-react'; // Authentication UI for Supabase
import { ThemeSupa } from '@supabase/auth-ui-shared'; // Default Supabase theme for Auth UI

// Initialize Supabase client with the project URL and public anon key
const supabase = createClient(
  'https://pigzvnjbzrlitabxqtsm.supabase.co', // Supabase project URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZ3p2bmpienJsaXRhYnhxdHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg5MTQ4NDksImV4cCI6MjAzNDQ5MDg0OX0.RjkRYiCcRQLYto2ensG1wZCXmQFxjR-QhyRR1qZV0iA' // Public anon key
);

/**
 * App Component
 * 
 * This component handles user authentication and manages session state.
 * It displays an authentication UI when the user is not logged in and a
 * simple logged-in message when the user is authenticated.
 */
export default function App() {
  // State to store the current authentication session
  const [session, setSession] = useState(null);

  /**
   * useEffect Hook:
   * - Fetches the current session on component mount.
   * - Sets up a real-time listener for authentication state changes.
   * - Cleans up the listener when the component is unmounted.
   */
  useEffect(() => {
    // Fetch the current session from Supabase on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); // Update session state with the current session
    });

    // Set up an authentication state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session); // Update session state whenever the auth state changes
    });

    // Clean up the subscription listener on unmount
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Render Logic:
   * - If no session exists, display the Supabase authentication UI.
   * - If a session exists, display a logged-in message.
   */
  if (!session) {
    // Render authentication UI when user is not logged in
    return (
      <Auth
        supabaseClient={supabase} // Pass the initialized Supabase client
        appearance={{ theme: ThemeSupa }} // Use the default Supabase theme for the Auth UI
      />
    );
  } else {
    // Render a simple logged-in message when user is authenticated
    return <div>Logged in!</div>;
  }
}
