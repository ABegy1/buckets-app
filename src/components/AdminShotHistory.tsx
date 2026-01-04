import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import styles from './AdminShotHistory.module.css';

interface ShotHistoryEntry {
  shot_id: number;
  shot_date: string;
  result: number;
  instance_id: number;
  player_name: string;
  team_name: string;
}

const formatShotResult = (result: number) => (Number.isNaN(result) ? 0 : result);

const AdminShotHistory: React.FC = () => {
  const [shots, setShots] = useState<ShotHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [undoingShotId, setUndoingShotId] = useState<number | null>(null);

  const fetchShotHistory = useCallback(async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      const { data: activeSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id')
        .is('end_date', null)
        .maybeSingle();

      if (seasonError) throw seasonError;
      if (!activeSeason) {
        setShots([]);
        setStatusMessage('No active season found.');
        return;
      }

      const { data: instances, error: instanceError } = await supabase
        .from('player_instance')
        .select('player_instance_id, player_id, team_id')
        .eq('season_id', activeSeason.season_id);

      if (instanceError) throw instanceError;

      if (!instances || instances.length === 0) {
        setShots([]);
        setStatusMessage('No player instances found for the active season.');
        return;
      }

      const instanceIds = instances.map((instance) => instance.player_instance_id);
      const playerIds = Array.from(new Set(instances.map((instance) => instance.player_id)));
      const teamIds = Array.from(new Set(instances.map((instance) => instance.team_id)));

      const [{ data: players, error: playersError }, { data: teams, error: teamsError }] = await Promise.all([
        supabase.from('players').select('player_id, name').in('player_id', playerIds),
        supabase.from('teams').select('team_id, team_name').in('team_id', teamIds),
      ]);

      if (playersError) throw playersError;
      if (teamsError) throw teamsError;

      const playerMap = new Map(players?.map((player) => [player.player_id, player.name]));
      const teamMap = new Map(teams?.map((team) => [team.team_id, team.team_name]));
      const instanceMap = new Map(
        instances.map((instance) => [
          instance.player_instance_id,
          { playerId: instance.player_id, teamId: instance.team_id },
        ]),
      );

      const { data: shotsData, error: shotsError } = await supabase
        .from('shots')
        .select('shot_id, shot_date, result, instance_id')
        .in('instance_id', instanceIds)
        .order('shot_date', { ascending: false });

      if (shotsError) throw shotsError;

      const historyEntries = (shotsData || []).map((shot) => {
        const instanceMeta = instanceMap.get(shot.instance_id);
        const playerName = instanceMeta ? playerMap.get(instanceMeta.playerId) : undefined;
        const teamName = instanceMeta ? teamMap.get(instanceMeta.teamId) : undefined;

        return {
          shot_id: shot.shot_id,
          shot_date: shot.shot_date,
          result: Number(shot.result) || 0,
          instance_id: shot.instance_id,
          player_name: playerName || 'Unknown Player',
          team_name: teamName || 'Unknown Team',
        };
      });

      setShots(historyEntries);

      if (historyEntries.length === 0) {
        setStatusMessage('No shots have been recorded for the active season yet.');
      }
    } catch (error) {
      console.error('Error fetching shot history:', error);
      setStatusMessage('Unable to load shot history. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShotHistory();

    const shotChannel = supabase
      .channel('shot-history-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, fetchShotHistory)
      .subscribe();

    const instanceChannel = supabase
      .channel('shot-history-instance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_instance' }, fetchShotHistory)
      .subscribe();

    return () => {
      supabase.removeChannel(shotChannel);
      supabase.removeChannel(instanceChannel);
    };
  }, [fetchShotHistory]);

  const handleUndo = async (shot: ShotHistoryEntry) => {
    const shouldUndo = window.confirm(
      `Undo shot for ${shot.player_name}? This will revert the score and shots left.`,
    );
    if (!shouldUndo) return;

    setUndoingShotId(shot.shot_id);
    setStatusMessage('');

    try {
      const { data: playerInstance, error: instanceError } = await supabase
        .from('player_instance')
        .select('score, shots_left')
        .eq('player_instance_id', shot.instance_id)
        .single();

      if (instanceError || !playerInstance) throw instanceError;

      const pointsToRemove = formatShotResult(shot.result);
      const updatedScore = playerInstance.score - pointsToRemove;
      const updatedShotsLeft = playerInstance.shots_left + 1;

      const { error: updateError } = await supabase
        .from('player_instance')
        .update({ score: updatedScore, shots_left: updatedShotsLeft })
        .eq('player_instance_id', shot.instance_id);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('shots')
        .delete()
        .eq('shot_id', shot.shot_id);

      if (deleteError) throw deleteError;

      setStatusMessage('Shot undone successfully. Standings and stats will refresh automatically.');
      await fetchShotHistory();
    } catch (error) {
      console.error('Error undoing shot:', error);
      setStatusMessage('Unable to undo the shot. Please try again.');
    } finally {
      setUndoingShotId(null);
    }
  };

  return (
    <section className={styles.historySection}>
      <div className={styles.historyHeader}>
        <h3 className={styles.historyTitle}>Shot History</h3>
        <p className={styles.historySubtitle}>
          Review every recorded attempt and undo any shot that was logged incorrectly.
        </p>
      </div>

      <div className={styles.historyTableWrapper}>
        <table className={styles.historyTable}>
          <thead>
            <tr>
              <th scope="col">Player</th>
              <th scope="col">Team</th>
              <th scope="col">Result</th>
              <th scope="col">Shot Time</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5}>Loading shot history...</td>
              </tr>
            )}
            {!loading && shots.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  {statusMessage || 'No shot attempts recorded yet.'}
                </td>
              </tr>
            )}
            {!loading &&
              shots.map((shot) => (
                <tr key={shot.shot_id}>
                  <td>{shot.player_name}</td>
                  <td>{shot.team_name}</td>
                  <td>{formatShotResult(shot.result)}</td>
                  <td>{new Date(shot.shot_date).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.undoButton}
                      onClick={() => handleUndo(shot)}
                      disabled={undoingShotId === shot.shot_id}
                    >
                      {undoingShotId === shot.shot_id ? 'Undoing...' : 'Undo'}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {statusMessage && shots.length > 0 && (
        <p className={styles.statusMessage}>{statusMessage}</p>
      )}
    </section>
  );
};

export default AdminShotHistory;
