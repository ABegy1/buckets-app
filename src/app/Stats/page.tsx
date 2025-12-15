'use client';

import { useEffect, useState } from 'react';
import { listAllTimePlayerStats, listAllTimeTierStats, PlayerStat } from '@/lib/bucketsDb';

interface TierStat {
  player_id: string;
  player_name: string;
  tier_definition_id: string;
  tier_name: string;
  points: number;
  shots: number;
  makes: number;
}

export default function StatsPage() {
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [tierStats, setTierStats] = useState<TierStat[]>([]);

  useEffect(() => {
    const load = async () => {
      const [p, t] = await Promise.all([listAllTimePlayerStats(), listAllTimeTierStats()]);
      setPlayers(p);
      setTierStats(t as TierStat[]);
    };
    load();
  }, []);

  return (
    <main className="max-w-5xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-3xl font-bold">All-time stats</h1>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-xl font-semibold">Players</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Player</th>
                <th className="border px-2 py-1">Points</th>
                <th className="border px-2 py-1">Makes</th>
                <th className="border px-2 py-1">Shots</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.player_id}>
                  <td className="border px-2 py-1">{p.player_name}</td>
                  <td className="border px-2 py-1">{p.points}</td>
                  <td className="border px-2 py-1">{p.makes}</td>
                  <td className="border px-2 py-1">{p.shots}</td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td className="border px-2 py-1 text-gray-600" colSpan={4}>
                    No stats yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-xl font-semibold">By tier</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Tier</th>
                <th className="border px-2 py-1">Player</th>
                <th className="border px-2 py-1">Points</th>
                <th className="border px-2 py-1">Makes</th>
                <th className="border px-2 py-1">Shots</th>
              </tr>
            </thead>
            <tbody>
              {tierStats.map((row) => (
                <tr key={`${row.player_id}-${row.tier_definition_id}`}>
                  <td className="border px-2 py-1">{row.tier_name}</td>
                  <td className="border px-2 py-1">{row.player_name}</td>
                  <td className="border px-2 py-1">{row.points}</td>
                  <td className="border px-2 py-1">{row.makes}</td>
                  <td className="border px-2 py-1">{row.shots}</td>
                </tr>
              ))}
              {tierStats.length === 0 && (
                <tr>
                  <td className="border px-2 py-1 text-gray-600" colSpan={5}>
                    No tier stats yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
