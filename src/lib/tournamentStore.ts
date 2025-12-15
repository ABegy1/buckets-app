import { EventEmitter } from 'events';
import {
  Tournament,
  TournamentSeedData,
  buildTournament,
  recalcFromPlayers,
  recordScore,
  randomizeUnseededPlayers,
} from './bracket';

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomUUID } = require('crypto');
  return randomUUID();
};

const tournaments = new Map<string, Tournament>();
const emitters = new Map<string, EventEmitter>();

const getEmitter = (id: string) => {
  if (!emitters.has(id)) {
    emitters.set(id, new EventEmitter());
  }
  return emitters.get(id)!;
};

export const createTournament = (seedData: TournamentSeedData) => {
  const tournament = buildTournament(seedData);
  tournaments.set(tournament.id, tournament);
  getEmitter(tournament.id).emit('update', tournament);
  return tournament;
};

export const listTournaments = () => Array.from(tournaments.values());

export const getTournament = (id: string) => tournaments.get(id) || null;

export const updateTournamentSetup = (id: string, seedData: TournamentSeedData) => {
  const current = tournaments.get(id);
  if (!current) throw new Error('Tournament not found');
  if (current.status !== 'DRAFT') throw new Error('Tournament locked');
  const next = recalcFromPlayers({ ...current, status: 'DRAFT' }, seedData.players.map((p: any) => ({ ...p, id: p.id || makeId() })) as any);
  next.name = seedData.name;
  next.description = seedData.description;
  next.startTime = seedData.startTime;
  next.visibility = seedData.visibility;
  next.updatedAt = new Date().toISOString();
  tournaments.set(id, next);
  getEmitter(id).emit('update', next);
  return next;
};

export const shuffleUnseeded = (id: string) => {
  const current = tournaments.get(id);
  if (!current) throw new Error('Tournament not found');
  if (current.status !== 'DRAFT') throw new Error('Tournament locked');
  const updatedPlayers = randomizeUnseededPlayers(current.players);
  const next = recalcFromPlayers(current, updatedPlayers);
  tournaments.set(id, next);
  getEmitter(id).emit('update', next);
  return next;
};

export const startTournament = (id: string) => {
  const current = tournaments.get(id);
  if (!current) throw new Error('Tournament not found');
  const next: Tournament = { ...current, status: 'LIVE', updatedAt: new Date().toISOString() };
  tournaments.set(id, next);
  getEmitter(id).emit('update', next);
  return next;
};

export const submitScore = (id: string, matchId: string, scoreA: number | null, scoreB: number | null) => {
  const current = tournaments.get(id);
  if (!current) throw new Error('Tournament not found');
  if (current.status !== 'LIVE') throw new Error('Tournament not live');
  const next = recordScore(current, matchId, scoreA, scoreB);
  tournaments.set(id, next);
  getEmitter(id).emit('update', next);
  return next;
};

export const resetScore = (id: string, matchId: string) => submitScore(id, matchId, null, null);

export const subscribe = (id: string, cb: (t: Tournament) => void) => {
  const emitter = getEmitter(id);
  emitter.on('update', cb);
  return () => emitter.off('update', cb);
};

export const seedDemo = () => {
  if (tournaments.size > 0) return;
  const demo = createTournament({
    name: 'Demo Bracket',
    description: 'Example bracket ready to edit',
    visibility: 'public',
    players: Array.from({ length: 8 }).map((_, idx) => ({ name: `Player ${idx + 1}`, seed: idx < 4 ? idx + 1 : undefined })),
  });
  tournaments.set(demo.id, demo);
};
