'use client'; // Required in Next.js App Router for client-side rendering

import React, { useEffect, useState } from 'react';
import styles from './Rules.module.css'; // Styles for the Rules page
import { supabase } from '@/supabaseClient'; // Supabase client for database operations
import ReactMarkdown from 'react-markdown'; // Markdown rendering library
// @ts-ignore
import { usePathname, useRouter } from 'next/navigation'; // Navigation hooks from Next.js

import Image from 'next/image'
import bucketsLogo from "@/assets/images/buckets.png"
import scoreLogo from "@/assets/images/add.png" 
import standingsLogo from "@/assets/images/speedometer.png"
import freeAgencyLogo from "@/assets/images/bench.png"
import rulesLogo from "@/assets/images/document.png"
import statsLogo from "@/assets/images/analytics.png"
import userLogo from "@/assets/images/user.png" 
import adminLogo from "@/assets/images/administrator.png" 
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
      <div className={styles.navMenu}>
        <Image className={`${styles.navItem} dark:invert`} 
                  src={bucketsLogo}
                  alt='Buckets!'
                  width="75"
                  height="75"
        >
        </Image>
        <h1 className={`${styles.navbarTitle}`}>Buckets</h1>
      </div>
      <nav className={styles.navMenu}>
        {/* Navigation Buttons */}
        <Image className={`${styles.navItem} ${pathname === '/Admin' ? styles.active : ''} dark:invert`} 
          src={scoreLogo}
          alt='Score'
          width="65"
          height="65"
          onClick={() => handleNavigation('Admin')}>
        </Image>
        <Image className={`${styles.navItem} ${pathname === '/Standings' ? styles.active : ''} dark:invert`} 
          src={standingsLogo}
          alt='Standings'
          width="75"
          height="75"
          onClick={() => handleNavigation('Standings')}>
        </Image>
        <Image className={`${styles.navItem} ${pathname === '/FreeAgency' ? styles.active : ''} dark:invert`} 
          src={freeAgencyLogo}
          alt='Free Agency'
          width="65"
          height="65"
          onClick={() => handleNavigation('FreeAgency')}>
        </Image>
        <Image className={`${styles.navItem} ${pathname === '/Rules' ? styles.active : ''} dark:invert`} 
          src={rulesLogo}
          alt='Rules'
          width="65"
          height="65"
          onClick={() => handleNavigation('Rules')}>
        </Image>
        <Image className={`${styles.navItem} ${pathname === '/Stats' ? styles.active : ''} dark:invert`} 
          src={statsLogo}
          alt='Stats'
          width="65"
          height="65"
          onClick={() => handleNavigation('Stats')}>
        </Image>
        <Image className={`${styles.navItem} ${pathname === '/User' ? styles.active : ''} dark:invert`} 
          src={userLogo}
          alt='Stats'
          width="65"
          height="65">
        </Image>
        <Image className={`${styles.navItem} ${pathname === '/Admin' ? styles.active : ''} dark:invert`} 
          src={adminLogo}
          alt='Stats'
          width="65"
          height="65"
          onClick={() => handleNavigation('Admin')}>
        </Image>
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
