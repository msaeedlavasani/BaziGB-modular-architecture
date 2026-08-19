/**
 * Tournament API client + demo data.
 *
 * Server endpoints (NestJS on port 3001):
 *   GET  /tournaments                  -> list tournaments (with _count)
 *   GET  /tournaments/:id              -> full detail (players + matches)
 *   POST /tournaments/:id/register     -> seat players { playerIds: string[] }
 *
 * Server shapes differ from what the UI wants (statuses include `seeded`,
 * rounds are 1-based, players are user ids, no prize/date fields), so every
 * fetch goes through a normalizer. When the server is unreachable the
 * fallback demo data is used instead, keeping the pages renderable.
 */

import { api, ApiError } from './api';

export type TournamentStatus = 'registration' | 'in_progress' | 'completed';
export type MatchStatus = 'pending' | 'in_progress' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  gameType: string; // 'tic-tac-toe' | 'chess'
  status: TournamentStatus;
  /** ISO date-time the tournament starts. */
  startsAt: string;
  prize: string;
  maxPlayers: number;
  playersJoined: number;
  description: string;
}

export interface BracketMatch {
  id: string;
  /** Round index, 0 = first round. */
  round: number;
  /** Position within the round (0-based). */
  slot: number;
  /** Display name of player A, or null when the seat is empty. */
  playerA: string | null;
  playerB: string | null;
  /** Display name of the winner, null when undecided. */
  winnerId: string | null;
  status: MatchStatus;
  /** Short score string, e.g. "2–1". */
  score?: string;
}

export interface TournamentDetail extends Tournament {
  /** Number of rounds in the bracket (0 when not generated yet). */
  rounds: number;
  matches: BracketMatch[];
}

export interface JoinResult {
  joined: boolean;
  /** True when the server API is missing and we only faked the join. */
  demo: boolean;
  message: string;
}

/* ------------------------- server response types ------------------------- */

interface ServerTournament {
  id: string;
  name: string;
  gameType: string;
  /** registration | seeded | in_progress | completed */
  status: string;
  maxPlayers: number;
  bracket: string | null;
  winnerId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { players: number; matches: number };
}

interface ServerTournamentDetail extends ServerTournament {
  players: Array<{
    seed: number;
    userId: string;
    user: { id: string; username: string; rating: number };
  }>;
  matches: Array<{
    id: string;
    /** 1-based round. */
    round: number;
    /** 0-based position inside the round. */
    bracketIndex: number;
    playerAId: string | null;
    playerBId: string | null;
    winnerId: string | null;
    nextMatchId: string | null;
    status: string; // pending | in_progress | completed
    playedAt: string | null;
  }>;
}

/* ------------------------------ normalizers ------------------------------ */

function normalizeStatus(status: string): TournamentStatus {
  // `seeded` = registration closed and the bracket is built -> effectively live.
  if (status === 'in_progress' || status === 'seeded') return 'in_progress';
  if (status === 'completed') return 'completed';
  return 'registration';
}

function normalizeList(t: ServerTournament): Tournament {
  return {
    id: t.id,
    name: t.name,
    gameType: t.gameType || 'tic-tac-toe',
    status: normalizeStatus(t.status),
    startsAt: t.createdAt,
    prize: '',
    maxPlayers: t.maxPlayers,
    playersJoined: t._count.players,
    description: '',
  };
}

function normalizeDetail(t: ServerTournamentDetail): TournamentDetail {
  const nameById = new Map(
    t.players.map((p) => [p.userId, p.user.username] as const),
  );
  const nameOf = (userId: string | null): string | null => {
    if (!userId) return null;
    return nameById.get(userId) ?? userId;
  };

  const maxRound = t.matches.reduce((max, m) => Math.max(max, m.round), 0);
  const matches: BracketMatch[] = t.matches.map((m) => ({
    id: m.id,
    round: m.round - 1,
    slot: m.bracketIndex,
    playerA: nameOf(m.playerAId),
    playerB: nameOf(m.playerBId),
    winnerId: nameOf(m.winnerId),
    status: m.status as MatchStatus,
  }));

  return {
    ...normalizeList(t),
    rounds: maxRound, // 0 when the bracket has not been seeded yet
    matches,
  };
}

/* --------------------------------- API ----------------------------------- */

/** List tournaments, newest first. */
export async function fetchTournaments(): Promise<Tournament[]> {
  try {
    const data = await api.get<ServerTournament[]>('/tournaments');
    return data.map(normalizeList);
  } catch {
    return DEMO_TOURNAMENTS;
  }
}

/** Fetch a single tournament with its full bracket; null when not found. */
export async function fetchTournament(id: string): Promise<TournamentDetail | null> {
  try {
    const data = await api.get<ServerTournamentDetail>(
      `/tournaments/${encodeURIComponent(id)}`,
    );
    return normalizeDetail(data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    return demoDetail(id);
  }
}

/** Seat the current user into a tournament (registration phase only). */
export async function joinTournament(
  id: string,
  userId?: string,
): Promise<JoinResult> {
  try {
    await api.post(`/tournaments/${encodeURIComponent(id)}/register`, {
      playerIds: userId ? [userId] : [],
    });
    return { joined: true, demo: false, message: 'You are in!' };
  } catch (err) {
    // Server unreachable / endpoint missing -> demo confirmation.
    if (err instanceof ApiError && err.status === 0) {
      return {
        joined: true,
        demo: true,
        message: 'Joined (demo mode — connect the server API to go live)',
      };
    }
    throw err;
  }
}

/* ------------------------------ demo data -------------------------------- */

const DEMO_TOURNAMENTS: Tournament[] = [
  {
    id: 'midnight-chess-open',
    name: 'Midnight Chess Open',
    gameType: 'chess',
    status: 'in_progress',
    startsAt: '2026-08-07T22:00:00',
    prize: '$50 + Trophy',
    maxPlayers: 8,
    playersJoined: 8,
    description:
      '8-player single elimination. Fast controls, one winner takes the pot.',
  },
  {
    id: 'ttt-blitz-4',
    name: 'Tic-Tac-Toe Blitz #4',
    gameType: 'tic-tac-toe',
    status: 'registration',
    startsAt: '2026-08-09T18:00:00',
    prize: '$25',
    maxPlayers: 32,
    playersJoined: 21,
    description:
      'Lightning rounds of Tic-Tac-Toe. Brackets lock the moment 32 players are in.',
  },
  {
    id: 'grandmaster-invitational',
    name: 'Grandmaster Invitational',
    gameType: 'chess',
    status: 'registration',
    startsAt: '2026-08-14T20:00:00',
    prize: '$100',
    maxPlayers: 16,
    playersJoined: 6,
    description:
      'The big one. Sixteen of the sharpest minds, one champion. Entry closes Aug 13.',
  },
  {
    id: 'casual-saturday',
    name: 'Casual Saturday Showdown',
    gameType: 'tic-tac-toe',
    status: 'completed',
    startsAt: '2026-08-01T16:00:00',
    prize: 'Bragging rights',
    maxPlayers: 4,
    playersJoined: 4,
    description: 'A relaxed weekend knockout — Xero takes the crown.',
  },
];

function demoDetail(id: string): TournamentDetail | null {
  const base = DEMO_TOURNAMENTS.find((t) => t.id === id);
  if (!base) return null;

  if (id === 'midnight-chess-open') {
    return {
      ...base,
      rounds: 3,
      matches: [
        // Quarterfinals
        { id: 'm1', round: 0, slot: 0, playerA: 'NovaKing', playerB: 'PixelWolf', winnerId: 'NovaKing', status: 'completed', score: '1–0' },
        { id: 'm2', round: 0, slot: 1, playerA: 'RookWarden', playerB: 'MidKnight', winnerId: 'MidKnight', status: 'completed', score: '0–1' },
        { id: 'm3', round: 0, slot: 2, playerA: 'BlitzQueen', playerB: 'DarkBishop', winnerId: 'DarkBishop', status: 'completed', score: '1–0' },
        { id: 'm4', round: 0, slot: 3, playerA: 'Tempest', playerB: 'CheckMate', winnerId: 'Tempest', status: 'completed', score: '1–0' },
        // Semifinals
        { id: 'm5', round: 1, slot: 0, playerA: 'NovaKing', playerB: 'MidKnight', winnerId: null, status: 'in_progress', score: '1–1' },
        { id: 'm6', round: 1, slot: 1, playerA: 'DarkBishop', playerB: 'Tempest', winnerId: 'DarkBishop', status: 'completed', score: '2–1' },
        // Final
        { id: 'm7', round: 2, slot: 0, playerA: null, playerB: 'DarkBishop', winnerId: null, status: 'pending' },
      ],
    };
  }

  if (id === 'casual-saturday') {
    return {
      ...base,
      rounds: 2,
      matches: [
        { id: 'm1', round: 0, slot: 0, playerA: 'Xero', playerB: 'Mistral', winnerId: 'Xero', status: 'completed', score: '2–0' },
        { id: 'm2', round: 0, slot: 1, playerA: 'Nyx', playerB: 'Volt', winnerId: 'Volt', status: 'completed', score: '1–2' },
        { id: 'm3', round: 1, slot: 0, playerA: 'Xero', playerB: 'Volt', winnerId: 'Xero', status: 'completed', score: '2–1' },
      ],
    };
  }

  // Registration-phase tournaments: bracket not generated yet.
  return { ...base, rounds: 0, matches: [] };
}
