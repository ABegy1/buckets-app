'use client'; // Required in App Router for components using hooks
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation'; // For navigation in App Router
import styles from './HomePage.module.css'; // Import the CSS module
import Link from 'next/link';
import AddUser from '@/components/AddDummyUser';

const useUserRole = (fullName: string) => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        console.log('Fetching user role for:', fullName); // Debugging log
        const response = await fetch(`/api/addUser?full_name=${encodeURIComponent(fullName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user role');
        }
        const data = await response.json();
        console.log('User role fetched:', data.role); // Debugging log
        setRole(data.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
        console.log('Finished fetching role. Loading:', loading); // Debugging log
      }
    };

    if (fullName) {
      fetchUserRole();
    }
  }, [fullName]);

  return { role, loading };
};

const HomePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter(); // Import from 'next/navigation'

  // Debugging log for user session
  const { role, loading: roleLoading } = useUserRole(user?.user_metadata.full_name ?? '');
  console.log('Current user:', user); // Debugging log
  console.log('Role loading status:', roleLoading); // Debugging log
  console.log('User role:', role); // Debugging log

  // Check user session and handle redirect
  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session data:', session); // Debugging log
      setUser(session?.user ?? null);
    };

    getUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state change detected. Session:', session); // Debugging log
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle role-based redirection
  useEffect(() => {
    if (!user) return;

    if (!roleLoading && role) {
      console.log('User is authenticated. Redirecting...'); // Debugging log
      if (role === 'Admin') {
        router.push('/admin'); // Redirect to admin page
      } else {
        router.push('/user'); // Redirect to user page
      }
    }
  }, [user, role, roleLoading, router]);

  // Show loading screen while checking user session and role
  if (!user || roleLoading) {
    console.log('Still loading user or role...'); // Debugging log
    return <div className={styles.loading}>Loading...</div>;
  }

  // Sign In Button if not authenticated
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.log('Error signing in with Google:', error.message);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.log('Error signing out:', error.message);
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
            {/* Render AddUser component test */}
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
