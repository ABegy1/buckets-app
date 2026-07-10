'use client';

import React from 'react';
import { Player } from '@/lib/bracket';

interface PlayerEditorProps {
  players: Player[];
  onChange: (players: Player[]) => void;
}

const PlayerEditor: React.FC<PlayerEditorProps> = ({ players, onChange }) => {
  const updatePlayer = (id: string, field: keyof Player, value: any) => {
    onChange(players.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const addPlayer = () => {
    onChange([
      ...players,
      {
        id: crypto.randomUUID(),
        name: `Player ${players.length + 1}`,
      },
    ]);
  };

  const removePlayer = (id: string) => {
    onChange(players.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-2">
      {players.map((player, idx) => (
        <div key={player.id} className="grid grid-cols-5 gap-2 items-center">
          <input
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 col-span-2"
            value={player.name}
            onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
            placeholder="Name"
          />
          <input
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
            value={player.team ?? ''}
            onChange={(e) => updatePlayer(player.id, 'team', e.target.value)}
            placeholder="Team"
          />
          <input
            type="number"
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
            value={player.seed ?? ''}
            min={1}
            onChange={(e) => updatePlayer(player.id, 'seed', e.target.value === '' ? null : Number(e.target.value))}
            placeholder="Seed"
          />
          <div className="flex justify-end">
            <button className="text-red-400 text-sm" onClick={() => removePlayer(player.id)}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <button className="px-3 py-1 bg-blue-600 rounded text-white" onClick={addPlayer}>
        Add player
      </button>
    </div>
  );
};

export default PlayerEditor;
