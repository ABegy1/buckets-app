'use client'
import React, { useEffect, useState, useCallback } from 'react';
import styles from './FreeAgency.module.css';
import { supabase } from '@/supabaseClient';
import { usePathname, useRouter } from 'next/navigation';

const FreeAgencyPage: React.FC = () => {
  const [seasonName, setSeasonName] = useState<string>(''); // State for the season name
  const [freeAgents, setFreeAgents] = useState<any[]>([]); // State for free agents and their stats
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (page: string) => {
    router.push(`/${page}`);
  };

  // Fetch free agents
  const fetchFreeAgents = async () => {
    try {
      const { data: activeSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id, season_name')
        .is('end_date', null)
        .single();

      if (seasonError || !activeSeason) throw seasonError;

      const activeSeasonId = activeSeason.season_id;
      setSeasonName(activeSeason.season_name); // Set season name

      const { data: freeAgentsData, error: freeAgentsError } = await supabase
        .from('players')
        .select('*, tiers(color)')
        .eq('is_free_agent', true);

      if (freeAgentsError) throw freeAgentsError;

      const freeAgentsWithStats = await Promise.all(
        freeAgentsData.map(async (player: any) => {
          const { data: playerInstance, error: playerInstanceError } = await supabase
            .from('player_instance')
            .select('shots_left, score')
            .eq('player_id', player.player_id)
            .eq('season_id', activeSeasonId)
            .single();

          if (playerInstanceError || !playerInstance) throw playerInstanceError;

          return {
            name: player.name,
            shots_left: playerInstance.shots_left,
            total_points: playerInstance.score,
            tier_color: player.tiers?.color || '#000', // Default color if no tier color is found
          };
        })
      );

      setFreeAgents(freeAgentsWithStats);
    } catch (error) {
      console.error('Error fetching free agents and stats:', error);
    }
  };

  // Real-time subscription for free agents
  const subscribeToRealTimeUpdates = useCallback(async () => {
    const { data: activeSeason } = await supabase
      .from('seasons')
      .select('season_id')
      .is('end_date', null)
      .single();

    const activeSeasonId = activeSeason?.season_id;

    if (!activeSeasonId) return;

    // Player instance real-time updates
    const playerInstanceChannel = supabase
      .channel('player-instance-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'player_instance' },
        fetchFreeAgents // Re-fetch the free agents to reflect the changes
      )
      .subscribe();

    // Players real-time updates
    const playerChannel = supabase
      .channel('player-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        fetchFreeAgents // Re-fetch the free agents to reflect changes
      )
      .subscribe();

    // Shots real-time updates (if shots data affects free agents)
    const shotChannel = supabase
      .channel('shots-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shots' },
        fetchFreeAgents
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playerInstanceChannel);
      supabase.removeChannel(playerChannel);
      supabase.removeChannel(shotChannel);
    };
  }, []); // Use empty dependency array to memoize the function

  useEffect(() => {
    fetchFreeAgents();
    subscribeToRealTimeUpdates();
  }, [subscribeToRealTimeUpdates]); // Add the memoized function as a dependency

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
        <div className={styles.freeAgencyPage}>
          <h2 className={styles.seasonTitle}>{seasonName} Free Agents</h2>
          <div className={styles.players}>
  <div className={styles.headerRow}>
    <span className={styles.columnHeader}>Name</span>
    <span className={styles.columnHeader}>Shots Left</span>
    <span className={styles.columnHeader}>Total Points</span>
  </div>
  {freeAgents.map((player, playerIndex) => (
    <div key={playerIndex} className={styles.playerRow}>
      <div className={styles.playerNameColumn}>
        {/* Name column with colored circle */}
        <div className={styles.playerName}>
          <span
            className={styles.colorCircle}
            style={{ backgroundColor: player.tier_color }}
          ></span>
          <span>{player.name}</span>
        </div>
      </div>
      <div className={styles.shotsLeftColumn}>
        {/* Centered shots left */}
        <span>{player.shots_left}</span>
      </div>
      <div className={styles.totalPointsColumn}>
        {/* Right aligned total points */}
        <span>{player.total_points}</span>
      </div>
    </div>
  ))}
</div>
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

export default FreeAgencyPage;
