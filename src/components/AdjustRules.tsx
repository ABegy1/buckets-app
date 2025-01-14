/**
 * AdjustRules Component
 *
 * This component allows administrators to view and update the rules for the active season.
 * Features include:
 * - Fetching the current active season's rules from the Supabase backend.
 * - Updating the rules for the season and saving changes to the database.
 * - Real-time subscription to updates, ensuring the UI reflects the latest changes made by others.
 *
 * Props:
 * - `isOpen`: A boolean indicating if the component should be rendered and active.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient'; // Import the Supabase client
import styles from './AdjustRules.module.css'; // Import CSS module for styling

interface AdjustRulesProps {
  isOpen: boolean;
}

const AdjustRules: React.FC<AdjustRulesProps> = ({ isOpen }) => {
  // State variables for managing rules and active season ID
  const [rules, setRules] = useState<string>(''); // Current rules fetched from the backend
  const [updatedRules, setUpdatedRules] = useState<string>(''); // Rules being edited by the user
  const [seasonId, setSeasonId] = useState<number | null>(null); // Active season's ID

  /**
   * Fetch active season data, including its ID and current rules.
   * Updates local state with the fetched data.
   */
  const fetchSeasonData = useCallback(async () => {
    try {
      const { data: activeSeason, error } = await supabase
        .from('seasons')
        .select('season_id, rules')
        .is('end_date', null)
        .single();

      if (error || !activeSeason) {
        console.error('Error fetching season data:', error);
        return;
      }

      setSeasonId(activeSeason.season_id); // Set the active season ID
      setRules(activeSeason.rules); // Set the current rules
      setUpdatedRules(activeSeason.rules); // Initialize the editable rules with the current rules
    } catch (error) {
      console.error('Unexpected error fetching season data:', error);
    }
  }, []);

  /**
   * Effect to fetch season data and subscribe to real-time updates when the component is open.
   */
  useEffect(() => {
    if (!isOpen) return; // Do nothing if the component is not open

    fetchSeasonData(); // Fetch initial data

    // Subscribe to real-time updates for the `seasons` table
    const rulesChannel = supabase
      .channel('seasons-db-changes') // Create a real-time channel
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'seasons' },
        fetchSeasonData // Re-fetch data on updates
      )
      .subscribe();

    return () => {
      // Clean up the subscription on unmount or when the component closes
      supabase.removeChannel(rulesChannel);
    };
  }, [isOpen, fetchSeasonData]);

  /**
   * Handle submission of updated rules.
   * Sends the updated rules to the backend to save them for the active season.
   */
  const handleSubmit = async () => {
    if (!updatedRules || !seasonId) return; // Ensure rules and season ID are valid

    try {
      const { error } = await supabase
        .from('seasons')
        .update({ rules: updatedRules }) // Update the `rules` column
        .eq('season_id', seasonId); // Target the active season

      if (error) {
        console.error('Error updating season rules:', error);
        return;
      }

      console.log('Rules updated successfully');
    } catch (error) {
      console.error('Unexpected error updating rules:', error);
    }
  };

  return (
    /**
     * Render the AdjustRules component.
     * Includes a textarea for editing rules and a save button for submitting changes.
     */
    <div className={styles.adjustRules}>
      {/* Header for the component */}
      <h2 className={styles.header}>Edit Season Rules</h2>

      {/* Textarea for editing rules */}
      <textarea
        className={styles.rulesTextarea}
        value={updatedRules}
        onChange={(e) => setUpdatedRules(e.target.value)} // Update state on change
      />

      {/* Actions section with a save button */}
      <div className={styles.rulesActions}>
        <button onClick={handleSubmit}>Save</button>
      </div>
    </div>
  );
};

export default AdjustRules;
