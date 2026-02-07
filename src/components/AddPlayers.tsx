/**
 * AddPlayers Component
 *
 * This component allows administrators to add new players to an active season.
 * Features include:
 * - Fetching active season data, teams, and tiers from the Supabase backend.
 * - Adding a player to the selected team and tier or marking them as a free agent.
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
  const [teams, setTeams] = useState<any[]>([]); // List of teams
  const [tiers, setTiers] = useState<any[]>([]); // List of tiers
  const [newPlayerName, setNewPlayerName] = useState<string>(''); // Input for new player name
  const [selectedTier, setSelectedTier] = useState<number | null>(null); // Selected tier for new player
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null); // Selected team for new player
  const [shotCount, setShotCount] = useState<number>(40); // Initial shot count for the player
  const [seasonId, setSeasonId] = useState<number | null>(null); // Active season ID
  const [isFreeAgent, setIsFreeAgent] = useState<boolean>(false); // Indicates if the player is a free agent
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  /**
   * Effect to fetch data when the component is opened.
   * Fetches:
   * - Active season information
   * - Existing players, teams, and tiers
   */
  useEffect(() => {
    if (!isOpen) return; // Exit if the component is not open
    setSubmitStatus(null);

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
      setSubmitStatus('Please provide a name, team (or Free Agency), and tier.');
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
      setSubmitStatus('Unable to add the player. Please try again.');
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
      setSubmitStatus('Player was added, but shots could not be assigned.');
    } else {
      setNewPlayerName(''); // Clear the input field
      setSubmitStatus('Player added to the active season.');
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
          onChange={(e) => {
            setNewPlayerName(e.target.value);
            setSubmitStatus(null);
          }}
          placeholder="Enter player name"
        />
      </label>

      {/* Team dropdown */}
      <label>
        Team:
        <select
          value={isFreeAgent ? 'free-agent' : selectedTeam ?? ''}
          onChange={(e) => {
            if (e.target.value === 'free-agent') {
              setIsFreeAgent(true);
              setSelectedTeam(null);
              setSubmitStatus(null);
              return;
            }
            setIsFreeAgent(false);
            setSelectedTeam(Number(e.target.value));
            setSubmitStatus(null);
          }}
        >
          <option value="free-agent">Free Agency</option>
          {teams.map((team) => (
            <option key={team.team_id} value={team.team_id}>
              {team.team_name}
            </option>
          ))}
        </select>
      </label>

      {/* Tier dropdown */}
      <label>
        Tier:
        <select
          value={selectedTier || ''}
          onChange={(e) => {
            setSelectedTier(Number(e.target.value));
            setSubmitStatus(null);
          }}
        >
          {tiers.map((tier) => (
            <option key={tier.tier_id} value={tier.tier_id}>
              {tier.tier_name}
            </option>
          ))}
        </select>
      </label>

      {/* Shots input */}
      <label>
        Shots Left:
        <input
          type="number"
          min={0}
          value={shotCount}
          onChange={(e) => {
            const value = Number(e.target.value);
            setShotCount(Number.isNaN(value) ? 0 : value);
            setSubmitStatus(null);
          }}
        />
      </label>

      {/* Button to add a new player */}
      {submitStatus && <p>{submitStatus}</p>}
      <button className={styles.globalButton} onClick={handleAddPlayer}>
        Submit Player
      </button>
    </div>
  );
};

export default AddPlayers;
