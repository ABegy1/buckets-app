import React, { useEffect, useMemo, useState } from 'react';
import styles from './CurrentSeasonModal.module.css';
import { supabase } from '@/supabaseClient';

interface CurrentSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'adjustments' | 'history';

interface TeamOption {
  team_id: number;
  team_name: string;
}

interface TierOption {
  tier_id: number;
  tier_name: string;
}

interface PlayerAdjustmentRow {
  key: string;
  playerInstanceId?: number;
  playerId?: number;
  name: string;
  shotsLeft: number;
  score: number;
  teamId: number | null;
  tierId: number | null;
  isNew: boolean;
}

interface ShotHistoryRow {
  shotId: number;
  instanceId: number;
  playerName: string;
  shotNumber: number;
  points: number;
  shotDate: string;
}

const CurrentSeasonModal: React.FC<CurrentSeasonModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('adjustments');
  const [isSubmitConfirmationOpen, setIsSubmitConfirmationOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [players, setPlayers] = useState<PlayerAdjustmentRow[]>([]);
  const [originalPlayers, setOriginalPlayers] = useState<PlayerAdjustmentRow[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [tiers, setTiers] = useState<TierOption[]>([]);
  const [shotHistory, setShotHistory] = useState<ShotHistoryRow[]>([]);
  const [pendingUndoShots, setPendingUndoShots] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('adjustments');
      setIsSubmitConfirmationOpen(false);
      setSeasonId(null);
      setPlayers([]);
      setOriginalPlayers([]);
      setTeams([]);
      setTiers([]);
      setShotHistory([]);
      setPendingUndoShots(new Set());
      setLoading(true);
      return;
    }

    const fetchSeasonData = async () => {
      setLoading(true);
      try {
        const { data: activeSeason, error: seasonError } = await supabase
          .from('seasons')
          .select('season_id')
          .is('end_date', null)
          .single();

        if (seasonError || !activeSeason) {
          console.error('No active season found:', seasonError);
          setLoading(false);
          return;
        }

        const activeSeasonId = activeSeason.season_id;
        setSeasonId(activeSeasonId);

        const [playerRes, teamRes, tierRes, shotsRes] = await Promise.all([
          supabase
            .from('player_instance')
            .select('player_instance_id, player_id, shots_left, score, players(name, team_id, tier_id)')
            .eq('season_id', activeSeasonId),
          supabase.from('teams').select('team_id, team_name'),
          supabase.from('tiers').select('tier_id, tier_name'),
          supabase
            .from('shots')
            .select(
              `shot_id, instance_id, shot_date, result, player_instance:instance_id (player_instance_id, season_id, players(name))`
            )
            .eq('player_instance.season_id', activeSeasonId)
            .order('shot_date', { ascending: true }),
        ]);

        if (playerRes.error) {
          console.error('Error fetching player instances:', playerRes.error);
        }

        if (teamRes.error) {
          console.error('Error fetching teams:', teamRes.error);
        }

        if (tierRes.error) {
          console.error('Error fetching tiers:', tierRes.error);
        }

        if (shotsRes.error) {
          console.error('Error fetching shots:', shotsRes.error);
        }

        const playerRows: PlayerAdjustmentRow[] = (playerRes.data || []).map((player) => ({
          key: `existing-${player.player_instance_id}`,
          playerInstanceId: player.player_instance_id,
          playerId: player.player_id,
          name: player.players?.name ?? 'Unknown Player',
          shotsLeft: player.shots_left ?? 0,
          score: player.score ?? 0,
          teamId: player.players?.team_id ?? null,
          tierId: player.players?.tier_id ?? null,
          isNew: false,
        }));

        setPlayers(playerRows);
        setOriginalPlayers(playerRows);
        setTeams(teamRes.data || []);
        setTiers(tierRes.data || []);

        const shotCounts = new Map<number, number>();
        const shotsWithNumbers: ShotHistoryRow[] = (shotsRes.data || []).map((shot) => {
          const instanceId = shot.instance_id;
          const currentCount = shotCounts.get(instanceId) ?? 0;
          const shotNumber = currentCount + 1;
          shotCounts.set(instanceId, shotNumber);

          return {
            shotId: shot.shot_id,
            instanceId,
            playerName: shot.player_instance?.players?.name ?? 'Unknown Player',
            shotNumber,
            points: Number(shot.result) || 0,
            shotDate: shot.shot_date,
          };
        });

        shotsWithNumbers.sort((a, b) => new Date(b.shotDate).getTime() - new Date(a.shotDate).getTime());
        setShotHistory(shotsWithNumbers);
      } catch (error) {
        console.error('Unexpected error fetching season data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonData();
  }, [isOpen]);

  const handleCloseModal = () => {
    setIsSubmitConfirmationOpen(false);
    onClose();
  };

  const handleSubmitChanges = () => {
    setIsSubmitConfirmationOpen(true);
  };

  const pendingUndoSummary = useMemo(() => {
    const summary = new Map<number, { shotsToRefund: number; scoreToRemove: number }>();
    shotHistory.forEach((shot) => {
      if (!pendingUndoShots.has(shot.shotId)) return;
      const current = summary.get(shot.instanceId) ?? { shotsToRefund: 0, scoreToRemove: 0 };
      summary.set(shot.instanceId, {
        shotsToRefund: current.shotsToRefund + 1,
        scoreToRemove: current.scoreToRemove + shot.points,
      });
    });
    return summary;
  }, [pendingUndoShots, shotHistory]);

  const hasChanges = useMemo(() => {
    if (pendingUndoShots.size > 0) return true;
    if (players.some((player) => player.isNew)) return true;

    const originalMap = new Map(
      originalPlayers.map((player) => [player.playerInstanceId, player])
    );

    return players.some((player) => {
      if (player.isNew) return true;
      const original = originalMap.get(player.playerInstanceId);
      if (!original) return true;
      return (
        original.name !== player.name ||
        original.shotsLeft !== player.shotsLeft ||
        original.score !== player.score ||
        original.teamId !== player.teamId ||
        original.tierId !== player.tierId
      );
    });
  }, [originalPlayers, pendingUndoShots.size, players]);

  const handlePlayerFieldChange = <T extends keyof PlayerAdjustmentRow>(
    key: string,
    field: T,
    value: PlayerAdjustmentRow[T]
  ) => {
    setPlayers((prev) =>
      prev.map((player) => (player.key === key ? { ...player, [field]: value } : player))
    );
  };

  const handleAddPlayerRow = () => {
    const newKey = `new-${Date.now()}`;
    const newRow: PlayerAdjustmentRow = {
      key: newKey,
      name: '',
      shotsLeft: 0,
      score: 0,
      teamId: null,
      tierId: null,
      isNew: true,
    };
    setPlayers((prev) => [newRow, ...prev]);
  };

  const handleRemoveNewPlayer = (key: string) => {
    setPlayers((prev) => prev.filter((player) => player.key !== key));
  };

  const togglePendingUndo = (shotId: number) => {
    setPendingUndoShots((prev) => {
      const next = new Set(prev);
      if (next.has(shotId)) {
        next.delete(shotId);
      } else {
        next.add(shotId);
      }
      return next;
    });
  };

  const handleConfirmSubmitChanges = async () => {
    if (!seasonId) return;
    setIsSaving(true);

    try {
      const undoMap = pendingUndoSummary;
      const originalMap = new Map(
        originalPlayers.map((player) => [player.playerInstanceId, player])
      );

      const playerUpdates = [] as PromiseLike<{ error: any }>[];
      const instanceUpdates = [] as PromiseLike<{ error: any }>[];

      for (const player of players) {
        if (player.isNew) continue;
        const original = originalMap.get(player.playerInstanceId);
        if (!original || !player.playerId || !player.playerInstanceId) continue;

        const undoSummary = undoMap.get(player.playerInstanceId) ?? {
          shotsToRefund: 0,
          scoreToRemove: 0,
        };
        const finalShotsLeft = player.shotsLeft + undoSummary.shotsToRefund;
        const finalScore = player.score - undoSummary.scoreToRemove;

        if (
          original.name !== player.name ||
          original.teamId !== player.teamId ||
          original.tierId !== player.tierId
        ) {
          playerUpdates.push(
            supabase
              .from('players')
              .update({
                name: player.name.trim() || 'Unknown Player',
                team_id: player.teamId,
                tier_id: player.tierId,
              })
              .eq('player_id', player.playerId)
          );
        }

        if (original.shotsLeft !== finalShotsLeft || original.score !== finalScore) {
          instanceUpdates.push(
            supabase
              .from('player_instance')
              .update({
                shots_left: finalShotsLeft,
                score: finalScore,
              })
              .eq('player_instance_id', player.playerInstanceId)
          );
        }
      }

      for (const player of players.filter((row) => row.isNew)) {
        const trimmedName = player.name.trim();
        if (!trimmedName) continue;

        const { data: createdPlayer, error: createPlayerError } = await supabase
          .from('players')
          .insert({
            name: trimmedName,
            team_id: player.teamId,
            tier_id: player.tierId,
          })
          .select('player_id')
          .single();

        if (createPlayerError || !createdPlayer) {
          console.error('Error adding player:', createPlayerError);
          continue;
        }

        const { error: instanceError } = await supabase.from('player_instance').insert({
          player_id: createdPlayer.player_id,
          season_id: seasonId,
          shots_left: player.shotsLeft,
          score: player.score,
        });

        if (instanceError) {
          console.error('Error adding player instance:', instanceError);
        }
      }

      const updateResults = await Promise.all([...playerUpdates, ...instanceUpdates]);
      updateResults.forEach((result) => {
        if (result?.error) {
          console.error('Error saving changes:', result.error);
        }
      });

      if (pendingUndoShots.size > 0) {
        const shotIds = Array.from(pendingUndoShots);
        const { error: deleteError } = await supabase.from('shots').delete().in('shot_id', shotIds);
        if (deleteError) {
          console.error('Error deleting shots:', deleteError);
        }
      }

      setIsSubmitConfirmationOpen(false);
      onClose();
    } catch (error) {
      console.error('Unexpected error applying changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`${styles.currentSeasonModal} ${isOpen ? styles.currentSeasonModalOpen : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Manage current season"
    >
      <div className={styles.modalContent}>
        <button
          className={styles.topCloseBtn}
          onClick={handleCloseModal}
          aria-label="Close current season controls"
        >
          ×
        </button>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>Current Season Controls</h2>
            <p className={styles.subtitle}>
              Draft adjustments and history edits here. Nothing is applied until you submit.
            </p>
          </div>
        </div>

        <div className={styles.tabBar} role="tablist" aria-label="Current season sections">
          <button
            className={`${styles.tabButton} ${activeTab === 'adjustments' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('adjustments')}
            role="tab"
            aria-selected={activeTab === 'adjustments'}
            aria-controls="season-adjustments"
          >
            Season adjustments
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'history' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('history')}
            role="tab"
            aria-selected={activeTab === 'history'}
            aria-controls="shot-history"
          >
            Shot history
          </button>
        </div>

        <div className={styles.contentWrapper}>
          {loading ? (
            <div className={styles.loadingState}>Loading current season data...</div>
          ) : (
            <div className={styles.content}>
              {activeTab === 'adjustments' && (
                <section id="season-adjustments" role="tabpanel" className={styles.tabPanel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h3>Season adjustments</h3>
                      <p>Update players, shots, scores, teams, and tiers in one inline table.</p>
                    </div>
                    <button className={styles.primaryBtn} onClick={handleAddPlayerRow}>
                      + Add player
                    </button>
                  </div>

                  <div className={styles.tableScroll}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Players</th>
                          <th>Shots</th>
                          <th>Score</th>
                          <th>Team</th>
                          <th>Tier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.length === 0 && (
                          <tr>
                            <td colSpan={5} className={styles.emptyState}>
                              No players found for the current season.
                            </td>
                          </tr>
                        )}
                        {players.map((player) => {
                          const undoSummary = player.playerInstanceId
                            ? pendingUndoSummary.get(player.playerInstanceId)
                            : undefined;

                          return (
                            <tr key={player.key} className={player.isNew ? styles.newRow : ''}>
                              <td>
                                <div className={styles.playerCell}>
                                  <input
                                    type="text"
                                    value={player.name}
                                    placeholder="Player name"
                                    onChange={(event) =>
                                      handlePlayerFieldChange(player.key, 'name', event.target.value)
                                    }
                                  />
                                  {player.isNew && (
                                    <button
                                      type="button"
                                      className={styles.linkButton}
                                      onClick={() => handleRemoveNewPlayer(player.key)}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className={styles.numericField}>
                                  <input
                                    type="number"
                                    value={player.shotsLeft}
                                    min={0}
                                    onChange={(event) =>
                                      handlePlayerFieldChange(
                                        player.key,
                                        'shotsLeft',
                                        Number(event.target.value)
                                      )
                                    }
                                  />
                                  {undoSummary && undoSummary.shotsToRefund > 0 && (
                                    <span className={styles.pendingNote}>
                                      +{undoSummary.shotsToRefund} pending undo
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className={styles.numericField}>
                                  <input
                                    type="number"
                                    value={player.score}
                                    min={0}
                                    onChange={(event) =>
                                      handlePlayerFieldChange(
                                        player.key,
                                        'score',
                                        Number(event.target.value)
                                      )
                                    }
                                  />
                                  {undoSummary && undoSummary.scoreToRemove > 0 && (
                                    <span className={styles.pendingNote}>
                                      -{undoSummary.scoreToRemove} pending undo
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <select
                                  value={player.teamId ?? ''}
                                  onChange={(event) =>
                                    handlePlayerFieldChange(
                                      player.key,
                                      'teamId',
                                      event.target.value ? Number(event.target.value) : null
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
                                <select
                                  value={player.tierId ?? ''}
                                  onChange={(event) =>
                                    handlePlayerFieldChange(
                                      player.key,
                                      'tierId',
                                      event.target.value ? Number(event.target.value) : null
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
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeTab === 'history' && (
                <section id="shot-history" role="tabpanel" className={styles.tabPanel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h3>Shot history</h3>
                      <p>Review every shot recorded this season. Undo shots before submitting changes.</p>
                    </div>
                    {pendingUndoShots.size > 0 && (
                      <div className={styles.pendingBadge}>
                        {pendingUndoShots.size} undo{pendingUndoShots.size === 1 ? '' : 's'} queued
                      </div>
                    )}
                  </div>

                  <div className={styles.tableScroll}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Player</th>
                          <th>Shot #</th>
                          <th>Points</th>
                          <th>Recorded</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shotHistory.length === 0 && (
                          <tr>
                            <td colSpan={5} className={styles.emptyState}>
                              No shots recorded yet for this season.
                            </td>
                          </tr>
                        )}
                        {shotHistory.map((shot) => {
                          const isPendingUndo = pendingUndoShots.has(shot.shotId);
                          return (
                            <tr key={shot.shotId} className={isPendingUndo ? styles.undoRow : ''}>
                              <td>{shot.playerName}</td>
                              <td>{shot.shotNumber}</td>
                              <td>{shot.points}</td>
                              <td>{new Date(shot.shotDate).toLocaleString()}</td>
                              <td>
                                <button
                                  type="button"
                                  className={styles.secondaryBtn}
                                  onClick={() => togglePendingUndo(shot.shotId)}
                                >
                                  {isPendingUndo ? 'Restore' : 'Undo'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        <div className={styles.bottomBar}>
          <button className={styles.secondaryBtn} onClick={handleCloseModal} disabled={isSaving}>
            Close
          </button>
          <button
            className={styles.primaryBtn}
            onClick={handleSubmitChanges}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Saving...' : 'Submit changes'}
          </button>
        </div>
      </div>

      {isSubmitConfirmationOpen && (
        <div className={styles.confirmationOverlay} role="alertdialog" aria-modal="true">
          <div className={styles.confirmationCard}>
            <h3>Submit current season updates?</h3>
            <p>Confirm to apply your changes and close the modal.</p>
            <div className={styles.confirmationActions}>
              <button className={styles.secondaryBtn} onClick={() => setIsSubmitConfirmationOpen(false)}>
                Keep editing
              </button>
              <button
                className={styles.primaryBtn}
                onClick={handleConfirmSubmitChanges}
                disabled={isSaving}
              >
                Submit and close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentSeasonModal;
