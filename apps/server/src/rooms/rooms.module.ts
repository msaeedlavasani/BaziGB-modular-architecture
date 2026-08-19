import { Module } from '@nestjs/common';
import { RoomsController } from './room.controller';
import { RoomService } from './room.service';

/**
 * RoomsModule — کانونی روی پیاده‌سازی Prisma (RoomService).
 *
 * نکته معماری: در ابتدای پورت، یک پیاده‌سازی درون‌حافظه‌ای (RoomsService +
 * GameEngineService) هم وجود داشت که با payload وب ناسازگار بود و باعث
 * «Internal server error» هنگام ساخت اتاق می‌شد. گیتوی سوکت (GameGateway)
 * همیشه از RoomService (Prisma) استفاده می‌کند؛ پس اینجا تنها کنترلر ثبت
 * شده همین پیاده‌سازی Prisma است:
 *
 *   POST /rooms  { gameType, maxRounds }  → ساخت اتاق خالی + کد دعوت
 *   GET  /rooms  (?status=)               → لیست اتاق‌ها
 *   GET  /rooms/:code                     → اتاق با currentState ذخیره‌شده
 *
 * نشستن بازیکن‌ها از طریق رویداد socket.io «joinRoom» انجام می‌شود.
 */
@Module({
  controllers: [RoomsController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomsModule {}
