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
    const [newPlayerName, setNewPlayerName] = useState<string>(''); 
    const [selectedTier, setSelectedTier] = useState<number | null>(null); 
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null); 
    const [shotCount, setShotCount] = useState<number>(40); 
    const [seasonId, setSeasonId] = useState<number | null>(null); 
    const [isFreeAgent, setIsFreeAgent] = useState<boolean>(false); // New state for free agent status
  
    useEffect(() => {
      if (!isOpen) return;

      const fetchActiveSeason = async () => {
        const { data, error } = await supabase
          .from('seasons')
          .select('season_id')
          .is('end_date', null)
          .single();

        if (error || !data) {
          console.error('Error fetching active season:', error);
        } else {
          setSeasonId(data.season_id);
        }
      };

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
          if (!isFreeAgent) {
            setSelectedTeam(data?.[0]?.team_id || null); // Default to first available team only if not a free agent
          }
        }
      };

      const fetchTiers = async () => {
        const { data, error } = await supabase.from('tiers').select('*');
        if (error) {
          console.error('Error fetching tiers:', error);
        } else {
          setTiers(data || []);
          setSelectedTier(data?.[0]?.tier_id || null);
        }
      };

      fetchActiveSeason();
      fetchPlayers();
      fetchTeams();
      fetchTiers();
    }, [isOpen, isFreeAgent]);

    const handleAddPlayer = async () => {
      if (!seasonId) {
        console.error('No active season found. Cannot add players.');
        return;
      }

      if (!newPlayerName || !selectedTier || (!selectedTeam && !isFreeAgent)) {
        console.error('Player name, team, or tier is missing.');
        return;
      }

      const { data: newPlayer, error } = await supabase
        .from('players')
        .insert([{ 
          name: newPlayerName, 
          tier_id: selectedTier,  
          team_id: isFreeAgent ? null : selectedTeam,  // If free agent, set team_id to null
          is_free_agent: isFreeAgent // Set free agent status
        }])
        .select()
        .single();

      if (error || !newPlayer) {
        console.error('Error adding player:', error);
        return;
      }

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
        setNewPlayerName('');
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

      {!isFreeAgent && (
        <label>
          Team:
          <select 
            value={selectedTeam || ''} 
            onChange={(e) => setSelectedTeam(Number(e.target.value))}>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
              </option>
            ))}
          </select>
        </label>
      )}

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
      <div className={styles.playersSection}>
        <ul>
          {players.map((player) => (
            <li key={player.player_id}>
              {player.name} (Team: {player.team_id}, Tier: {player.tier_id}, Free Agent: {player.is_free_agent ? 'Yes' : 'No'})
            </li>
          ))}
        </ul>
      </div>

      <button className={styles.globalButton} onClick={handleAddPlayer}>Add Player</button>
    </div>
    );
};

export default AddPlayers;
