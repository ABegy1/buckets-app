'use client';
import React, { useEffect, useState } from 'react';
import styles from './NextSeason.module.css';
import { supabase } from '@/supabaseClient';

// EditTeamModal Component
interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: any;
  onUpdate: (team: any) => void;
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({ isOpen, onClose, team, onUpdate }) => {
  const [teamName, setTeamName] = useState<string>(team?.team_name || '');

  useEffect(() => {
    if (team) {
      setTeamName(team.team_name);
    }
  }, [team]);

  const handleUpdateTeam = async () => {
    const { error } = await supabase
      .from('teams')
      .update({ team_name: teamName })
      .eq('team_id', team.team_id);
    
    if (error) {
      console.error('Error updating team:', error);
    } else {
      onUpdate({ ...team, team_name: teamName });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2>Edit Team</h2>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team Name"
          />
          <div className={styles.modalActions}>
            <button onClick={handleUpdateTeam}>Save</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTeamModal;