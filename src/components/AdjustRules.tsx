import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import styles from './AdjustRules.module.css'; // Use the CSS module for styling

interface AdjustRulesProps {
  isOpen: boolean;
}

const AdjustRules: React.FC<AdjustRulesProps> = ({ isOpen }) => {
  const [rules, setRules] = useState<string>('');
  const [updatedRules, setUpdatedRules] = useState<string>('');
  const [seasonId, setSeasonId] = useState<number | null>(null);

  const fetchSeasonData = useCallback(async () => {
    try {
      // Fetch the active season's ID and rules
      const { data: activeSeason, error } = await supabase
        .from('seasons')
        .select('season_id, rules')
        .is('end_date', null)
        .single();

      if (error || !activeSeason) {
        console.error('Error fetching season data:', error);
        return;
      }

      setSeasonId(activeSeason.season_id);
      setRules(activeSeason.rules);
      setUpdatedRules(activeSeason.rules);
    } catch (error) {
      console.error('Unexpected error fetching season data:', error);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    fetchSeasonData();

    // Subscribe to real-time updates for rule changes
    const rulesChannel = supabase
      .channel('seasons-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'seasons' }, fetchSeasonData)
      .subscribe();

    return () => {
      // Clean up the subscription
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

  return (
    <div className={styles.adjustRules}>
      <h2 className={styles.header}>Edit Season Rules</h2> {/* Apply the header class */}
      <textarea
        className={styles.rulesTextarea}
        value={updatedRules}
        onChange={(e) => setUpdatedRules(e.target.value)}
      />
      <div className={styles.rulesActions}>
        <button onClick={handleSubmit}>Save</button>
      </div>
    </div>
  );
};

export default AdjustRules;
