'use client';
import React, { useState } from 'react';
import styles from './NextSeason.module.css';

interface NextSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSeason: () => void;
}

const NextSeasonModal: React.FC<NextSeasonModalProps> = ({ isOpen, onClose, onStartSeason }) => {
  const [view, setView] = useState<'team' | 'tier'>('team');
  const [teams, setTeams] = useState<string[]>(['Blue', 'Gold', 'Red']);
  const [tiers, setTiers] = useState<string[]>(['Black', 'Red', 'Yellow', 'Green']);
  const [players, setPlayers] = useState<string[]>(['Ryan', 'Brandon', 'Lochlan', 'Player 3', 'Player 4']);
  const [shotCount, setShotCount] = useState<number>(40);

  const handleAddTeam = () => {
    setTeams([...teams, `New Team ${teams.length + 1}`]);
  };

  const handleAddTier = () => {
    setTiers([...tiers, `New Tier ${tiers.length + 1}`]);
  };

  const handleAddPlayer = () => {
    setPlayers([...players, `Player ${players.length + 1}`]);
  };

  const handleShotCountChange = (change: number) => {
    setShotCount(shotCount + change);
  };

  const handleSubmit = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.nextSeasonModal}>
      <div className={styles.modalContent}>
        <div className={styles.toggleButtons}>
          <button className={view === 'team' ? styles.active : ''} onClick={() => setView('team')}>
            Team Setup
          </button>
          <button className={view === 'tier' ? styles.active : ''} onClick={() => setView('tier')}>
            Tier Setup
          </button>
        </div>

        {view === 'team' ? (
          <>
            <h2>Team Setup</h2>
            {teams.map((team, index) => (
              <div key={index} className={styles.team}>
                {team}
                {/* You can add a remove button here if needed */}
              </div>
            ))}
            <button className={styles.globalButton} onClick={handleAddTeam}>Add Team</button>
          </>
        ) : (
          <>
            <h2>Tier Setup</h2>
            {tiers.map((tier, index) => (
              <div key={index} className={styles.tier}>
                {tier}
                {/* You can add a remove button here if needed */}
              </div>
            ))}
            <button className={styles.globalButton} onClick={handleAddTier}>Add Tier</button>
          </>
        )}

        <h2>Player Setup</h2>
        {players.map((player, index) => (
          <div key={index} className={styles.player}>
            {player}
            {/* You can add a remove button here if needed */}
          </div>
        ))}
        <button className={styles.globalButton} onClick={handleAddPlayer}>Add Player</button>

        <h2>Season Shot Count</h2>
        <div className={styles.shotCount}>
          <button onClick={() => handleShotCountChange(-1)}>-</button>
          <span>{shotCount}</span>
          <button onClick={() => handleShotCountChange(1)}>+</button>
        </div>

        <button className={styles.globalButton} onClick={handleSubmit}>Start Season</button>
      </div>
    </div>
  );
};

export default NextSeasonModal;
