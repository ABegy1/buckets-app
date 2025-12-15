'use client';

import { useEffect, useState } from 'react';
import { subscribeShotEvents, getActiveSeason, getStandings, TeamStanding, PlayerStat } from '@/lib/bucketsDb';

export default function StandingsPage() {
  const [seasonName, setSeasonName] = useState<string>('Loading...');
  const [teams, setTeams] = useState<TeamStanding[]>([]);
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [seasonId, setSeasonId] = useState<string | null>(null);

  const loadStandings = async (id: string) => {
    const results = await getStandings(id);
    setTeams(results.teams);
    setPlayers(results.players);
  };

  useEffect(() => {
    const load = async () => {
      const season = await getActiveSeason();
      if (season) {
        setSeasonName(season.season_name);
        setSeasonId(season.id);
        await loadStandings(season.id);
      } else {
        setSeasonName('No active season');
        setSeasonId(null);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!seasonId) return;
    const channel = subscribeShotEvents(seasonId, () => loadStandings(seasonId));
    return () => channel?.unsubscribe?.();
  }, [seasonId]);

  return (
    <main className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Standings</h1>
        <p className="text-gray-600">{seasonName}</p>
      </div>

      {!seasonId && <p className="text-gray-600">Activate a season to view standings.</p>}

      {seasonId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="border rounded-lg p-4 space-y-2">
            <h2 className="text-xl font-semibold">Teams</h2>
            <ul className="space-y-1">
              {teams.map((team) => (
                <li key={team.season_team_id} className="flex justify-between border rounded px-2 py-1">
                  <span>{team.team_name}</span>
                  <span className="font-mono">{team.team_points} pts</span>
                </li>
              ))}
              {teams.length === 0 && <li className="text-gray-600">No teams configured.</li>}
            </ul>
          </section>

          <section className="border rounded-lg p-4 space-y-2">
            <h2 className="text-xl font-semibold">Players</h2>
            <ul className="space-y-1">
              {players.map((player) => (
                <li key={player.player_id} className="flex justify-between border rounded px-2 py-1">
                  <span>{player.player_name}</span>
                  <span className="font-mono">{player.points} pts · {player.makes}/{player.shots}</span>
                </li>
              ))}
              {players.length === 0 && <li className="text-gray-600">No player stats yet.</li>}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}
