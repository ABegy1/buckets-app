'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';
import styles from './HomePage.module.css'; // Import the CSS module
import Link from 'next/link';
import AddUser from '@/components/AddDummyUser';
const useUserRole = (fullName: string) => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`/api/addUser?full_name=${encodeURIComponent(fullName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user role');
        }
        const data = await response.json();
        setRole(data.role);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [fullName]);

  return { role, loading };
};

const HomePage = () => {
  const [user, setUser] = useState<User | null>(null);
  console.log(user);
  const { role, loading  } = useUserRole(user?.user_metadata.full_name ?? '');

  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const addUser = async (user: User) => {
      console.log('Adding user through AddUser component');
      const response = await fetch('/api/addUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user.user_metadata.full_name,
          email: user.email,
        }),
      });

      if (!response.ok) {
        console.error('Failed to add user');
      }
    };

    if (user) {
      addUser(user);
    }
  }, [user]);
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
            {/* Render AddUser component conditionally */}
            {user && <AddUser name={user.user_metadata.full_name} email={user.email} />}
          </div>
        )}
        <div>
          {role === 'Admin' ? (
            <div className={styles.roleMessage}>Welcome, Admin!</div>
          ) : (
            <div className={styles.roleMessage}>Welcome, User!</div>
          )}
        </div>
        <nav className={styles.nav}>
  <ul>
    {role === 'Admin' && (
      <>
        <li>
          <Link href="/About">Main Touch Interface</Link>
        </li>
        <li>
          <Link href="/Contact">Standings</Link>
        </li>
      </>
    )}
  </ul>
</nav>
      </main>
      <footer className={styles.appFooter}>
        <p>&copy; 2024 Buckets Game. All rights reserved.</p>
      </footer>
    </div>
  );
};
HomePage.displayName = 'HomePage';

export default HomePage;
