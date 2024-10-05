'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation'; // For navigation in App Router
import styles from './HomePage.module.css'; // Import the CSS module
import AddUser from '@/components/AddDummyUser';

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
        router.push('/'); // Redirect to sign-in page after sign out
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

  // Prevent rendering of the page until the authentication check is complete
  if (!authChecked) {
    return <div>Loading...</div>; // Optionally display a loading spinner or message
  }

  // The rest of the component renders only after authentication
  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <h1>Buckets</h1>
      </header>
      <main className={styles.appContent}>
        {user && (
          <div>
            <p>Welcome, {user.email}</p>
            <button className="btn" onClick={async () => await supabase.auth.signOut()}>Sign Out</button>
            {user && <AddUser name={user.user_metadata.full_name } email={user.email?? ''} />}
          </div>
        )}
      </main>
      <footer className={styles.appFooter}>
        <p>&copy; 2024 Buckets Game. All rights reserved.</p>
      </footer>
    </div>
  );
};

HomePage.displayName = 'HomePage';

export default HomePage;
