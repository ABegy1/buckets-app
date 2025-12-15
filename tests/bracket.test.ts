import assert from 'assert';
const { buildTournament, recordScore, nextPowerOfTwo } = require('../src/lib/bracket');

type SimplePlayer = { name: string; seed?: number };

const makeTournament = (players: SimplePlayer[]) =>
  buildTournament({ name: 'Test', players: players.map((p) => ({ ...p })) });

// Test bracket sizing
const size10 = nextPowerOfTwo(10);
assert.strictEqual(size10, 16, 'Next power of two should be 16');

// Test seeding placement keeps top seed apart
const tourney = makeTournament([
  { name: 'Seed1', seed: 1 },
  { name: 'Seed2', seed: 2 },
  { name: 'Seed3', seed: 3 },
  { name: 'Seed4', seed: 4 },
]);
const roundOneMatches = tourney.matches.filter((m: any) => m.roundNumber === 1);
const matchWithSeed1 = roundOneMatches.find(
  (m: any) => m.slotAPlayerId === tourney.players[0].id || m.slotBPlayerId === tourney.players[0].id,
);
const matchWithSeed2 = roundOneMatches.find(
  (m: any) => m.slotAPlayerId === tourney.players[1].id || m.slotBPlayerId === tourney.players[1].id,
);
assert.ok(matchWithSeed1 && matchWithSeed2 && matchWithSeed1.id !== matchWithSeed2.id, 'Top seeds should not meet in round one');

// Test BYE auto-advance
const uneven = makeTournament([
  { name: 'Alpha', seed: 1 },
  { name: 'Beta', seed: 2 },
  { name: 'Gamma', seed: 3 },
]);
const byeMatch = uneven.matches.find((m: any) => m.roundNumber === 1 && (!m.slotAPlayerId || !m.slotBPlayerId));
assert.ok(byeMatch?.winnerPlayerId, 'BYE should auto-advance player');

// Test score advancement and rollback
const playable = makeTournament([
  { name: 'A' },
  { name: 'B' },
  { name: 'C' },
  { name: 'D' },
]);
const firstMatch = playable.matches.find((m: any) => m.roundNumber === 1 && m.matchNumber === 0)!;
const afterScore = recordScore(playable, firstMatch.id, 3, 1);
const propagated = afterScore.matches.find((m: any) => m.id === firstMatch.nextMatchId)!;
assert.strictEqual(
  propagated.slotAPlayerId || propagated.slotBPlayerId,
  afterScore.players.find((p: any) => p.id === firstMatch.slotAPlayerId)?.id,
);
const rollback = recordScore(afterScore, firstMatch.id, null, null);
const cleaned = rollback.matches.find((m: any) => m.id === firstMatch.nextMatchId)!;
assert.ok(!cleaned.slotAPlayerId || !cleaned.slotBPlayerId, 'Rollback should clear progression');

console.log('All bracket logic tests passed');
