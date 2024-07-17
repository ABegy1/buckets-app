import React, { useState } from 'react';
import styles from './CurrentSeasonModal.module.css';

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
          {activeTab === 'Adjust Shots' && (
            <div className={styles.adjustShots}>
              <h2>Adjust Shots</h2>
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Shots</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ryan</td>
                    <td><button>-</button> 30 <button>+</button></td>
                  </tr>
                  <tr>
                    <td>Brad</td>
                    <td><button>-</button> 20 <button>+</button></td>
                  </tr>
                  <tr>
                    <td>McNay</td>
                    <td><button>-</button> 12 <button>+</button></td>
                  </tr>
                  <tr>
                    <td>David</td>
                    <td><button>-</button> 0 <button>+</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'Teams' && (
            <div className={styles.teams}>
              <h2>Adjust Teams</h2>
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Shots</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ryan</td>
                    <td><button>-</button> 30 <button>+</button></td>
                  </tr>
                  <tr>
                    <td>Brad</td>
                    <td><button>-</button> 20 <button>+</button></td>
                  </tr>
                  <tr>
                    <td>McNay</td>
                    <td><button>-</button> 12 <button>+</button></td>
                  </tr>
                  <tr>
                    <td>David</td>
                    <td><button>-</button> 0 <button>+</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'Adjust Scores' && (
            <div className={styles.adjustScores}>
              <h2>Adjust Scores</h2>
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Shots</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ryan</td>
                    <td><button>-</button> 30 <button>+</button></td>
                  </tr>
                  <tr>
                    <td>Brad</td>
                    <td><button>-</button> 20 <button>+</button></td>
                  </tr>
                  <tr>
                    <td>McNay</td>
                    <td><button>-</button> 12 <button>+</button></td>
                  </tr>
                  <tr>
                    <td>David</td>
                    <td><button>-</button> 0 <button>+</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'Tier Adjust' && (
            <div className={styles.tierAdjust}>
              <h2>Tier Adjust</h2>
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Shots</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ryan</td>
                    <td><button>-</button> 30 <button>+</button></td>
                  </tr>
                  <tr>
                    <td>Brad</td>
                    <td><button>-</button> 20 <button>+</button></td>
                  </tr>
                  <tr>
                    <td>McNay</td>
                    <td><button>-</button> 12 <button>+</button></td>
                  </tr>
                  <tr>
                    <td>David</td>
                    <td><button>-</button> 0 <button>+</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentSeasonModal;
