/**
 * AdjustScores Component
 *
 * This component allows administrators to view and adjust player scores for the active season.
 * Features include:
 * - Fetching the list of players and their scores from the Supabase backend.
 * - Displaying players in a table with buttons to increment or decrement their scores.
 * - Updating player scores in real-time both locally and in the database.
 *
 * Props:
 * - `isOpen`: A boolean indicating whether the component should be rendered and active.
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient'; // Supabase client import
import styles from './AdjustScores.module.css'; // CSS module for styling

interface AdjustScoresProps {
  isOpen: boolean;
}

const AdjustScores: React.FC<AdjustScoresProps> = ({ isOpen }) => {
  // State to manage the list of players and their scores
  const [players, setPlayers] = useState<any[]>([]); // Player data fetched from the backend
  const [loading, setLoading] = useState(true); // Loading state for data fetching

  /**
   * Effect to fetch players and scores when the component is open.
   * - Step 1: Fetch the active season's ID.
   * - Step 2: Fetch players and their scores for the active season.
   */
  useEffect(() => {
    if (!isOpen) return; // Exit early if the component is not open

    const fetchPlayers = async () => {
      setLoading(true); // Set loading state to true while fetching
      try {
        // Fetch the active season where `end_date` is null
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

        // Fetch players and their scores for the active season
        const { data: playerData, error: playerError } = await supabase
          .from('player_instance')
          .select(`
            player_id,
            score,
            players (name)
          `)
          .eq('season_id', activeSeasonId); // Filter by the active season ID

        if (playerError) {
          console.error('Error fetching player scores:', playerError);
        } else {
          setPlayers(playerData || []); // Update the local state with player data
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false); // Set loading state to false when fetching is complete
      }
    };

    fetchPlayers(); // Call the function to fetch player data
  }, [isOpen]);

  /**
   * Handles score adjustment for a player.
   * - Updates the player's score locally.
   * - Sends the updated score to the database.
   *
   * @param playerId - The ID of the player whose score is being adjusted.
   * @param adjustment - The adjustment value (+1 or -1).
   */
  const handleAdjustScores = async (playerId: number, adjustment: number) => {
    // Update the local state with the new score
    const updatedPlayers = players.map((player) => {
      if (player.player_id === playerId) {
        return { ...player, score: player.score + adjustment };
      }
      return player;
    });
    setPlayers(updatedPlayers); // Update the players list in the state

    // Find the updated player
    const playerToUpdate = updatedPlayers.find((p) => p.player_id === playerId);

    // Update the player's score in the database
    const { error } = await supabase
      .from('player_instance')
      .update({ score: playerToUpdate.score })
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating score:', error);
    }
  };

  return (
    /**
     * Render the AdjustScores component.
     * - Displays a loading message while fetching data.
     * - Shows a table of players with buttons to adjust their scores.
     */
    <div className={styles.adjustScores}>
      {/* Header for the component */}
      <h2>Adjust Scores</h2>

      {/* Show a loading message while data is being fetched */}
      {loading ? (
        <p>Loading players...</p>
      ) : (
        <div className={styles['table-container']}>
          {/* Table to display player data */}
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {/* Map over players and render their data in table rows */}
              {players.map((player) => (
                <tr key={player.player_id}>
                  <td>{player.players.name}</td>
                  <td>
                    {/* Button to decrement the score, disabled if score <= 0 */}
                    <button
                      onClick={() => handleAdjustScores(player.player_id, -1)}
                      disabled={player.score <= 0}
                    >
                      -
                    </button>
                    {player.score}
                    {/* Button to increment the score */}
                    <button onClick={() => handleAdjustScores(player.player_id, 1)}>+</button>
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

export default AdjustScores;
