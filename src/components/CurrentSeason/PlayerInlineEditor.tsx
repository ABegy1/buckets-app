import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/supabaseClient';
import styles from './CurrentSeasonModal.module.css';

interface PlayerInlineEditorProps {
  isOpen: boolean;
  teams: any[];
  onRefreshTeams: () => Promise<void>;
}

interface PlayerRow {
  player_instance_id: number | null;
  player_id: number;
  shots_left: number;
  score: number;
  players: {
    name: string;
    team_id: number | null;
    is_hidden: boolean;
    tier_id: number | null;
  };
}

const PlayerInlineEditor: React.FC<PlayerInlineEditorProps> = ({ isOpen, teams, onRefreshTeams }) => {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const savedShotsRef = useRef<Record<number, number>>({});

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: activeSeason, error: activeSeasonError } = await supabase
          .from('seasons')
          .select('season_id')
          .is('end_date', null)
          .single();

        if (activeSeasonError || !activeSeason) {
          console.error('No active season found:', activeSeasonError);
          return;
        }

        const activeSeasonId = activeSeason.season_id;

        const [{ data: playerData, error: playerError }, { data: tierData, error: tierError }] =
          await Promise.all([
            supabase
              .from('player_instance')
              .select(
                `player_instance_id, player_id, shots_left, score, players (name, team_id, is_hidden, tier_id)`
              )
              .eq('season_id', activeSeasonId),
            supabase.from('tiers').select('*'),
          ]);

        if (playerError) {
          console.error('Error fetching player data:', playerError);
        } else {
          const sanitizedPlayers = (playerData || []).map((player) => ({
            player_instance_id: player.player_instance_id ?? null,
            player_id: player.player_id,
            shots_left: player.shots_left ?? 0,
            score: player.score ?? 0,
            players: {
              name: player.players?.name ?? 'Unknown Player',
              team_id: player.players?.team_id ?? null,
              is_hidden: player.players?.is_hidden ?? false,
              tier_id: player.players?.tier_id ?? null,
            },
          }));
          setPlayers(sanitizedPlayers);
          const shotsMap: Record<number, number> = {};
          sanitizedPlayers.forEach((player) => {
            if (player.player_instance_id) {
              shotsMap[player.player_instance_id] = player.shots_left;
            }
          });
          savedShotsRef.current = shotsMap;
        }

        if (tierError) {
          console.error('Error fetching tiers:', tierError);
        } else {
          setTiers(tierData || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  const handlePlayerNameChange = async (playerId: number, newName: string) => {
    setPlayers((prev) =>
      prev.map((player) => (player.player_id === playerId ? { ...player, players: { ...player.players, name: newName } } : player))
    );

    const { error } = await supabase.from('players').update({ name: newName }).eq('player_id', playerId);
    if (error) {
      console.error('Error updating player name:', error);
    }
  };

  const handleTeamChange = async (playerId: number, newTeamId: number | null) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.player_id === playerId ? { ...player, players: { ...player.players, team_id: newTeamId } } : player
      )
    );

    const { error } = await supabase
      .from('players')
      .update({ team_id: newTeamId === null ? null : newTeamId })
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating player team:', error);
    } else {
      onRefreshTeams();
    }
  };

  const handleTierChange = async (playerId: number, newTierId: number | null) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.player_id === playerId ? { ...player, players: { ...player.players, tier_id: newTierId } } : player
      )
    );

    const { error } = await supabase.from('players').update({ tier_id: newTierId }).eq('player_id', playerId);

    if (error) {
      console.error('Error updating player tier:', error);
    }
  };

  const handleVisibilityChange = async (playerId: number, isHidden: boolean) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.player_id === playerId ? { ...player, players: { ...player.players, is_hidden: isHidden } } : player
      )
    );

    const { error } = await supabase.from('players').update({ is_hidden: isHidden }).eq('player_id', playerId);

    if (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const removeTodaysShots = async (playerInstanceId: number, shotsToRemove: number) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);

    const { data: todaysShots, error: fetchError } = await supabase
      .from('shots')
      .select('shot_id')
      .eq('instance_id', playerInstanceId)
      .gte('shot_date', startOfDay.toISOString())
      .lt('shot_date', startOfNextDay.toISOString())
      .order('shot_date', { ascending: false })
      .limit(shotsToRemove);

    if (fetchError) {
      console.error("Error fetching today's shots for removal:", fetchError);
      return;
    }

    if (!todaysShots || todaysShots.length === 0) return;

    const shotIdsToDelete = todaysShots.map((shot) => shot.shot_id);

    const { error: deleteError } = await supabase.from('shots').delete().in('shot_id', shotIdsToDelete);

    if (deleteError) {
      console.error("Error deleting today's shots:", deleteError);
    }
  };

  const updateShots = async (player: PlayerRow, newValue: number) => {
    if (!player.player_instance_id) return;
    const sanitized = Math.max(0, Number.isNaN(newValue) ? 0 : newValue);

    setPlayers((prev) =>
      prev.map((row) => (row.player_id === player.player_id ? { ...row, shots_left: sanitized } : row))
    );

    const previousShots = savedShotsRef.current[player.player_instance_id] ?? player.shots_left;
    const increase = sanitized - previousShots;

    if (increase > 0) {
      await removeTodaysShots(player.player_instance_id, increase);
    }

    const { error } = await supabase
      .from('player_instance')
      .update({ shots_left: sanitized })
      .eq('player_instance_id', player.player_instance_id);

    if (error) {
      console.error('Error updating shots:', error);
    } else {
      savedShotsRef.current[player.player_instance_id] = sanitized;
    }
  };

  const handleAdjustShots = (player: PlayerRow, adjustment: number) => {
    const updated = Math.max(0, player.shots_left + adjustment);
    updateShots(player, updated);
  };

  const updateScore = async (player: PlayerRow, newValue: number) => {
    if (!player.player_instance_id) return;
    const sanitized = Math.max(0, Number.isNaN(newValue) ? 0 : newValue);

    setPlayers((prev) =>
      prev.map((row) => (row.player_id === player.player_id ? { ...row, score: sanitized } : row))
    );

    const { error } = await supabase
      .from('player_instance')
      .update({ score: sanitized })
      .eq('player_instance_id', player.player_instance_id);

    if (error) {
      console.error('Error updating score:', error);
    }
  };

  const handleAdjustScore = (player: PlayerRow, adjustment: number) => {
    const updated = Math.max(0, player.score + adjustment);
    updateScore(player, updated);
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Players</p>
          <h3 className={styles.sectionTitle}>Edit teams, shots, scores, and tiers inline</h3>
        </div>
      </div>

      {loading ? (
        <p className={styles.mutedText}>Loading players...</p>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Shots</th>
                <th>Score</th>
                <th>Tier</th>
                <th>Hidden</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.mutedText}>
                    No players found for the active season.
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr key={player.player_id}>
                    <td className={styles.nameCell}>
                      <input
                        className={styles.inlineInput}
                        type="text"
                        value={player.players.name}
                        onChange={(e) => handlePlayerNameChange(player.player_id, e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className={styles.inlineSelect}
                        value={player.players.team_id ?? ''}
                        onChange={(e) =>
                          handleTeamChange(
                            player.player_id,
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                      >
                        <option value="">No Team</option>
                        {teams.map((team) => (
                          <option key={team.team_id} value={team.team_id}>
                            {team.team_name || 'Unknown Team'}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className={styles.adjustGroup}>
                        <button
                          className={styles.roundButton}
                          onClick={() => handleAdjustShots(player, -1)}
                          disabled={player.shots_left <= 0 || !player.player_instance_id}
                          aria-label={`Remove a shot from ${player.players.name}`}
                        >
                          –
                        </button>
                        <input
                          className={styles.numberInput}
                          type="number"
                          min={0}
                          value={player.shots_left}
                          onChange={(e) =>
                            setPlayers((prev) =>
                              prev.map((row) =>
                                row.player_id === player.player_id
                                  ? { ...row, shots_left: Math.max(0, Number(e.target.value)) }
                                  : row
                              )
                            )
                          }
                          onBlur={(e) => updateShots(player, Number(e.target.value))}
                        />
                        <button
                          className={styles.roundButton}
                          onClick={() => handleAdjustShots(player, 1)}
                          disabled={!player.player_instance_id}
                          aria-label={`Add a shot back to ${player.players.name}`}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className={styles.adjustGroup}>
                        <button
                          className={styles.roundButton}
                          onClick={() => handleAdjustScore(player, -1)}
                          disabled={player.score <= 0 || !player.player_instance_id}
                          aria-label={`Remove a point from ${player.players.name}`}
                        >
                          –
                        </button>
                        <input
                          className={styles.numberInput}
                          type="number"
                          min={0}
                          value={player.score}
                          onChange={(e) =>
                            setPlayers((prev) =>
                              prev.map((row) =>
                                row.player_id === player.player_id
                                  ? { ...row, score: Math.max(0, Number(e.target.value)) }
                                  : row
                              )
                            )
                          }
                          onBlur={(e) => updateScore(player, Number(e.target.value))}
                        />
                        <button
                          className={styles.roundButton}
                          onClick={() => handleAdjustScore(player, 1)}
                          disabled={!player.player_instance_id}
                          aria-label={`Add a point to ${player.players.name}`}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <select
                        className={styles.inlineSelect}
                        value={player.players.tier_id ?? ''}
                        onChange={(e) =>
                          handleTierChange(
                            player.player_id,
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                      >
                        <option value="">No Tier</option>
                        {tiers.map((tier) => (
                          <option key={tier.tier_id} value={tier.tier_id}>
                            {tier.tier_name || 'Unknown Tier'}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={player.players.is_hidden}
                          onChange={(e) => handleVisibilityChange(player.player_id, e.target.checked)}
                        />
                        Hidden
                      </label>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlayerInlineEditor;
