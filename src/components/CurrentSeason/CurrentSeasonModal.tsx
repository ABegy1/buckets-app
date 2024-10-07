import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import styles from './CurrentSeasonModal.module.css';

interface CurrentSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CurrentSeasonModal: React.FC<CurrentSeasonModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('Adjust Shots');
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlayers = async () => {
      setLoading(true);
      try {
        // Fetch players and their current shots left
        const { data, error } = await supabase
          .from('player_instance')
          .select(`
            player_id,
            shots_left,
            players (name)
          `);

        if (error) {
          console.error('Error fetching player shots:', error);
        } else {
          setPlayers(data || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [isOpen]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleAdjustShots = async (playerId: number, adjustment: number) => {
    const updatedPlayers = players.map(player => {
      if (player.player_id === playerId) {
        return { ...player, shots_left: player.shots_left + adjustment };
      }
      return player;
    });
    setPlayers(updatedPlayers);

    // Update shots left in the database
    const playerToUpdate = updatedPlayers.find(p => p.player_id === playerId);
    const { error } = await supabase
      .from('player_instance')
      .update({ shots_left: playerToUpdate.shots_left })
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating shots left:', error);
    }
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
              {loading ? (
                <p>Loading players...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Shots</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map(player => (
                      <tr key={player.player_id}>
                        <td>{player.players.name}</td>
                        <td>
                          <button onClick={() => handleAdjustShots(player.player_id, -1)} disabled={player.shots_left <= 0}>-</button>
                          {player.shots_left}
                          <button onClick={() => handleAdjustShots(player.player_id, 1)}>+</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
