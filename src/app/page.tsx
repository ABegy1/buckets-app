'use client'; // Required in Next.js App Router for client-side rendering

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Supabase client for authentication and database operations
import type { User } from '@supabase/supabase-js'; // Supabase User type definition
import { useRouter } from 'next/navigation'; // Next.js router for navigation

/**
 * Custom Hook: useUserRole
 * 
 * Fetches the role of a user based on their full name by making an API call.
 * Tracks the user's role using state.
 * 
 * @param {string | null} fullName - The full name of the user.
 * @returns {Object} - An object containing the user's role.
 */
const useUserRole = (fullName: string | null) => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!fullName) return; // Skip fetching role if full name is not available

    const fetchUserRole = async () => {
      try {
        console.log('Fetching user role for:', fullName);
        const response = await fetch(`/api/addUser?full_name=${encodeURIComponent(fullName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user role');
        }
        const data = await response.json();
        setRole(data.role); // Set the fetched role in state
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, [fullName]);

  return { role }; // Return the user's role
};

/**
 * HomePage Component
 * 
 * The main entry point of the application. Handles user authentication,
 * role fetching, user addition to the database, and redirects based on user role.
 */
const HomePage = () => {
  const [user, setUser] = useState<User | null>(null); // Current authenticated user
  const [loading, setLoading] = useState(true); // Tracks whether session is being checked
  const [authChecked, setAuthChecked] = useState(false); // Tracks if authentication check is complete
  const [userAdded, setUserAdded] = useState(false); // Tracks whether the user has been added to the database
  const router = useRouter(); // Next.js router for navigation

  // Fetch the user role using a custom hook
  const { role } = useUserRole(user?.user_metadata.full_name ?? null);

  /**
   * Fetch the current user session and set up authentication state change listener.
   */
  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
      } else {
        setUser(session?.user ?? null); // Set the authenticated user
      }
      setLoading(false); // Authentication check is done
      setAuthChecked(true);
    };

    getUserSession();

    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user ?? null); // Update user state when signed in
      } else {
        setUser(null); // Clear user state on sign-out
        router.push('/'); // Redirect to homepage after sign-out
      }
    });

    return () => {
      authListener.subscription.unsubscribe(); // Clean up listener on component unmount
    };
  }, [router]);

    /**
   * Automatically sign in the user with email if running in dev. Google otherwise
   */
  useEffect(() => {
    if (authChecked && !loading && !user) {
      if(process.env.NODE_ENV == 'development'){
        console.log("Running in dev mode, logging in with local account");
        const signInWithEmail = async () => {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: 'admin@admin.com',
            password: 'Bucketspass011!',
          });
          if (error) {
            console.error('Error signing in with email:', error.message);
          }
          else {
            console.log('User logged in: ', data);
          }
        };

        signInWithEmail();
      }
      else{
        console.log("Logging in with Google");
        const signInWithGoogle = async () => {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
          });
          if (error) console.error('Error signing in with Google:', error.message);
        };

        signInWithGoogle();
      }
    }
  }, [authChecked, loading, user]);

  /**
   * Add the user to the database if they don't already exist.
   */
  useEffect(() => {
    const addUserIfNotExists = async () => {
      if (user && !userAdded) {
        const { data, error } = await supabase
          .from('users')
          .select('email')
          .eq('email', user.email);

        if (!data || data.length === 0) {
          // User doesn't exist; add them to the database
          console.log('User not found, adding to Supabase');
          await supabase
            .from('users')
            .insert([{ name: user.user_metadata.full_name, email: user.email, role: 'User', View: 'Standings' }]);
          setUserAdded(true);
        } else {
          console.log('User already exists in Supabase');
          setUserAdded(true);
        }
      }
    };

    if (user) {
      addUserIfNotExists();
    }
  }, [user, userAdded]);

  /**
   * Redirect the user based on their role after session and role checks are complete.
   */
  useEffect(() => {
    if (user && role && userAdded) {
      if (role === 'Admin') {
        router.push('/Admin'); // Redirect admins to the admin page
      } else {
        router.push('/Standings'); // Redirect standard users to the standings page
      }
    }
  }, [user, role, router, userAdded]);

  // Prevent rendering until authentication check is complete
  return null; // Render nothing while processing authentication
};

export default HomePage;
