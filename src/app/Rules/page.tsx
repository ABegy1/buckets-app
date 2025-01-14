'use client'; // Required in Next.js App Router for client-side rendering

import React, { useEffect, useState } from 'react';
import styles from './Rules.module.css'; // Styles for the Rules page
import { supabase } from '@/supabaseClient'; // Supabase client for database operations
import ReactMarkdown from 'react-markdown'; // Markdown rendering library
// @ts-ignore
import { usePathname, useRouter } from 'next/navigation'; // Navigation hooks from Next.js

/**
 * RulesPage Component
 * 
 * This component displays the rules for the current season in a markdown format. It fetches the
 * rules from the database and updates dynamically when changes occur in the backend.
 * 
 * Key Functionalities:
 * - Fetches the current season's name and rules from the database.
 * - Displays rules in markdown format using the `ReactMarkdown` library.
 * - Provides navigation between app sections via a dynamic navbar.
 * - Updates rules in real time using Supabase's subscription channels.
 * 
 * Features:
 * - Responsive layout with dynamic content rendering.
 * - Real-time updates to ensure the latest rules are displayed.
 * - Modular structure for easy customization and maintenance.
 */

const RulesPage: React.FC = () => {
  // State variables
  const [seasonName, setSeasonName] = useState<string>(''); // Name of the current season
  const [seasonRules, setSeasonRules] = useState<string>(''); // Rules for the current season

  const router = useRouter(); // Router hook for navigation
  const pathname = usePathname(); // Pathname hook to determine the current page

  /**
   * Handles navigation between pages.
   * @param page The target page to navigate to.
   */
  const handleNavigation = (page: string) => {
    router.push(`/${page}`);
  };

  /**
   * Fetches the rules and season name for the current active season.
   */
  const fetchSeasonRules = async () => {
    try {
      const { data: activeSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_name, rules') // Fetch season name and rules
        .is('end_date', null) // Ensure the season is active
        .single();

      if (seasonError || !activeSeason) throw seasonError;

      setSeasonName(activeSeason.season_name); // Set the season name
      setSeasonRules(activeSeason.rules); // Set the markdown-formatted rules
    } catch (error) {
      console.error('Error fetching season rules:', error); // Log errors to the console
    }
  };

  /**
   * Effect hook to fetch rules and set up real-time updates.
   */
  useEffect(() => {
    fetchSeasonRules(); // Initial fetch of season rules

    // Subscribe to real-time updates for changes to the season's rules
    const seasonChannel = supabase
      .channel('season-rules-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seasons' },
        fetchSeasonRules // Re-fetch rules on changes
      )
      .subscribe();

    return () => {
      supabase.removeChannel(seasonChannel); // Cleanup subscription on unmount
    };
  }, []);

  return (
    <div className={styles.userContainer}>
      {/* Header Section */}
      <header className={styles.navbar}>
        <h1 className={styles.navbarTitle}>Buckets</h1>
        <nav className={styles.navMenu}>
          {/* Navigation buttons */}
          <button
            onClick={() => handleNavigation('Standings')}
            className={`${styles.navItem} ${pathname === '/Standings' ? styles.active : ''}`}
          >
            Standings
          </button>
          <button
            onClick={() => handleNavigation('FreeAgency')}
            className={`${styles.navItem} ${pathname === '/FreeAgency' ? styles.active : ''}`}
          >
            Free Agency
          </button>
          <button
            onClick={() => handleNavigation('Rules')}
            className={`${styles.navItem} ${pathname === '/Rules' ? styles.active : ''}`}
          >
            Rules
          </button>
          <button
            onClick={() => handleNavigation('Stats')}
            className={`${styles.navItem} ${pathname === '/Stats' ? styles.active : ''}`}
          >
            Stats
          </button>
        </nav>
      </header>

      {/* Main Content Section */}
      <main className={styles.userContent}>
        <div className={styles.rulesPage}>
          <h2 className={styles.rulesTitle}>{seasonName} Rules</h2>
          {/* Render the markdown-formatted rules */}
          <ReactMarkdown className={styles.rulesContent}>{seasonRules}</ReactMarkdown>
        </div>
      </main>

      {/* Footer Section */}
      <footer className={styles.userFooter}>
        <p>&copy; 2025 Buckets Game. All rights reserved.</p>
        <button
          className={styles.signOutButton}
          onClick={() => { /* Add sign-out logic */ }}
        >
          Sign Out
        </button>
      </footer>
    </div>
  );
};

export default RulesPage;
