/**
 * Leaderboard API client.
 *
 *   GET /leaderboard?page=1&pageSize=10  ->  { items, total, page, pageSize, totalPages }
 *
 * The server returns paginated raw entries ({ rank, id, username, rating,
 * wins, losses }); this module normalizes them into the richer shape the UI
 * renders. Errors are deliberately surfaced to the page: a competitive
 * ranking must never make demo accounts look like real players.
 */

import { api } from './api';
import { isLocalUiDemoEnabled } from './local-ui-demo';

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
}

interface ServerLeaderboardPage {
  items: Array<{
    rank: number;
    id: string;
    username: string;
    wins: number;
    losses: number;
    draws: number;
    gamesPlayed: number;
    winRate: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LeaderboardPage {
  items: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** True only for explicitly enabled local presentation data. */
  demo: boolean;
}

/** A compact, explicit page prevents an unbounded ranking list. */
export async function fetchLeaderboard(game = 'tic-tac-toe', pageNumber = 1, pageSize = 10): Promise<LeaderboardPage> {
  if (isLocalUiDemoEnabled('leaderboard')) {
    return buildDemoPage(game, pageNumber, pageSize);
  }

  const page = await api.get<ServerLeaderboardPage>(
    `/leaderboard?game=${encodeURIComponent(game)}&page=${pageNumber}&pageSize=${pageSize}`,
  );

  return {
    total: page.total,
    page: page.page,
    pageSize: page.pageSize,
    totalPages: page.totalPages,
    demo: false,
    items: page.items.map((item) => {
      return {
        rank: item.rank,
        userId: item.id,
        username: item.username,
        wins: item.wins,
        losses: item.losses,
        draws: item.draws,
        gamesPlayed: item.gamesPlayed,
        winRate: item.winRate,
      };
    }),
  };
}

/** Explicit local UI fixture; it is unreachable from a production build. */
function buildDemoPage(_game: string, pageNumber: number, pageSize: number): LeaderboardPage {
  const allEntries = Array.from({ length: 30 }, (_, index) => {
    const gamesPlayed = 45 - index + ((index * 7) % 12);
    const wins = Math.max(1, Math.round(gamesPlayed * (0.72 - index * 0.008)));
    const losses = Math.max(0, gamesPlayed - wins);

    return {
      rank: index + 1,
      userId: `local-demo-${index + 1}`,
      username: `DemoPlayer${String(index + 1).padStart(2, '0')}`,
      wins,
      losses,
      draws: 0,
      gamesPlayed,
      winRate: Math.round((wins / gamesPlayed) * 1000) / 10,
    } satisfies LeaderboardEntry;
  });
  const safePage = Math.max(1, Math.min(Math.ceil(allEntries.length / pageSize), pageNumber));

  return {
    items: allEntries.slice((safePage - 1) * pageSize, safePage * pageSize),
    total: allEntries.length,
    page: safePage,
    pageSize,
    totalPages: Math.ceil(allEntries.length / pageSize),
    demo: true,
  };
}
