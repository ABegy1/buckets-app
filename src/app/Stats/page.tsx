'use client'; // Required in Next.js App Router
import React from 'react';
import styles from './Stats.module.css'; // Updated path for combined styles
import { useRouter } from 'next/navigation';

const StatsPage: React.FC = () => {
    const router = useRouter();
    const handleNavigation = (page: string) => {
        router.push(`/${page}`);
      };
  return (
    <div className={styles.userContainer}>
      <header className={styles.navbar}>
        <h1 className={styles.navbarTitle}>Buckets</h1> {/* Adjust title as needed */}
        <nav className={styles.navMenu}>
          <button onClick={() => handleNavigation('Standings')} className={styles.navItem}>
            Standings
          </button>
          <button onClick={() => handleNavigation('FreeAgency')} className={styles.navItem}>
            FreeAgency
          </button>
          <button onClick={() => handleNavigation('Rules')} className={styles.navItem}>
            Rules
          </button>
          
        </nav>
      </header>

      <main className={styles.userContent}>
        <div className={styles.container}>
          <h2 className={styles.pageTitle}>Coming Soon</h2> {/* Placeholder for page content */}
          <div className={styles.content}>
            {/* Add your page content here */}
          </div>
        </div>
      </main>

      <footer className={styles.userFooter}>
        <p>&copy; 2024 Buckets Game. All rights reserved.</p>
        <button className={styles.signOutButton}>Sign Out</button> {/* Placeholder for sign-out button */}
      </footer>
    </div>
  );
};

export default StatsPage;
