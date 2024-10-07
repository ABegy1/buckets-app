// AdjustTiers.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import styles from './AdjustTiers.module.css'; // Create a new CSS module for AdjustTiers

interface AdjustTiersProps {
  isOpen: boolean;
}

const AdjustTiers: React.FC<AdjustTiersProps> = ({ isOpen }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlayersAndTiers = async () => {
      setLoading(true);
      try {
        // Fetch players and their current tiers
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select(`
            player_id,
            name,
            tier_id
          `);

        if (playerError) {
          console.error('Error fetching players:', playerError);
        } else {
          setPlayers(playerData || []);
        }

        // Fetch all tiers
        const { data: tierData, error: tierError } = await supabase
          .from('tiers')
          .select('*');

        if (tierError) {
          console.error('Error fetching tiers:', tierError);
        } else {
          setTiers(tierData || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayersAndTiers();
  }, [isOpen]);

  const handleTierChange = async (playerId: number, newTierId: number) => {
    // Optimistically update the tier in the UI
    const updatedPlayers = players.map(player => {
      if (player.player_id === playerId) {
        return { ...player, tier_id: newTierId };
      }
      return player;
    });
    setPlayers(updatedPlayers);

    // Update the player's tier in the database
    const { error } = await supabase
      .from('players')
      .update({ tier_id: newTierId })
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating player tier:', error);
    }
  };

  return (
    <div className={styles.adjustTiers}>
      <h2>Adjust Tiers</h2>
      {loading ? (
        <p>Loading tiers and players...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Tier</th>
            </tr>
          </thead>
          <tbody>
            {players.length > 0 ? (
              players.map(player => (
                <tr key={player?.player_id}>
                  <td>{player?.name || 'Unknown Player'}</td>
                  <td>
                    <select
                      value={player?.tier_id || ''}
                      onChange={(e) => handleTierChange(player?.player_id, Number(e.target.value))}
                    >
                      <option value="">No Tier</option>
                      {tiers.length > 0 ? (
                        tiers.map(tier => (
                          <option key={tier?.tier_id} value={tier?.tier_id}>
                            {tier?.tier_name || 'Unknown Tier'}
                          </option>
                        ))
                      ) : (
                        <option disabled>No tiers available</option>
                      )}
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2}>No players found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdjustTiers;
