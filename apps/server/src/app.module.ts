import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { GameModule } from './game/game.module';
import { HistoryModule } from './history/history.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { AdminModule } from './admin/admin.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SmsModule } from './sms/sms.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'] }),
    PrismaModule,
    CommonModule,
    AuthModule,
    RoomsModule,
    GameModule,
    HistoryModule,
    LeaderboardModule,
    TournamentsModule,
    AdminModule,
    SiteSettingsModule,
    NotificationsModule,
    SmsModule,
  ],
})
export class AppModule {}
