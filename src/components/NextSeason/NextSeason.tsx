'use client';
import React, { useEffect, useState } from 'react';
import styles from './NextSeason.module.css';
import { supabase } from '@/supabaseClient';
import EditTeamModal from './EditTeamModal';
import EditTierModal from './EditTierModal';
import EditPlayerModal from './EditPlayerModal';

interface NextSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSeason: () => void;
}

const NextSeasonModal: React.FC<NextSeasonModalProps> = ({ isOpen, onClose, onStartSeason }) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [shotCount, setShotCount] = useState<number>(40);
  const [isFreeAgent, setIsFreeAgent] = useState<boolean>(false);
  const [seasonName, setSeasonName] = useState<string>('');
  const [seasonRules, setSeasonRules] = useState<string>('');

  const [isEditPlayerModalOpen, setEditPlayerModalOpen] = useState<boolean>(false);
  const [isEditTeamModalOpen, setEditTeamModalOpen] = useState<boolean>(false);
  const [isEditTierModalOpen, setEditTierModalOpen] = useState<boolean>(false);

  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch initial data
    const fetchTeams = async () => {
      const { data, error } = await supabase.from('teams').select('*');
      if (error) console.error('Error fetching teams:', error);
      else setTeams(data || []);
    };

    const fetchTiers = async () => {
      const { data, error } = await supabase.from('tiers').select('*');
      if (error) console.error('Error fetching tiers:', error);
      else setTiers(data || []);
    };

    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('players').select('*');
      if (error) console.error('Error fetching players:', error);
      else setPlayers(data || []);
    };

    fetchTeams();
    fetchTiers();
    fetchPlayers();

    const teamChannel = supabase.channel('team-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchTeams).subscribe();
    const tierChannel = supabase.channel('tier-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'tiers' }, fetchTiers).subscribe();
    const playerChannel = supabase.channel('player-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchPlayers).subscribe();

    return () => {
      supabase.removeChannel(teamChannel);
      supabase.removeChannel(tierChannel);
      supabase.removeChannel(playerChannel);
    };
  }, [isOpen]);

  // Team Functions
  const handleAddTeam = async () => {
    const { error } = await supabase.from('teams').insert([{ team_name: `New Team ${teams.length + 1}` }]);
    if (error) console.error('Error adding team:', error);
  };

  const handleDeleteTeam = async (teamId: number) => {
    const { error } = await supabase.from('teams').delete().eq('team_id', teamId);
    if (error) console.error('Error deleting team:', error);
  };

  const handleOpenEditTeamModal = (team: any) => {
    setSelectedTeam(team);
    setEditTeamModalOpen(true);
  };

  const handleCloseEditTeamModal = () => {
    setSelectedTeam(null);
    setEditTeamModalOpen(false);
  };

  // Tier Functions
  const handleAddTier = async () => {
    const { error } = await supabase.from('tiers').insert([{ tier_name: `New Tier ${tiers.length + 1}`, color: '#000000' }]);
    if (error) console.error('Error adding tier:', error);
  };

  const handleDeleteTier = async (tierId: number) => {
    const { error } = await supabase.from('tiers').delete().eq('tier_id', tierId);
    if (error) console.error('Error deleting tier:', error);
  };

  const handleOpenEditTierModal = (tier: any) => {
    setSelectedTier(tier);
    setEditTierModalOpen(true);
  };

  const handleCloseEditTierModal = () => {
    setSelectedTier(null);
    setEditTierModalOpen(false);
  };

  // Player Functions
  const handleAddPlayer = async () => {
    if (tiers.length === 0) {
      console.error('No available tiers to assign to the player.');
      return;
    }
  
    const { error } = await supabase
      .from('players')
      .insert([{ 
        name: `Player ${players.length + 1}`, 
        tier_id: tiers[0]?.tier_id || 1,  
        team_id: isFreeAgent ? null : teams[0]?.team_id || null, 
        is_free_agent: isFreeAgent 
      }]);
  
    if (error) {
      console.error('Error adding player:', error);
    }
  };

  const handleDeletePlayer = async (playerId: number) => {
    const { error } = await supabase.from('players').delete().eq('player_id', playerId);
    if (error) console.error('Error deleting player:', error);
  };

  const handleOpenEditPlayerModal = (player: any) => {
    setSelectedPlayer(player);
    setEditPlayerModalOpen(true);
  };

  const handleCloseEditPlayerModal = () => {
    setSelectedPlayer(null);
    setEditPlayerModalOpen(false);
  };

  const handleShotCountChange = (change: number) => {
    setShotCount(shotCount + change);
  };

  const startNewSeason = async (): Promise<number | null> => {
    const currentDate = new Date();

    try {
      const { data: currentSeason, error: currentSeasonError } = await supabase
        .from('seasons')
        .select('season_id, end_date')
        .order('start_date', { ascending: false }) 
        .limit(1)
        .single();

      if (currentSeasonError) {
        console.error('Error fetching current season:', currentSeasonError);
      } else if (currentSeason && !currentSeason.end_date) {
        const { error: updateSeasonError } = await supabase
          .from('seasons')
          .update({ end_date: currentDate.toISOString() })
          .eq('season_id', currentSeason.season_id);

        if (updateSeasonError) throw updateSeasonError;
      }

      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .insert({
          season_name: seasonName || `Season ${currentDate.getFullYear()}`,
          start_date: currentDate.toISOString(),
          end_date: null, 
          shot_total: shotCount,
          rules: seasonRules || 'Default Rules',
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
        if (tiers.length === 0 || teams.length === 0 || players.length === 0) {
          throw new Error('Tiers, Teams, and Players must be added before starting a season');
        }

        for (const player of players) {
          const { error: playerInstanceError } = await supabase.from('player_instance').insert({
            player_id: player.player_id,
            season_id: seasonId,
            shots_left: shotCount,
            score: 0,
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
    <div className={styles.modalBackdrop} aria-modal="true" role="dialog" tabIndex={-1}>
      <div className={styles.modal}>
        <button onClick={onClose} className={styles.closeButton}>X</button>

        <h2>Start New Season</h2>

        <div className={styles.formSection}>
          <label htmlFor="seasonName">Season Name</label>
          <input
            id="seasonName"
            type="text"
            value={seasonName}
            onChange={(e) => setSeasonName(e.target.value)}
            placeholder="Enter season name"
          />
        </div>

        <div className={styles.formSection}>
          <label htmlFor="seasonRules">Season Rules</label>
          <textarea
            id="seasonRules"
            value={seasonRules}
            onChange={(e) => setSeasonRules(e.target.value)}
            placeholder="Enter season rules"
          />
        </div>

        <div className={styles.listSection}>
          <h3>Teams</h3>
          <div className={styles.scrollableList}>
            {teams.map((team) => (
              <div key={team.team_id} className={styles.listItem}>
                {team.team_name}
                <button className={styles.editButton} onClick={() => handleOpenEditTeamModal(team)}>Edit</button>
                <button className={styles.deleteButton} onClick={() => handleDeleteTeam(team.team_id)}>X</button>
              </div>
            ))}
          </div>
          <button className={styles.addButton} onClick={handleAddTeam}>Add Team</button>
        </div>

        <div className={styles.listSection}>
          <h3>Tiers</h3>
          <div className={styles.scrollableList}>
            {tiers.map((tier) => (
              <div key={tier.tier_id} className={styles.listItem}>
                {tier.tier_name} (Color: {tier.color})
                <button className={styles.editButton} onClick={() => handleOpenEditTierModal(tier)}>Edit</button>
                <button className={styles.deleteButton} onClick={() => handleDeleteTier(tier.tier_id)}>X</button>
              </div>
            ))}
          </div>
          <button className={styles.addButton} onClick={handleAddTier}>Add Tier</button>
        </div>

        <div className={styles.listSection}>
          <h3>Players</h3>
          <div className={styles.scrollableList}>
            {players.map((player) => (
              <div key={player.player_id} className={styles.listItem}>
                {player.name}
                <button className={styles.editButton} onClick={() => handleOpenEditPlayerModal(player)}>Edit</button>
                <button className={styles.deleteButton} onClick={() => handleDeletePlayer(player.player_id)}>X</button>
              </div>
            ))}
          </div>
          <button className={styles.addButton} onClick={handleAddPlayer}>Add Player</button>
        </div>

        <div className={styles.shotCountSection}>
          <h3>Season Shot Count</h3>
          <div className={styles.shotCount}>
            <button onClick={() => handleShotCountChange(-1)}>-</button>
            <span>{shotCount}</span>
            <button onClick={() => handleShotCountChange(1)}>+</button>
          </div>
        </div>

        <button className={styles.globalButton} onClick={handleSubmit}>Start Season</button>

        {/* Modals */}
        {isEditPlayerModalOpen && (
          <EditPlayerModal
            isOpen={isEditPlayerModalOpen}
            onClose={handleCloseEditPlayerModal}
            player={selectedPlayer}
            tiers={tiers}
            teams={teams}
            onUpdate={(updatedPlayer) => {
              setPlayers((prevPlayers) =>
                prevPlayers.map((p) => (p.player_id === updatedPlayer.player_id ? updatedPlayer : p))
              );
            }}
          />
        )}

        {isEditTeamModalOpen && (
          <EditTeamModal 
            isOpen={isEditTeamModalOpen} 
            onClose={handleCloseEditTeamModal} 
            team={selectedTeam} 
            onUpdate={(updatedTeam) => {
              setTeams((prevTeams) =>
                prevTeams.map((t) => (t.team_id === updatedTeam.team_id ? updatedTeam : t))
              );
            }}
          />
        )}

        {isEditTierModalOpen && (
          <EditTierModal 
            isOpen={isEditTierModalOpen} 
            onClose={handleCloseEditTierModal} 
            tier={selectedTier} 
            onUpdate={(updatedTier) => {
              setTiers((prevTiers) =>
                prevTiers.map((t) => (t.tier_id === updatedTier.tier_id ? updatedTier : t))
              );
            }}
          />
        )}
      </div>
    </div>
  );
};

export default NextSeasonModal;
