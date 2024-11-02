import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

interface TierScore {
    tier_name: string;
    tier_score: number;
}

interface PlayerTierScoresProps {
    playerId: number;
}

const PlayerTierScores: React.FC<PlayerTierScoresProps> = ({ playerId }) => {
    const [tierScores, setTierScores] = useState<TierScore[]>([]);

    const fetchTierScores = async () => {
        try {
            // Fetch tier scores for the specific player, joining with `tiers` table to get `tier_name`
            const { data: tierScoresData, error } = await supabase
                .from('player_instance')
                .select(`
                    score,
                    tier_id,
                    tiers (tier_name)
                `)
                .eq('player_id', playerId);

            if (error) throw error;

            // Aggregate scores by tier
            const aggregatedScores = tierScoresData.reduce((acc, tierScore) => {
                const tierName = tierScore.tiers?.tier_name || 'Unknown';
                const existingTier = acc.find(t => t.tier_name === tierName);
                if (existingTier) {
                    existingTier.tier_score += tierScore.score;
                } else {
                    acc.push({ tier_name: tierName, tier_score: tierScore.score });
                }
                return acc;
            }, [] as TierScore[]);

            setTierScores(aggregatedScores);
        } catch (error) {
            console.error('Error fetching tier scores:', error);
        }
    };

    useEffect(() => {
        fetchTierScores();
    }, [playerId]);

    return (
        <div>
            <h3>Scores by Tier:</h3>
            {tierScores.length > 0 ? (
                tierScores.map((tier, index) => (
                    <p key={index}>{tier.tier_name}: {tier.tier_score}</p>
                ))
            ) : (
                <p>No tier scores available</p>
            )}
        </div>
    );
};

export default PlayerTierScores;
