import React, { useEffect, useState } from 'react';
import styles from './CurrentSeasonModal.module.css'; // Import CSS module for styling
import AdjustShots from '../AdjustShots'; // Component for adjusting shots
import AdjustTeams from '../AdjustTeams'; // Component for managing teams and players
import AdjustScores from '../AdjustScores'; // Component for modifying scores
import AdjustTiers from '../AdjustTier'; // Component for adjusting tiers
import AddPlayers from '../AddPlayers'; // Component for adding new players
import AdjustRules from '../AdjustRules'; // Component for updating rules

// Type definition for the component's props
interface CurrentSeasonModalProps {
  isOpen: boolean; // Determines whether the modal is open
  onClose: () => void; // Function to handle closing the modal
}

/**
 * CurrentSeasonModal Component
 *
 * This component displays a modal with tabs to manage and adjust various aspects
 * of the current season, such as shots, teams, scores, tiers, players, and rules.
 *
 * Props:
 * - `isOpen` (boolean): Controls whether the modal is visible.
 * - `onClose` (function): Callback function to close the modal.
 */
const CurrentSeasonModal: React.FC<CurrentSeasonModalProps> = ({ isOpen, onClose }) => {
  // State to track the active tab in the modal
  const [activeTab, setActiveTab] = useState('Adjust Shots');
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [isStartConfirmationOpen, setIsStartConfirmationOpen] = useState(false);
  const [isSubmitConfirmationOpen, setIsSubmitConfirmationOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('Adjust Shots');
      setIsEditingEnabled(false);
      setIsStartConfirmationOpen(false);
      setIsSubmitConfirmationOpen(false);
    }
  }, [isOpen]);

  /**
   * Updates the active tab based on user selection.
   * @param {string} tab - The name of the selected tab.
   */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab); // Update the active tab state
  };

  const handleCloseModal = () => {
    setIsEditingEnabled(false);
    setIsStartConfirmationOpen(false);
    setIsSubmitConfirmationOpen(false);
    onClose();
  };

  const handleConfirmStartEditing = () => {
    setIsEditingEnabled(true);
    setIsStartConfirmationOpen(false);
  };

  const handleSubmitChanges = () => {
    setIsSubmitConfirmationOpen(true);
  };

  const handleConfirmSubmitChanges = () => {
    setIsSubmitConfirmationOpen(false);
    setIsEditingEnabled(false);
    onClose();
  };

  return (
    // Modal container with dynamic class based on `isOpen` prop
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
              Make all edits in one place, then submit to apply them. Nothing is changed until you confirm.
            </p>
          </div>
          {!isEditingEnabled && (
            <button className={styles.primaryBtn} onClick={() => setIsStartConfirmationOpen(true)}>
              Start adjustments
            </button>
          )}
        </div>

        {/* Tabs for navigating between sections */}
        <div className={styles.tabs} aria-disabled={!isEditingEnabled}>
          {/* Tab: Adjust Shots */}
          <button
            className={`${styles.tab} ${activeTab === 'Adjust Shots' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Adjust Shots')}
            disabled={!isEditingEnabled}
          >
            Adjust Shots
          </button>

          {/* Tab: Team/Player Edit */}
          <button
            className={`${styles.tab} ${activeTab === 'Teams' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Teams')}
            disabled={!isEditingEnabled}
          >
            Team/Player Edit
          </button>

          {/* Tab: Adjust Scores */}
          <button
            className={`${styles.tab} ${activeTab === 'Adjust Scores' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Adjust Scores')}
            disabled={!isEditingEnabled}
          >
            Adjust Scores
          </button>

          {/* Tab: Tier Adjust */}
          <button
            className={`${styles.tab} ${activeTab === 'Tier Adjust' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Tier Adjust')}
            disabled={!isEditingEnabled}
          >
            Tier Adjust
          </button>

          {/* Tab: Add Player */}
          <button
            className={`${styles.tab} ${activeTab === 'Add Player' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Add Player')}
            disabled={!isEditingEnabled}
          >
            Add Player
          </button>

          {/* Tab: Adjust Rules */}
          <button
            className={`${styles.tab} ${activeTab === 'Adjust Rules' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Adjust Rules')}
            disabled={!isEditingEnabled}
          >
            Adjust Rules
          </button>
        </div>

        {/* Content area for the selected tab */}
        <div className={styles.contentWrapper}>
          {!isEditingEnabled ? (
            <div className={styles.lockScreen}>
              <h3>Ready to tune the current season?</h3>
              <p>Start adjustments to load the latest season data. No edits are applied until you confirm.</p>
              <div className={styles.lockActions}>
                <button className={styles.primaryBtn} onClick={() => setIsStartConfirmationOpen(true)}>
                  Start adjustments
                </button>
                <button className={styles.secondaryBtn} onClick={handleCloseModal}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.content}>
              {/* Render content based on the active tab */}
              {activeTab === 'Adjust Shots' && <AdjustShots isOpen={isOpen} />}
              {activeTab === 'Teams' && <AdjustTeams isOpen={isOpen} />}
              {activeTab === 'Adjust Scores' && <AdjustScores isOpen={isOpen} />}
              {activeTab === 'Tier Adjust' && <AdjustTiers isOpen={isOpen} />}
              {activeTab === 'Add Player' && <AddPlayers isOpen={isOpen} />}
              {activeTab === 'Adjust Rules' && <AdjustRules isOpen={isOpen} />}
            </div>
          )}
        </div>

        {/* Bottom bar with controls */}
        <div className={styles.bottomBar}>
          <button className={styles.secondaryBtn} onClick={handleCloseModal}>
            Close
          </button>
          <button className={styles.primaryBtn} onClick={handleSubmitChanges} disabled={!isEditingEnabled}>
            Submit changes
          </button>
        </div>
      </div>

      {isStartConfirmationOpen && (
        <div className={styles.confirmationOverlay} role="alertdialog" aria-modal="true">
          <div className={styles.confirmationCard}>
            <h3>Enable current season adjustments?</h3>
            <p>
              You&apos;re about to load the latest data. Changes will only be applied after you submit them.
            </p>
            <div className={styles.confirmationActions}>
              <button className={styles.secondaryBtn} onClick={() => setIsStartConfirmationOpen(false)}>
                Go back
              </button>
              <button className={styles.primaryBtn} onClick={handleConfirmStartEditing}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

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
