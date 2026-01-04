/**
 * AdjustShotsDashes Component
 *
 * This component allows administrators to assign "shots left" dashes (0-2) for players
 * in the active season.
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import styles from './AdjustShotsDashes.module.css';

interface AdjustShotsDashesProps {
  isOpen: boolean;
}

interface PlayerDashRow {
  player_id: number;
  player_instance_id: number;
  shots_left_dashes: number;
  players: {
    name: string;
  }[];
}

const MIN_DASHES = 0;
const MAX_DASHES = 2;

const AdjustShotsDashes: React.FC<AdjustShotsDashesProps> = ({ isOpen }) => {
  const [players, setPlayers] = useState<PlayerDashRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlayers = async () => {
      setLoading(true);
      try {
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

        const { data: playerData, error: playerError } = await supabase
          .from('player_instance')
          .select(`
            player_id,
            player_instance_id,
            shots_left_dashes,
            players (name)
          `)
          .eq('season_id', activeSeason.season_id)
          .order('player_id', { ascending: true });

        if (playerError) {
          console.error('Error fetching player dash data:', playerError);
        } else {
          setPlayers((playerData || []) as PlayerDashRow[]);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [isOpen]);

  const handleAdjustDashes = async (playerId: number, adjustment: number) => {
    const updatedPlayers = players.map((player) => {
      if (player.player_id === playerId) {
        const nextValue = Math.min(
          MAX_DASHES,
          Math.max(MIN_DASHES, (player.shots_left_dashes ?? 0) + adjustment)
        );
        return { ...player, shots_left_dashes: nextValue };
      }
      return player;
    });

    setPlayers(updatedPlayers);

    const playerToUpdate = updatedPlayers.find((player) => player.player_id === playerId);

    if (!playerToUpdate) {
      console.error('Player not found when adjusting dashes');
      return;
    }

    const { error } = await supabase
      .from('player_instance')
      .update({ shots_left_dashes: playerToUpdate.shots_left_dashes })
      .eq('player_instance_id', playerToUpdate.player_instance_id);

    if (error) {
      console.error('Error updating shots left dashes:', error);
    }
  };

  return (
    <div className={styles.adjustShotsDashes}>
      <h2>Shots Left Dashes</h2>

      {loading ? (
        <p>Loading players...</p>
      ) : (
        <div className={styles['table-container']}>
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Dashes</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.player_id}>
                  <td>{player.players?.[0]?.name}</td>
                  <td>
                    <button
                      onClick={() => handleAdjustDashes(player.player_id, -1)}
                      disabled={(player.shots_left_dashes ?? 0) <= MIN_DASHES}
                    >
                      -
                    </button>
                    {player.shots_left_dashes ?? 0}
                    <button
                      onClick={() => handleAdjustDashes(player.player_id, 1)}
                      disabled={(player.shots_left_dashes ?? 0) >= MAX_DASHES}
                    >
                      +
                    </button>
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

export default AdjustShotsDashes;
