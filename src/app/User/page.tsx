'use client'; // Required in Next.js App Router
import React from 'react';
import styles from './UserPage.module.css'; // Import the CSS module

const UserPage = () => {
  return (
    <div className={styles.userContainer}>
      <header className={styles.userHeader}>
        <h1>User Dashboard</h1>
      </header>
      <main className={styles.userContent}>
        <p>Welcome, User! You have successfully been redirected to the user dashboard.</p>
      </main>
      <footer className={styles.userFooter}>
        <p>&copy; 2024 Buckets Game. user Panel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default UserPage;
