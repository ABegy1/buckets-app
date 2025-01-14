import React, { useState } from 'react';
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

  /**
   * Updates the active tab based on user selection.
   * @param {string} tab - The name of the selected tab.
   */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab); // Update the active tab state
  };

  return (
    // Modal container with dynamic class based on `isOpen` prop
    <div className={`${styles.currentSeasonModal} ${isOpen ? styles.currentSeasonModalOpen : ''}`}>
      <div className={styles.modalContent}>
        {/* Tabs for navigating between sections */}
        <div className={styles.tabs}>
          {/* Tab: Adjust Shots */}
          <button
            className={`${styles.tab} ${activeTab === 'Adjust Shots' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Adjust Shots')}
          >
            Adjust Shots
          </button>

          {/* Tab: Team/Player Edit */}
          <button
            className={`${styles.tab} ${activeTab === 'Teams' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Teams')}
          >
            Team/Player Edit
          </button>

          {/* Tab: Adjust Scores */}
          <button
            className={`${styles.tab} ${activeTab === 'Adjust Scores' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Adjust Scores')}
          >
            Adjust Scores
          </button>

          {/* Tab: Tier Adjust */}
          <button
            className={`${styles.tab} ${activeTab === 'Tier Adjust' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Tier Adjust')}
          >
            Tier Adjust
          </button>

          {/* Tab: Add Player */}
          <button
            className={`${styles.tab} ${activeTab === 'Add Player' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Add Player')}
          >
            Add Player
          </button>

          {/* Tab: Adjust Rules */}
          <button
            className={`${styles.tab} ${activeTab === 'Adjust Rules' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Adjust Rules')}
          >
            Adjust Rules
          </button>
        </div>

        {/* Content area for the selected tab */}
        <div className={styles.content}>
          {/* Render content based on the active tab */}
          {activeTab === 'Adjust Shots' && <AdjustShots isOpen={isOpen} />}
          {activeTab === 'Teams' && <AdjustTeams isOpen={isOpen} />}
          {activeTab === 'Adjust Scores' && <AdjustScores isOpen={isOpen} />}
          {activeTab === 'Tier Adjust' && <AdjustTiers isOpen={isOpen} />}
          {activeTab === 'Add Player' && <AddPlayers isOpen={isOpen} />}
          {activeTab === 'Adjust Rules' && <AdjustRules isOpen={isOpen} />}
        </div>

        {/* Bottom bar with a close button */}
        <div className={styles.bottomBar}>
          <button className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrentSeasonModal;
