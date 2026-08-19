import { Controller, Get } from '@nestjs/common';

/** پیامک — جای‌نگه‌دار (فاز بعدی) */
@Controller('sms')
export class SmsController {
  @Get()
  status() {
    return { status: 'todo', message: 'سرویس sms.ir در فاز بعدی پیاده‌سازی می‌شود' };
  }
}
