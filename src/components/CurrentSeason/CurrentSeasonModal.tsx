import React, { useState } from 'react';
import styles from './CurrentSeasonModal.module.css';
import AdjustShots from '../AdjustShots';
import AdjustTeams from '../AdjustTeams';
import AdjustScores from '../AdjustScores';
import AdjustTiers from '../AdjustTier';
import AddPlayers from '../AddPlayers';

interface CurrentSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CurrentSeasonModal: React.FC<CurrentSeasonModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('Adjust Shots');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className={`${styles.currentSeasonModal} ${isOpen ? styles.currentSeasonModalOpen : ''}`}>
      <div className={styles.modalContent}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'Adjust Shots' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Adjust Shots')}
          >
            Adjust Shots
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'Teams' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Teams')}
          >
            Teams
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'Adjust Scores' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Adjust Scores')}
          >
            Adjust Scores
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'Tier Adjust' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Tier Adjust')}
          >
            Tier Adjust
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'Add Player' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('Add Player')}
          >
            Add Player
          </button>
        </div>
        <div className={styles.content}>
          {activeTab === 'Adjust Shots' && <AdjustShots isOpen={isOpen} />}
          {activeTab === 'Teams' && <AdjustTeams isOpen={isOpen} />}
          {activeTab === 'Adjust Scores' && <AdjustScores isOpen={isOpen} />}
          {activeTab === 'Tier Adjust' && <AdjustTiers isOpen={isOpen} />}
          {activeTab === 'Add Player' && <AddPlayers isOpen={isOpen} />}
        </div>
        <div className={styles.bottomBar}>
          <button className={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default CurrentSeasonModal;
