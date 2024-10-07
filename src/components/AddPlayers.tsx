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
      }
    };

    const fetchTiers = async () => {
      const { data, error } = await supabase.from('tiers').select('*');
      if (error) {
        console.error('Error fetching tiers:', error);
      } else {
        setTiers(data || []);
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

    if (tiers.length === 0 || teams.length === 0) {
      console.error('No available tiers or teams to assign to the player.');
      return;
    }

    const { data: newPlayer, error } = await supabase
      .from('players')
      .insert([{ 
        name: `Player ${players.length + 1}`, 
        tier_id: tiers[0]?.tier_id || 1,  // Assign the first available tier
        team_id: teams[0]?.team_id || null // Assign the first available team
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
    }
  };

  return (
    <div className={styles.addPlayers}>
      <h2>Add Players to Active Season</h2>
      <button onClick={handleAddPlayer}>Add Player</button>

      <h3>Current Players</h3>
      <ul>
        {players.map((player) => (
          <li key={player.player_id}>{player.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default AddPlayers;
