/**
 * AdjustTiers Component
 *
 * This component allows administrators to view and adjust the tiers of players.
 * Features include:
 * - Fetching all players and their current tier assignments from the Supabase backend.
 * - Fetching available tiers for assignment.
 * - Displaying players in a table format with a dropdown to update their tier.
 * - Updating tier assignments in real-time both locally and in the database.
 *
 * Props:
 * - `isOpen`: A boolean indicating whether the component should be active and displayed.
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient'; // Supabase client import
import styles from './AdjustTiers.module.css'; // Import CSS module for styling

interface AdjustTiersProps {
  isOpen: boolean;
}

const AdjustTiers: React.FC<AdjustTiersProps> = ({ isOpen }) => {
  // State for managing players and tiers
  const [players, setPlayers] = useState<any[]>([]); // List of players fetched from the backend
  const [tiers, setTiers] = useState<any[]>([]); // List of tiers fetched from the backend
  const [loading, setLoading] = useState(true); // Loading state for data fetching

  /**
   * Effect to fetch players and tiers when the component is opened.
   * - Players include `player_id`, `name`, and `tier_id`.
   * - Tiers include all available tier data.
   */
  useEffect(() => {
    if (!isOpen) return; // Exit early if the component is not open

    const fetchPlayersAndTiers = async () => {
      setLoading(true); // Set loading state to true while fetching
      try {
        // Fetch players and their current tiers
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('player_id, name, tier_id');

        if (playerError) {
          console.error('Error fetching players:', playerError);
        } else {
          setPlayers(playerData || []);
        }

        // Fetch all tiers
        const { data: tierData, error: tierError } = await supabase.from('tiers').select('*');

        if (tierError) {
          console.error('Error fetching tiers:', tierError);
        } else {
          setTiers(tierData || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false); // Set loading state to false when fetching is complete
      }
    };

    fetchPlayersAndTiers(); // Call the fetch function
  }, [isOpen]);

  /**
   * Handles tier changes for a player.
   * - Updates the player's tier locally in the UI.
   * - Sends the updated tier to the backend.
   *
   * @param playerId - The ID of the player being updated.
   * @param newTierId - The ID of the new tier.
   */
  const handleTierChange = async (playerId: number, newTierId: number) => {
    // Optimistically update the player's tier locally
    const updatedPlayers = players.map((player) =>
      player.player_id === playerId ? { ...player, tier_id: newTierId } : player
    );
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
    /**
     * Render the AdjustTiers component.
     * - Displays a loading message while data is being fetched.
     * - Shows a table of players with dropdowns to adjust their tier assignments.
     */
    <div className={styles.adjustTiers}>
      <h2>Adjust Tiers</h2>

      {/* Show a loading message while data is being fetched */}
      {loading ? (
        <p>Loading tiers and players...</p>
      ) : (
        <div className={styles['table-container']}>
          {/* Table to display players and their tiers */}
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {players.length > 0 ? (
                players.map((player) => (
                  <tr key={player.player_id}>
                    {/* Display player's name */}
                    <td>{player.name || 'Unknown Player'}</td>

                    {/* Dropdown to change player's tier */}
                    <td>
                      <select
                        value={player.tier_id || ''}
                        onChange={(e) =>
                          handleTierChange(player.player_id, Number(e.target.value))
                        }
                      >
                        <option value="">No Tier</option>
                        {tiers.length > 0 ? (
                          tiers.map((tier) => (
                            <option key={tier.tier_id} value={tier.tier_id}>
                              {tier.tier_name || 'Unknown Tier'}
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
        </div>
      )}
    </div>
  );
};

export default AdjustTiers;
