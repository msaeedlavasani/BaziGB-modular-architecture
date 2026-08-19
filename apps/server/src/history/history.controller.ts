import { Controller, Get, Param } from '@nestjs/common';
import { HistoryService } from './history.service';

/**
 * HTTP endpoint to read game history.
 *
 *   GET /history/:userId  ->  { userId, stats, history }
 */
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get(':userId')
  getUserHistory(@Param('userId') userId: string) {
    return this.historyService.getUserHistory(userId);
  }
}
