'use client'; // Required in Next.js App Router
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './adminPage.module.css'; // Import the CSS module
import { supabase } from '@/supabaseClient'; // Import the Supabase client

const AdminPage = () => {
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
    <div className={styles.adminContainer}>
      <header className={styles.adminHeader}>
        <h1>Admin Dashboard</h1>
      </header>
      <main className={styles.adminContent}>
        <p>Welcome, Admin! You have successfully been redirected to the admin dashboard.</p>
        <button className="btn" onClick={handleSignOut}>Sign Out</button>
      </main>
      <footer className={styles.adminFooter}>
        <p>&copy; 2024 Buckets Game. Admin Panel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdminPage;
