'use client'; // Required in Next.js App Router
import React, { useEffect, useState } from 'react';
import styles from './Rules.module.css'; // Updated path for combined styles
import { supabase } from '@/supabaseClient';
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import { usePathname, useRouter } from 'next/navigation';

const RulesPage: React.FC = () => {
  const [seasonName, setSeasonName] = useState<string>(''); // State for season name
  const [seasonRules, setSeasonRules] = useState<string>(''); // State for season rules
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (page: string) => {
    router.push(`/${page}`);
  };

  // Fetch rules for the active season
  const fetchSeasonRules = async () => {
    try {
      const { data: activeSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_name, rules') // Fetch rules field
        .is('end_date', null)
        .single();

      if (seasonError || !activeSeason) throw seasonError;

      setSeasonName(activeSeason.season_name); // Set season name
      setSeasonRules(activeSeason.rules); // Set season rules
    } catch (error) {
      console.error('Error fetching season rules:', error);
    }
  };

  // Real-time updates for season rules
  useEffect(() => {
    fetchSeasonRules();

    const seasonChannel = supabase
      .channel('season-rules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seasons' }, fetchSeasonRules)
      .subscribe();

    return () => {
      supabase.removeChannel(seasonChannel);
    };
  }, []);

  return (
    <div className={styles.userContainer}>
      <header className={styles.navbar}>
        <h1 className={styles.navbarTitle}>Buckets</h1>
        <nav className={styles.navMenu}>
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

      <main className={styles.userContent}>
        <div className={styles.rulesPage}>
          <h2>{seasonName} Rules</h2>
          <ReactMarkdown>{seasonRules}</ReactMarkdown>
        </div>
      </main>

      <footer className={styles.userFooter}>
        <p>&copy; 2024 Buckets Game. All rights reserved.</p>
        <button className={styles.signOutButton} onClick={() => { /* Add sign out logic here */ }}>
          Sign Out
        </button>
      </footer>
    </div>
  );
};

export default RulesPage;
