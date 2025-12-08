'use client'; // Required in Next.js App Router for client-side rendering
import React, { useEffect, useState, useCallback } from 'react';
import styles from './Stats.module.css'; // CSS module for styling
import { supabase } from '@/supabaseClient'; // Supabase client for database operations
import PlayerTierStats from '@/components/PlayerTierStats'; // Component to display tier-specific stats for players

import Header from '@/components/Header';
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
      shot_percentage: number;
    }[]
  >([]); // State to store combined player statistics

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
        const seasonsPlayed = playerStats?.seasons_played || 0;
        const averageScore = seasonsPlayed > 0 ? totalScore / seasonsPlayed : 0;
        const pointsPerShot = totalShots > 0 ? totalScore / totalShots : 0;
        const shotPercentage = totalShots > 0 ? (totalScore / (totalShots * 3)) * 100 : 0;

        return {
          player_id: player.player_id,
          name: player.name,
          seasons_played: seasonsPlayed,
          mvp_awards: playerStats?.mvp_awards || 0,
          team_wins: playerStats?.team_wins || 0,
          total_shots: totalShots,
          total_score: totalScore,
          high,
          low,
          average_score: averageScore,
          points_per_shot: pointsPerShot,
          shot_percentage: shotPercentage,
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

  // Fetch player stats on component mount and subscribe to changes
  useEffect(() => {
    fetchPlayerStats();

    const channel = supabase
      .channel('player-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'player_instance' },
        fetchPlayerStats
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stats' },
        fetchPlayerStats
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPlayerStats]);

  return (
    <div className={styles.userContainer}>
      {/* Header Section */}
      <Header></Header>

      {/* Main Content Section */}
      <main className={styles.userContent}>
        <div className={styles.container}>
          <h2 className={styles.pageTitle}>Player Stats</h2>
          <div className={styles.statsContainer}>
            <div className={styles.tableWrapper}>
              <table className={styles.statsTable}>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Seasons</th>
                    <th>MVPs</th>
                    <th>Team Wins</th>
                    <th>Total Shots</th>
                    <th>Total Score</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Avg Score</th>
                    <th>Pts/Shot</th>
                    <th>Shot %</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <React.Fragment key={player.player_id}>
                      <tr>
                        <td>{player.name}</td>
                        <td>{player.seasons_played}</td>
                        <td>{player.mvp_awards}</td>
                        <td>{player.team_wins}</td>
                        <td>{player.total_shots}</td>
                        <td>{player.total_score}</td>
                        <td>{player.high}</td>
                        <td>{player.low}</td>
                        <td>{player.average_score.toFixed(2)}</td>
                        <td>{player.points_per_shot.toFixed(2)}</td>
                        <td>{player.shot_percentage.toFixed(2)}%</td>
                      </tr>
                      <tr>
                        <td colSpan={11}>
                          <PlayerTierStats playerId={player.player_id} />
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
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
