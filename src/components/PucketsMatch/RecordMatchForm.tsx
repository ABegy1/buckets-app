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

import React, { useActionState, useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient'; // Supabase client import
import styles from './RecordMatchForm.module.css'; // CSS module for styling
import { PucketsPlayerWithStats, Match } from '@/app/Puckets/types'; // Importing types for player and match data
import { recordMatch } from './RecordMatch';

interface RecordMatchProps {
  isOpen: boolean;
}

const RecordMatch: React.FC<RecordMatchProps> = ({ isOpen }) => {
  // State to manage the list of players and their scores
  const [players, setPlayers] = useState<PucketsPlayerWithStats[]>([]); // Player data fetched from the backend
  const [loading, setLoading] = useState(true); // Loading state for data fetching
  const [season, setSeason] = useState<number>(); // Current season info
  const [submitState, formAction, pending] = useActionState(recordMatch, null); //Status string for the match submit request


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
          <form action={formAction}>
            <fieldset>
              <div style={{fontSize: '14px', color: 'black'}}>
                Debug: {JSON.stringify(submitState)}
              </div>
              <select name="player1.instance_id" 
                defaultValue={submitState?.values?.player1?.instance_id ?? 0} 
                key={submitState?.values?.player1?.instance_id ?? 0}
                >
                  <option value="">Select a player</option>
                  {players.map((player) => (
                    <option 
                      key = {player.instance_id} 
                      value={player.instance_id}
                    >
                        {player.name}
                    </option>
                ))}
              </select>
              <input 
                type="number" 
                name="player1.score" 
                max={21} 
                min={0} 
                defaultValue={submitState?.values?.player1?.score ?? 0}
              >
              </input>
              {submitState?.errors && <p aria-live="polite">{submitState.errors}</p>}
            </fieldset>
            <fieldset>
              <select name="player2.instance_id"
                defaultValue={submitState?.values?.player2?.instance_id ?? 0} 
                key={submitState?.values?.player2?.instance_id ?? 0}
              >
                <option value="">Select a player</option>
                {players.map((player) => (
                  <option key = {player.instance_id} value={player.instance_id}>{player.name}</option>
                ))}
              </select>
              <input 
                type="number" 
                name="player2.score" 
                max={21} 
                min={0}
                defaultValue={submitState?.values?.player2?.score ?? 0}
              >
              </input>
            </fieldset>
            {submitState?.success && <p aria-live='polite'>Match Submitted Successfully</p>}
            <button type='submit' disabled={pending}>Submit</button>

          </form>
        </div>
      )}
    </div>
  );
};

export default RecordMatch;
