'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { getActiveSeason } from '@/lib/bucketsDb';

export default function HomePage() {
  const [activeSeasonName, setActiveSeasonName] = useState<string>('Loading...');

  useEffect(() => {
    const load = async () => {
      const season = await getActiveSeason();
      setActiveSeasonName(season ? season.season_name : 'No active season');
    };
    load();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main className="max-w-3xl mx-auto py-16 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Buckets control center</h1>
      <p className="text-gray-600">Active season: {activeSeasonName}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link className="rounded-lg border p-4 hover:border-blue-500" href="/Standings">
          <h2 className="font-semibold">Standings</h2>
          <p className="text-sm text-gray-600">Live view backed by the new v2 schema.</p>
        </Link>
        <Link className="rounded-lg border p-4 hover:border-blue-500" href="/Admin">
          <h2 className="font-semibold">Admin</h2>
          <p className="text-sm text-gray-600">Record shots, manage seasons, and void mistakes.</p>
        </Link>
        <Link className="rounded-lg border p-4 hover:border-blue-500" href="/Stats">
          <h2 className="font-semibold">All-time stats</h2>
          <p className="text-sm text-gray-600">Tier and cross-season leaderboards.</p>
        </Link>
        <Link className="rounded-lg border p-4 hover:border-blue-500" href="/FreeAgency">
          <h2 className="font-semibold">Season history</h2>
          <p className="text-sm text-gray-600">Completed seasons, winners, and MVPs.</p>
        </Link>
        <Link className="rounded-lg border p-4 hover:border-blue-500" href="/Rules">
          <h2 className="font-semibold">Rules</h2>
          <p className="text-sm text-gray-600">Per-tier scoring for the active season.</p>
        </Link>
      </div>
      <button onClick={handleSignOut} className="text-sm text-blue-600 underline">
        Sign out
      </button>
    </main>
  );
}
