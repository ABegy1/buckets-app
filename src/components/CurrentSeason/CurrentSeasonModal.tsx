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
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlayersAndTeams = async () => {
      setLoading(true);
      try {
        // Fetch players and their current teams
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select(`
            player_id,
            name,
            team_id
          `);

        if (playerError) {
          console.error('Error fetching players:', playerError);
        } else {
          setPlayers(playerData || []);
        }

        // Fetch all teams
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*');

        if (teamError) {
          console.error('Error fetching teams:', teamError);
        } else {
          setTeams(teamData || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayersAndTeams();
  }, [isOpen]);
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  const handleTeamChange = async (playerId: number, newTeamId: number) => {
    // Optimistically update the team in the UI
    const updatedPlayers = players.map(player => {
      if (player.player_id === playerId) {
        return { ...player, team_id: newTeamId };
      }
      return player;
    });
    setPlayers(updatedPlayers);

    // Update the player's team in the database
    const { error } = await supabase
      .from('players')
      .update({ team_id: newTeamId })
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating player team:', error);
    }
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
              {/* Adjust Teams Tab */}
              <h2>Adjust Teams</h2>
              {loading ? (
                <p>Loading teams and players...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map(player => (
                      <tr key={player.player_id}>
                        <td>{player.name}</td>
                        <td>
                          <select
                            value={player.team_id || ''}
                            onChange={(e) => handleTeamChange(player.player_id, Number(e.target.value))}
                          >
                            <option value="">No Team</option>
                            {teams.map(team => (
                              <option key={team.team_id} value={team.team_id}>
                                {team.team_name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
