import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GameEngineService } from './game-engine.service';
import { GameGateway } from './game.gateway';

@Module({
  imports: [DatabaseModule],
  providers: [GameEngineService, GameGateway],
  exports: [GameEngineService],
})
export class GameModule {}
