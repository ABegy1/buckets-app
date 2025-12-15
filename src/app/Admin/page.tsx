'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  activateSeason,
  completeSeason,
  createPlannedSeason,
  getActiveSeason,
  getStandings,
  listPlannedSeasons,
  listPlayersForSeason,
  listRecentShotsForSeason,
  recordShot,
  RosterEntry,
  Season,
  subscribeShotEvents,
  TeamStanding,
  voidShot,
} from '@/lib/bucketsDb';

interface ShotFormState {
  seasonRosterId: string;
  result: 'make' | 'miss';
  note: string;
}

export default function AdminPage() {
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [plannedSeasons, setPlannedSeasons] = useState<Season[]>([]);
  const [recentShots, setRecentShots] = useState<any[]>([]);
  const [shotForm, setShotForm] = useState<ShotFormState>({ seasonRosterId: '', result: 'make', note: '' });
  const [completeWinner, setCompleteWinner] = useState<string>('');
  const [completeMvp, setCompleteMvp] = useState<string>('');
  const [newSeasonName, setNewSeasonName] = useState('');

  const refreshSeasonData = useCallback(async (seasonId: string) => {
    const [rosterRows, standingsRes, shots] = await Promise.all([
      listPlayersForSeason(seasonId),
      getStandings(seasonId),
      listRecentShotsForSeason(seasonId),
    ]);
    setRoster(rosterRows);
    setStandings(standingsRes.teams);
    setRecentShots(shots);
    setShotForm((prev) =>
      prev.seasonRosterId || rosterRows.length === 0 ? prev : { ...prev, seasonRosterId: rosterRows[0].id }
    );
    if (standingsRes.teams.length > 0) {
      setCompleteWinner(standingsRes.teams[0].season_team_id);
    }
    if (standingsRes.players.length > 0) {
      setCompleteMvp(standingsRes.players[0].player_id);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const [season, plans] = await Promise.all([getActiveSeason(), listPlannedSeasons()]);
      setActiveSeason(season);
      setPlannedSeasons(plans);
      if (season) {
        await refreshSeasonData(season.id);
      }
    };
    load();
  }, [refreshSeasonData]);

  useEffect(() => {
    if (!activeSeason) return;
    const channel = subscribeShotEvents(activeSeason.id, () => refreshSeasonData(activeSeason.id));
    return () => {
      channel?.unsubscribe?.();
    };
  }, [activeSeason, refreshSeasonData]);

  const handleRecordShot = async () => {
    if (!activeSeason || !shotForm.seasonRosterId) return;
    await recordShot({ seasonRosterId: shotForm.seasonRosterId, result: shotForm.result, note: shotForm.note });
    setShotForm((prev) => ({ ...prev, note: '' }));
    await refreshSeasonData(activeSeason.id);
  };

  const handleVoidShot = async (id: string) => {
    if (!activeSeason) return;
    await voidShot(id, 'Admin void');
    await refreshSeasonData(activeSeason.id);
  };

  const handleCreateSeason = async () => {
    if (!newSeasonName.trim()) return;
    const created = await createPlannedSeason(newSeasonName.trim());
    if (created) {
      setNewSeasonName('');
      setPlannedSeasons((prev) => [...prev, created]);
    }
  };

  const handleActivateSeason = async (seasonId: string) => {
    const ok = await activateSeason(seasonId);
    if (ok) {
      const season = await getActiveSeason();
      setActiveSeason(season);
      await refreshSeasonData(seasonId);
      const plans = await listPlannedSeasons();
      setPlannedSeasons(plans);
    }
  };

  const handleCompleteSeason = async () => {
    if (!activeSeason) return;
    await completeSeason(activeSeason.id, completeWinner || undefined, completeMvp || undefined);
    setActiveSeason(null);
    setRoster([]);
    setStandings([]);
  };

  const rosterOptions = useMemo(
    () =>
      roster.map((r) => ({
        value: r.id,
        label: `${r.player_name} (${r.team_name ?? 'Free Agent'} - ${r.tier_name} @ ${r.points_per_make} pts)`
      })),
    [roster]
  );

  return (
    <main className="max-w-5xl mx-auto py-10 px-4 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-gray-600">Manage seasons, record shots, and keep standings in sync with the new schema.</p>
      </div>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-xl font-semibold">Active season</h2>
        {activeSeason ? (
          <div className="space-y-2">
            <p className="text-gray-700">{activeSeason.season_name}</p>
            <div className="flex flex-wrap gap-3">
              <select
                className="border rounded px-2 py-1"
                value={shotForm.seasonRosterId}
                onChange={(e) => setShotForm({ ...shotForm, seasonRosterId: e.target.value })}
              >
                {rosterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                className="border rounded px-2 py-1"
                value={shotForm.result}
                onChange={(e) => setShotForm({ ...shotForm, result: e.target.value as 'make' | 'miss' })}
              >
                <option value="make">Make</option>
                <option value="miss">Miss</option>
              </select>
              <input
                className="border rounded px-2 py-1 flex-1"
                placeholder="Note (optional)"
                value={shotForm.note}
                onChange={(e) => setShotForm({ ...shotForm, note: e.target.value })}
              />
              <button className="bg-blue-600 text-white rounded px-3 py-1" onClick={handleRecordShot} disabled={!shotForm.seasonRosterId}>
                Record shot
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <h3 className="font-semibold">Teams</h3>
                <ul className="space-y-1">
                  {standings.map((team) => (
                    <li key={team.season_team_id} className="flex justify-between border rounded px-2 py-1">
                      <span>{team.team_name}</span>
                      <span className="font-mono">{team.team_points} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Recent shots</h3>
                <ul className="space-y-1">
                  {recentShots.map((shot) => (
                    <li key={shot.id} className="flex justify-between items-center border rounded px-2 py-1 text-sm">
                      <span>
                        {shot.player_name} — {shot.result} ({shot.points} pts) {shot.note ? `– ${shot.note}` : ''}
                      </span>
                      {!shot.is_voided && (
                        <button className="text-red-600 underline" onClick={() => handleVoidShot(shot.id)}>
                          Void
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                className="border rounded px-2 py-1"
                value={completeWinner}
                onChange={(e) => setCompleteWinner(e.target.value)}
              >
                {standings.map((team) => (
                  <option key={team.season_team_id} value={team.season_team_id}>
                    {team.team_name}
                  </option>
                ))}
              </select>
              <select
                className="border rounded px-2 py-1"
                value={completeMvp}
                onChange={(e) => setCompleteMvp(e.target.value)}
              >
                {roster.map((player) => (
                  <option key={player.player_id} value={player.player_id}>
                    {player.player_name}
                  </option>
                ))}
              </select>
              <button className="bg-emerald-600 text-white rounded px-3 py-1" onClick={handleCompleteSeason}>
                Complete season
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No active season. Activate one below.</p>
        )}
      </section>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-xl font-semibold">Planned seasons</h2>
        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-2 py-1"
            placeholder="Season name"
            value={newSeasonName}
            onChange={(e) => setNewSeasonName(e.target.value)}
          />
          <button className="bg-gray-900 text-white rounded px-3 py-1" onClick={handleCreateSeason}>
            Create planned season
          </button>
        </div>
        <ul className="space-y-2">
          {plannedSeasons.map((season) => (
            <li key={season.id} className="flex justify-between items-center border rounded px-2 py-1">
              <span>{season.season_name}</span>
              <button className="text-blue-600 underline" onClick={() => handleActivateSeason(season.id)}>
                Activate
              </button>
            </li>
          ))}
          {plannedSeasons.length === 0 && <li className="text-gray-600">No planned seasons</li>}
        </ul>
      </section>
    </main>
  );
}
