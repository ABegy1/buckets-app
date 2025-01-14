/**
 * AddPlayers Component
 *
 * This component allows administrators to add new players to an active season.
 * Features include:
 * - Fetching active season data, players, teams, and tiers from the Supabase backend.
 * - Adding a player to the selected team and tier or marking them as a free agent.
 * - Dynamically updating the list of current players in real-time.
 * - Support for assigning players a specific number of shots for the season.
 *
 * Props:
 * - `isOpen`: Determines whether the component should be active or not.
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient'; // Adjust to your Supabase client import path
import styles from './AddPlayers.module.css';

interface AddPlayersProps {
  isOpen: boolean;
}

const AddPlayers: React.FC<AddPlayersProps> = ({ isOpen }) => {
  // State management for players, teams, tiers, and form inputs
  const [players, setPlayers] = useState<any[]>([]); // List of players
  const [teams, setTeams] = useState<any[]>([]); // List of teams
  const [tiers, setTiers] = useState<any[]>([]); // List of tiers
  const [newPlayerName, setNewPlayerName] = useState<string>(''); // Input for new player name
  const [selectedTier, setSelectedTier] = useState<number | null>(null); // Selected tier for new player
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null); // Selected team for new player
  const [shotCount, setShotCount] = useState<number>(40); // Initial shot count for the player
  const [seasonId, setSeasonId] = useState<number | null>(null); // Active season ID
  const [isFreeAgent, setIsFreeAgent] = useState<boolean>(false); // Indicates if the player is a free agent

  /**
   * Effect to fetch data when the component is opened.
   * Fetches:
   * - Active season information
   * - Existing players, teams, and tiers
   */
  useEffect(() => {
    if (!isOpen) return; // Exit if the component is not open

    const fetchActiveSeason = async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('season_id')
        .is('end_date', null)
        .single();
      if (error || !data) {
        console.error('Error fetching active season:', error);
      } else {
        setSeasonId(data.season_id); // Set the active season ID
      }
    };

    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('players').select('*');
      if (error) {
        console.error('Error fetching players:', error);
      } else {
        setPlayers(data || []); // Update the players list
      }
    };

    const fetchTeams = async () => {
      const { data, error } = await supabase.from('teams').select('*');
      if (error) {
        console.error('Error fetching teams:', error);
      } else {
        setTeams(data || []);
        if (!isFreeAgent) {
          setSelectedTeam(data?.[0]?.team_id || null); // Default to the first team if not a free agent
        }
      }
    };

    const fetchTiers = async () => {
      const { data, error } = await supabase.from('tiers').select('*');
      if (error) {
        console.error('Error fetching tiers:', error);
      } else {
        setTiers(data || []);
        setSelectedTier(data?.[0]?.tier_id || null); // Default to the first tier
      }
    };

    fetchActiveSeason();
    fetchPlayers();
    fetchTeams();
    fetchTiers();
  }, [isOpen, isFreeAgent]);

  /**
   * Handles adding a new player to the active season.
   * Validates inputs and updates the backend.
   */
  const handleAddPlayer = async () => {
    if (!seasonId) {
      console.error('No active season found. Cannot add players.');
      return;
    }

    if (!newPlayerName || !selectedTier || (!selectedTeam && !isFreeAgent)) {
      console.error('Player name, team, or tier is missing.');
      return;
    }

    // Insert the new player into the database
    const { data: newPlayer, error } = await supabase
      .from('players')
      .insert([
        {
          name: newPlayerName,
          tier_id: selectedTier,
          team_id: isFreeAgent ? null : selectedTeam,
          is_free_agent: isFreeAgent,
        },
      ])
      .select()
      .single();

    if (error || !newPlayer) {
      console.error('Error adding player:', error);
      return;
    }

    // Create a player instance for the active season
    const { error: playerInstanceError } = await supabase
      .from('player_instance')
      .insert({
        player_id: newPlayer.player_id,
        season_id: seasonId,
        shots_left: shotCount,
        score: 0,
      });

    if (playerInstanceError) {
      console.error('Error adding player instance:', playerInstanceError);
    } else {
      setPlayers([...players, newPlayer]); // Add new player to the local state
      setNewPlayerName(''); // Clear the input field
    }
  };

  return (
    /**
     * Render the AddPlayers form and player list.
     * Only show the form if `isOpen` is true.
     */
    <div className={styles.addPlayers}>
      <h2>Add Players to Active Season</h2>

      {/* Input for player name */}
      <label>
        Player Name:
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Enter player name"
        />
      </label>

      {/* Checkbox for free agent status */}
      <label>
        Free Agent:
        <input
          type="checkbox"
          checked={isFreeAgent}
          onChange={(e) => {
            setIsFreeAgent(e.target.checked);
            if (e.target.checked) {
              setSelectedTeam(null); // Reset team selection when free agent is checked
            }
          }}
        />
      </label>

      {/* Team dropdown (hidden if free agent) */}
      {!isFreeAgent && (
        <label>
          Team:
          <select value={selectedTeam || ''} onChange={(e) => setSelectedTeam(Number(e.target.value))}>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Tier dropdown */}
      <label>
        Tier:
        <select value={selectedTier || ''} onChange={(e) => setSelectedTier(Number(e.target.value))}>
          {tiers.map((tier) => (
            <option key={tier.tier_id} value={tier.tier_id}>
              {tier.tier_name}
            </option>
          ))}
        </select>
      </label>

      {/* List of current players */}
      <h3>Current Players</h3>
      <div className={styles.playersSection}>
        <ul>
          {players.map((player) => (
            <li key={player.player_id}>
              {player.name} (Team: {player.team_id}, Tier: {player.tier_id}, Free Agent: {player.is_free_agent ? 'Yes' : 'No'})
            </li>
          ))}
        </ul>
      </div>

      {/* Button to add a new player */}
      <button className={styles.globalButton} onClick={handleAddPlayer}>
        Add Player
      </button>
    </div>
  );
};

export default AddPlayers;
