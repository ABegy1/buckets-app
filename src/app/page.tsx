'use client'; // Required in Next.js App Router
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const useUserRole = (fullName: string | null) => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!fullName) return;

    const fetchUserRole = async () => {
      try {
        console.log('Fetching user role for:', fullName);
        const response = await fetch(`/api/addUser?full_name=${encodeURIComponent(fullName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user role');
        }
        const data = await response.json();
        setRole(data.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, [fullName]);

  return { role };
};

const HomePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Track if loading is in progress
  const [authChecked, setAuthChecked] = useState(false); // Track if authentication check is done
  const [userAdded, setUserAdded] = useState(false); // Track if user is added
  const router = useRouter(); // For navigation

  // Fetch the user role once user is signed in
  const { role } = useUserRole(user?.user_metadata.full_name ?? null);

  // Fetch user session and update state
  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
      } else {
        setUser(session?.user ?? null);
      }
      setLoading(false); // Loading done after checking session
      setAuthChecked(true); // Authentication check is complete
    };

    getUserSession();

    // Listen to auth state changes (including sign-out)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user ?? null); // User signed in or state updated
      } else {
        setUser(null); // User signed out
        router.push('/'); // Redirect to sign-in page after 
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Automatically handle sign-in if no user is authenticated
  useEffect(() => {
    if (authChecked && !loading && !user) {
      const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
        });
        if (error) console.error('Error signing in with Google:', error.message);
      };

      signInWithGoogle();
    }
  }, [authChecked, loading, user]);

  // Add the user to the Supabase users table if they don't already exist
  useEffect(() => {
    const addUserIfNotExists = async () => {
      if (user && !userAdded) {
        const { data, error } = await supabase
          .from('users')
          .select('email')
          .eq('email', user.email);

        if (!data || data.length === 0) {
          // User doesn't exist, so add them
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

  // Handle role-based redirection after session and role are both loaded
  useEffect(() => {
    if (user && role && userAdded) {
      if (role === 'Admin') {
        router.push('/Admin'); // Redirect to admin page
      } else {
        router.push('/User'); // Redirect to user page
      }
    }
  }, [user, role, router, userAdded]);

  // Prevent rendering until the authentication check is complete
  return null;
};

export default HomePage;
