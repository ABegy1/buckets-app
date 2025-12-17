import React from 'react';
import styles from './sidebar.module.css';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCurrentSeasonClick: () => void;
  onStartSeasonClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onCurrentSeasonClick, onStartSeasonClick }) => {
  const router = useRouter();

  const handleSettingsClick = () => {
    onClose();
    router.push('/Settings');
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <button className={styles.closeBtn} onClick={onClose}>X</button>
      <div className={styles.sidebarContent}>
        <div className={styles.option} onClick={onCurrentSeasonClick}>Current Season</div>
        <div className={styles.option} onClick={onStartSeasonClick}>Start Season</div>
        <div className={styles.option} onClick={handleSettingsClick}>Gameplay Settings</div>
      </div>
    </div>
  );
};

export default Sidebar;
