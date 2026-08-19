import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
}

export interface LeaderboardPage {
  items: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Global rankings.
 *
 * The ladder is ordered by ELO `rating` (desc), then `wins` (desc), then
 * account age (asc) so ties resolve deterministically. The same ordering is
 * used for `getPlayerRank`, so ranks stay consistent with the list view.
 */
@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch a page of the global leaderboard.
   *
   * @param page     1-based page number (clamped to >= 1)
   * @param pageSize items per page (clamped to 1..100, default 10)
   */
  async getTopPlayers(page = 1, pageSize = 10): Promise<LeaderboardPage> {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeSize = Math.min(100, Math.max(1, Math.floor(pageSize) || 10));

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: [{ rating: 'desc' }, { wins: 'desc' }, { createdAt: 'asc' }],
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        select: {
          id: true,
          username: true,
          rating: true,
          wins: true,
          losses: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    const items: LeaderboardEntry[] = users.map((user, index) => ({
      rank: (safePage - 1) * safeSize + index + 1,
      ...user,
    }));

    return {
      items,
      total,
      page: safePage,
      pageSize: safeSize,
      totalPages: Math.max(1, Math.ceil(total / safeSize)),
    };
  }

  /**
   * Rank of a single player using the same ordering as `getTopPlayers`.
   * Returns null when the user does not exist.
   */
  async getPlayerRank(userId: string): Promise<{ userId: string; rank: number; rating: number } | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    // Players "ahead" of this one under (rating desc, wins desc, createdAt asc).
    const ahead = await this.prisma.user.count({
      where: {
        OR: [
          { rating: { gt: user.rating } },
          { rating: user.rating, wins: { gt: user.wins } },
          { rating: user.rating, wins: user.wins, createdAt: { lt: user.createdAt } },
        ],
      },
    });

    return { userId, rank: ahead + 1, rating: user.rating };
  }
}
