'use client';
import React, { useEffect, useState } from 'react';
import styles from './NextSeason.module.css';
import { supabase } from '@/supabaseClient';

// EditTeamModal Component
interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: any;
  onUpdate: (team: any) => void;
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({ isOpen, onClose, team, onUpdate }) => {
  const [teamName, setTeamName] = useState<string>(team?.team_name || '');

  useEffect(() => {
    if (team) {
      setTeamName(team.team_name);
    }
  }, [team]);

  const handleUpdateTeam = async () => {
    const { error } = await supabase
      .from('teams')
      .update({ team_name: teamName })
      .eq('team_id', team.team_id);
    
    if (error) {
      console.error('Error updating team:', error);
    } else {
      onUpdate({ ...team, team_name: teamName });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2>Edit Team</h2>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team Name"
          />
          <div className={styles.modalActions}>
            <button onClick={handleUpdateTeam}>Save</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// EditTierModal Component
interface EditTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: any;
  onUpdate: (tier: any) => void;
}

const EditTierModal: React.FC<EditTierModalProps> = ({ isOpen, onClose, tier, onUpdate }) => {
  const [tierName, setTierName] = useState<string>(tier?.tier_name || '');
  const [color, setColor] = useState<string>(tier?.color || '#000000');

  useEffect(() => {
    if (tier) {
      setTierName(tier.tier_name);
      setColor(tier.color);
    }
  }, [tier]);

  const handleUpdateTier = async () => {
    const { error } = await supabase
      .from('tiers')
      .update({ tier_name: tierName, color })
      .eq('tier_id', tier.tier_id);
    
    if (error) {
      console.error('Error updating tier:', error);
    } else {
      onUpdate({ ...tier, tier_name: tierName, color });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2>Edit Tier</h2>
          <input
            type="text"
            value={tierName}
            onChange={(e) => setTierName(e.target.value)}
            placeholder="Tier Name"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <div className={styles.modalActions}>
            <button onClick={handleUpdateTier}>Save</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: any;
  tiers: any[];
  teams: any[];
  onUpdate: (player: any) => void;
}

const EditPlayerModal: React.FC<EditPlayerModalProps> = ({ isOpen, onClose, player, tiers, teams, onUpdate }) => {
  const [playerName, setPlayerName] = useState<string>(player?.name || '');
  const [tierId, setTierId] = useState<number>(player?.tier_id || tiers[0]?.tier_id);
  const [teamId, setTeamId] = useState<number>(teams[0]?.team_id || 1);

  useEffect(() => {
    if (player) {
      setPlayerName(player.name);
      setTierId(player.tier_id);
      setTeamId(teams[0]?.team_id || 1);
    }
  }, [player, teams]);

  const handleUpdatePlayer = async () => {
    // Update the player itself
    const { error: playerError } = await supabase
      .from('players')
      .update({ name: playerName, tier_id: tierId })
      .eq('player_id', player.player_id);
    
    if (playerError) {
      console.error('Error updating player:', playerError);
    }

    // Call the onUpdate callback to reflect changes in the UI
    onUpdate({ ...player, name: playerName, tier_id: tierId, team_id: teamId });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2>Edit Player</h2>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Player Name"
          />
          <select value={tierId} onChange={(e) => setTierId(Number(e.target.value))}>
            {tiers.map((tier) => (
              <option key={tier.tier_id} value={tier.tier_id}>
                {tier.tier_name}
              </option>
            ))}
          </select>

          {/* Team selection dropdown */}
          <select value={teamId} onChange={(e) => setTeamId(Number(e.target.value))}>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
              </option>
            ))}
          </select>

          <div className={styles.modalActions}>
            <button onClick={handleUpdatePlayer}>Save</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};
// Main NextSeasonModal Component
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

  // Modals state
  const [isEditPlayerModalOpen, setEditPlayerModalOpen] = useState<boolean>(false);
  const [isEditTeamModalOpen, setEditTeamModalOpen] = useState<boolean>(false);
  const [isEditTierModalOpen, setEditTierModalOpen] = useState<boolean>(false);

  // Selected entities for editing
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

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
    const { error } = await supabase.from('players').insert([{ name: `Player ${players.length + 1}`, tier_id: tiers[0]?.tier_id || 1 }]);
    if (error) console.error('Error adding player:', error);
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
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);
  
    try {
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .insert({
          season_name: `Season ${startDate.getFullYear()}`,
          start_date: startDate.toISOString(),
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
        if (tiers.length === 0 || teams.length === 0 || players.length === 0) {
          throw new Error('Tiers, Teams, and Players must be added before starting a season');
        }
  
        for (const player of players) {
          const { error: playerInstanceError } = await supabase.from('player_instance').insert({
            player_id: player.player_id,
            season_id: seasonId,
            team_id: teams[0]?.team_id || 1,
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
        <button onClick={onClose}>X</button>

        <h2>Team Setup</h2>
        {teams.map((team) => (
          <div key={team.team_id} className={styles.team}>
            {team.team_name}
            <button className={styles.editButton} onClick={() => handleOpenEditTeamModal(team)}>Edit</button>
            <button className={styles.deleteButton} onClick={() => handleDeleteTeam(team.team_id)}>X</button>
          </div>
        ))}
        <button className={styles.globalButton} onClick={handleAddTeam}>Add Team</button>

        <h2>Tier Setup</h2>
        {tiers.map((tier) => (
          <div key={tier.tier_id} className={styles.tier}>
            {tier.tier_name} (Color: {tier.color})
            <button className={styles.editButton} onClick={() => handleOpenEditTierModal(tier)}>Edit</button>
            <button className={styles.deleteButton} onClick={() => handleDeleteTier(tier.tier_id)}>X</button>
          </div>
        ))}
        <button className={styles.globalButton} onClick={handleAddTier}>Add Tier</button>

        <h2>Player Setup</h2>
        {players.map((player) => (
          <div key={player.player_id} className={styles.player}>
            {player.name}
            <button className={styles.editButton} onClick={() => handleOpenEditPlayerModal(player)}>Edit</button>
            <button className={styles.deleteButton} onClick={() => handleDeletePlayer(player.player_id)}>X</button>
          </div>
        ))}
        <button className={styles.globalButton} onClick={handleAddPlayer}>Add Player</button>

        <h2>Season Shot Count</h2>
        <div className={styles.shotCount}>
          <button onClick={() => handleShotCountChange(-1)}>-</button>
          <span>{shotCount}</span>
          <button onClick={() => handleShotCountChange(1)}>+</button>
        </div>

        <button className={styles.globalButton} onClick={handleSubmit}>Start Season</button>

        {/* EditPlayerModal */}
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

        {/* EditTeamModal */}
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

        {/* EditTierModal */}
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
