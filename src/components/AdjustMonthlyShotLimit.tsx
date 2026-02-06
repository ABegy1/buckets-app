/**
 * AdjustMonthlyShotLimit Component
 *
 * Allows administrators to view and update the monthly shot limit for the active season.
 * - Fetches the active season limit from Supabase.
 * - Saves changes to the `monthly_shot_limit` column on the active season.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import styles from './AdjustMonthlyShotLimit.module.css';

interface AdjustMonthlyShotLimitProps {
  isOpen: boolean;
}

const DEFAULT_MONTHLY_SHOT_LIMIT = 40;

const AdjustMonthlyShotLimit: React.FC<AdjustMonthlyShotLimitProps> = ({ isOpen }) => {
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [limit, setLimit] = useState<number>(DEFAULT_MONTHLY_SHOT_LIMIT);
  const [saving, setSaving] = useState(false);

  const fetchLimit = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('season_id, monthly_shot_limit')
        .is('end_date', null)
        .single();

      if (error || !data) {
        console.error('Error fetching monthly shot limit:', error);
        return;
      }

      setSeasonId(data.season_id);
      setLimit(Number(data.monthly_shot_limit) || DEFAULT_MONTHLY_SHOT_LIMIT);
    } catch (error) {
      console.error('Unexpected error fetching monthly shot limit:', error);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    fetchLimit();

    const seasonChannel = supabase
      .channel('monthly-shot-limit-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'seasons' }, fetchLimit)
      .subscribe();

    return () => {
      supabase.removeChannel(seasonChannel);
    };
  }, [fetchLimit, isOpen]);

  const handleSave = async () => {
    if (!seasonId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('seasons')
        .update({ monthly_shot_limit: limit })
        .eq('season_id', seasonId);

      if (error) {
        console.error('Error updating monthly shot limit:', error);
      }
    } catch (error) {
      console.error('Unexpected error updating monthly shot limit:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.adjustMonthlyShotLimit}>
      <h2 className={styles.header}>Monthly Shot Limit</h2>
      <p className={styles.helperText}>
        Update the maximum number of shots each player can take per month before an override prompt appears.
      </p>
      <div className={styles.formRow}>
        <label htmlFor="monthlyShotLimit">Monthly limit</label>
        <input
          id="monthlyShotLimit"
          className={styles.limitInput}
          type="number"
          min={0}
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value))}
        />
      </div>
      <div className={styles.actions}>
        <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default AdjustMonthlyShotLimit;
