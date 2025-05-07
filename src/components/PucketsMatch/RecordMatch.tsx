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
import styles from './RecordMatch.module.css'; // CSS module for styling
import { PucketsPlayerWithStats, Match } from '@/app/Puckets/page';

interface RecordMatchProps {
  isOpen: boolean;
}

const RecordMatch: React.FC<RecordMatchProps> = ({ isOpen }) => {
  // State to manage the list of players and their scores
  const [players, setPlayers] = useState<PucketsPlayerWithStats[]>([]); // Player data fetched from the backend
  const [loading, setLoading] = useState(true); // Loading state for data fetching
  const [season, setSeason] = useState<number>(); // Current season info
  const [match, setMatch] = useState<Match>(
{
    player1: {
      instance_id: -1,
      name: '',
      rating: -1,
      score: 0,
    },
    player2: {
      instance_id: -1,
      name: '',
      rating: -1,
      score: 0,
    },
    season_id: -1,
    date: new Date(0)
  }
  ); // The match to be recorded
  /**
   * Effect to fetch players and scores when the component is open.
   * - Step 1: Fetch the active season's ID.
   * - Step 2: Fetch players and their scores for the active season.
   */
  useEffect(() => {
    if (!isOpen) return; // Exit early if the component is not open

    const fetchPlayers = async () => {
      try {
        // Fetch active season details

        const { data: activeSeason, error: seasonError } = await supabase
          .schema('puckets')
          .from('seasons')
          .select('season_id, season_name, rules')
          .is('end_date', null)
          .single();
    
        if (seasonError || !activeSeason) throw seasonError;
    
        const activeSeasonId = activeSeason.season_id;
        setSeason(activeSeasonId);
          // Fetch players
  
        const { data: playerData, error: playerError } = await supabase
          .schema('puckets')
          .from('player_instance')
          .select('player_instance_id, season_id, rating, losses, wins, successive_loss, successive_wins, players (name)')
          .eq('season_id', activeSeasonId);
    
        if (playerError) throw playerError;
        // console.log("playerData:\n", playerData);
        const playerStats: PucketsPlayerWithStats[] = await Promise.all(
          playerData.map(async (player: any) => {
                return {
                  instance_id: player.player_instance_id,
                  name: player.players.name,
                  rating: player.rating,
                  wins: player.wins,
                  losses: player.losses,
                  successive_wins: player.successive_wins,
                  successive_losses: player.successive_loss,
                  tier: 0,
                  is_hidden: false,
                  is_inactive: false
                };
              })
            );
    
            // Sort players by their score, descending
            playerStats.sort((a, b) => b.rating - a.rating);
        console.log("playerStats:\n", playerStats);
        setPlayers(playerStats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching teams, players, and season info:', error);
      }
    };
    

    fetchPlayers(); // Call the function to fetch player data
  }, [isOpen]);

  const handleMatchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMatch((prev) => ({
      ...prev,
      [name]: value,
    }));
    console.log(value);
  };

  /**
   * Handles score adjustment for a player.
   * - Updates the player's score locally.
   * - Sends the updated score to the database.
   *
   * @param playerId - The ID of the player whose score is being adjusted.
   * @param adjustment - The adjustment value (+1 or -1).
   */
  const handleRecordMatch = async (player1Id: number, player1Score: number, player2Id: number, player2Score: number) => {
    // Update the local state with the new score
    // const updatedPlayers = players.map((player) => {
    //   if (player.player_id === playerId) {
    //     return { ...player, score: player.score + adjustment };
    //   }
    //   return player;
    // });
    // setPlayers(updatedPlayers); // Update the players list in the state

    // // Find the updated player
    // const playerToUpdate = updatedPlayers.find((p) => p.player_id === playerId);

    // // Update the player's score in the database
    // const { error } = await supabase
    //   .from('player_instance')
    //   .update({ score: playerToUpdate.score })
    //   .eq('player_id', playerId);

    // if (error) {
    //   console.error('Error updating score:', error);
    // }
  };

  return (
    /**
     * Render the AdjustScores component.
     * - Displays a loading message while fetching data.
     * - Shows a table of players with buttons to adjust their scores.
     */
    <div className={styles.recordMatch}>
      {/* Header for the component */}
      <h2>Record Match</h2>

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
                <tr>
                  <td>
                    <select value={match?.player1.instance_id} onChange={handleMatchChange}>
                    {players.map((player, playerIndex) => (
                      <option key = {playerIndex} value={player.instance_id}>{player.name}</option>
                    ))}
                    </select>
                  </td>
                  <td>
                    <input type="number" max={21} min={0} value={match?.player1.score} onChange={handleMatchChange}></input>
                  </td>
                </tr>
                <tr>
                  <td>
                    <select value={match?.player2.instance_id} onChange={handleMatchChange}>
                    {players.map((player) => (
                      <option key = {player.instance_id} value={player.instance_id}>{player.name}</option>
                    ))}
                    </select>
                  </td>
                  <td>
                    <input type="number" max={21} min={0} value={match?.player2.score} onChange={handleMatchChange}></input>
                  </td>
                </tr>
            </tbody>
          </table>
          <button onSubmit={handleRecordMatch}>Submit</button>
          <div>Submitted Successfully</div>
        </div>
      )}
    </div>
  );
};

export default RecordMatch;
