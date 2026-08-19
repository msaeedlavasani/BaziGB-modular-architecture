/**
 * Leaderboard API client + demo data.
 *
 *   GET /leaderboard?page=1&pageSize=50  ->  { items, total, page, pageSize, totalPages }
 *
 * The server returns paginated raw entries ({ rank, id, username, rating,
 * wins, losses }); this module normalizes them into the richer shape the UI
 * renders (win rate, totals, etc.) and falls back to a realistic 50-player
 * demo board when the server is unreachable.
 */

import { api } from './api';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  /** Win rate as a percentage 0..100. */
  winRate: number;
  /** Competitive rating used to sort the board. */
  rating: number;
}

interface ServerLeaderboardPage {
  items: Array<{
    rank: number;
    id: string;
    username: string;
    rating: number;
    wins: number;
    losses: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Top 50 players, normalized for display. */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const page = await api.get<ServerLeaderboardPage>(
      '/leaderboard?page=1&pageSize=50',
    );
    return page.items.map((item) => {
      const gamesPlayed = item.wins + item.losses;
      return {
        rank: item.rank,
        userId: item.id,
        username: item.username,
        wins: item.wins,
        losses: item.losses,
        draws: 0,
        gamesPlayed,
        winRate:
          gamesPlayed > 0
            ? Math.round((item.wins / gamesPlayed) * 1000) / 10
            : 0,
        rating: item.rating,
      };
    });
  } catch {
    return buildDemoLeaderboard();
  }
}

/* ------------------------------ demo data -------------------------------- */

const NAME_FIRST = [
  'Nova', 'Pixel', 'Rook', 'Blitz', 'Dark', 'Tempest', 'Check', 'Iron',
  'Quantum', 'Shadow', 'Crimson', 'Golden', 'Silent', 'Swift', 'Frost',
  'Thunder', 'Mystic', 'Solar', 'Lunar', 'Neon', 'Hyper', 'Turbo', 'Mega',
  'Ultra', 'Cosmic', 'Void', 'Echo', 'Blaze', 'Storm', 'Ghost', 'Phantom',
  'Cipher', 'Rogue', 'Viper', 'Falcon', 'Raven', 'Wolf', 'Tiger', 'Lion',
  'Bear', 'Hawk', 'Owl', 'Fox', 'Knight', 'Queen', 'King', 'Bishop', 'Pawn',
  'Master', 'Grand',
];

const NAME_LAST = [
  'King', 'Wolf', 'Warden', 'Knight', 'Bishop', 'Queen', 'Check', 'Mate',
  'Storm', 'Blaze', 'Frost', 'Ember', 'Shade', 'Spark', 'Rush', 'Wave',
  'Fury', 'Bolt', 'Pulse', 'Drift', 'Nova', 'Orbit', 'Pilot', 'Runner',
  'Caster', 'Hunter', 'Slayer', 'Mage', 'Sage', 'Wizard', 'Pro', 'Ace',
  'One', 'Zero', 'X', 'Lord', 'Ninja', 'Samurai', 'Specter', 'Hawk',
  'Falcon', 'Viper', 'Cobra', 'Titan', 'Giant', 'Dwarf', 'Elf', 'Orc',
  'Wraith', 'Reaper',
];

/** Deterministic 50-player board so the UI renders identically every visit. */
function buildDemoLeaderboard(): LeaderboardEntry[] {
  return Array.from({ length: 50 }, (_, i) => {
    const gamesPlayed = 320 - i * 3 + ((i * 17) % 50);
    const rawWinRate = 84 - i * 1.2 + ((i * 13) % 7) * 0.25;
    const winRate = Math.min(99, Math.max(1, rawWinRate));
    const wins = Math.round((gamesPlayed * winRate) / 100);
    const draws = (i * 7) % 9;
    const losses = Math.max(0, gamesPlayed - wins - draws);
    const rating = 2180 - i * 18 + ((i * 29) % 25);

    return {
      rank: i + 1,
      userId: `demo-user-${i + 1}`,
      username: `${NAME_FIRST[i]}${NAME_LAST[(i * 13 + 7) % NAME_LAST.length]}`,
      wins,
      losses,
      draws,
      gamesPlayed,
      winRate: Math.round(winRate * 10) / 10,
      rating,
    };
  });
}
