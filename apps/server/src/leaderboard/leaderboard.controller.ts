import { Controller, Get } from '@nestjs/common';

/** رتبه‌بندی — جای‌نگه‌دار (فاز بعدی) */
@Controller('leaderboard')
export class LeaderboardController {
  @Get()
  list() {
    return { status: 'todo', message: 'ماژول رتبه‌بندی در فاز بعدی پیاده‌سازی می‌شود' };
  }
}
