'use client';

import { useParams } from 'next/navigation';
import Bracket from '@/components/Bracket';
import useTournament from '@/hooks/useTournament';
import { useState } from 'react';

export default function LivePage() {
  const params = useParams<{ id: string }>();
  const { tournament, error } = useTournament(params.id);
  const [message, setMessage] = useState<string | null>(null);

  const handleScoreChange = async (matchId: string, scoreA: number | null, scoreB: number | null) => {
    setMessage(null);
    const res = await fetch(`/api/tournaments/${params.id}/score`, {
      method: 'POST',
      body: JSON.stringify({ matchId, scoreA, scoreB }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || 'Unable to submit score');
    }
  };

  if (error) return <div className="text-red-400">{error}</div>;
  if (!tournament) return <div>Loading...</div>;

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Live scoring - {tournament.name}</h1>
      <div className="text-sm text-zinc-400">Enter scores to advance winners automatically. Ties are not allowed.</div>
      {message && <div className="text-red-400 text-sm">{message}</div>}
      <Bracket tournament={tournament} editable onScoreChange={handleScoreChange} />
    </div>
  );
}
