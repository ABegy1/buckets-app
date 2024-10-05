'use client'; // Required in Next.js App Router
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import styles from './UserPage.module.css'; // Import the CSS module

const UserPage = () => {
  const router = useRouter(); // Use router for navigation

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/'); // Redirect to sign-in page after signing out
      }
    });

    return () => {
      authListener.subscription.unsubscribe(); // Cleanup listener when component unmounts
    };
  }, [router]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    } else {
      router.push('/'); // Redirect to sign-in page after successful sign-out
    }
  };

  return (
    <div className={styles.userContainer}>
      <header className={styles.userHeader}>
        <h1>User Dashboard</h1>
      </header>
      <main className={styles.userContent}>
        <p>Welcome, User! You have successfully been redirected to the user dashboard.</p>
        <button className="btn" onClick={handleSignOut}>Sign Out</button>
      </main>
      <footer className={styles.userFooter}>
        <p>&copy; 2024 Buckets Game. user Panel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default UserPage;
