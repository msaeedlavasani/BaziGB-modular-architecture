import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const RANKED_GAMES = new Set(['tic-tac-toe', 'backgammon', 'chess', 'vegas']);

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winRate: number;
}

export interface LeaderboardPage {
  game: string;
  items: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
}

function parsePlayers(raw: string): string[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? [...new Set(value.map(String))] : [];
  } catch {
    return [];
  }
}

/** Per-game Alpha rankings derived from authoritative completed-match history. */
@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  private validateGame(game: string): string {
    if (!RANKED_GAMES.has(game)) throw new BadRequestException('بازی انتخاب‌شده معتبر نیست');
    return game;
  }

  private async rankedEntries(game: string): Promise<LeaderboardEntry[]> {
    const gameName = this.validateGame(game);
    const history = await this.prisma.gameHistory.findMany({
      where: { gameName },
      select: { winnerId: true, players: true },
    });

    const stats = new Map<string, PlayerStats>();
    for (const match of history) {
      const players = parsePlayers(match.players);
      for (const playerId of players) {
        const current = stats.get(playerId) ?? { wins: 0, losses: 0, draws: 0, gamesPlayed: 0 };
        current.gamesPlayed += 1;
        if (!match.winnerId) current.draws += 1;
        else if (match.winnerId === playerId) current.wins += 1;
        else current.losses += 1;
        stats.set(playerId, current);
      }
    }

    const users = stats.size === 0
      ? []
      : await this.prisma.user.findMany({
          where: { id: { in: [...stats.keys()] }, deactivated: false },
          select: { id: true, username: true, createdAt: true },
        });

    const ranked = users.map((user) => {
      const value = stats.get(user.id)!;
      return {
        rank: 0,
        id: user.id,
        username: user.username,
        ...value,
        winRate: value.gamesPlayed > 0 ? Math.round((value.wins / value.gamesPlayed) * 1000) / 10 : 0,
        createdAt: user.createdAt,
      };
    });

    ranked.sort((a, b) =>
      b.wins - a.wins ||
      b.winRate - a.winRate ||
      b.gamesPlayed - a.gamesPlayed ||
      a.createdAt.getTime() - b.createdAt.getTime() ||
      a.username.localeCompare(b.username),
    );

    return ranked.map(({ createdAt: _createdAt, ...entry }, index) => ({ ...entry, rank: index + 1 }));
  }

  async getTopPlayers(game = 'tic-tac-toe', page = 1, pageSize = 10): Promise<LeaderboardPage> {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeSize = Math.min(100, Math.max(1, Math.floor(pageSize) || 10));
    const ranked = await this.rankedEntries(game);
    const totalPages = Math.max(1, Math.ceil(ranked.length / safeSize));
    const clampedPage = Math.min(safePage, totalPages);

    return {
      game,
      items: ranked.slice((clampedPage - 1) * safeSize, clampedPage * safeSize),
      total: ranked.length,
      page: clampedPage,
      pageSize: safeSize,
      totalPages,
    };
  }

  async getPlayerRank(userId: string, game = 'tic-tac-toe'): Promise<LeaderboardEntry | null> {
    return (await this.rankedEntries(game)).find((entry) => entry.id === userId) ?? null;
  }
}
