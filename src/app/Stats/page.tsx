'use client'; // Required in Next.js App Router for client-side rendering
import React, { useEffect, useState, useCallback } from 'react';
import styles from './Stats.module.css'; // CSS module for styling
import { usePathname, useRouter } from 'next/navigation'; // Next.js navigation hooks
import { supabase } from '@/supabaseClient'; // Supabase client for database operations
import PlayerTierStats from '@/components/PlayerTierStats'; // Component to display tier-specific stats for players

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
 * StatsPage Component
 *
 * This component displays player statistics such as total score, total shots,
 * and performance metrics. It fetches data from multiple database tables,
 * combines it, and presents it in a structured format.
 *
 * Key Features:
 * - Combines data from `players`, `stats`, and `player_instance` tables.
 * - Filters out hidden players.
 * - Calculates derived statistics like points per shot and average score.
 * - Displays player data sorted by total score in descending order.
 */
const StatsPage: React.FC = () => {
  const router = useRouter(); // Router instance for navigation
  const pathname = usePathname(); // Current path for active link highlighting
  const [players, setPlayers] = useState<
    {
      player_id: number;
      name: string;
      seasons_played: number;
      mvp_awards: number;
      team_wins: number;
      total_shots: number;
      total_score: number;
      high: number;
      low: number;
      average_score: number;
      points_per_shot: number;
    }[]
  >([]); // State to store combined player statistics

  /**
   * Navigates to the specified page.
   * @param page The target page to navigate to.
   */
  const handleNavigation = (page: string) => {
    router.push(`/${page}`);
  };

  /**
   * Fetches and processes player statistics, combining data from multiple tables.
   */
  const fetchPlayerStats = useCallback(async () => {
    try {
      // Step 1: Fetch player data (including hidden status)
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('player_id, name, is_hidden');

      if (playersError) throw playersError;
      if (!playersData) return;

      // Step 2: Filter out hidden players
      const visiblePlayersData = playersData.filter((p) => !p.is_hidden);

      // Step 3: Fetch additional stats from the `stats` table
      const { data: statsData, error: statsError } = await supabase
        .from('stats')
        .select('player_id, seasons_played, mvp_awards, team_wins, total_shots, total_score, high, low');

      if (statsError) throw statsError;

      // Step 4: Get active season details
      const { data: currentSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id, shot_total')
        .is('end_date', null) // Only fetch the active season
        .single();

      if (seasonError || !currentSeason) throw seasonError;

      const currentSeasonId = currentSeason.season_id; // Active season ID
      const seasonShotTotal = currentSeason.shot_total; // Total shots for the season

      // Step 5: Fetch current season player instances
      const { data: currentSeasonData, error: instanceError } = await supabase
        .from('player_instance')
        .select('player_id, score, shots_left')
        .eq('season_id', currentSeasonId);

      if (instanceError) throw instanceError;

      // Step 6: Combine data for visible players
      const combinedData = visiblePlayersData.map((player) => {
        const playerStats = statsData?.find((stat) => stat.player_id === player.player_id);
        const currentInstance = currentSeasonData?.find(
          (instance) => instance.player_id === player.player_id
        );
        const currentSeasonScore = currentInstance?.score || 0;
        const shotsLeft = currentInstance?.shots_left || 0;

        // Calculate current season shots taken
        const currentSeasonShots = seasonShotTotal - shotsLeft;

        // Calculate total shots and total score
        const totalShots = (playerStats?.total_shots || 0) + currentSeasonShots;
        const totalScore = (playerStats?.total_score || 0) + currentSeasonScore;

        // Calculate derived stats
        const high = playerStats?.high || 0;
        const low = playerStats?.low || 0;
        const averageScore = (high + low) / 2;
        const pointsPerShot = totalShots > 0 ? totalScore / totalShots : 0;

        return {
          player_id: player.player_id,
          name: player.name,
          seasons_played: playerStats?.seasons_played || 0,
          mvp_awards: playerStats?.mvp_awards || 0,
          team_wins: playerStats?.team_wins || 0,
          total_shots: totalShots,
          total_score: totalScore,
          high,
          low,
          average_score: averageScore,
          points_per_shot: pointsPerShot,
        };
      });

      // Sort players by total score in descending order
      combinedData.sort((a, b) => b.total_score - a.total_score);

      // Update the state with combined player statistics
      setPlayers(combinedData);
    } catch (error) {
      console.error('Error fetching player stats:', error); // Log errors to the console
    }
  }, []);

  // Fetch player stats on component mount
  useEffect(() => {
    fetchPlayerStats();
  }, [fetchPlayerStats]);

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
        <div className={styles.container}>
          <h2 className={styles.pageTitle}>Player Stats</h2>
          <div className={styles.statsContainer}>
            <div className={styles.statsList}>
              {/* Render Player Statistics */}
              {players.map((player) => (
                <div key={player.player_id} className={styles.playerStat}>
                  <h2>{player.name}</h2>
                  <p>Seasons Played: {player.seasons_played}</p>
                  <p>MVP Awards: {player.mvp_awards}</p>
                  <p>Team Wins: {player.team_wins}</p>
                  <p>Total Shots: {player.total_shots}</p>
                  <p>Total Score: {player.total_score}</p>
                  <p>High Score: {player.high}</p>
                  <p>Low Score: {player.low}</p>
                  <p>Average Score: {player.average_score.toFixed(2)}</p>
                  <p>Points Per Shot: {player.points_per_shot.toFixed(2)}</p>

                  {/* Render tier-specific stats using a separate component */}
                  <PlayerTierStats playerId={player.player_id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <footer className={styles.userFooter}>
        <p>&copy; 2025 Buckets Game. All rights reserved.</p>
        <button className={styles.signOutButton}>Sign Out</button>
      </footer>
    </div>
  );
};

export default StatsPage;
