'use client';
import React, { useEffect, useState } from 'react';
import styles from './NextSeason.module.css';
import { supabase } from '@/supabaseClient';

interface NextSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSeason: () => void;
}

const NextSeasonModal: React.FC<NextSeasonModalProps> = ({ isOpen, onClose, onStartSeason }) => {
  const [view, setView] = useState<'team' | 'tier'>('team');
  const [teams, setTeams] = useState<any[]>([]); 
  const [tiers, setTiers] = useState<any[]>([]); 
  const [players, setPlayers] = useState<any[]>([]);
  const [shotCount, setShotCount] = useState<number>(40);

  useEffect(() => {
    if (!isOpen) return;

    console.log('Setting up subscriptions for modal');

    // Fetch initial data
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

    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('players').select('*');
      if (error) {
        console.error('Error fetching players:', error);
      } else {
        setPlayers(data || []);
      }
    };

    fetchTeams();
    fetchTiers();
    fetchPlayers();

    // Set up real-time subscriptions
    const teamChannel = supabase
      .channel('team-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchTeams)
      .subscribe();

    const tierChannel = supabase
      .channel('tier-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tiers' }, fetchTiers)
      .subscribe();

    const playerChannel = supabase
      .channel('player-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchPlayers)
      .subscribe();

    return () => {
      console.log('Unsubscribing from modal updates');
      supabase.removeChannel(teamChannel);
      supabase.removeChannel(tierChannel);
      supabase.removeChannel(playerChannel);
    };
  }, [isOpen]);

  const handleAddTeam = async () => {
    const { error } = await supabase.from('teams').insert([{ team_name: `New Team ${teams.length + 1}` }]);
    if (error) console.error('Error adding team:', error);
  };

  const handleAddTier = async () => {
    const { error } = await supabase.from('tiers').insert([{ tier_name: `New Tier ${tiers.length + 1}`, color: '#000000' }]);
    if (error) console.error('Error adding tier:', error);
  };

  const handleAddPlayer = async () => {
    const { error } = await supabase.from('players').insert([{ name: `Player ${players.length + 1}`, tier_id: tiers[0]?.tier_id || 1 }]);
    if (error) console.error('Error adding player:', error);
  };

  const handleShotCountChange = (change: number) => {
    setShotCount(shotCount + change);
  };

  const startNewSeason = async (): Promise<number | null> => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);
  
    try {
      // Create the new season
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .insert({
          season_name: `Season ${startDate.getFullYear()}`, // Default season name
          start_date: startDate.toISOString(), // Use ISO format for dates
          end_date: endDate.toISOString(),
          shot_total: shotCount,
          rules: 'Default Rules',
        })
        .select();
    
      if (seasonError || !seasonData || seasonData.length === 0) {
        throw new Error('Error starting season');
      }

      return seasonData[0].season_id;
    
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error('An unexpected error occurred:', error);
      }
      return null;
    }
  };

  const handleSubmit = async () => {
    const seasonId = await startNewSeason();
  
    if (seasonId !== null) {
      try {
        // Ensure that we have tiers, teams, and players before proceeding
        if (tiers.length === 0 || teams.length === 0 || players.length === 0) {
          throw new Error('Tiers, Teams, and Players must be added before starting a season');
        }
  
        // Iterate over each player and create their player_instance
        for (const player of players) {
          const { error: playerInstanceError } = await supabase.from('player_instance').insert({
            player_id: player.player_id,
            season_id: seasonId,
            team_id: teams[0]?.team_id || 1, // Assuming each player belongs to the first team for simplicity
            shots_left: shotCount,
          });
  
          if (playerInstanceError) {
            console.error('Error adding player instance:', playerInstanceError);
          }
        }
  
        onClose();
        onStartSeason();
      } catch (error) {
        if (error instanceof Error) {
          console.error(error.message);
        } else {
          console.error('An unexpected error occurred:', error);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.nextSeasonModal}>
      <div className={styles.modalContent}>
        <div className={styles.toggleButtons}>
          <button className={view === 'team' ? styles.active : ''} onClick={() => setView('team')}>Team Setup</button>
          <button className={view === 'tier' ? styles.active : ''} onClick={() => setView('tier')}>Tier Setup</button>
        </div>
        {view === 'team' ? (
          <>
            <h2>Team Setup</h2>
            {teams.map((team) => (
              <div key={team.team_id} className={styles.team}>{team.team_name}</div>
            ))}
            <button className={styles.globalButton} onClick={handleAddTeam}>Add Team</button>
          </>
        ) : (
          <>
            <h2>Tier Setup</h2>
            {tiers.map((tier) => (
              <div key={tier.tier_id} className={styles.tier}>{tier.tier_name} (Color: {tier.color})</div>
            ))}
            <button className={styles.globalButton} onClick={handleAddTier}>Add Tier</button>
          </>
        )}

        <h2>Player Setup</h2>
        {players.map((player) => (
          <div key={player.player_id} className={styles.player}>{player.name}</div>
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