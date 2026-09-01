import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

/**
 * Global rankings API.
 *
 *   GET /leaderboard?page=1&pageSize=10  ->  { items, total, page, pageSize, totalPages }
 *   GET /leaderboard/:userId             ->  { userId, rank, rating }
 */
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  getTopPlayers(
    @Query('game') game?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.leaderboardService.getTopPlayers(
      game ?? 'tic-tac-toe',
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }

  @Get(':userId')
  async getPlayerRank(@Param('userId') userId: string, @Query('game') game?: string) {
    const rank = await this.leaderboardService.getPlayerRank(userId, game ?? 'tic-tac-toe');
    if (!rank) {
      throw new NotFoundException(`User "${userId}" not found`);
    }
    return rank;
  }
}
