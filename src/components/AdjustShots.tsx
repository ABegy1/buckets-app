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

        // Step 2: Fetch players and their current shots left for the active season
        const { data: playerData, error: playerError } = await supabase
          .from('player_instance')
          .select(`
            player_id,
            shots_left,
            players (name)
          `)
          .eq('season_id', activeSeasonId); // Filter by the active season

        if (playerError) {
          console.error('Error fetching player shots:', playerError);
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

  const handleAdjustShots = async (playerId: number, adjustment: number) => {
    const updatedPlayers = players.map(player => {
      if (player.player_id === playerId) {
        return { ...player, shots_left: player.shots_left + adjustment };
      }
      return player;
    });
    setPlayers(updatedPlayers);

    // Update shots left in the database
    const playerToUpdate = updatedPlayers.find(p => p.player_id === playerId);
    const { error } = await supabase
      .from('player_instance')
      .update({ shots_left: playerToUpdate.shots_left })
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating shots left:', error);
    }
  };

  return (
    <div className={styles.adjustShots}>
  <h2>Adjust Shots</h2>
  {loading ? (
    <p>Loading players...</p>
  ) : (
    <div className={styles['table-container']}>
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
                <button onClick={() => handleAdjustShots(player.player_id, -1)} disabled={player.shots_left <= 0}>-</button>
                {player.shots_left}
                <button onClick={() => handleAdjustShots(player.player_id, 1)}>+</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

  );
};

export default AdjustShots;
