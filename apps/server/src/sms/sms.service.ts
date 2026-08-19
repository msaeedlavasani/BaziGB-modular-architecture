import { Injectable } from '@nestjs/common';

/** سرویس sms.ir — جای‌نگه‌دار (فاز بعدی) */
@Injectable()
export class SmsService {
  send(_phone: string, _message: string): { status: string } {
    return { status: 'todo' };
  }
}
