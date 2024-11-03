// PlayerTierStats.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import styles from './PlayerTierStats.module.css';

interface PlayerTierStatsProps {
    playerId: number;
}

interface TierStat {
    tier_name: string;
    total_score: number;
    total_shots: number;
    high: number;
    low: number;
    average_score: number;
    points_per_shot: number;
}

const PlayerTierStats: React.FC<PlayerTierStatsProps> = ({ playerId }) => {
    const [tierStats, setTierStats] = useState<TierStat[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchTierStats = async () => {
            try {
                // Step 1: Fetch base tier stats for the player
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

                // Step 3: Get the current season where `end_date` is NULL
                const { data: currentSeason, error: seasonError } = await supabase
                    .from('seasons')
                    .select('season_id')
                    .is('end_date', null)
                    .single();

                if (seasonError || !currentSeason) throw seasonError;

                const currentSeasonId = currentSeason.season_id;

                // Step 4: Fetch player's current season player_instance records
                const { data: playerInstanceData, error: instanceError } = await supabase
                    .from('player_instance')
                    .select('player_instance_id')
                    .eq('season_id', currentSeasonId)
                    .eq('player_id', playerId);

                if (instanceError) throw instanceError;

                const playerInstanceIds = playerInstanceData.map(instance => instance.player_instance_id);

                // Step 5: Fetch current season shots by instance IDs and tier
                const { data: shotsData, error: shotsError } = await supabase
                    .from('shots')
                    .select('result, tier_id')
                    .in('instance_id', playerInstanceIds);

                if (shotsError) throw shotsError;

                // Step 6: Calculate real-time tier stats by combining base stats and current season shots
                const updatedTierStats = tierStatsData.map(tierStat => {
                    const tier = tiersData.find(t => t.tier_id === tierStat.tier_id);
                    const tierShots = shotsData.filter(shot => shot.tier_id === tierStat.tier_id);

                    // Current season calculations for tier
                    const currentTotalScore = tierShots.reduce((acc, shot) => acc + shot.result, 0);
                    const currentTotalShots = tierShots.length;
                    const currentHigh = Math.max(tierStat.high, ...tierShots.map(shot => shot.result));
                    const currentLow = Math.min(tierStat.low, ...tierShots.map(shot => shot.result), 1); // Avoid division by zero

                    // Combine base stats and current season data
                    const totalScore = tierStat.total_score + currentTotalScore;
                    const totalShots = tierStat.total_shots + currentTotalShots;
                    const averageScore = (currentHigh + currentLow) / 2;
                    const pointsPerShot = totalShots > 0 ? totalScore / totalShots : 0;

                    return {
                        tier_name: tier ? tier.tier_name : 'Unknown',
                        total_score: totalScore,
                        total_shots: totalShots,
                        high: currentHigh,
                        low: currentLow,
                        average_score: averageScore,
                        points_per_shot: pointsPerShot,
                    };
                });

                setTierStats(updatedTierStats);
            } catch (error) {
                console.error('Error fetching tier stats:', error);
            }
        };

        fetchTierStats();
    }, [playerId]);

    const toggleExpansion = () => setIsExpanded(prev => !prev);

    return (
        <div className={styles.tierStatsContainer}>
            <button onClick={toggleExpansion} className={styles.toggleButton}>
                {isExpanded ? 'Hide Tier Stats' : 'Show Tier Stats'}
            </button>
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
