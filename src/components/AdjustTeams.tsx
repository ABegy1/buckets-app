import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import styles from './AdjustTeams.module.css'; // Create a new CSS module for AdjustTeams

interface AdjustTeamsProps {
  isOpen: boolean;
}

const AdjustTeams: React.FC<AdjustTeamsProps> = ({ isOpen }) => {
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

  const handlePlayerNameChange = async (playerId: number, newName: string) => {
    // Optimistically update the player name in the UI
    const updatedPlayers = players.map(player => {
      if (player.player_id === playerId) {
        return { ...player, name: newName };
      }
      return player;
    });
    setPlayers(updatedPlayers);

    // Update the player's name in the database
    const { error } = await supabase
      .from('players')
      .update({ name: newName })
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating player name:', error);
    }
  };

  const handleTeamNameChange = async (teamId: number, newName: string) => {
    // Optimistically update the team name in the UI
    const updatedTeams = teams.map(team => {
      if (team.team_id === teamId) {
        return { ...team, team_name: newName };
      }
      return team;
    });
    setTeams(updatedTeams);

    // Update the team name in the database
    const { error } = await supabase
      .from('teams')
      .update({ team_name: newName })
      .eq('team_id', teamId);

    if (error) {
      console.error('Error updating team name:', error);
    }
  };

  return (
    <div className={styles.adjustTeams}>
      <h2>Team/Player Edit</h2>
      {loading ? (
        <p>Loading teams and players...</p>
      ) : (
        <>
          {/* Table for Player -> Team Adjustments */}
          <div className={styles['table-container']}>
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Team</th>
                </tr>
              </thead>
              <tbody>
                {players.length > 0 ? (
                  players.map(player => (
                    <tr key={player?.player_id}>
                      <td>
                        <input
                          type="text"
                          value={player?.name || 'Unknown Player'}
                          onChange={(e) => handlePlayerNameChange(player?.player_id, e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          value={player?.team_id || ''}
                          onChange={(e) => handleTeamChange(player?.player_id, Number(e.target.value))}
                        >
                          <option value="">No Team</option>
                          {teams.length > 0 ? (
                            teams.map(team => (
                              <option key={team?.team_id} value={team?.team_id}>
                                {team?.team_name || 'Unknown Team'}
                              </option>
                            ))
                          ) : (
                            <option disabled>No teams available</option>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2}>No players found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Edit team names once, outside of the player table */}
          <h3>Edit Team Names</h3>
          <div className={styles['team-edit-container']}>
            {teams.length > 0 ? (
              teams.map(team => (
                <div key={team.team_id} className={styles.teamRow}>
                  <label htmlFor={`team-${team.team_id}`}>{team?.team_name}</label>
                  <input
                    id={`team-${team.team_id}`}
                    type="text"
                    value={team?.team_name || 'Unknown Team'}
                    onChange={(e) => handleTeamNameChange(team.team_id, e.target.value)}
                  />
                </div>
              ))
            ) : (
              <p>No teams available to edit.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdjustTeams;
