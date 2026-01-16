'use client';
import React, { useEffect, useState } from 'react';
import styles from './NextSeason.module.css';
import { supabase } from '@/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';
import EditTierModal from './EditTierModal';

interface NextSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSeason: () => void;
}
/**
 * NextSeasonModal Component
 * 
 * This component manages the settings and data for the next season, including
 * teams, tiers, players, and rules. It also handles advanced stats and database updates.
 */
const NextSeasonModal: React.FC<NextSeasonModalProps> = ({ isOpen, onClose, onStartSeason }) => {
  // State variables for managing data and UI interactions
  const [teams, setTeams] = useState<any[]>([]); // List of teams
  const [tiers, setTiers] = useState<any[]>([]); // List of tiers
  const [players, setPlayers] = useState<any[]>([]); // List of players
  const [initialTeams, setInitialTeams] = useState<any[]>([]);
  const [initialTiers, setInitialTiers] = useState<any[]>([]);
  const [initialPlayers, setInitialPlayers] = useState<any[]>([]);
  const [shotCount, setShotCount] = useState<number>(40); // Default shot count for the new season
  const [isFreeAgent, setIsFreeAgent] = useState<boolean>(false); // Indicates if the player is a free agent
  const [seasonName, setSeasonName] = useState<string>(''); // Name of the upcoming season
  const [seasonRules, setSeasonRules] = useState<string>(''); // Rules for the new season
  const [isTeamTournament, setIsTeamTournament] = useState<boolean>(true); // Track whether the season is a team tournament
  const [isFfaTournament, setIsFfaTournament] = useState<boolean>(false); // Track whether the season is a free-for-all tournament
  const shouldRecordStats = isTeamTournament || isFfaTournament;
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Modals state
  const [isEditTierModalOpen, setEditTierModalOpen] = useState<boolean>(false);

  // Selected items for editing
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [draggedTierId, setDraggedTierId] = useState<number | null>(null);
   /**
   * Effect: Fetch data when the modal opens.
   * This includes teams, tiers, and players data, and sets up real-time subscriptions.
   */
  useEffect(() => {
    if (!isOpen) return;

    // Default to recording stats so seasons remain official unless explicitly disabled
    setIsTeamTournament(true);
    setIsFfaTournament(false);

    // Fetch teams from the database
    const fetchTeams = async () => {
      const { data, error } = await supabase.from('teams').select('*');
      if (error) console.error('Error fetching teams:', error);
      else {
        const normalizedTeams = (data || []).map((team) => ({ ...team, is_hidden: team.is_hidden ?? false }));
        setTeams(normalizedTeams);
        setInitialTeams(normalizedTeams);
      }
    };

    // Fetch tiers from the database
    const fetchTiers = async () => {
      const { data, error } = await supabase.from('tiers').select('*');
      if (error) console.error('Error fetching tiers:', error);
      else {
        setTiers(data || []);
        setInitialTiers(data || []);
      }
    };

    // Fetch players from the database
    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('players').select('*');
      if (error) console.error('Error fetching players:', error);
      else {
        const normalizedPlayers = (data || []).map((player) => ({ ...player, is_hidden: player.is_hidden ?? false }));
        setPlayers(normalizedPlayers);
        setInitialPlayers(normalizedPlayers);
      }
    };

    //Fetch the active season rules from the database
    const fetchSeasonData = async () => {
        const { data: activeSeason, error } = await supabase
          .from('seasons')
          .select('season_id, rules')
          .is('end_date', null)
          .maybeSingle();
        if (error) {
          console.error('Error fetching season data:', error);
          return;
        }
        if (activeSeason) {
          setSeasonRules(activeSeason.rules); // Set the current rules
        }
    };

    fetchTeams();
    fetchTiers();
    fetchPlayers();
    fetchSeasonData();
  }, [isOpen]);

 /**
 * Handles adding a new team to the database.
  * The team name is auto-generated based on the number of existing teams.
  */
  const handleAddTeam = async () => {
    const newTeam = {
      team_id: `temp-team-${Date.now()}`,
      team_name: `New Team ${teams.length + 1}`,
      is_hidden: false,
    };
    setTeams((prevTeams) => [...prevTeams, newTeam]);
  };

   /**
   * Handles deleting a team from the database by its ID.
   * @param teamId - The ID of the team to delete.
   */
  const handleDeleteTeam = async (teamId: number) => {
    setTeams((prevTeams) => prevTeams.filter((team) => team.team_id !== teamId));
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.team_id === teamId ? { ...player, team_id: null, is_free_agent: true } : player
      )
    );
  };

  const handleTeamFieldChange = (teamId: number, updates: Record<string, any>) => {
    setTeams((prevTeams) => prevTeams.map((team) => (team.team_id === teamId ? { ...team, ...updates } : team)));
  };

  /**
   * Handles adding a new tier to the database.
   * The tier name is auto-generated based on the number of existing tiers, with a default color.
   */
  const handleAddTier = async () => {
    const newTier = {
      tier_id: `temp-tier-${Date.now()}`,
      tier_name: `New Tier ${tiers.length + 1}`,
      color: '#000000',
    };

    setTiers((prev) => [...prev, newTier]);
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
  /**
   * Handles deleting a tier from the database by its ID.
   * @param tierId - The ID of the tier to delete.
   */
  const handleDeleteTier = async (tierId: number) => {
    setTiers((prevTiers) => prevTiers.filter((tier) => tier.tier_id !== tierId));
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.tier_id === tierId ? { ...player, tier_id: tiers.find((t) => t.tier_id !== tierId)?.tier_id } : player
      )
    );
  };

 /**
   * Opens the modal for editing a specific tier.
   * @param tier - The tier to edit.
   */
 const handleOpenEditTierModal = (tier: any) => {
  setSelectedTier(tier);
  setEditTierModalOpen(true);
};

 /**
   * Closes the tier editing modal and clears the selected tier.
   */
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

    const newPlayer = {
      player_id: `temp-player-${Date.now()}`,
      name: `Player ${players.length + 1}`,
      tier_id: tiers[0]?.tier_id || null,
      team_id: isFreeAgent ? null : teams[0]?.team_id || null,
      is_free_agent: isFreeAgent,
      is_hidden: false,
    };

    setPlayers((prev) => [...prev, newPlayer]);
  };

  const handleDeletePlayer = async (playerId: number) => {
    setPlayers((prevPlayers) => prevPlayers.filter((player) => player.player_id !== playerId));
  };

  const handleShotCountChange = (change: number) => {
    setShotCount(shotCount + change);
  };

  const isTempId = (id: any) => typeof id === 'string' && id.startsWith('temp-');
  const resolveMappedId = (value: any, map: Map<string, number>) => {
    if (value === null || value === undefined) return null;
    if (isTempId(value)) {
      return map.get(value) ?? null;
    }
    return value;
  };

  const handleReorderTier = (targetTierId: number) => {
    setTiers((prevTiers) => {
      if (draggedTierId === null || draggedTierId === targetTierId) return prevTiers;

      const updated = [...prevTiers];
      const fromIndex = updated.findIndex((tier) => tier.tier_id === draggedTierId);
      const toIndex = updated.findIndex((tier) => tier.tier_id === targetTierId);

      if (fromIndex === -1 || toIndex === -1) return prevTiers;

      const [movedTier] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedTier);

      return updated;
    });
  };

  const handleUpdatePlayerFields = async (playerId: number, updates: Record<string, any>) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.player_id === playerId
          ? {
              ...player,
              ...updates,
            }
          : player
      )
    );
  };

  const handlePlayerTeamChange = async (playerId: number, teamValue: string) => {
    if (teamValue === 'free-agent') {
      await handleUpdatePlayerFields(playerId, { team_id: null, is_free_agent: true });
      return;
    }

    await handleUpdatePlayerFields(playerId, { team_id: teamValue, is_free_agent: false });
  };

  const handlePlayerTierChange = async (playerId: number, tierValue: string) => {
    await handleUpdatePlayerFields(playerId, { tier_id: tierValue });
  };

  const closeOutCurrentSeason = async (seasonId: number, isOfficialSeason: boolean) => {
    console.log('Closing out season ID:', seasonId);
  
    // Retrieve the season shot total for calculating shots taken
    const { data: currentSeason, error: seasonError } = await supabase
      .from('seasons')
      .select('shot_total')
      .eq('season_id', seasonId)
      .maybeSingle();

    if (seasonError) handleError(seasonError, 'Failed to retrieve current season');
    if (!currentSeason) handleError(null, 'Current season data is null');
    const seasonShotTotal = currentSeason ? currentSeason.shot_total || 0 : 0;

    if (!isOfficialSeason) {
      const currentDate = new Date().toISOString();
      const { error: closeSeasonError } = await supabase
        .from('seasons')
        .update({ end_date: currentDate })
        .eq('season_id', seasonId);

      if (closeSeasonError) handleError(closeSeasonError, 'Failed to close the current season');
      return;
    }

    const { data: playerRecords, error: playersError } = await supabase
      .from('players')
      .select('player_id, is_free_agent');

    if (playersError) handleError(playersError, 'Failed to retrieve player records');

    const eligiblePlayerIds = new Set(
      (playerRecords || [])
        .filter((player) => !player.is_free_agent)
        .map((player) => player.player_id),
    );
  
    // Step 1: Calculate team and player stats for the current season
    // Find the team with the highest score
    const { data: highestScoringTeam, error: highestTeamError } = await supabase
  .from('teams')
  .select('team_id')
  .gt('team_score', 0) // Only consider teams that scored
  .order('team_score', { ascending: false })
  .limit(1)
  .maybeSingle(); // Avoid crash if no teams scored

  
    if (highestTeamError) handleError(highestTeamError, 'Failed to retrieve highest scoring team');
  
    if (!highestScoringTeam || highestScoringTeam.team_id === null) {
  console.warn('No winning team found this season — skipping team_wins increment.');
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
            .maybeSingle();
  
          if (playerStatsError) handleError(playerStatsError, 'Failed to retrieve player stats');
         if (!playerStats) {
            console.warn(`No stats found for player ID ${player.player_id} — skipping team_wins increment.`);
            continue; // go to next player
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
      .maybeSingle();

    if (topPlayerError) handleError(topPlayerError, 'Failed to retrieve top scoring player');

    if (!topScoringPlayer) {
      console.warn('No top scoring player found for this season.');
    } else {
      // Fetch current mvp_awards
      const { data: mvpStats, error: mvpStatsError } = await supabase
        .from('stats')
        .select('mvp_awards')
        .eq('player_id', topScoringPlayer.player_id)
        .maybeSingle();

      if (mvpStatsError) handleError(mvpStatsError, 'Failed to retrieve MVP stats');
      if (!mvpStats) {
        console.warn(`MVP stats not found for player ID ${topScoringPlayer.player_id} — skipping MVP update.`);
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

    const filteredPlayerInstances =
      eligiblePlayerIds.size > 0
        ? playerInstances.filter((instance) => eligiblePlayerIds.has(instance.player_id))
        : playerInstances;

    for (const instance of filteredPlayerInstances) {
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
    const eligiblePlayerStatsList =
      eligiblePlayerIds.size > 0
        ? playerStatsList.filter((player) => eligiblePlayerIds.has(player.player_id))
        : playerStatsList;

    for (const playerStat of eligiblePlayerStatsList) {
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
        console.log(shotsTaken)
  
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
              .maybeSingle(); 
              if (tierStatError) {
                // This means the request truly failed, not just "no rows returned"
                handleError(tierStatError, `Failed to retrieve tier stats for player ${playerId}, tier ${tierId}`);
              } else if (!tierStat) {
                // No row found => either create one or skip
              
                // (Optional) if you want to create new row if not found:
                const { error: insertTierStatsError } = await supabase
                  .from('tier_stats')
                  .insert({
                    player_id: playerId,
                    tier_id: tierId,
                    total_score: tierData.total_score,
                    total_shots: tierData.total_shots,
                  });
              
                if (insertTierStatsError) {
                  handleError(insertTierStatsError, `Failed to insert new tier_stats row for player ${playerId}, tier ${tierId}`);
                }
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
        is_official: shouldRecordStats,
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
    setIsProcessing(true);
    let closedSeasonId: number | null = null;
    let startedSeasonId: number | null = null;
    try {
      // Fetch the current active season
      const { data: currentSeason, error: currentSeasonError } = await supabase
        .from('seasons')
        .select('season_id, end_date, is_official')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (currentSeasonError) handleError(currentSeasonError, 'Failed to retrieve current season');

      if (currentSeason && !currentSeason.end_date) {
        const seasonId = currentSeason.season_id;

        // Step 1: Close out the current season
        await closeOutCurrentSeason(seasonId, Boolean(currentSeason.is_official));
        closedSeasonId = seasonId;
      }

      // Step 2: Apply roster updates
      const newTeamIdMap = new Map<string, number>();
      const newTierIdMap = new Map<string, number>();

      const teamsToAdd = teams.filter((team) => isTempId(team.team_id));
      await Promise.all(
        teamsToAdd.map(async (team) => {
          const { data: insertedTeam, error } = await supabase
            .from('teams')
            .insert({ team_name: team.team_name, is_hidden: team.is_hidden ?? false })
            .select()
            .maybeSingle();
          if (error) handleError(error, 'Failed to add team');
          if (insertedTeam) {
            newTeamIdMap.set(team.team_id, insertedTeam.team_id);
          }
        })
      );

      const tiersToAdd = tiers.filter((tier) => isTempId(tier.tier_id));
      await Promise.all(
        tiersToAdd.map(async (tier) => {
          const { data: insertedTier, error } = await supabase
            .from('tiers')
            .insert({ tier_name: tier.tier_name, color: tier.color })
            .select()
            .maybeSingle();
          if (error) handleError(error, 'Failed to add tier');
          if (insertedTier) {
            newTierIdMap.set(tier.tier_id, insertedTier.tier_id);
          }
        })
      );

      const teamsToUpdate = teams.filter(
        (team) =>
          !isTempId(team.team_id) &&
          initialTeams.some(
            (initialTeam) =>
              initialTeam.team_id === team.team_id &&
              (initialTeam.team_name !== team.team_name || initialTeam.is_hidden !== team.is_hidden)
          )
      );
      await Promise.all(
        teamsToUpdate.map(async (team) => {
          const { error } = await supabase
            .from('teams')
            .update({ team_name: team.team_name, is_hidden: team.is_hidden ?? false })
            .eq('team_id', team.team_id);
          if (error) handleError(error, 'Failed to update team');
        })
      );

      const tiersToUpdate = tiers.filter(
        (tier) =>
          !isTempId(tier.tier_id) &&
          initialTiers.some(
            (initialTier) =>
              initialTier.tier_id === tier.tier_id &&
              (initialTier.tier_name !== tier.tier_name || initialTier.color !== tier.color)
          )
      );
      await Promise.all(
        tiersToUpdate.map(async (tier) => {
          const { error } = await supabase
            .from('tiers')
            .update({ tier_name: tier.tier_name, color: tier.color })
            .eq('tier_id', tier.tier_id);
          if (error) handleError(error, 'Failed to update tier');
        })
      );

      const teamIdsToDelete = initialTeams
        .filter((team) => !teams.some((currentTeam) => currentTeam.team_id === team.team_id))
        .map((team) => team.team_id);
      if (teamIdsToDelete.length) {
        const { error } = await supabase.from('teams').delete().in('team_id', teamIdsToDelete as number[]);
        if (error) handleError(error, 'Failed to delete teams');
      }

      const tierIdsToDelete = initialTiers
        .filter((tier) => !tiers.some((currentTier) => currentTier.tier_id === tier.tier_id))
        .map((tier) => tier.tier_id);
      if (tierIdsToDelete.length) {
        const { error } = await supabase.from('tiers').delete().in('tier_id', tierIdsToDelete as number[]);
        if (error) handleError(error, 'Failed to delete tiers');
      }

      const playersToAdd = players.filter((player) => isTempId(player.player_id));
      const newPlayerIdMap = new Map<string, number>();
      await Promise.all(
        playersToAdd.map(async (player) => {
          const resolvedTeamId = resolveMappedId(player.team_id, newTeamIdMap);
          const resolvedTierId = resolveMappedId(player.tier_id, newTierIdMap);
          const { data: insertedPlayer, error } = await supabase
            .from('players')
            .insert({
              name: player.name,
              tier_id: resolvedTierId,
              team_id: player.is_free_agent ? null : resolvedTeamId,
              is_free_agent: player.is_free_agent,
              is_hidden: player.is_hidden ?? false,
            })
            .select()
            .maybeSingle();
          if (error) handleError(error, 'Failed to add player');
          if (insertedPlayer) {
            newPlayerIdMap.set(player.player_id, insertedPlayer.player_id);
          }
        })
      );

      const playersToUpdate = players.filter((player) => {
        if (isTempId(player.player_id)) return false;
        const initialPlayer = initialPlayers.find((p) => p.player_id === player.player_id);
        if (!initialPlayer) return false;
        return (
          initialPlayer.name !== player.name ||
          initialPlayer.team_id !== resolveMappedId(player.team_id, newTeamIdMap) ||
          initialPlayer.tier_id !== resolveMappedId(player.tier_id, newTierIdMap) ||
          initialPlayer.is_free_agent !== player.is_free_agent ||
          initialPlayer.is_hidden !== player.is_hidden
        );
      });

      await Promise.all(
        playersToUpdate.map(async (player) => {
          const resolvedTeamId = resolveMappedId(player.team_id, newTeamIdMap);
          const resolvedTierId = resolveMappedId(player.tier_id, newTierIdMap);
          const { error } = await supabase
            .from('players')
            .update({
              name: player.name,
              tier_id: resolvedTierId,
              team_id: player.is_free_agent ? null : resolvedTeamId,
              is_free_agent: player.is_free_agent,
              is_hidden: player.is_hidden ?? false,
            })
            .eq('player_id', player.player_id);
          if (error) handleError(error, 'Failed to update player');
        })
      );

      const playerIdsToDelete = initialPlayers
        .filter((player) => !players.some((currentPlayer) => currentPlayer.player_id === player.player_id))
        .map((player) => player.player_id);
      if (playerIdsToDelete.length) {
        const { error } = await supabase.from('players').delete().in('player_id', playerIdsToDelete as number[]);
        if (error) handleError(error, 'Failed to delete players');
      }

      const finalPlayers = players.map((player) => {
        const resolvedTeamId = resolveMappedId(player.team_id, newTeamIdMap);
        const resolvedTierId = resolveMappedId(player.tier_id, newTierIdMap);
        const finalPlayerId = isTempId(player.player_id)
          ? newPlayerIdMap.get(player.player_id as string) ?? null
          : player.player_id;

        return {
          ...player,
          player_id: finalPlayerId,
          team_id: player.is_free_agent ? null : resolvedTeamId,
          tier_id: resolvedTierId,
        };
      }).filter((player) => player.player_id !== null);

      // Step 3: Create a new season
      const newSeasonId = await createNewSeason();
      if (!newSeasonId) throw new Error('Failed to start a new season.');
      startedSeasonId = newSeasonId;

      // Step 4: Create new player instances for the new season in bulk
      if (finalPlayers.length > 0) {
        const playerInstances = finalPlayers.map((player) => ({
          player_id: player.player_id,
          season_id: newSeasonId,
          shots_left: shotCount,
          score: 0,
        }));

        const { error: playerInstanceError } = await supabase.from('player_instance').insert(playerInstances);

        if (playerInstanceError)
          handleError(playerInstanceError, 'Failed to create player instances for the new season');
      }

      // Close modal and notify parent component
      onClose();
      onStartSeason();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      if (closedSeasonId && !startedSeasonId) {
        const { error: reopenError } = await supabase
          .from('seasons')
          .update({ end_date: null })
          .eq('season_id', closedSeasonId);
        if (reopenError) {
          console.error('Failed to reopen the previous season after an error:', reopenError);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };
  // Check if the modal should be rendered. If `isOpen` is false, return null to avoid rendering.
  if (!isOpen) return null;

  return (
    <div
      className={styles.modalBackdrop}
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
      aria-label="Plan next season"
    >
      <div className={styles.modal}>
        {/* Close button to close the modal */}
        <button onClick={onClose} className={styles.closeButton}>X</button>

        {/* Header for the modal */}
        <h2>Start New Season</h2>

        {/* Section for inputting the season name */}
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

        {/* Section for inputting the season rules */}
        <div className={styles.formSection}>
          <label htmlFor="seasonRules">Season Rules</label>
          <textarea
            id="seasonRules"
            value={seasonRules}
            onChange={(e) => setSeasonRules(e.target.value)}
            placeholder="Enter season rules"
          />
        </div>

        <div className={styles.formSection}>
          <label>Competition Format</label>
          <div className={styles.toggleRow}>
            <label className={styles.toggleControl} htmlFor="teamTournament">
              <input
                id="teamTournament"
                aria-label="Team Tournament"
                className={styles.toggleInput}
                type="checkbox"
                checked={isTeamTournament}
                onChange={(e) => setIsTeamTournament(e.target.checked)}
              />
              <span className={styles.toggleTrack} aria-hidden="true" />
            </label>
            <span className={styles.toggleText}>Team Tournament</span>
          </div>
          <div className={styles.toggleRow}>
            <label className={styles.toggleControl} htmlFor="ffaTournament">
              <input
                id="ffaTournament"
                aria-label="FFA (Free for All) Tournament"
                className={styles.toggleInput}
                type="checkbox"
                checked={isFfaTournament}
                onChange={(e) => setIsFfaTournament(e.target.checked)}
              />
              <span className={styles.toggleTrack} aria-hidden="true" />
            </label>
            <span className={styles.toggleText}>FFA Tournament (Free for All)</span>
          </div>
          <p className={styles.helperText}>
            Player stats are recorded when either tournament option is enabled. Leave both unchecked for draft seasons; their stats
            will be cleared when the next season starts.
          </p>
        </div>

        <div className={styles.modalGrid}>
          {/* Teams Management Section */}
          <div className={styles.listSection}>
            <div className={styles.sectionHeader}>
              <h3>Teams</h3>
              <button className={styles.addButton} onClick={handleAddTeam}>
                Add Team
              </button>
            </div>
            <div className={styles.scrollableList}>
              {teams.map((team) => (
                <div key={team.team_id} className={styles.listItem}>
                  <input
                    className={styles.inlineInput}
                    value={team.team_name}
                    onChange={(e) => handleTeamFieldChange(team.team_id, { team_name: e.target.value })}
                    aria-label={`Edit ${team.team_name} name`}
                  />
                  <div className={styles.itemActions}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={team.is_hidden || false}
                        onChange={(e) => handleTeamFieldChange(team.team_id, { is_hidden: e.target.checked })}
                      />
                      Hide from standings
                    </label>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteTeam(team.team_id)}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tiers Management Section */}
          <div className={styles.listSection}>
            <div className={styles.sectionHeader}>
              <h3>Tiers</h3>
              <button className={styles.addButton} onClick={handleAddTier}>
                Add Tier
              </button>
            </div>
            <div className={styles.scrollableList}>
              {tiers.map((tier) => (
                <div
                  key={tier.tier_id}
                  className={styles.listItem}
                  draggable
                  onDragStart={() => setDraggedTierId(tier.tier_id)}
                  onDragEnter={() => handleReorderTier(tier.tier_id)}
                  onDragEnd={() => setDraggedTierId(null)}
                >
                  <span className={styles.dragHandle} aria-label="Reorder tier">
                    ⋮⋮
                  </span>
                  <span className={styles.tierDetails}>
                    {tier.tier_name} (Color: {tier.color})
                  </span>
                  <div className={styles.itemActions}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleOpenEditTierModal(tier)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteTier(tier.tier_id)}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Players Management Section */}
        <div className={styles.listSection}>
          <div className={styles.sectionHeader}>
            <h3>Players</h3>
            <button className={styles.addButton} onClick={handleAddPlayer}>
              Add Player
            </button>
          </div>
          <div className={styles.playersTable}>
            <div className={styles.playersHeader}>
              <span>Name</span>
              <span>Team</span>
              <span>Tier</span>
              <span>Visibility</span>
              <span className={styles.headerActions}>Actions</span>
            </div>
            <div className={styles.playersBody}>
              {players.map((player) => (
                <div key={player.player_id} className={styles.playersRow}>
                  <input
                    className={styles.inlineInput}
                    value={player.name}
                    onChange={(e) => handleUpdatePlayerFields(player.player_id, { name: e.target.value })}
                    aria-label={`Edit name for ${player.name}`}
                  />
                  <select
                    value={player.is_free_agent ? 'free-agent' : player.team_id ?? 'free-agent'}
                    onChange={(e) => handlePlayerTeamChange(player.player_id, e.target.value)}
                    aria-label={`Change team for ${player.name}`}
                  >
                    <option value="free-agent">Free Agent</option>
                    {teams.map((team) => (
                      <option key={team.team_id} value={team.team_id}>
                        {team.team_name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={player.tier_id}
                    onChange={(e) => handlePlayerTierChange(player.player_id, e.target.value)}
                    aria-label={`Change tier for ${player.name}`}
                  >
                    {tiers.map((tier) => (
                      <option key={tier.tier_id} value={tier.tier_id}>
                        {tier.tier_name}
                      </option>
                    ))}
                  </select>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={player.is_hidden || false}
                      onChange={(e) => handleUpdatePlayerFields(player.player_id, { is_hidden: e.target.checked })}
                    />
                    Hide from standings
                  </label>
                  <div className={styles.itemActions}>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeletePlayer(player.player_id)}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shot Count Adjustment Section */}
        <div className={styles.shotCountSection}>
          <h3>Season Shot Count</h3>
          <div className={styles.shotCount}>
            <button onClick={() => handleShotCountChange(-1)}>-</button>
            <span>{shotCount}</span>
            <button onClick={() => handleShotCountChange(1)}>+</button>
          </div>
        </div>

        {/* Submit Button */}
        <button className={styles.globalButton} onClick={handleSubmit} disabled={isProcessing}>
          Start Season
        </button>

        {/* Edit Tier Modal */}
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
