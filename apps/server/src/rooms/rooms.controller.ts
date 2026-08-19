import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { AIDifficulty, GameId } from '@bazigb/engine';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get()
  list() {
    return this.rooms.listRooms();
  }

  @Post()
  create(@Body() body: { gameId: GameId; mode?: 'bot' | 'pvp'; difficulty?: AIDifficulty }) {
    return this.rooms.createRoom(body.gameId, body.mode ?? 'bot', body.difficulty ?? 'medium');
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.rooms.getRoom(id);
  }
}
