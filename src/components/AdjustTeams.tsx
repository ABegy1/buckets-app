/**
 * AdjustTeams Component
 *
 * This component provides an interface to manage teams and players. Administrators can:
 * - Edit player names, assign players to teams, or mark players as free agents.
 * - Toggle player visibility (`is_hidden`).
 * - Edit team names.
 * - View all players and teams in a table format.
 *
 * Props:
 * - `isOpen`: A boolean indicating whether the component should be active and displayed.
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient'; // Import Supabase client
import styles from './AdjustTeams.module.css'; // Import CSS module for styling

interface AdjustTeamsProps {
  isOpen: boolean;
}

const AdjustTeams: React.FC<AdjustTeamsProps> = ({ isOpen }) => {
  // State for managing players and teams
  const [players, setPlayers] = useState<any[]>([]); // List of players fetched from the backend
  const [teams, setTeams] = useState<any[]>([]); // List of teams fetched from the backend
  const [loading, setLoading] = useState(true); // Loading state for data fetching

  /**
   * Fetch players and teams when the component is opened.
   * - Players include `player_id`, `name`, `team_id`, and `is_hidden`.
   * - Teams include all available team data.
   */
  useEffect(() => {
    if (!isOpen) return; // Exit early if the component is not open

    const fetchPlayersAndTeams = async () => {
      setLoading(true); // Set loading state to true while fetching
      try {
        // Fetch players
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('player_id, name, team_id, is_hidden');

        if (playerError) {
          console.error('Error fetching players:', playerError);
        } else {
          setPlayers(playerData || []);
        }

        // Fetch teams
        const { data: teamData, error: teamError } = await supabase.from('teams').select('*');

        if (teamError) {
          console.error('Error fetching teams:', teamError);
        } else {
          setTeams(teamData || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false); // Set loading state to false when fetching is complete
      }
    };

    fetchPlayersAndTeams(); // Call the fetch function
  }, [isOpen]);

  /**
   * Updates a player's team assignment or marks them as a free agent.
   *
   * @param playerId - The ID of the player being updated.
   * @param newTeamId - The ID of the new team or `null` for free agent.
   */
  const handleTeamChange = async (playerId: number, newTeamId: number | null) => {
    const isFreeAgent = newTeamId === null;

    // Update players locally
    const updatedPlayers = players.map((player) =>
      player.player_id === playerId
        ? { ...player, team_id: isFreeAgent ? null : newTeamId, is_free_agent: isFreeAgent }
        : player
    );
    setPlayers(updatedPlayers);

    // Update the backend
    const { error } = await supabase
      .from('players')
      .update({
        team_id: isFreeAgent ? null : newTeamId,
        is_free_agent: isFreeAgent,
      })
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating player team:', error);
    }
  };

  /**
   * Updates a player's name.
   *
   * @param playerId - The ID of the player being updated.
   * @param newName - The new name of the player.
   */
  const handlePlayerNameChange = async (playerId: number, newName: string) => {
    // Update players locally
    const updatedPlayers = players.map((player) =>
      player.player_id === playerId ? { ...player, name: newName } : player
    );
    setPlayers(updatedPlayers);

    // Update the backend
    const { error } = await supabase
      .from('players')
      .update({ name: newName })
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating player name:', error);
    }
  };

  /**
   * Toggles a player's visibility (`is_hidden`).
   *
   * @param playerId - The ID of the player being updated.
   * @param newIsHidden - The new visibility status.
   */
  const handleIsHiddenChange = async (playerId: number, newIsHidden: boolean) => {
    // Update players locally
    const updatedPlayers = players.map((player) =>
      player.player_id === playerId ? { ...player, is_hidden: newIsHidden } : player
    );
    setPlayers(updatedPlayers);

    // Update the backend
    const { error } = await supabase
      .from('players')
      .update({ is_hidden: newIsHidden })
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating player visibility:', error);
    }
  };

  /**
   * Updates a team's name.
   *
   * @param teamId - The ID of the team being updated.
   * @param newName - The new name of the team.
   */
  const handleTeamNameChange = async (teamId: number, newName: string) => {
    // Update teams locally
    const updatedTeams = teams.map((team) =>
      team.team_id === teamId ? { ...team, team_name: newName } : team
    );
    setTeams(updatedTeams);

    // Update the backend
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

      {/* Show a loading message while data is being fetched */}
      {loading ? (
        <p>Loading teams and players...</p>
      ) : (
        <div className={styles['sections-container']}>
          {/* Player/Team Edit Section */}
          <div className={styles['table-container']}>
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Team</th>
                  <th>Hidden?</th>
                </tr>
              </thead>
              <tbody>
                {players.length > 0 ? (
                  players.map((player) => (
                    <tr key={player.player_id}>
                      <td>
                        <input
                          type="text"
                          value={player.name || 'Unknown Player'}
                          onChange={(e) => handlePlayerNameChange(player.player_id, e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          value={player.team_id || ''}
                          onChange={(e) => {
                            const newTeamId = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            handleTeamChange(player.player_id, newTeamId);
                          }}
                        >
                          <option value="">No Team</option>
                          {teams.map((team) => (
                            <option key={team.team_id} value={team.team_id}>
                              {team.team_name || 'Unknown Team'}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <label>
                          <input
                            type="checkbox"
                            checked={player.is_hidden || false}
                            onChange={(e) => handleIsHiddenChange(player.player_id, e.target.checked)}
                          />
                          Hidden
                        </label>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>No players found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Edit Team Names Section */}
          <div className={styles['team-edit-container']}>
            <h3>Edit Team Names</h3>
            {teams.length > 0 ? (
              teams.map((team) => (
                <div key={team.team_id} className={styles.teamRow}>
                  <label htmlFor={`team-${team.team_id}`}>{team.team_name}</label>
                  <input
                    id={`team-${team.team_id}`}
                    type="text"
                    value={team.team_name || 'Unknown Team'}
                    onChange={(e) => handleTeamNameChange(team.team_id, e.target.value)}
                  />
                </div>
              ))
            ) : (
              <p>No teams available to edit.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdjustTeams;
