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
  const router = useRouter(); // For navigation

  // Fetch the user role once user is signed in
  const { role } = useUserRole(user?.user_metadata.full_name ?? null);
  console.log(user, role);

  // Fetch user session and update state
  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
      } else {
        setUser(session?.user ?? null);
      }
    };

    getUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle role-based redirection after session and role are both loaded
  useEffect(() => {
    console.log(user, role);
    if (user && role) {
      console.log("got user and role")
      if (role === 'Admin') {
        console.log("pushed to admin page")
        router.push('/admin'); // Redirect to admin page
      } else {
        router.push('/user'); // Redirect to user page
      }
    }
  }, [user, role, router]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.error('Error signing in with Google:', error.message);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error.message);
  };

  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <h1>Buckets</h1>
      </header>
      <main className={styles.appContent}>
        {!user ? (
          <button className="btn" onClick={signInWithGoogle}>Sign In with Google</button>
        ) : (
          <div>
            <p>Welcome, {user.email}</p>
            <button className="btn" onClick={signOut}>Sign Out</button>
            {user && <AddUser name={user.user_metadata.full_name} email={user.email} />}
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
