'use client'; // Required in Next.js App Router for client-side rendering
import React, { useEffect, useState, useCallback } from 'react';
import styles from './Stats.module.css'; // CSS module for styling
import { supabase } from '@/supabaseClient'; // Supabase client for database operations
import Header from '@/components/Header';

type PlayerStats = {
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
};

type SortKey = keyof PlayerStats;

const getSortableLastName = (name: string) => {
  const trimmedName = name.trim();
  const nameParts = trimmedName.split(/\s+/);

  if (nameParts.length === 1) return trimmedName;

  return nameParts[nameParts.length - 1];
};

const sortPlayers = (playerList: PlayerStats[], key: SortKey, direction: 'asc' | 'desc') => {
  const sortedPlayers = [...playerList].sort((a, b) => {
    if (key === 'name') {
      const lastNameComparison = getSortableLastName(a.name).localeCompare(
        getSortableLastName(b.name),
        undefined,
        { sensitivity: 'base' },
      );

      if (lastNameComparison !== 0) return lastNameComparison;

      return a.name.localeCompare(b.name);
    }

    const valueA = a[key];
    const valueB = b[key];

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return valueA - valueB;
    }

    return String(valueA).localeCompare(String(valueB), undefined, { sensitivity: 'base' });
  });

  if (direction === 'desc') {
    sortedPlayers.reverse();
  }

  return sortedPlayers;
};
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
 * - Displays player data in a sortable table (defaulted to alphabetical by last name).
 */
const StatsPage: React.FC = () => {
  const [players, setPlayers] = useState<PlayerStats[]>([]); // State to store combined player statistics
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>(
    {
      key: 'name',
      direction: 'asc',
    },
  );

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
        const currentSeasonShots = Math.max(0, seasonShotTotal - shotsLeft);

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

      // Sort players by last name alphabetically by default
      const sortedPlayers = sortPlayers(combinedData, 'name', 'asc');

      // Update the state with combined player statistics
      setPlayers(sortedPlayers);
    } catch (error) {
      console.error('Error fetching player stats:', error); // Log errors to the console
    }
  }, []);

  const handleSort = (key: SortKey) => {
    const isSameKey = sortConfig.key === key;
    const direction = isSameKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';

    setSortConfig({ key, direction });
    setPlayers((prevPlayers) => sortPlayers(prevPlayers, key, direction));
  };

  // Fetch player stats on component mount
  useEffect(() => {
    fetchPlayerStats();
  }, [fetchPlayerStats]);

  return (
    <div className={styles.userContainer}>
      {/* Header Section */}
      <Header></Header>

      {/* Main Content Section */}
      <main className={styles.userContent}>
        <div className={styles.container}>
          <h2 className={styles.pageTitle}>Player Stats</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>
                    <button type="button" onClick={() => handleSort('name')} className={styles.sortButton}>
                      Player
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      onClick={() => handleSort('seasons_played')}
                      className={styles.sortButton}
                    >
                      Seasons Played
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('mvp_awards')} className={styles.sortButton}>
                      MVP Awards
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('team_wins')} className={styles.sortButton}>
                      Team Wins
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('total_shots')} className={styles.sortButton}>
                      Total Shots
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('total_score')} className={styles.sortButton}>
                      Total Score
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('high')} className={styles.sortButton}>
                      High Score
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('low')} className={styles.sortButton}>
                      Low Score
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('average_score')} className={styles.sortButton}>
                      Average Score
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('points_per_shot')} className={styles.sortButton}>
                      Points / Shot
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.player_id}>
                    <td className={styles.playerName}>{player.name}</td>
                    <td>{player.seasons_played}</td>
                    <td>{player.mvp_awards}</td>
                    <td>{player.team_wins}</td>
                    <td>{player.total_shots}</td>
                    <td>{player.total_score}</td>
                    <td>{player.high}</td>
                    <td>{player.low}</td>
                    <td>{player.average_score.toFixed(2)}</td>
                    <td>{player.points_per_shot.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
