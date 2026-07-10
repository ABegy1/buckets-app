'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Bracket from '@/components/Bracket';
import PlayerEditor from '@/components/PlayerEditor';
import { TournamentSeedData, buildTournament, randomizeUnseededPlayers } from '@/lib/bracket';

export default function NewTournamentPage() {
  const router = useRouter();
  const [name, setName] = useState('My Tournament');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [players, setPlayers] = useState(
    Array.from({ length: 4 }).map((_, idx) => ({ id: crypto.randomUUID(), name: `Player ${idx + 1}`, seed: idx < 2 ? idx + 1 : null })),
  );
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(
    () =>
      buildTournament({
        name,
        description,
        visibility,
        players: players.map((p) => ({ name: p.name, seed: p.seed ?? undefined, team: p.team, notes: p.notes })),
      }),
    [name, description, visibility, players],
  );

  const handleRandomize = () => {
    setPlayers(randomizeUnseededPlayers(players));
  };

  const handleSubmit = async () => {
    const payload: TournamentSeedData = {
      name,
      description,
      visibility,
      players: players.map((p) => ({ name: p.name, seed: p.seed ?? undefined, team: p.team, notes: p.notes })),
    };
    try {
      const res = await fetch('/api/tournaments', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Unable to create tournament');
      }
      const data = await res.json();
      router.push(`/tournaments/${data.id}/setup`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create a tournament</h1>
          <p className="text-zinc-400 text-sm">Set up your players and preview the bracket instantly.</p>
        </div>
        <button className="px-4 py-2 bg-green-600 rounded text-white" onClick={handleSubmit}>
          Save & Continue
        </button>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-3">
          <input
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2"
            placeholder="Tournament name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label className="text-sm text-zinc-300">Visibility</label>
          <select
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
          >
            <option value="public">Public link</option>
            <option value="private">Private</option>
          </select>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-blue-600 rounded text-white" onClick={handleRandomize}>
              Randomize unseeded
            </button>
            <button className="px-3 py-1 border border-zinc-600 rounded text-white" onClick={() => setPlayers(players.map((p) => ({ ...p, seed: p.seed })))}>
              Keep seeds
            </button>
          </div>
          <PlayerEditor players={players} onChange={setPlayers} />
        </div>
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Live bracket preview</h2>
            <div className="text-sm text-zinc-400">Bracket size adapts to {preview.players.length} players.</div>
          </div>
          <Bracket tournament={preview} />
        </div>
      </div>
    </div>
  );
}
