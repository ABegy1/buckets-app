import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient'; // Adjust to your supabase client import
import styles from './AddPlayers.module.css';

interface AddPlayersProps {
  isOpen: boolean;
}

const AddPlayers: React.FC<AddPlayersProps> = ({ isOpen }) => {
    const [players, setPlayers] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [tiers, setTiers] = useState<any[]>([]);
    const [newPlayerName, setNewPlayerName] = useState<string>(''); // New state for player name
    const [selectedTier, setSelectedTier] = useState<number | null>(null); // New state for player tier
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null); // New state for player team
    const [shotCount, setShotCount] = useState<number>(40); // Default shot count for players
    const [seasonId, setSeasonId] = useState<number | null>(null); // ID of the active season
  
    useEffect(() => {
      if (!isOpen) return;
  
      // Fetch the active season
      const fetchActiveSeason = async () => {
        const { data, error } = await supabase
          .from('seasons')
          .select('season_id')
          .is('end_date', null) // Only select season with null end_date
          .single();
  
        if (error || !data) {
          console.error('Error fetching active season:', error);
        } else {
          setSeasonId(data.season_id);
        }
      };
  
      // Fetch players, teams, and tiers
      const fetchPlayers = async () => {
        const { data, error } = await supabase.from('players').select('*');
        if (error) {
          console.error('Error fetching players:', error);
        } else {
          setPlayers(data || []);
        }
      };
  
      const fetchTeams = async () => {
        const { data, error } = await supabase.from('teams').select('*');
        if (error) {
          console.error('Error fetching teams:', error);
        } else {
          setTeams(data || []);
          setSelectedTeam(data?.[0]?.team_id || null); // Default to first available team
        }
      };
  
      const fetchTiers = async () => {
        const { data, error } = await supabase.from('tiers').select('*');
        if (error) {
          console.error('Error fetching tiers:', error);
        } else {
          setTiers(data || []);
          setSelectedTier(data?.[0]?.tier_id || null); // Default to first available tier
        }
      };
  
      fetchActiveSeason();
      fetchPlayers();
      fetchTeams();
      fetchTiers();
    }, [isOpen]);
  
    const handleAddPlayer = async () => {
      if (!seasonId) {
        console.error('No active season found. Cannot add players.');
        return;
      }
  
      if (!newPlayerName || !selectedTier || !selectedTeam) {
        console.error('Player name, team, or tier is missing.');
        return;
      }
  
      const { data: newPlayer, error } = await supabase
        .from('players')
        .insert([{ 
          name: newPlayerName, 
          tier_id: selectedTier,  // Use selected tier
          team_id: selectedTeam, // Use selected team
        }])
        .select()
        .single();
  
      if (error || !newPlayer) {
        console.error('Error adding player:', error);
        return;
      }
  
      // Add player_instance to the active season
      const { error: playerInstanceError } = await supabase.from('player_instance').insert({
        player_id: newPlayer.player_id,
        season_id: seasonId,
        shots_left: shotCount,
        score: 0,
      });
  
      if (playerInstanceError) {
        console.error('Error adding player instance:', playerInstanceError);
      } else {
        setPlayers([...players, newPlayer]);
        setNewPlayerName(''); // Reset player name field
      }
    };
  
    return (
      <div className={styles.addPlayers}>
        <h2>Add Players to Active Season</h2>
  
        <label>
          Player Name:
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Enter player name"
          />
        </label>
  
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
  
        <h3>Current Players</h3>
        <ul>
          {players.map((player) => (
            <li key={player.player_id}>
              {player.name} (Team: {player.team_id}, Tier: {player.tier_id})
            </li>
          ))}
        </ul>
  
        <button className={styles.globalButton} onClick={handleAddPlayer}>Add Player</button>
      </div>
    );
  };
  
  export default AddPlayers;