'use client'
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import styles from './FreeAgency.module.css';
import { supabase } from '@/supabaseClient';
import { usePathname, useRouter } from 'next/navigation';
import { FaSnowflake } from "react-icons/fa6"; 
import Header from '@/components/Header';

/**
 * FreeAgency Page
 * 
 * This component serves as the Free Agency dashboard 
 * It displays all the free agents within the current season and their associated statistics
 */

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
    console.log(currentMissStreak)

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

const FlameIcon = () => (
  <span className={styles.flameWrap} aria-hidden="true">
    <svg
      className={styles.flameSvg}
      viewBox="0 0 125 189.864"
      role="presentation"
      focusable="false"
    >
      <path
        className={`${styles.flameMain} ${styles.one}`}
        d="M76.616 54.645c1.683-16.543-3.005-34.936-3.005-34.936s-6.277 8.37-10.267 16.132c-3.989-8.064-10.561-16.779-10.561-16.779s-4.834 19.042-2.896 35.902c1.954 16.995-10.172 24.512-16.643 41.743-6.472 17.231-4.797 48.182 29.548 57.164 34.347-8.983 35.982-40.032 29.51-57.264-6.47-17.231-17.621-24.937-15.686-41.962z"
      />
      <path
        className={`${styles.flame} ${styles.two}`}
        d="M63.861 108.818c4.032-8.249 1.951-19.165 1.951-19.165s-3.859 4.289-6.433 8.146c-2.575-3.857-6.452-8.146-6.452-8.146s-1.792 10.915 2.221 19.165c4.013 8.249-.399 16.379-.399 16.379s2.828 4.947 8.638 4.947 8.639-4.947 8.639-4.947-4.196-8.13-.165-16.379z"
      />
      <path
        className={`${styles.flame} ${styles.three}`}
        d="M33.321 103.663c2.576-5.143 2.189-11.436 2.189-11.436s-3.607 2.646-5.893 5.107c-2.285-2.461-5.737-5.107-5.737-5.107s-.913 6.293 1.643 11.436c2.557 5.143-.584 9.537-.584 9.537s2.36 2.254 5.162 2.254 5.12-2.254 5.12-2.254-2.476-4.394.1-9.537z"
      />
      <path
        className={`${styles.flame} ${styles.four}`}
        d="M90.071 103.663c2.575-5.143 2.188-11.436 2.188-11.436s-3.605 2.646-5.891 5.107c-2.286-2.461-5.737-5.107-5.737-5.107s-.914 6.293 1.643 11.436c2.557 5.143-.584 9.537-.584 9.537s2.36 2.254 5.162 2.254c2.802 0 5.12-2.254 5.12-2.254s-2.477-4.394.1-9.537z"
      />
      <path
        className={`${styles.flame} ${styles.five}`}
        d="M63.521 57.568c2.079-4.151 1.735-9.272 1.735-9.272s-2.965 2.123-4.849 4.087c-1.885-1.964-4.734-4.087-4.734-4.087s-.762 5.121 1.3 9.272c2.061 4.151-.46 7.727-.46 7.727s1.947 1.826 4.227 1.826c2.281 0 4.227-1.826 4.227-1.826s-2.524-3.576-.446-7.727z"
      />
    </svg>
  </span>
);

const FreeAgencyPage: React.FC = () => {
  // State variables to track page data and UI interactions
  const [seasonName, setSeasonName] = useState<string>(''); // Name of the current season
  const [freeAgents, setFreeAgents] = useState<any[]>([]); // List of free agents and their stats
  const previousFreeAgentsRef = useRef<any[]>([]); // Reference to previous free agent data for streak comparison

  /**
   * Fetches free agents and their associated stats for the current season.
   */
  const fetchFreeAgents = async () => {
    try {
      // Fetch the current season details
      const { data: activeSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id, season_name')
        .is('end_date', null)
        .single();
  
      if (seasonError || !activeSeason) throw seasonError;
  
      const activeSeasonId = activeSeason.season_id;
      setSeasonName(activeSeason.season_name);
        // Fetch free agent data

      const { data: freeAgentsData, error: freeAgentsError } = await supabase
        .from('players')
        .select('*, tiers(color)')
        .eq('is_free_agent', true);
  
      if (freeAgentsError) throw freeAgentsError;
        // Enrich free agent data with stats

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

  /**
   * Subscribes to real-time updates for changes to player, player instance, and shot data.
   */
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
 /**
   * Effects to initialize data fetching and real-time subscriptions.
   */
  useEffect(() => {
    fetchFreeAgents();
    subscribeToRealTimeUpdates();
  }, [subscribeToRealTimeUpdates]);
  /**
   * Compares current and previous free agents to trigger sound effects for streaks.
   */
  useEffect(() => {
    // Skip comparison on the initial render
    if (previousFreeAgentsRef.current.length === 0) {
      previousFreeAgentsRef.current = freeAgents;
      return;
    }

    const previousFreeAgents = previousFreeAgentsRef.current;

    freeAgents.forEach((player) => {
      let previousStreak = 0;

      const previousPlayer = previousFreeAgents.find(
        (prevPlayer) => prevPlayer.name === player.name
      );

      if (previousPlayer) {
        previousStreak = previousPlayer.current_streak;
      }

    });

    // Update the previous freeAgents reference with the current state
    previousFreeAgentsRef.current = freeAgents;
  }, [freeAgents]);

  return (
    <div className={styles.userContainer}>
       {/* Header Section */}
      <Header></Header>
      {/* Main Content */}

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
                    
                    {player.current_streak >= 3 && (
                      <span className={styles.fireIcon}><FlameIcon /></span>
                    )}

                    {player.current_miss_streak >= 3 && (
                    <span className={styles.coldIcon}><FaSnowflake /></span>  // Cold icon for missed shot streaks
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
      {/* Footer Section */}

      <footer className={styles.userFooter}>
        <p>&copy; 2025 Buckets Game. All rights reserved.</p>
        <button className={styles.signOutButton} onClick={() => { /* Add sign out logic here */ }}>
          Sign Out
        </button>
      </footer>
    </div>
  );
};

export default FreeAgencyPage;
