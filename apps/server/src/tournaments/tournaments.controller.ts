import { Controller, Get } from '@nestjs/common';

/** تورنمنت‌ها — جای‌نگه‌دار (فاز بعدی) */
@Controller('tournaments')
export class TournamentsController {
  @Get()
  list() {
    return { status: 'todo', message: 'ماژول تورنمنت در فاز بعدی پیاده‌سازی می‌شود' };
  }
}
