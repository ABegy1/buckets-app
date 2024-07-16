'use client';
import React, { useState } from 'react';
import './about.css';
import Modal from '@/components/Modal';

const About = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');

  const handleOpenModal = (name: string) => {
    setSelectedName(name);
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  return (
    <div className="about-page">
      <div className="container">
        <div className="secondary-screen-options">
          <button>Standings</button>
          <button>Stats</button>
          <button>Rules</button>
        </div>

        <div className="players">
          <div className="column">
            <div className="header">Green</div>
            <div className="box" onClick={() => handleOpenModal('Stephen')}>Stephen</div>
            <div className="box" onClick={() => handleOpenModal('David')}>David</div>
            <div className="box" onClick={() => handleOpenModal('Brandon')}>Brandon</div>
          </div>
          <div className="column">
            <div className="header">Yellow</div>
            <div className="box" onClick={() => handleOpenModal('Andrew')}>Andrew</div>
            <div className="box" onClick={() => handleOpenModal('McNay')}>McNay</div>
            <div className="box" onClick={() => handleOpenModal('Jay')}>Jay</div>
          </div>
          <div className="column">
            <div className="header">Red</div>
            <div className="box" onClick={() => handleOpenModal('Jarrod')}>Jarrod</div>
            <div className="box" onClick={() => handleOpenModal('Brad')}>Brad</div>
            <div className="box" onClick={() => handleOpenModal('Jason')}>Jason</div>
          </div>
          <div className="column">
            <div className="header">Black</div>
            <div className="box" onClick={() => handleOpenModal('Ryan')}>Ryan</div>
            <div className="box" onClick={() => handleOpenModal('Kevin')}>Kevin</div>
            <div className="box" onClick={() => handleOpenModal('Malson')}>Malson</div>
          </div>
        </div>

        <div className="top-right">
          <div className="button-group">
            <button>Season</button>
            <button>View</button>
          </div>
        </div>
      </div>

      <Modal name={selectedName} isOpen={isOpen} onClose={handleCloseModal} />
    </div>
  );
};

About.displayName = 'About';

export default About;