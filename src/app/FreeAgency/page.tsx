'use client'
import React, { useEffect, useState, useCallback } from 'react';
import styles from './FreeAgency.module.css';
import { supabase } from '@/supabaseClient';
import { usePathname, useRouter } from 'next/navigation';
import { FaFireFlameCurved } from "react-icons/fa6";


// Reuse the calculateShotsMadeInRow function from Standings
const calculateShotsMadeInRow = async (playerInstanceId: number) => {
  try {
    const { data: shots, error: shotsError } = await supabase
      .from('shots')
      .select('is_made')
      .eq('instance_id', playerInstanceId);

    if (shotsError || !shots) throw shotsError;

    let shotsMadeInRow = 0;
    let maxShotsInRow = 0;

    shots.forEach((shot: any) => {
      if (shot.is_made) {
        shotsMadeInRow++;
        maxShotsInRow = Math.max(maxShotsInRow, shotsMadeInRow);
      } else {
        shotsMadeInRow = 0;
      }
    });

    return maxShotsInRow;
  } catch (error) {
    console.error('Error calculating shots made in a row:', error);
    return 0;
  }
};

const FreeAgencyPage: React.FC = () => {
  const [seasonName, setSeasonName] = useState<string>(''); 
  const [freeAgents, setFreeAgents] = useState<any[]>([]); 
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (page: string) => {
    router.push(`/${page}`);
  };

  // Fetch free agents and calculate shots in a row
  const fetchFreeAgents = async () => {
    try {
      const { data: activeSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id, season_name')
        .is('end_date', null)
        .single();

      if (seasonError || !activeSeason) throw seasonError;

      const activeSeasonId = activeSeason.season_id;
      setSeasonName(activeSeason.season_name);

      const { data: freeAgentsData, error: freeAgentsError } = await supabase
        .from('players')
        .select('*, tiers(color)')
        .eq('is_free_agent', true);

      if (freeAgentsError) throw freeAgentsError;

      const freeAgentsWithStats = await Promise.all(
        freeAgentsData.map(async (player: any) => {
          const { data: playerInstance, error: playerInstanceError } = await supabase
            .from('player_instance')
            .select('player_instance_id, shots_left, score')
            .eq('player_id', player.player_id)
            .eq('season_id', activeSeasonId)
            .single();

          if (playerInstanceError || !playerInstance) throw playerInstanceError;

          // Calculate shots made in a row
          const shotsMadeInRow = await calculateShotsMadeInRow(playerInstance.player_instance_id);

          return {
            name: player.name,
            shots_left: playerInstance.shots_left,
            total_points: playerInstance.score,
            tier_color: player.tiers?.color || '#000',
            shots_made_in_row: shotsMadeInRow,  // Store shots in a row for display
          };
        })
      );

      setFreeAgents(freeAgentsWithStats);
    } catch (error) {
      console.error('Error fetching free agents and stats:', error);
    }
  };

  const subscribeToRealTimeUpdates = useCallback(async () => {
    const { data: activeSeason } = await supabase
      .from('seasons')
      .select('season_id')
      .is('end_date', null)
      .single();

    const activeSeasonId = activeSeason?.season_id;

    if (!activeSeasonId) return;

    const playerInstanceChannel = supabase
      .channel('player-instance-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'player_instance' },
        fetchFreeAgents
      )
      .subscribe();

    const playerChannel = supabase
      .channel('player-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        fetchFreeAgents
      )
      .subscribe();

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
  }, []);

  useEffect(() => {
    fetchFreeAgents();
    subscribeToRealTimeUpdates();
  }, [subscribeToRealTimeUpdates]);

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
                  <div className={styles.playerName}>
                    <span
                      className={styles.colorCircle}
                      style={{ backgroundColor: player.tier_color }}
                    ></span>
                    <span>{player.name}</span>
                    
                    {/* Display the fire icon if player has 3 or more shots in a row */}
                    {player.shots_made_in_row >= 3 && (
                      <span className={styles.fireIcon}><FaFireFlameCurved/></span>  // Placeholder icon, replace with your imported icon
                    )}
                  </div>
                </div>
                <div className={styles.shotsLeftColumn}>
                  <span>{player.shots_left}</span>
                </div>
                <div className={styles.totalPointsColumn}>
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
