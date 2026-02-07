import React, { useEffect, useMemo, useState } from 'react';
import styles from './CurrentSeasonModal.module.css';
import AddPlayers from '../AddPlayers';
import AdjustRules from '../AdjustRules';
import { supabase } from '@/supabaseClient';

// Type definition for the component's props
interface CurrentSeasonModalProps {
  isOpen: boolean; // Determines whether the modal is open
  onClose: () => void; // Function to handle closing the modal
}

interface SeasonRow {
  playerInstanceId: number;
  playerId: number;
  playerName: string;
  shotsLeft: number;
  score: number;
  teamId: number | null;
  tierId: number | null;
  dashes: number;
}

interface TeamOption {
  team_id: number;
  team_name: string | null;
}

interface TierOption {
  tier_id: number;
  tier_name: string | null;
}

type UtilityPanel = 'none' | 'add-player' | 'adjust-rules';

const hasRowChanged = (row: SeasonRow, initial?: SeasonRow) => {
  if (!initial) return true;
  return (
    row.playerName !== initial.playerName ||
    row.shotsLeft !== initial.shotsLeft ||
    row.score !== initial.score ||
    row.teamId !== initial.teamId ||
    row.tierId !== initial.tierId ||
    row.dashes !== initial.dashes
  );
};

const parseNumberInput = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * CurrentSeasonModal Component
 *
 * This component displays a modal with inline table controls to manage and adjust
 * various aspects of the current season, such as shots, teams, scores, tiers,
 * players, and rules.
 *
 * Props:
 * - `isOpen` (boolean): Controls whether the modal is visible.
 * - `onClose` (function): Callback function to close the modal.
 */
const CurrentSeasonModal: React.FC<CurrentSeasonModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitConfirmationOpen, setIsSubmitConfirmationOpen] = useState(false);
  const [seasonRows, setSeasonRows] = useState<SeasonRow[]>([]);
  const [initialRows, setInitialRows] = useState<SeasonRow[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [tiers, setTiers] = useState<TierOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [activeUtility, setActiveUtility] = useState<UtilityPanel>('none');

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitConfirmationOpen(false);
      setActiveUtility('none');
      setSubmitStatus(null);
    }
  }, [isOpen]);

  const handleCloseModal = () => {
    setIsSubmitConfirmationOpen(false);
    onClose();
  };

  const handleSubmitChanges = () => {
    if (!hasChanges) {
      setSubmitStatus('No changes to submit yet.');
      return;
    }
    setSubmitStatus(null);
    setIsSubmitConfirmationOpen(true);
  };

  const handleConfirmSubmitChanges = async () => {
    setIsSubmitConfirmationOpen(false);
    setSubmitStatus(null);

    const updates = seasonRows
      .map((row) => ({
        row,
        initial: initialRows.find((initialRow) => initialRow.playerInstanceId === row.playerInstanceId),
      }))
      .filter((entry) => entry.initial && hasRowChanged(entry.row, entry.initial));

    if (updates.length === 0) {
      setSubmitStatus('No changes to submit yet.');
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        updates.flatMap(({ row, initial }) => {
          const operations = [];
          if (
            row.score !== initial!.score ||
            row.shotsLeft !== initial!.shotsLeft ||
            row.dashes !== initial!.dashes
          ) {
            operations.push(
              supabase
                .from('player_instance')
                .update({
                  score: row.score,
                  shots_left: row.shotsLeft,
                  shots_left_dashes: row.dashes,
                })
                .eq('player_instance_id', row.playerInstanceId),
            );
          }
          if (
            row.playerName !== initial!.playerName ||
            row.teamId !== initial!.teamId ||
            row.tierId !== initial!.tierId
          ) {
            operations.push(
              supabase
                .from('players')
                .update({
                  name: row.playerName,
                  team_id: row.teamId,
                  tier_id: row.tierId,
                })
                .eq('player_id', row.playerId),
            );
          }
          return operations;
        }),
      );

      setInitialRows(seasonRows.map((row) => ({ ...row })));
      setSubmitStatus('Changes submitted.');
      onClose();
    } catch (error) {
      console.error('Error submitting changes:', error);
      setSubmitStatus('Something went wrong while submitting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchSeasonData = async () => {
      setIsLoading(true);
      setSubmitStatus(null);
      try {
        const { data: activeSeason, error: seasonError } = await supabase
          .from('seasons')
          .select('season_id')
          .is('end_date', null)
          .single();

        if (seasonError || !activeSeason) {
          console.error('No active season found:', seasonError);
          setSeasonRows([]);
          setInitialRows([]);
          return;
        }

        const [playerInstancesResponse, teamsResponse, tiersResponse] = await Promise.all([
          supabase
            .from('player_instance')
            .select(
              'player_instance_id, player_id, score, shots_left, shots_left_dashes, players (name, team_id, tier_id)',
            )
            .eq('season_id', activeSeason.season_id),
          supabase.from('teams').select('team_id, team_name'),
          supabase.from('tiers').select('tier_id, tier_name'),
        ]);

        if (playerInstancesResponse.error) {
          console.error('Error fetching player data:', playerInstancesResponse.error);
        }

        const mappedRows: SeasonRow[] = (playerInstancesResponse.data || []).map((instance) => ({
          playerInstanceId: instance.player_instance_id,
          playerId: instance.player_id,
          playerName: instance.players?.name ?? 'Unknown Player',
          shotsLeft: instance.shots_left ?? 0,
          score: instance.score ?? 0,
          teamId: instance.players?.team_id ?? null,
          tierId: instance.players?.tier_id ?? null,
          dashes: instance.shots_left_dashes ?? 0,
        }));

        setSeasonRows(mappedRows);
        setInitialRows(mappedRows.map((row) => ({ ...row })));
        setTeams(teamsResponse.data || []);
        setTiers(tiersResponse.data || []);
      } catch (error) {
        console.error('Unexpected error loading season controls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeasonData();
  }, [isOpen]);

  const handleRowUpdate = (playerInstanceId: number, updates: Partial<SeasonRow>) => {
    setSeasonRows((prev) =>
      prev.map((row) => (row.playerInstanceId === playerInstanceId ? { ...row, ...updates } : row)),
    );
  };

  const hasChanges = useMemo(
    () => seasonRows.some((row) => hasRowChanged(row, initialRows.find((initialRow) => initialRow.playerInstanceId === row.playerInstanceId))),
    [seasonRows, initialRows],
  );

  return (
    // Modal container with dynamic class based on `isOpen` prop
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
              Make edits directly in the table, then submit to apply them. Nothing changes until you confirm.
            </p>
          </div>
          <div className={styles.utilityMenu}>
            <label htmlFor="utilitySelect">Other menus:</label>
            <select
              id="utilitySelect"
              value={activeUtility}
              onChange={(event) => setActiveUtility(event.target.value as UtilityPanel)}
              className={styles.select}
            >
              <option value="none">None</option>
              <option value="add-player">Add Player</option>
              <option value="adjust-rules">Adjust Rules</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div>
              <p className={styles.tableTitle}>Current season adjustments</p>
              <p className={styles.tableHelp}>
                Click any cell to edit shots, scores, teams, tiers, or dashes for the active season.
              </p>
            </div>
            <div className={styles.tableMeta}>
              {isLoading ? <span>Loading…</span> : <span>{seasonRows.length} players</span>}
              {hasChanges && <span className={styles.pendingBadge}>Unsaved changes</span>}
            </div>
          </div>

          <table className={styles.controlsTable}>
            <thead>
              <tr>
                <th scope="col">Player Name</th>
                <th scope="col">Shots Left</th>
                <th scope="col">Score</th>
                <th scope="col">Team</th>
                <th scope="col">Tier</th>
                <th scope="col">Dashes</th>
              </tr>
            </thead>
            <tbody>
              {seasonRows.map((row) => (
                <tr key={row.playerInstanceId}>
                  <td>
                    <input
                      className={styles.cellInput}
                      value={row.playerName}
                      onChange={(event) => handleRowUpdate(row.playerInstanceId, { playerName: event.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      type="number"
                      min={0}
                      value={row.shotsLeft}
                      onChange={(event) =>
                        handleRowUpdate(row.playerInstanceId, {
                          shotsLeft: parseNumberInput(event.target.value, row.shotsLeft),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      type="number"
                      min={0}
                      value={row.score}
                      onChange={(event) =>
                        handleRowUpdate(row.playerInstanceId, { score: parseNumberInput(event.target.value, row.score) })
                      }
                    />
                  </td>
                  <td>
                    <select
                      className={styles.cellSelect}
                      value={row.teamId ?? ''}
                      onChange={(event) =>
                        handleRowUpdate(row.playerInstanceId, {
                          teamId: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                    >
                      <option value="">Unassigned</option>
                      {teams.map((team) => (
                        <option key={team.team_id} value={team.team_id}>
                          {team.team_name || 'Unknown Team'}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className={styles.cellSelect}
                      value={row.tierId ?? ''}
                      onChange={(event) =>
                        handleRowUpdate(row.playerInstanceId, {
                          tierId: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                    >
                      <option value="">Unassigned</option>
                      {tiers.map((tier) => (
                        <option key={tier.tier_id} value={tier.tier_id}>
                          {tier.tier_name || 'Unknown Tier'}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      type="number"
                      min={0}
                      max={2}
                      value={row.dashes}
                      onChange={(event) =>
                        handleRowUpdate(row.playerInstanceId, {
                          dashes: Math.min(2, Math.max(0, parseNumberInput(event.target.value, row.dashes))),
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
              {!isLoading && seasonRows.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    No players found for the active season yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {activeUtility !== 'none' && (
          <div className={styles.utilityPanel}>
            <div className={styles.utilityHeader}>
              <h3>{activeUtility === 'add-player' ? 'Add Player' : 'Adjust Rules'}</h3>
              <button
                className={styles.utilityClose}
                onClick={() => setActiveUtility('none')}
                aria-label="Close utility panel"
              >
                ×
              </button>
            </div>
            <div className={styles.utilityContent}>
              {activeUtility === 'add-player' && <AddPlayers isOpen={isOpen} />}
              {activeUtility === 'adjust-rules' && <AdjustRules isOpen={isOpen} />}
            </div>
          </div>
        )}

        {/* Bottom bar with controls */}
        <div className={styles.bottomBar}>
          {submitStatus && <span className={styles.submitStatus}>{submitStatus}</span>}
          <button className={styles.secondaryBtn} onClick={handleCloseModal}>
            Close
          </button>
          <button className={styles.primaryBtn} onClick={handleSubmitChanges} disabled={isLoading || !hasChanges}>
            Submit changes
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
              <button className={styles.primaryBtn} onClick={handleConfirmSubmitChanges}>
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
