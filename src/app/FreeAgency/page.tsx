'use client'
import React, { useEffect, useState, useCallback } from 'react';
import styles from './FreeAgency.module.css';
import { supabase } from '@/supabaseClient';
import { usePathname, useRouter } from 'next/navigation';
import { FaFireFlameCurved } from "react-icons/fa6";
import { GiIceCube } from "react-icons/gi";



const calculateCurrentShotStreak = async (playerInstanceId: number) => {
  try {
    // Fetch all shots for the given player_instance_id, ordered by shot_date to maintain sequence
    const { data: shots, error: shotsError } = await supabase
      .from('shots')
      .select('result')
      .eq('instance_id', playerInstanceId)
      .order('shot_date', { ascending: true });  // Make sure shots are in chronological order

    if (shotsError || !shots) throw shotsError;

    let currentStreak = 0;

    // Loop through the shots in order and count current consecutive made shots
    for (const shot of shots) {
      if (shot.result !== 0) {
        // Increment the streak if the shot was made
        currentStreak++;
      } else {
        // Reset the streak if a shot was missed
        currentStreak = 0;
      }
    }

    return currentStreak;  // Return the current streak of consecutive made shots
  } catch (error) {
    console.error('Error calculating current shot streak:', error);
    return 0;  // Return 0 if an error occurs or streak is broken
  }
};
const calculateCurrentMissStreak = async (playerInstanceId: number) => {
  try {
    // Fetch all shots for the given player_instance_id, ordered by shot_date to maintain sequence
    const { data: shots, error: shotsError } = await supabase
      .from('shots')
      .select('result')
      .eq('instance_id', playerInstanceId)
      .order('shot_date', { ascending: true });  // Ensure shots are ordered by date

    if (shotsError || !shots) throw shotsError;

    let currentMissStreak = 0;

    // Loop through the shots in order and count current consecutive missed shots
    for (const shot of shots) {
      if (shot.result === 0) {
        // Increment the miss streak if the shot was missed
        currentMissStreak++;
      } else {
        // Reset the miss streak if a shot was made
        currentMissStreak = 0;
      }
    }

    return currentMissStreak;  // Return the current streak of consecutive missed shots
  } catch (error) {
    console.error('Error calculating current miss streak:', error);
    return 0;  // Return 0 if an error occurs or streak is broken
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
  
          // Calculate current shot streak (successful shots)
          const currentStreak = await calculateCurrentShotStreak(playerInstance.player_instance_id);
  
          // Calculate current miss streak (missed shots)
          const currentMissStreak = await calculateCurrentMissStreak(playerInstance.player_instance_id);
  
          return {
            name: player.name,
            shots_left: playerInstance.shots_left,
            total_points: playerInstance.score,
            tier_color: player.tiers?.color || '#000',
            current_streak: currentStreak,        // Track the current streak of made shots
            current_miss_streak: currentMissStreak  // Track the current streak of missed shots
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
                    {player.current_streak >= 3 && (
                      <span className={styles.fireIcon}><FaFireFlameCurved/></span>  // Placeholder icon, replace with your imported icon
                    )}

                    {/* Display the cold icon if player has 3 or more consecutive missed shots */}
                    {player.current_miss_streak >= 3 && (
                    <span className={styles.coldIcon}><GiIceCube /></span>  // Cold icon for missed shot streaks
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
