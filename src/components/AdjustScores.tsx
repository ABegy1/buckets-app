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
        // Step 1: Fetch the active season where end_date is null
        const { data: activeSeason, error: activeSeasonError } = await supabase
          .from('seasons')
          .select('season_id')
          .is('end_date', null)
          .single();

        if (activeSeasonError || !activeSeason) {
          console.error('No active season found:', activeSeasonError);
          setLoading(false);
          return;
        }

        const activeSeasonId = activeSeason.season_id;

        // Step 2: Fetch players and their current score for the active season
        const { data: playerData, error: playerError } = await supabase
          .from('player_instance')
          .select(`
            player_id,
            score,
            players (name)
          `)
          .eq('season_id', activeSeasonId); // Filter by the active season

        if (playerError) {
          console.error('Error fetching player scores:', playerError);
        } else {
          setPlayers(playerData || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [isOpen]);

  const handleAdjustScores = async (playerId: number, adjustment: number) => {
    const updatedPlayers = players.map(player => {
      if (player.player_id === playerId) {
        return { ...player, score: player.score + adjustment };
      }
      return player;
    });
    setPlayers(updatedPlayers);

    // Update score in the database
    const playerToUpdate = updatedPlayers.find(p => p.player_id === playerId);
    const { error } = await supabase
      .from('player_instance')
      .update({ score: playerToUpdate.score })
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating score:', error);
    }
  };

  return (
    <div className={styles.AdjustScores}>
      <h2>Adjust Score</h2>
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
                  <button onClick={() => handleAdjustScores(player.player_id, -1)} disabled={player.score <= 0}>-</button>
                  {player.score}
                  <button onClick={() => handleAdjustScores(player.player_id, 1)}>+</button>
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
