// AdjustShots.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import styles from './AdjustShots.module.css'; // Create a new CSS module for AdjustShots

interface AdjustShotsProps {
  isOpen: boolean;
}

const AdjustShots: React.FC<AdjustShotsProps> = ({ isOpen }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlayers = async () => {
      setLoading(true);
      try {
        // Fetch players and their current shots left
        const { data, error } = await supabase
          .from('player_instance')
          .select(`
            player_id,
            score,
            players (name)
          `);

        if (error) {
          console.error('Error fetching player shots:', error);
        } else {
          setPlayers(data || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [isOpen]);

  const handleAdjustShots = async (playerId: number, adjustment: number) => {
    const updatedPlayers = players.map(player => {
      if (player.player_id === playerId) {
        return { ...player, score: player.score + adjustment };
      }
      return player;
    });
    setPlayers(updatedPlayers);

    // Update shots left in the database
    const playerToUpdate = updatedPlayers.find(p => p.player_id === playerId);
    const { error } = await supabase
      .from('player_instance')
      .update({ score: playerToUpdate.score })
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating shots left:', error);
    }
  };

  return (
    <div className={styles.AdjustShots}>
      <h2>Adjust Shots</h2>
      {loading ? (
        <p>Loading players...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Shots</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.player_id}>
                <td>{player.players.name}</td>
                <td>
                  <button onClick={() => handleAdjustShots(player.player_id, -1)} disabled={player.score <= 0}>-</button>
                  {player.score}
                  <button onClick={() => handleAdjustShots(player.player_id, 1)}>+</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdjustShots;
