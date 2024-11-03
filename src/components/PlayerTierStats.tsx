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
                const { data: tierStatsData, error: tierStatsError } = await supabase
                    .from('tier_stats')
                    .select('tier_id, total_score, total_shots, high, low')
                    .eq('player_id', playerId);

                if (tierStatsError) throw tierStatsError;

                const { data: tiersData, error: tiersError } = await supabase
                    .from('tiers')
                    .select('tier_id, tier_name');

                if (tiersError) throw tiersError;

                const mappedTierStats = tierStatsData.map(tierStat => {
                    const tier = tiersData.find(t => t.tier_id === tierStat.tier_id);
                    const tierAverageScore = (tierStat.high + tierStat.low) / 2;
                    const tierPointsPerShot = tierStat.total_shots > 0 ? tierStat.total_score / tierStat.total_shots : 0;

                    return {
                        tier_name: tier ? tier.tier_name : 'Unknown',
                        total_score: tierStat.total_score,
                        total_shots: tierStat.total_shots,
                        high: tierStat.high,
                        low: tierStat.low,
                        average_score: tierAverageScore,
                        points_per_shot: tierPointsPerShot,
                    };
                });

                setTierStats(mappedTierStats);
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
