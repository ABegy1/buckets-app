import { NextResponse } from 'next/server';
import { getTournament, subscribe } from '@/lib/tournamentStore';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const tournament = getTournament(params.id);
  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: any) => {
        controller.enqueue(`data: ${JSON.stringify(payload)}\n\n`);
      };
      send(tournament);
      const unsubscribe = subscribe(params.id, send);
      const interval = setInterval(() => send(getTournament(params.id)), 30000);
      controller.enqueue(': connected\n\n');
      return () => {
        clearInterval(interval);
        unsubscribe();
      };
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
