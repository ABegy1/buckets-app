'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';
import AddUser from '@/components/AddDummyUser';
import './global.css';
import Link from 'next/link';

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
  const { role, loading } = useUserRole(user?.user_metadata.full_name ?? '');

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
    if (user) {
      console.log('Adding user through AddUser component');
      <AddUser name={user.user_metadata.full_name} email={user.email} />;
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
    <div className="app">
      <header className="app-header">
        <h1>Buckets</h1>
      </header>
      <main className="app-content">
        {!user ? (
          <button className="btn" onClick={signInWithGoogle}>Sign In with Google</button>
        ) : (
          <div>
            <p>Welcome, {user.email}</p>
            <button className="btn" onClick={signOut}>Sign Out</button>
          </div>
        )}
        <div>
          {role === 'Admin' ? (
            <div className="role-message">Welcome, Admin!</div>
          ) : (
            <div className="role-message">Welcome, User!</div>
          )}
        </div>
        <nav>
          <ul>
            {role === 'Admin' && (
              <>
                <li>
                  <Link href="/About">
                    <a>Home Screen</a>
                  </Link>
                </li>
                <li>
                  <Link href="/Contact">
                    <a>Score Display</a>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </main>
      <footer className="app-footer">
        <p>&copy; 2024 Buckets Game. All rights reserved.</p>
      </footer>
    </div>
  );
};

HomePage.displayName = 'HomePage';

export default HomePage;
