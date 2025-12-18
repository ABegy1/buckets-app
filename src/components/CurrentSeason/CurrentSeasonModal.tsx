'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import styles from './CurrentSeasonModal.module.css';
import PlayerInlineEditor from './PlayerInlineEditor';
import TeamsAndRulesPanel from './TeamsAndRulesPanel';

interface CurrentSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CurrentSeasonModal: React.FC<CurrentSeasonModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitConfirmationOpen, setIsSubmitConfirmationOpen] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);

  const fetchTeams = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('teams').select('*');
      if (error) {
        console.error('Error fetching teams:', error);
        return [];
      }
      setTeams(data || []);
      return data || [];
    } catch (err) {
      console.error('Unexpected error fetching teams:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
      setIsSubmitConfirmationOpen(false);
    }
  }, [isOpen, fetchTeams]);

  const handleCloseModal = () => {
    setIsSubmitConfirmationOpen(false);
    onClose();
  };

  const handleSubmitChanges = () => {
    setIsSubmitConfirmationOpen(true);
  };

  const handleConfirmSubmitChanges = () => {
    setIsSubmitConfirmationOpen(false);
    onClose();
  };

  return (
    <div
      className={`${styles.currentSeasonModal} ${isOpen ? styles.currentSeasonModalOpen : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Manage current season"
    >
      <div className={styles.modalContent}>
        <button
          className={styles.topCloseBtn}
          onClick={handleCloseModal}
          aria-label="Close current season controls"
        >
          ×
        </button>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>Current Season Controls</h2>
            <p className={styles.subtitle}>
              Edit players, teams, scores, shots, tiers, and rules side-by-side. Changes save inline and
              submit when you are ready.
            </p>
          </div>
        </div>

        <div className={styles.layoutGrid}>
          <PlayerInlineEditor isOpen={isOpen} teams={teams} onRefreshTeams={fetchTeams} />
          <TeamsAndRulesPanel
            isOpen={isOpen}
            teams={teams}
            onTeamsChange={setTeams}
            onRefreshTeams={fetchTeams}
          />
        </div>

        <div className={styles.bottomBar}>
          <button className={styles.secondaryBtn} onClick={handleCloseModal}>
            Close
          </button>
          <button className={styles.primaryBtn} onClick={handleSubmitChanges}>
            Submit changes
          </button>
        </div>
      </div>

      {isSubmitConfirmationOpen && (
        <div className={styles.confirmationOverlay} role="alertdialog" aria-modal="true">
          <div className={styles.confirmationCard}>
            <h3>Submit current season updates?</h3>
            <p>Confirm to apply your changes and close the modal.</p>
            <div className={styles.confirmationActions}>
              <button className={styles.secondaryBtn} onClick={() => setIsSubmitConfirmationOpen(false)}>
                Keep editing
              </button>
              <button className={styles.primaryBtn} onClick={handleConfirmSubmitChanges}>
                Submit and close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentSeasonModal;
