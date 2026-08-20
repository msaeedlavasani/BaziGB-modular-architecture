import { forwardRef, Module } from '@nestjs/common';
import { HistoryModule } from '../history/history.module';
import { AuthModule } from '../auth/auth.module';
import { RoomsModule } from '../rooms/rooms.module';
import { GameEngineService } from './game-engine.service';
import { GameGateway } from './game.gateway';
import { BotStatsController } from './bot-stats.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [forwardRef(() => RoomsModule), HistoryModule, AuthModule, PrismaModule],
  controllers: [BotStatsController],
  providers: [GameEngineService, GameGateway],
  exports: [GameEngineService],
})
export class GameModule {}
