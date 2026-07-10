const getUUID = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomUUID } = require('crypto');
  return randomUUID();
};

export type TournamentStatus = 'DRAFT' | 'LIVE' | 'COMPLETED';

export interface Player {
  id: string;
  name: string;
  seed?: number | null;
  team?: string;
  notes?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  startTime?: string;
  visibility?: 'public' | 'private';
  status: TournamentStatus;
  players: Player[];
  matches: Match[];
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  roundNumber: number;
  matchNumber: number;
  slotAPlayerId: string | null;
  slotBPlayerId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winnerPlayerId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: 'A' | 'B' | null;
}

export interface TournamentSeedData {
  name: string;
  description?: string;
  startTime?: string;
  visibility?: 'public' | 'private';
  players: Omit<Player, 'id'>[];
}

export const nextPowerOfTwo = (count: number) => {
  if (count < 2) return 2;
  return 2 ** Math.ceil(Math.log2(count));
};

export const generateSeedingOrder = (size: number): number[] => {
  let order = [1, 2];
  while (order.length < size) {
    const next: number[] = [];
    const currentSize = order.length * 2 + 1;
    for (const seed of order) {
      next.push(seed);
      next.push(currentSize - seed);
    }
    order = next;
  }
  return order.slice(0, size);
};

const shuffle = <T,>(arr: T[]) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const placePlayersIntoSlots = (players: Player[], bracketSize: number) => {
  const seedingOrder = generateSeedingOrder(bracketSize);
  const slots: (Player | null)[] = Array(bracketSize).fill(null);
  const seededPlayers = players.filter((p) => p.seed && p.seed > 0);
  const unseededPlayers = players.filter((p) => !p.seed || p.seed <= 0);

  for (const player of seededPlayers) {
    const positionIndex = seedingOrder.findIndex((seed) => seed === player.seed);
    if (positionIndex >= 0) {
      slots[positionIndex] = player;
    }
  }

  const remainingSlots = slots.map((slot, idx) => (slot ? -1 : idx)).filter((v) => v >= 0);
  const randomized = shuffle(unseededPlayers);
  remainingSlots.forEach((slotIndex, idx) => {
    slots[slotIndex] = randomized[idx] ?? null;
  });

  return slots;
};

export const generateMatches = (tournamentId: string, bracketSize: number): Match[] => {
  const rounds = Math.log2(bracketSize);
  const matches: Match[] = [];
  for (let round = 1; round <= rounds; round += 1) {
    const matchesInRound = bracketSize / 2 ** round;
    for (let m = 0; m < matchesInRound; m += 1) {
      matches.push({
        id: getUUID(),
        tournamentId,
        roundNumber: round,
        matchNumber: m,
        slotAPlayerId: null,
        slotBPlayerId: null,
        scoreA: null,
        scoreB: null,
        winnerPlayerId: null,
        nextMatchId: null,
        nextMatchSlot: null,
      });
    }
  }

  const matchesByRound = matches.reduce<Record<number, Match[]>>((acc, match) => {
    acc[match.roundNumber] = acc[match.roundNumber] || [];
    acc[match.roundNumber].push(match);
    return acc;
  }, {});

  for (let round = 1; round < rounds; round += 1) {
    const current = matchesByRound[round];
    const next = matchesByRound[round + 1];
    current.forEach((match, idx) => {
      const target = next[Math.floor(idx / 2)];
      match.nextMatchId = target.id;
      match.nextMatchSlot = idx % 2 === 0 ? 'A' : 'B';
    });
  }

  return matches;
};

const pushWinner = (
  matches: Map<string, Match>,
  match: Match,
  winnerId: string | null,
) => {
  if (!match.nextMatchId || !match.nextMatchSlot) return;
  const nextMatch = matches.get(match.nextMatchId);
  if (!nextMatch) return;

  if (match.nextMatchSlot === 'A') {
    nextMatch.slotAPlayerId = winnerId;
  } else {
    nextMatch.slotBPlayerId = winnerId;
  }

  if (!winnerId) {
    nextMatch.scoreA = match.nextMatchSlot === 'A' ? null : nextMatch.scoreA;
    nextMatch.scoreB = match.nextMatchSlot === 'B' ? null : nextMatch.scoreB;
    nextMatch.winnerPlayerId = null;
    pushWinner(matches, nextMatch, null);
  }
};

export const buildTournament = (seedData: TournamentSeedData): Tournament => {
  const bracketSize = nextPowerOfTwo(seedData.players.length || 2);
  const tournamentId = getUUID();
  const players: Player[] = seedData.players.map((p) => ({ ...p, id: getUUID() }));
  const slots = placePlayersIntoSlots(players, bracketSize);
  const matches = generateMatches(tournamentId, bracketSize);
  const matchMap = new Map(matches.map((m) => [m.id, m]));

  matches
    .filter((m) => m.roundNumber === 1)
    .forEach((match, idx) => {
      const playerA = slots[idx * 2] ?? null;
      const playerB = slots[idx * 2 + 1] ?? null;
      match.slotAPlayerId = playerA ? playerA.id : null;
      match.slotBPlayerId = playerB ? playerB.id : null;

      if (playerA && !playerB) {
        match.winnerPlayerId = playerA.id;
        pushWinner(matchMap, match, playerA.id);
      } else if (!playerA && playerB) {
        match.winnerPlayerId = playerB.id;
        pushWinner(matchMap, match, playerB.id);
      }
    });

  const now = new Date().toISOString();
  return {
    id: tournamentId,
    name: seedData.name,
    description: seedData.description,
    startTime: seedData.startTime,
    visibility: seedData.visibility ?? 'public',
    status: 'DRAFT',
    players,
    matches,
    createdAt: now,
    updatedAt: now,
  };
};

export const recalcFromPlayers = (tournament: Tournament, players: Player[]) => {
  const updated = buildTournament({
    name: tournament.name,
    description: tournament.description,
    startTime: tournament.startTime,
    visibility: tournament.visibility,
    players,
  });
  return { ...updated, id: tournament.id, createdAt: tournament.createdAt, status: tournament.status };
};

export const recordScore = (
  tournament: Tournament,
  matchId: string,
  scoreA: number | null,
  scoreB: number | null,
): Tournament => {
  const matchMap = new Map(tournament.matches.map((m) => [m.id, { ...m }]));
  const match = matchMap.get(matchId);
  if (!match) throw new Error('Match not found');

  match.scoreA = scoreA;
  match.scoreB = scoreB;
  match.winnerPlayerId = null;

  if (scoreA === null || scoreB === null) {
    pushWinner(matchMap, match, null);
    return { ...tournament, matches: Array.from(matchMap.values()) };
  }

  if (scoreA === scoreB) {
    throw new Error('Tie scores not supported');
  }

  const winnerId = scoreA > scoreB ? match.slotAPlayerId : match.slotBPlayerId;
  match.winnerPlayerId = winnerId ?? null;
  pushWinner(matchMap, match, winnerId ?? null);
  return { ...tournament, matches: Array.from(matchMap.values()) };
};

export const randomizeUnseededPlayers = (players: Player[]) => {
  const seeded = players.filter((p) => p.seed && p.seed > 0);
  const unseeded = players.filter((p) => !p.seed || p.seed <= 0);
  return [...seeded, ...shuffle(unseeded)];
};

export const regenerateSeeds = (players: Player[]) => {
  const seeded = players.filter((p) => p.seed && p.seed > 0);
  const unseeded = players.filter((p) => !p.seed || p.seed <= 0);
  return [...seeded, ...shuffle(unseeded)];
};

export const removePlayerProgression = (matches: Map<string, Match>, playerId: string | null) => {
  if (!playerId) return;
  matches.forEach((m) => {
    if (m.slotAPlayerId === playerId) m.slotAPlayerId = null;
    if (m.slotBPlayerId === playerId) m.slotBPlayerId = null;
    if (m.winnerPlayerId === playerId) m.winnerPlayerId = null;
  });
};
