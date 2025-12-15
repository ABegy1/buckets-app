import { NextResponse } from 'next/server';
import { shuffleUnseeded } from '@/lib/tournamentStore';

export const dynamic = 'force-dynamic';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const tournament = shuffleUnseeded(params.id);
    return NextResponse.json(tournament);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unable to randomize' }, { status: 400 });
  }
}
