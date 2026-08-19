import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GameModule } from '../game/game.module';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RoomService } from './room.service';

@Module({
  imports: [DatabaseModule, forwardRef(() => GameModule)],
  controllers: [RoomsController],
  providers: [RoomsService, RoomService],
  exports: [RoomService],
})
export class RoomsModule {}
