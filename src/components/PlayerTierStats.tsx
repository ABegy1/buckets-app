/**
 * PlayerTierStats Component
 *
 * This component displays detailed statistics for a player's performance across different tiers.
 * Features include:
 * - Fetching tier statistics for a player, including both base stats and real-time updates from the current season.
 * - Calculating total scores, total shots, and points per shot by tier.
 * - Displaying high and low scores along with average scores.
 * - Collapsible view to toggle between showing and hiding the tier stats.
 *
 * Props:
 * - `playerId`: The ID of the player whose stats are being displayed.
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient'; // Supabase client for database interaction
import styles from './PlayerTierStats.module.css'; // CSS module for styling

interface PlayerTierStatsProps {
  playerId: number;
}

interface TierStat {
  tier_name: string; // Name of the tier
  total_score: number; // Total score accumulated in the tier
  total_shots: number; // Total shots taken in the tier
  high: number; // Highest score in a single attempt
  low: number; // Lowest score in a single attempt
  average_score: number; // Average score (calculated based on base stats)
  points_per_shot: number; // Points scored per shot (calculated dynamically)
}

const PlayerTierStats: React.FC<PlayerTierStatsProps> = ({ playerId }) => {
  const [tierStats, setTierStats] = useState<TierStat[]>([]); // Stores tier statistics
  const [isExpanded, setIsExpanded] = useState(false); // Tracks whether the stats are visible

  /**
   * Fetch and calculate tier stats for the player.
   * - Combines base stats with real-time data from the current season.
   * - Updates the `tierStats` state with the combined statistics.
   */
  useEffect(() => {
    const fetchTierStats = async () => {
      try {
        // Step 1: Fetch base stats for the player's tiers
        const { data: tierStatsData, error: tierStatsError } = await supabase
          .from('tier_stats')
          .select('tier_id, total_score, total_shots, high, low')
          .eq('player_id', playerId);

        if (tierStatsError) throw tierStatsError;

        // Step 2: Fetch tier names
        const { data: tiersData, error: tiersError } = await supabase
          .from('tiers')
          .select('tier_id, tier_name');

        if (tiersError) throw tiersError;

        // Step 3: Get the current season where `end_date` is null
        const { data: currentSeason, error: seasonError } = await supabase
          .from('seasons')
          .select('season_id')
          .is('end_date', null)
          .single();

        if (seasonError || !currentSeason) throw seasonError;

        const currentSeasonId = currentSeason.season_id;

        // Step 4: Fetch player instances for the current season
        const { data: playerInstanceData, error: instanceError } = await supabase
          .from('player_instance')
          .select('player_instance_id')
          .eq('season_id', currentSeasonId)
          .eq('player_id', playerId);

        if (instanceError) throw instanceError;

        const playerInstanceIds = playerInstanceData.map((instance) => instance.player_instance_id);

        // Step 5: Fetch current season shots by tier
        const { data: shotsData, error: shotsError } = await supabase
          .from('shots')
          .select('result, tier_id')
          .in('instance_id', playerInstanceIds);

        if (shotsError) throw shotsError;

        // Step 6: Combine base stats with current season data
        const updatedTierStats = tierStatsData.map((tierStat) => {
          const tier = tiersData.find((t) => t.tier_id === tierStat.tier_id);
          const tierShots = shotsData.filter((shot) => shot.tier_id === tierStat.tier_id);

          // Calculate current season stats for this tier
          const currentTotalScore = tierShots.reduce((acc, shot) => acc + shot.result, 0);
          const currentTotalShots = tierShots.length;

          // Combine base stats and current season stats
          const totalScore = tierStat.total_score + currentTotalScore;
          const totalShots = tierStat.total_shots + currentTotalShots;
          const pointsPerShot = totalShots > 0 ? totalScore / totalShots : 0;

          return {
            tier_name: tier ? tier.tier_name : 'Unknown', // Tier name or fallback
            total_score: totalScore,
            total_shots: totalShots,
            high: tierStat.high, // Base stat unchanged
            low: tierStat.low, // Base stat unchanged
            average_score: (tierStat.high + tierStat.low) / 2, // Average calculated from base stats
            points_per_shot: pointsPerShot, // Dynamic calculation
          };
        });

        setTierStats(updatedTierStats); // Update the state with calculated stats
      } catch (error) {
        console.error('Error fetching tier stats:', error);
      }
    };

    fetchTierStats(); // Fetch the stats when the component mounts or playerId changes
  }, [playerId]);

  /**
   * Toggles the visibility of the tier stats.
   */
  const toggleExpansion = () => setIsExpanded((prev) => !prev);

  return (
    <div className={styles.tierStatsContainer}>
      {/* Button to toggle stats visibility */}
      <button onClick={toggleExpansion} className={styles.toggleButton}>
        {isExpanded ? 'Hide Tier Stats' : 'Show Tier Stats'}
      </button>

      {/* Render stats only if expanded */}
      {isExpanded && (
        <div className={styles.tierStatsContent}>
          {tierStats.map((tier, index) => (
            <div key={index} className={styles.tierStat}>
              <h3>Tier: {tier.tier_name}</h3>
              <p>Total Score: {tier.total_score}</p>
              <p>Total Shots: {tier.total_shots}</p>
              <p>High Score: {tier.high}</p>
              <p>Low Score: {tier.low}</p>
              <p>Average Score: {tier.average_score.toFixed(2)}</p>
              <p>Points Per Shot: {tier.points_per_shot.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerTierStats;
