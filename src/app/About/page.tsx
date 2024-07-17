'use client';
import React, { useState } from 'react';
import styles from './About.module.css';
import Modal from '@/components/Modal/Modal';
import Sidebar from '@/components/Sidebar/Sidebar';
import CurrentSeasonModal from '@/components/CurrentSeason/CurrentSeasonModal';
import NextSeasonModal from '@/components/NextSeason/NextSeason';

const About = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCurrentSeasonModalOpen, setIsCurrentSeasonModalOpen] = useState(false);
  const [isNextSeasonModalOpen, setIsNextSeasonModalOpen] = useState<boolean>(false);

  const handleOpenModal = (name: string) => {
    setSelectedName(name);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleOpenCurrentSeasonModal = () => {
    setIsCurrentSeasonModalOpen(true);
    setIsSidebarOpen(false);
  };

  const handleCloseCurrentSeasonModal = () => {
    setIsCurrentSeasonModalOpen(false);
  };

  const handleOpenNextSeasonModal = () => {
    setIsNextSeasonModalOpen(true);
    setIsCurrentSeasonModalOpen(false);
  };

  const handleCloseNextSeasonModal = () => {
    setIsNextSeasonModalOpen(false);
  };

  const handleStartSeason = () => {
    console.log("Start Season clicked");
    setIsNextSeasonModalOpen(false);
  };

  return (
    <div className={styles.aboutPage}>
      <div className={styles.container}>
        <div className={styles.secondaryScreenOptions}>
          <button className={styles.button} onClick={handleOpenSidebar}>Settings</button>
        </div>

        <div className={styles.players}>
          <div className={styles.column}>
            <div className={styles.header}>Green</div>
            <div className={styles.box} onClick={() => handleOpenModal('Stephen')}>Stephen</div>
            <div className={styles.box} onClick={() => handleOpenModal('David')}>David</div>
            <div className={styles.box} onClick={() => handleOpenModal('Brandon')}>Brandon</div>
          </div>
          <div className={styles.column}>
            <div className={styles.header}>Yellow</div>
            <div className={styles.box} onClick={() => handleOpenModal('Andrew')}>Andrew</div>
            <div className={styles.box} onClick={() => handleOpenModal('McNay')}>McNay</div>
            <div className={styles.box} onClick={() => handleOpenModal('Jay')}>Jay</div>
          </div>
          <div className={styles.column}>
            <div className={styles.header}>Red</div>
            <div className={styles.box} onClick={() => handleOpenModal('Jarrod')}>Jarrod</div>
            <div className={styles.box} onClick={() => handleOpenModal('Brad')}>Brad</div>
            <div className={styles.box} onClick={() => handleOpenModal('Jason')}>Jason</div>
          </div>
          <div className={styles.column}>
            <div className={styles.header}>Black</div>
            <div className={styles.box} onClick={() => handleOpenModal('Ryan')}>Ryan</div>
            <div className={styles.box} onClick={() => handleOpenModal('Kevin')}>Kevin</div>
            <div className={styles.box} onClick={() => handleOpenModal('Malson')}>Malson</div>
          </div>
        </div>
      </div>

      <Modal name={selectedName} isOpen={isModalOpen} onClose={handleCloseModal} />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={handleCloseSidebar} 
        onCurrentSeasonClick={handleOpenCurrentSeasonModal} 
        onStartSeasonClick={handleOpenNextSeasonModal}
      />
      <CurrentSeasonModal isOpen={isCurrentSeasonModalOpen} onClose={handleCloseCurrentSeasonModal} />
      <NextSeasonModal 
        isOpen={isNextSeasonModalOpen} 
        onClose={handleCloseNextSeasonModal} 
        onStartSeason={handleStartSeason} 
      />
    </div>
  );
};

About.displayName = 'About';

export default About;
