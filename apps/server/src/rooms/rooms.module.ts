import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GameModule } from '../game/game.module';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [DatabaseModule, GameModule],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
