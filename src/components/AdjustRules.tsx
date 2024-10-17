import React, { useState, useEffect, useCallback } from 'react';
import styles from './AdjustRules.module.css'; // Import the CSS module
import { supabase } from '@/supabaseClient';

interface AdjustRulesProps {
  isOpen: boolean;
}

const AdjustRules: React.FC<AdjustRulesProps> = ({ isOpen }) => {
  const [rules, setRules] = useState<string>('');
  const [updatedRules, setUpdatedRules] = useState<string>('');
  const [seasonId, setSeasonId] = useState<number | null>(null);

  // Fetch the current season's ID and rules
  const fetchSeasonData = useCallback(async () => {
    try {
      // Fetch the current active season's ID and rules
      const { data: activeSeason, error } = await supabase
        .from('seasons')
        .select('season_id, rules')
        .is('end_date', null)
        .single();

      if (error || !activeSeason) {
        console.error('Error fetching season data:', error);
        return;
      }

      setSeasonId(activeSeason.season_id);  // Set the current season's ID
      setRules(activeSeason.rules);  // Set the current season's rules
      setUpdatedRules(activeSeason.rules);  // Prepopulate the rules for editing
    } catch (error) {
      console.error('Unexpected error fetching season data:', error);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch the initial season data when the modal opens
    fetchSeasonData();

    // Subscribe to real-time updates on the seasons table for rule changes
    const rulesChannel = supabase
      .channel('seasons-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'seasons' }, fetchSeasonData)
      .subscribe();

    return () => {
      // Cleanup subscription when modal is closed or component unmounts
      supabase.removeChannel(rulesChannel);
    };
  }, [isOpen, fetchSeasonData]);

  const handleSubmit = async () => {
    if (!updatedRules || !seasonId) return;

    try {
      const { error } = await supabase
        .from('seasons')
        .update({ rules: updatedRules })
        .eq('season_id', seasonId);

      if (error) {
        console.error('Error updating season rules:', error);
        return;
      }

      console.log('Rules updated successfully');
    } catch (error) {
      console.error('Unexpected error updating rules:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.adjustRulesModalOverlay} onClick={() => {}}>
      <div className={styles.adjustRulesModalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Edit Season Rules</h2>
        <textarea
          className={styles.rulesTextarea}
          value={updatedRules}
          onChange={(e) => setUpdatedRules(e.target.value)}
        />
        <div className={styles.rulesActions}>
          <button onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AdjustRules;
