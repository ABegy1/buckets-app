'use client'; // Required in Next.js App Router
import React from 'react';
import styles from './adminPage.module.css'; // Import the CSS module
import { supabase } from '@/supabaseClient'; // Import the Supabase client

const AdminPage = () => {
  return (
    <div className={styles.adminContainer}>
      <header className={styles.adminHeader}>
        <h1>Admin Dashboard</h1>
      </header>
      <main className={styles.adminContent}>
        <p>Welcome, Admin! You have successfully been redirected to the admin dashboard.</p>
        <button className="btn" onClick={async () => await supabase.auth.signOut()}>Sign Out</button>
      </main>
      <footer className={styles.adminFooter}>
        <p>&copy; 2024 Buckets Game. Admin Panel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdminPage;
