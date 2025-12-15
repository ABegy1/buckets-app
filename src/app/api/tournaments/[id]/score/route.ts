import { NextResponse } from 'next/server';
import { submitScore } from '@/lib/tournamentStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { matchId, scoreA, scoreB } = await request.json();
  try {
    const tournament = submitScore(params.id, matchId, scoreA ?? null, scoreB ?? null);
    return NextResponse.json(tournament);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unable to submit' }, { status: 400 });
  }
}
