'use client';

import { useParams, useRouter } from 'next/navigation';
import useTournament from '@/hooks/useTournament';
import Bracket from '@/components/Bracket';

export default function SetupPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { tournament, error } = useTournament(params.id);

  const handleRandomize = async () => {
    await fetch(`/api/tournaments/${params.id}/randomize`, { method: 'POST' });
  };

  const handleStart = async () => {
    await fetch(`/api/tournaments/${params.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'LIVE' }) });
    router.push(`/tournaments/${params.id}/live`);
  };

  if (error) return <div className="text-red-400">{error}</div>;
  if (!tournament) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <p className="text-zinc-400 text-sm">Seed players, randomize unseeded, and preview the bracket.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-blue-600 rounded" onClick={handleRandomize} disabled={tournament.status !== 'DRAFT'}>
            Randomize Unseeded
          </button>
          <button className="px-3 py-1 bg-green-600 rounded" onClick={handleStart} disabled={tournament.status !== 'DRAFT'}>
            Start Tournament
          </button>
        </div>
      </div>
      <div className="text-sm text-zinc-400">Status: {tournament.status}</div>
      <Bracket tournament={tournament} />
    </div>
  );
}
