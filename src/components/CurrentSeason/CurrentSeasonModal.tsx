import React, { useState } from 'react';
import styles from './CurrentSeasonModal.module.css';
import AdjustShots from '../AdjustShots';
import AdjustTeams from '../AdjustTeams';
import AdjustScores from '../AdjustScores';

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
        <button className={styles.closeBtn} onClick={onClose}>X</button>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'Adjust Shots' ? styles.tabActive : ''}`} onClick={() => handleTabChange('Adjust Shots')}>Adjust Shots</button>
          <button className={`${styles.tab} ${activeTab === 'Teams' ? styles.tabActive : ''}`} onClick={() => handleTabChange('Teams')}>Teams</button>
          <button className={`${styles.tab} ${activeTab === 'Adjust Scores' ? styles.tabActive : ''}`} onClick={() => handleTabChange('Adjust Scores')}>Adjust Scores</button>
          <button className={`${styles.tab} ${activeTab === 'Tier Adjust' ? styles.tabActive : ''}`} onClick={() => handleTabChange('Tier Adjust')}>Tier Adjust</button>
        </div>
        <div className={styles.content}>
          {activeTab === 'Adjust Shots' && <AdjustShots isOpen={isOpen} />} {/* Use the AdjustShots component */}
          {activeTab === 'Teams' && <AdjustTeams isOpen={isOpen} />} {/* Use the AdjustTeams component */}
          {activeTab === 'Adjust Scores' && <AdjustScores isOpen={isOpen} />} {/* Use the AdjustTeams component */}
          {/* Keep the other tabs the same */}
        </div>
      </div>
    </div>
  );
};

export default CurrentSeasonModal;
