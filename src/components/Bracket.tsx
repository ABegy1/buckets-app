'use client';

import React, { useMemo } from 'react';
import { Match, Player, Tournament } from '@/lib/bracket';

interface BracketProps {
  tournament: Tournament;
  editable?: boolean;
  onScoreChange?: (matchId: string, scoreA: number | null, scoreB: number | null) => void;
}

const playerLabel = (playerId: string | null, players: Player[]) => {
  if (!playerId) return 'BYE';
  const player = players.find((p) => p.id === playerId);
  if (!player) return 'BYE';
  const seed = player.seed ? `#${player.seed} ` : '';
  return `${seed}${player.name}`;
};

const MatchCard: React.FC<{
  match: Match;
  players: Player[];
  editable?: boolean;
  onScoreChange?: (matchId: string, scoreA: number | null, scoreB: number | null) => void;
}> = ({ match, players, editable, onScoreChange }) => {
  const winner = match.winnerPlayerId;
  const handleChange = (field: 'A' | 'B', value: string) => {
    if (!onScoreChange) return;
    const parsed = value === '' ? null : Number(value);
    if (Number.isNaN(parsed)) return;
    const scoreA = field === 'A' ? parsed : match.scoreA;
    const scoreB = field === 'B' ? parsed : match.scoreB;
    onScoreChange(match.id, scoreA, scoreB);
  };

  return (
    <div className="border border-zinc-700 bg-zinc-900 rounded p-3 mb-3 text-sm w-60">
      <div className={`flex justify-between items-center ${winner === match.slotAPlayerId ? 'text-green-400' : ''}`}>
        <span>{playerLabel(match.slotAPlayerId, players)}</span>
        {editable ? (
          <input
            type="number"
            className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1"
            value={match.scoreA ?? ''}
            onChange={(e) => handleChange('A', e.target.value)}
          />
        ) : (
          <span>{match.scoreA ?? '-'}</span>
        )}
      </div>
      <div className={`flex justify-between items-center ${winner === match.slotBPlayerId ? 'text-green-400' : ''}`}>
        <span>{playerLabel(match.slotBPlayerId, players)}</span>
        {editable ? (
          <input
            type="number"
            className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1"
            value={match.scoreB ?? ''}
            onChange={(e) => handleChange('B', e.target.value)}
          />
        ) : (
          <span>{match.scoreB ?? '-'}</span>
        )}
      </div>
    </div>
  );
};

export const Bracket: React.FC<BracketProps> = ({ tournament, editable, onScoreChange }) => {
  const rounds = useMemo(() => {
    const grouped = tournament.matches.reduce<Record<number, Match[]>>((acc, match) => {
      acc[match.roundNumber] = acc[match.roundNumber] || [];
      acc[match.roundNumber].push(match);
      return acc;
    }, {});
    return Object.keys(grouped)
      .map((key) => Number(key))
      .sort((a, b) => a - b)
      .map((round) => grouped[round].sort((a, b) => a.matchNumber - b.matchNumber));
  }, [tournament.matches]);

  return (
    <div className="overflow-auto">
      <div className="flex gap-4">
        {rounds.map((matches, idx) => (
          <div key={idx} className="min-w-[260px]">
            <div className="text-xs text-zinc-400 mb-2">Round {idx + 1}</div>
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} players={tournament.players} editable={editable} onScoreChange={onScoreChange} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Bracket;
