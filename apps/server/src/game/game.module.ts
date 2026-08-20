import { forwardRef, Module } from '@nestjs/common';
import { HistoryModule } from '../history/history.module';
import { AuthModule } from '../auth/auth.module';
import { RoomsModule } from '../rooms/rooms.module';
import { GameEngineService } from './game-engine.service';
import { GameGateway } from './game.gateway';

@Module({
  imports: [forwardRef(() => RoomsModule), HistoryModule, AuthModule],
  providers: [GameEngineService, GameGateway],
  exports: [GameEngineService],
})
export class GameModule {}
