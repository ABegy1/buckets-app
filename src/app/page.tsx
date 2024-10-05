'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation'; // For navigation in App Router
import type { User } from '@supabase/supabase-js';

const useUserRole = (fullName: string | null) => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!fullName) return;

    const fetchUserRole = async () => {
      try {
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
    };

    getUserSession();

    // Listen to auth state changes (including sign-out)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user ?? null); // User signed in or state updated
      } else {
        setUser(null); // User signed out
        router.push('/'); // Redirect to sign-in page after sign out
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Automatically handle sign-in if no user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
        });
        if (error) console.error('Error signing in with Google:', error.message);
      };

      signInWithGoogle();
    }
  }, [loading, user]);

  // Handle role-based redirection after session and role are both loaded
  useEffect(() => {
    if (user && role) {
      if (role === 'Admin') {
        router.push('/Admin'); // Redirect to admin page
      } else {
        router.push('/User'); // Redirect to user page
      }
    }
  }, [user, role, router]);

  // Render nothing, just handle routing
  return null;
};

HomePage.displayName = 'HomePage';

export default HomePage;
