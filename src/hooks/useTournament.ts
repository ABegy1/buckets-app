'use client';

import { useEffect, useState } from 'react';
import { Tournament } from '@/lib/bracket';

export const useTournament = (id: string) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/tournaments/${id}`);
        if (!res.ok) throw new Error('Unable to load');
        const data = await res.json();
        setTournament(data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    load();
    const eventSource = new EventSource(`/api/tournaments/${id}/events`);
    eventSource.onmessage = (evt) => {
      if (!evt.data) return;
      try {
        const parsed = JSON.parse(evt.data);
        setTournament(parsed);
      } catch (err: any) {
        setError(err.message);
      }
    };
    eventSource.onerror = () => setError('Connection lost');
    return () => eventSource.close();
  }, [id]);

  return { tournament, error };
};

export default useTournament;
