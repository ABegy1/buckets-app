'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import AdjustRules from '../AdjustRules';
import styles from './CurrentSeasonModal.module.css';

interface TeamsAndRulesPanelProps {
  isOpen: boolean;
  teams: any[];
  onTeamsChange: (teams: any[]) => void;
  onRefreshTeams: () => Promise<void>;
}

const TeamsAndRulesPanel: React.FC<TeamsAndRulesPanelProps> = ({
  isOpen,
  teams,
  onTeamsChange,
  onRefreshTeams,
}) => {
  const [loadingTeams, setLoadingTeams] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchTeams = async () => {
      setLoadingTeams(true);
      try {
        const { data, error } = await supabase.from('teams').select('*');
        if (error) {
          console.error('Error fetching teams:', error);
          return;
        }
        onTeamsChange(data || []);
      } catch (err) {
        console.error('Unexpected error fetching teams:', err);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [isOpen, onTeamsChange]);

  const handleTeamNameChange = async (teamId: number, newName: string) => {
    const updatedTeams = teams.map((team) =>
      team.team_id === teamId ? { ...team, team_name: newName } : team
    );
    onTeamsChange(updatedTeams);

    const { error } = await supabase.from('teams').update({ team_name: newName }).eq('team_id', teamId);

    if (error) {
      console.error('Error updating team name:', error);
      return;
    }

    onRefreshTeams();
  };

  return (
    <div className={styles.sideStack}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Teams</p>
            <h3 className={styles.sectionTitle}>Rename teams directly</h3>
            <p className={styles.mutedText}>Updates apply immediately and are reflected in the player list.</p>
          </div>
        </div>
        {loadingTeams ? (
          <p className={styles.mutedText}>Loading teams...</p>
        ) : teams.length > 0 ? (
          <div className={styles.teamList}>
            {teams.map((team) => (
              <label key={team.team_id} className={styles.teamRow}>
                <span className={styles.teamLabel}>{team.team_name || 'Unknown Team'}</span>
                <input
                  className={styles.inlineInput}
                  type="text"
                  value={team.team_name || ''}
                  onChange={(e) => handleTeamNameChange(team.team_id, e.target.value)}
                />
              </label>
            ))}
          </div>
        ) : (
          <p className={styles.mutedText}>No teams available to edit.</p>
        )}
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>League Rules</p>
            <h3 className={styles.sectionTitle}>Edit the active season rules</h3>
          </div>
        </div>
        <AdjustRules isOpen={isOpen} />
      </div>
    </div>
  );
};

export default TeamsAndRulesPanel;
