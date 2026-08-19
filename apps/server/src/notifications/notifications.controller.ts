import { Controller, Get } from '@nestjs/common';

/** اعلان‌ها — جای‌نگه‌دار (فاز بعدی) */
@Controller('notifications')
export class NotificationsController {
  @Get()
  list() {
    return { status: 'todo', message: 'ماژول اعلان‌ها در فاز بعدی پیاده‌سازی می‌شود' };
  }
}
