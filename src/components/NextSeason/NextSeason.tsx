'use client';
import React, { useEffect, useState } from 'react';
import styles from './NextSeason.module.css';
import { supabase } from '@/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';
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
  const handleError = (error: PostgrestError | null, message: string): never => {
    if (error) {
      console.error(message, error);
      throw new Error(`${message}: ${error.message}`);
    } else {
      console.error(message);
      throw new Error(message);
    }
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

  const closeOutCurrentSeason = async (seasonId: number) => {
    console.log('Closing out season ID:', seasonId);
  
    // Retrieve the season shot total for calculating shots taken
    const { data: currentSeason, error: seasonError } = await supabase
      .from('seasons')
      .select('shot_total')
      .eq('season_id', seasonId)
      .single();
  
    if (seasonError) handleError(seasonError, 'Failed to retrieve current season');
    if (!currentSeason) handleError(null, 'Current season data is null');
const seasonShotTotal = currentSeason ? currentSeason.shot_total || 0 : 0;
  
    // Step 1: Calculate team and player stats for the current season
    // Find the team with the highest score
    const { data: highestScoringTeam, error: highestTeamError } = await supabase
      .from('teams')
      .select('team_id')
      .order('team_score', { ascending: false })
      .limit(1)
      .single();
  
    if (highestTeamError) handleError(highestTeamError, 'Failed to retrieve highest scoring team');
  
    if (!highestScoringTeam) {
      console.warn('No highest scoring team found.');
    } else {
      // Get player IDs on the winning team
      const { data: teamPlayers, error: teamPlayersError } = await supabase
        .from('players')
        .select('player_id')
        .eq('team_id', highestScoringTeam.team_id);
  
      if (teamPlayersError) handleError(teamPlayersError, 'Failed to retrieve team players');
      if (!teamPlayers || teamPlayers.length === 0) {
        console.warn('No players found for the highest scoring team.');
      } else {
        // Update team_wins for each player on the winning team
        for (const player of teamPlayers) {
          // Fetch current team_wins
          const { data: playerStats, error: playerStatsError } = await supabase
            .from('stats')
            .select('team_wins')
            .eq('player_id', player.player_id)
            .single();
  
          if (playerStatsError) handleError(playerStatsError, 'Failed to retrieve player stats');
          if (!playerStats) {
            handleError(null, `Player stats not found for player ID ${player.player_id}`);
          } else {
            const currentTeamWins = playerStats.team_wins || 0;
            const newTeamWins = currentTeamWins + 1;
  
            const { error: updateError } = await supabase
              .from('stats')
              .update({ team_wins: newTeamWins })
              .eq('player_id', player.player_id);
  
            if (updateError) handleError(updateError, 'Failed to update team wins');
          }
        }
      }
    }
  
    // Find the player with the highest score and increment their MVP awards
    const { data: topScoringPlayer, error: topPlayerError } = await supabase
      .from('player_instance')
      .select('player_id')
      .eq('season_id', seasonId)
      .order('score', { ascending: false })
      .limit(1)
      .single();
  
    if (topPlayerError) handleError(topPlayerError, 'Failed to retrieve top scoring player');
  
    if (!topScoringPlayer) {
      console.warn('No top scoring player found for this season.');
    } else {
      // Fetch current mvp_awards
      const { data: mvpStats, error: mvpStatsError } = await supabase
        .from('stats')
        .select('mvp_awards')
        .eq('player_id', topScoringPlayer.player_id)
        .single();
  
      if (mvpStatsError) handleError(mvpStatsError, 'Failed to retrieve MVP stats');
      if (!mvpStats) {
        handleError(null, `MVP stats not found for player ID ${topScoringPlayer.player_id}`);
      } else {
        const currentMvpAwards = mvpStats.mvp_awards || 0;
        const newMvpAwards = currentMvpAwards + 1;
  
        const { error: updateMvpError } = await supabase
          .from('stats')
          .update({ mvp_awards: newMvpAwards })
          .eq('player_id', topScoringPlayer.player_id);
  
        if (updateMvpError) handleError(updateMvpError, 'Failed to update MVP awards');
      }
    }
  
    // Update seasons_played, high, low, total_score, and total_shots for each player
    const { data: playerStatsList, error: playerStatsError } = await supabase
      .from('stats')
      .select('player_id, seasons_played, high, low, total_score, total_shots');
  
    if (playerStatsError) handleError(playerStatsError, 'Failed to retrieve player stats');
    if (!playerStatsList) handleError(null, 'Player stats list is null');
  
    // Fetch player instances for the season
    const { data: playerInstances, error: playerInstancesError } = await supabase
      .from('player_instance')
      .select('player_id, player_instance_id, score, shots_left')
      .eq('season_id', seasonId);
  
    if (playerInstancesError) handleError(playerInstancesError, 'Failed to retrieve player instances');
    if (!playerInstances) handleError(null, 'Player instances data is null');
  
    // Calculate stats per player
    const statsByPlayer: Record<number, any> = {};
    if (!playerInstances) {
      handleError(null, 'Player instances data is null');
    }
    if (!playerInstances) return;

    for (const instance of playerInstances) {
      const playerId = instance.player_id;
      if (!statsByPlayer[playerId]) {
        statsByPlayer[playerId] = {
          seasonScore: 0,
          shotsLeft: seasonShotTotal,
          instanceIds: [],
        };
      }
      statsByPlayer[playerId].seasonScore += instance.score || 0;
      statsByPlayer[playerId].shotsLeft = Math.min(
        statsByPlayer[playerId].shotsLeft,
        instance.shots_left || seasonShotTotal
      );
      statsByPlayer[playerId].instanceIds.push(instance.player_instance_id);
    }
  
    // Update player stats
    if (!playerStatsList) return;
    for (const playerStat of playerStatsList) {
      const playerId = playerStat.player_id;
      const stats = statsByPlayer[playerId];
  
      if (stats) {
        const shotsTaken = seasonShotTotal - stats.shotsLeft;
  
        const newTotalScore = (playerStat.total_score || 0) + stats.seasonScore;
        const newHigh =
          playerStat.high !== null && playerStat.high !== undefined
            ? Math.max(playerStat.high, stats.seasonScore)
            : stats.seasonScore;
        const newLow =
          playerStat.low !== null && playerStat.low !== undefined
            ? Math.min(playerStat.low, stats.seasonScore)
            : stats.seasonScore;
        const newSeasonsPlayed = (playerStat.seasons_played || 0) + 1;
        const newTotalShots = (playerStat.total_shots || 0) + shotsTaken;
  
        const { error: updateStatsError } = await supabase
          .from('stats')
          .update({
            total_score: newTotalScore,
            high: newHigh,
            low: newLow,
            seasons_played: newSeasonsPlayed,
            total_shots: newTotalShots,
          })
          .eq('player_id', playerId);
  
        if (updateStatsError)
          handleError(updateStatsError, `Failed to update stats for player ${playerId}`);
  
        // Update tier stats
        const instanceIds = stats.instanceIds;
        if (instanceIds.length > 0) {
          const { data: playerShots, error: shotsError } = await supabase
            .from('shots')
            .select('tier_id, result')
            .in('instance_id', instanceIds);
  
          if (shotsError) handleError(shotsError, `Failed to retrieve shots for player ${playerId}`);
          if (!playerShots) {
            handleError(null, `Player shots data is null for player ID ${playerId}`);
          } else {
            const tierScores: Record<number, { total_score: number; total_shots: number }> = {};
            for (const shot of playerShots) {
              if (!tierScores[shot.tier_id]) {
                tierScores[shot.tier_id] = { total_score: 0, total_shots: 0 };
              }
              tierScores[shot.tier_id].total_score += shot.result;
              tierScores[shot.tier_id].total_shots += 1;
            }
  
            // Update tier_stats
            for (const [tierIdStr, tierData] of Object.entries(tierScores)) {
              const tierId = parseInt(tierIdStr, 10);
  
              // Fetch current tier stats
              const { data: tierStat, error: tierStatError } = await supabase
                .from('tier_stats')
                .select('total_score, total_shots')
                .eq('player_id', playerId)
                .eq('tier_id', tierId)
                .single();
  
              if (tierStatError) {
                handleError(
                  tierStatError,
                  `Failed to retrieve tier stats for player ${playerId}, tier ${tierId}`
                );
              } else if (!tierStat) {
                handleError(
                  null,
                  `Tier stats not found for player ID ${playerId}, tier ID ${tierId}`
                );
              } else {
                const newTotalScore = (tierStat.total_score || 0) + tierData.total_score;
                const newTotalShots = (tierStat.total_shots || 0) + tierData.total_shots;
  
                const { error: updateTierStatsError } = await supabase
                  .from('tier_stats')
                  .update({
                    total_score: newTotalScore,
                    total_shots: newTotalShots,
                  })
                  .eq('player_id', playerId)
                  .eq('tier_id', tierId);
  
                if (updateTierStatsError)
                  handleError(
                    updateTierStatsError,
                    `Failed to update tier stats for player ${playerId}, tier ${tierId}`
                  );
              }
            }
          }
        } else {
          console.warn(`No instance IDs found for player ${playerId} to update tier stats.`);
        }
      } else {
        console.warn(`No stats found for player ${playerId} in this season.`);
      }
    }
  
    // Step 2: Set the end date for the current season
    const currentDate = new Date().toISOString();
    const { error: closeSeasonError } = await supabase
      .from('seasons')
      .update({ end_date: currentDate })
      .eq('season_id', seasonId);
  
    if (closeSeasonError) handleError(closeSeasonError, 'Failed to close the current season');
  };
  
  // Function to create a new season
  const createNewSeason = async (): Promise<number | null> => {
    const currentDate = new Date();
  
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
  
    if (seasonError) handleError(seasonError, 'Failed to start a new season');
    if (!seasonData || seasonData.length === 0) {
      handleError(null, 'Season data is null or empty after insertion');
      return null;
    }
  
    return seasonData[0].season_id;
  };
  
  // Handle the submission to close out the current season and start a new one
  const handleSubmit = async () => {
    try {
      // Fetch the current active season
      const { data: currentSeason, error: currentSeasonError } = await supabase
        .from('seasons')
        .select('season_id, end_date')
        .order('start_date', { ascending: false })
        .limit(1)
        .single();
  
      if (currentSeasonError) handleError(currentSeasonError, 'Failed to retrieve current season');
      if (!currentSeason) throw new Error('Current season data is null');
      if (currentSeason.end_date) throw new Error('No active season to close out.');
  
      const seasonId = currentSeason.season_id;
  
      // Step 1: Close out the current season
      await closeOutCurrentSeason(seasonId);
  
      // Step 2: Create a new season
      const newSeasonId = await createNewSeason();
      if (!newSeasonId) throw new Error('Failed to start a new season.');
  
      // Step 3: Create new player instances for the new season in bulk
      if (!players || players.length === 0) {
        throw new Error('No players available to create new instances.');
      }
  
      const playerInstances = players.map((player) => ({
        player_id: player.player_id,
        season_id: newSeasonId,
        shots_left: shotCount,
        score: 0,
      }));
  
      const { error: playerInstanceError } = await supabase.from('player_instance').insert(playerInstances);
  
      if (playerInstanceError)
        handleError(playerInstanceError, 'Failed to create player instances for the new season');
  
      // Close modal and notify parent component
      onClose();
      onStartSeason();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Optionally handle user feedback for the error here
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
