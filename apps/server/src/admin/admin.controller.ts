import { Controller, Get } from '@nestjs/common';

/** داشبورد ادمین — جای‌نگه‌دار (فاز بعدی) */
@Controller('admin')
export class AdminController {
  @Get()
  dashboard() {
    return { status: 'todo', message: 'داشبورد ادمین در فاز بعدی پیاده‌سازی می‌شود' };
  }
}
