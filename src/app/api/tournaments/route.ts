import { NextResponse } from 'next/server';
import { createTournament, listTournaments, seedDemo } from '@/lib/tournamentStore';
import { TournamentSeedData } from '@/lib/bracket';

export const dynamic = 'force-dynamic';

seedDemo();

export async function GET() {
  return NextResponse.json(listTournaments());
}

export async function POST(request: Request) {
  const payload = (await request.json()) as TournamentSeedData;
  if (!payload.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!payload.players || payload.players.length < 2) {
    return NextResponse.json({ error: 'At least two players required' }, { status: 400 });
  }
  const tournament = createTournament(payload);
  return NextResponse.json(tournament, { status: 201 });
}
