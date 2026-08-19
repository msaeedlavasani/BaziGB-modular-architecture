import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule — سراسری (Global): PrismaService در همه ماژول‌ها قابل تزریق است.
 * (انتقال از نسخه قدیمی BaziGB)
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
