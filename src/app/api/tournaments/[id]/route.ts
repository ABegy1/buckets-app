import { NextResponse } from 'next/server';
import { getTournament, updateTournamentSetup, startTournament } from '@/lib/tournamentStore';
import { TournamentSeedData } from '@/lib/bracket';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const tournament = getTournament(params.id);
  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(tournament);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const payload = (await request.json()) as TournamentSeedData & { status?: string };
  const tournament = getTournament(params.id);
  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (payload.status === 'LIVE') {
    const next = startTournament(params.id);
    return NextResponse.json(next);
  }
  const updated = updateTournamentSetup(params.id, payload);
  return NextResponse.json(updated);
}
