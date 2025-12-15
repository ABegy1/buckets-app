'use client';

import { useEffect, useState } from 'react';
import { listSeasonHistory } from '@/lib/bucketsDb';

interface HistoryRow {
  season: any;
  standings: { teams: any[]; players: any[] };
  winner_team_name?: string | null;
  mvp_player_name?: string | null;
}

export default function SeasonHistoryPage() {
  const [history, setHistory] = useState<HistoryRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const rows = await listSeasonHistory();
      setHistory(rows as HistoryRow[]);
    };
    load();
  }, []);

  return (
    <main className="max-w-5xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Completed seasons</h1>
      {history.map((row) => (
        <section key={row.season.id} className="border rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{row.season.season_name}</h2>
              <p className="text-gray-600">Finished at {row.season.end_date ?? 'unknown'}</p>
            </div>
            <div className="text-right text-sm text-gray-700">
              <p>Winner: {row.winner_team_name ?? 'n/a'}</p>
              <p>MVP: {row.mvp_player_name ?? 'n/a'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Teams</h3>
              <ul className="space-y-1">
                {row.standings.teams.map((team) => (
                  <li key={team.season_team_id} className="flex justify-between border rounded px-2 py-1">
                    <span>{team.team_name}</span>
                    <span className="font-mono">{team.team_points} pts</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Players</h3>
              <ul className="space-y-1">
                {row.standings.players.map((player) => (
                  <li key={player.player_id} className="flex justify-between border rounded px-2 py-1">
                    <span>{player.player_name}</span>
                    <span className="font-mono">{player.points} pts</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ))}
      {history.length === 0 && <p className="text-gray-600">No completed seasons recorded.</p>}
    </main>
  );
}
