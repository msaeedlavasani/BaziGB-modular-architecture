import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Wraps PrismaClient so it can be injected anywhere via PrismaModule.
 * اگر دیتابیس در دسترس نباشد، سرور با هشدار بالا می‌آید (بازی‌ها روی فایل JSON
 * همچنان کار می‌کنند) و تنها endpoint های وابسته به دیتابیس خطا می‌دهند.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('دیتابیس متصل شد');
    } catch (e) {
      this.logger.warn(
        `دیتابیس در دسترس نیست (${e instanceof Error ? e.message : e}) — auth/OTP غیرفعال است؛ بازی‌ها روی فایل JSON ادامه دارند`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
