import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import styles from './AdjustScores.module.css'; // Create a new CSS module for AdjustScores

interface AdjustScoresProps {
  isOpen: boolean;
}

const AdjustScores: React.FC<AdjustScoresProps> = ({ isOpen }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlayers = async () => {
      setLoading(true);
      try {
        // Fetch players and their current score
        const { data, error } = await supabase
          .from('player_instance')
          .select(`
            player_id,
            player_instance_id,   // Include player_instance_id for shots table insertion
            score,         
            players (name) 
          `);

        if (error) {
          console.error('Error fetching player scores:', error);
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

  const handleAdjustScore = async (playerId: number, adjustment: number) => {
    // Optimistically update the score in the UI
    const updatedPlayers = players.map(player => {
      if (player.player_id === playerId) {
        return { ...player, score: player.score + adjustment };
      }
      return player;
    });
    setPlayers(updatedPlayers);

    // Find the player instance ID for shots insertion
    const playerToUpdate = updatedPlayers.find(p => p.player_id === playerId);
    const { player_instance_id, score } = playerToUpdate;

    // Step 1: Insert a new shot into the shots table with the adjustment
    const { error: shotError } = await supabase
      .from('shots')
      .insert({
        instance_id: player_instance_id,        // Insert related player_instance_id
        result: adjustment,                     // Record the score adjustment as a shot result
        shot_date: new Date().toISOString(),    // Add the current timestamp for shot_date
        tier_id: null // You should update this value with the relevant tier_id or logic to get it
      });

    if (shotError) {
      console.error('Error inserting shot:', shotError);
      return;  // Exit if there's an error inserting the shot
    }

    // Step 2: Update the score in the player_instance table
    const { error: updateError } = await supabase
      .from('player_instance')
      .update({ score })  // Update the score after adjusting
      .eq('player_id', playerId);

    if (updateError) {
      console.error('Error updating player score:', updateError);
    }
  };

  return (
    <div className={styles.adjustScores}>
      <h2>Adjust Scores</h2>
      {loading ? (
        <p>Loading players...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.player_id}>
                <td>{player.players.name}</td>
                <td>
                  <button onClick={() => handleAdjustScore(player.player_id, -1)} disabled={player.score <= 0}>-</button>
                  {player.score}
                  <button onClick={() => handleAdjustScore(player.player_id, 1)}>+</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdjustScores;
