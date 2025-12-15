'use client';

import { useParams } from 'next/navigation';
import Bracket from '@/components/Bracket';
import useTournament from '@/hooks/useTournament';
import Link from 'next/link';

export default function TournamentViewer() {
  const params = useParams<{ id: string }>();
  const { tournament, error } = useTournament(params.id);

  if (error) return <div className="text-red-400">{error}</div>;
  if (!tournament) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <p className="text-zinc-400 text-sm">Live updates stream to this page automatically.</p>
        </div>
        <Link href={`/tournaments/${params.id}/live`} className="px-3 py-1 bg-blue-600 rounded">
          Organizer scoring
        </Link>
      </div>
      <Bracket tournament={tournament} />
    </div>
  );
}
