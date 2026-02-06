import React, { useEffect, useState } from 'react';
import styles from './CurrentSeasonModal.module.css';
import AdjustShots from '../AdjustShots';
import AdjustShotsDashes from '../AdjustShotsDashes';
import AdjustTeams from '../AdjustTeams';
import AdjustScores from '../AdjustScores';
import AdjustTiers from '../AdjustTier';
import AddPlayers from '../AddPlayers';
import AdjustRules from '../AdjustRules';
import AdjustMonthlyShotLimit from '../AdjustMonthlyShotLimit';

// Type definition for the component's props
interface CurrentSeasonModalProps {
  isOpen: boolean; // Determines whether the modal is open
  onClose: () => void; // Function to handle closing the modal
}

/**
 * CurrentSeasonModal Component
 *
 * This component displays a modal with inline table controls to manage and adjust
 * various aspects of the current season, such as shots, teams, scores, tiers,
 * players, and rules.
 *
 * Props:
 * - `isOpen` (boolean): Controls whether the modal is visible.
 * - `onClose` (function): Callback function to close the modal.
 */
const CurrentSeasonModal: React.FC<CurrentSeasonModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('Adjust Shots');
  const [isSubmitConfirmationOpen, setIsSubmitConfirmationOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('Adjust Shots');
      setIsSubmitConfirmationOpen(false);
    }
  }, [isOpen]);

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

  const controls = [
    { key: 'Adjust Shots', label: 'Adjust Shots', description: 'Update shot attempts and completions.' },
    { key: 'Monthly Shot Limit', label: 'Monthly Shot Limit', description: 'Update the monthly shot cap for players.' },
    { key: 'Shots Left Dashes', label: 'Shots Left Dashes', description: 'Assign up to two dashes under shots left.' },
    { key: 'Teams', label: 'Team/Player Edit', description: 'Manage teams and player rosters.' },
    { key: 'Adjust Scores', label: 'Adjust Scores', description: 'Modify scores and results.' },
    { key: 'Tier Adjust', label: 'Tier Adjust', description: 'Reassign teams to tiers.' },
    { key: 'Add Player', label: 'Add Player', description: 'Add new players to the season.' },
    { key: 'Adjust Rules', label: 'Adjust Rules', description: 'Update season rules and guidelines.' },
  ];

  const handleQuickActionChange = (key: string) => {
    setActiveTab(key);
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
        </div>

        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div>
              <p className={styles.tableTitle}>Select a control to edit</p>
              <p className={styles.tableHelp}>Use the inline dropdown or the edit buttons to open a section.</p>
            </div>
            <div className={styles.quickSelect}>
              <label htmlFor="controlSelect">Jump to:</label>
              <select
                id="controlSelect"
                value={activeTab}
                onChange={(e) => handleQuickActionChange(e.target.value)}
                className={styles.select}
              >
                {controls.map((control) => (
                  <option key={control.key} value={control.key}>
                    {control.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <table className={styles.controlsTable}>
            <thead>
              <tr>
                <th scope="col">Control</th>
                <th scope="col">Description</th>
                <th scope="col">Action</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {controls.map((control) => (
                <tr key={control.key} className={activeTab === control.key ? styles.activeRow : ''}>
                  <td>{control.label}</td>
                  <td>{control.description}</td>
                  <td>
                    <div className={styles.inlineActions}>
                      <select
                        aria-label={`Choose action for ${control.label}`}
                        className={styles.select}
                        value={activeTab === control.key ? 'Edit' : 'View'}
                        onChange={() => handleQuickActionChange(control.key)}
                      >
                        <option value="View">View</option>
                        <option value="Edit">Edit</option>
                      </select>
                      <button
                        className={styles.inlineEditBtn}
                        onClick={() => handleQuickActionChange(control.key)}
                        aria-label={`Open ${control.label}`}
                      >
                        Open
                      </button>
                    </div>
                  </td>
                  <td>{activeTab === control.key ? 'Editing' : 'Idle'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Content area for the selected tab */}
        <div className={styles.contentWrapper}>
          <div className={styles.content}>
            {activeTab === 'Adjust Shots' && <AdjustShots isOpen={isOpen} />}
            {activeTab === 'Monthly Shot Limit' && <AdjustMonthlyShotLimit isOpen={isOpen} />}
            {activeTab === 'Shots Left Dashes' && <AdjustShotsDashes isOpen={isOpen} />}
            {activeTab === 'Teams' && <AdjustTeams isOpen={isOpen} />}
            {activeTab === 'Adjust Scores' && <AdjustScores isOpen={isOpen} />}
            {activeTab === 'Tier Adjust' && <AdjustTiers isOpen={isOpen} />}
            {activeTab === 'Add Player' && <AddPlayers isOpen={isOpen} />}
            {activeTab === 'Adjust Rules' && <AdjustRules isOpen={isOpen} />}
          </div>
        </div>

        {/* Bottom bar with controls */}
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
