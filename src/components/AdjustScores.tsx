// AdjustScores.tsx
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

    const fetchPlayerScores = async () => {
      setLoading(true);
      try {
        // Fetch player instances and their shot results
        const { data, error } = await supabase
          .from('player_instance')
          .select(`
            player_instance_id,
            player_id,
            players (name),  // Nested relation to get the player's name
            shots (result)
          `);

        if (error) {
          console.error('Error fetching player instances:', error);
        } else {
          const playersWithScores = data.map((player: any) => {
            const totalScore = player.shots.reduce((sum: number, shot: any) => sum + shot.result, 0);
            return {
              player_instance_id: player.player_instance_id,
              player_name: player.players.name,  // Access the player name correctly
              score: totalScore,
            };
          });
          setPlayers(playersWithScores || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerScores();
  }, [isOpen]);

  const handleScoreAdjust = async (playerInstanceId: number, adjustment: number) => {
    // Optimistically update the score in the UI
    const updatedPlayers = players.map(player => {
      if (player.player_instance_id === playerInstanceId) {
        return { ...player, score: player.score + adjustment };
      }
      return player;
    });
    setPlayers(updatedPlayers);

    // Update the player's shot results in the database
    const { error } = await supabase
      .from('shots')
      .insert({ result: adjustment, instance_id: playerInstanceId });

    if (error) {
      console.error('Error updating player score:', error);
    }
  };

  return (
    <div className={styles.adjustScores}>
      <h2>Adjust Scores</h2>
      {loading ? (
        <p>Loading players and scores...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {players.length > 0 ? (
              players.map(player => (
                <tr key={player.player_instance_id}>
                  <td>{player.player_name}</td>
                  <td>
                    <button onClick={() => handleScoreAdjust(player.player_instance_id, -1)} disabled={player.score <= 0}>-</button>
                    {player.score}
                    <button onClick={() => handleScoreAdjust(player.player_instance_id, 1)}>+</button>
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

export default AdjustScores;
