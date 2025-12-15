'use client';

import { useEffect, useState } from 'react';
import { getActiveSeason, getSeasonRules, SeasonRulesRow } from '@/lib/bucketsDb';

export default function RulesPage() {
  const [seasonName, setSeasonName] = useState('Loading...');
  const [rules, setRules] = useState<SeasonRulesRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const season = await getActiveSeason();
      if (!season) {
        setSeasonName('No active season');
        setRules([]);
        return;
      }
      setSeasonName(season.season_name);
      const seasonRules = await getSeasonRules(season.id);
      setRules(seasonRules);
    };
    load();
  }, []);

  return (
    <main className="max-w-3xl mx-auto py-10 px-4 space-y-4">
      <h1 className="text-3xl font-bold">Rules</h1>
      <p className="text-gray-600">{seasonName}</p>
      <div className="border rounded-lg p-4 space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="flex justify-between items-center border rounded px-3 py-2">
            <div>
              <p className="font-semibold">{rule.tier_name}</p>
              <p className="text-sm text-gray-600">Tier ID: {rule.tier_definition_id}</p>
            </div>
            <span className="font-mono">{rule.points_per_make} pts/make</span>
          </div>
        ))}
        {rules.length === 0 && <p className="text-gray-600">No rules defined for the active season.</p>}
      </div>
    </main>
  );
}
