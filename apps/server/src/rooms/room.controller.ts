import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { RoomService, RoomStatus, RoomWithParsedData } from './room.service';
import { publicGameState } from '../game-registry';

/** برای کاتان، currentState در پاسخ HTTP فقط نسخهٔ عمومی باشد (دادهٔ خصوصی نشت نکند) */
function sanitizeRoom(room: RoomWithParsedData): RoomWithParsedData {
  if (room.gameType !== 'catan' || !room.currentState) return room;
  return { ...room, currentState: publicGameState(room.gameType, room.currentState) as RoomWithParsedData['currentState'] };
}

/**
 * HTTP endpoints powering the web lobby.
 *
 *   GET  /rooms            -> list rooms (optionally ?status=waiting|playing|finished)
 *   POST /rooms            -> create a room record, returns the room incl. its invite code
 *   GET  /rooms/:code      -> fetch a single room by invite code (incl. persisted currentState)
 *
 * Players are seated through the socket.io `joinRoom` event (GameGateway),
 * so creating a room here does not seat anyone yet — the creator joins via
 * the socket right after navigating to the game page.
 */
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async listRooms(@Query('status') status?: string) {
    const valid: RoomStatus[] = ['waiting', 'playing', 'finished'];
    const parsed =
      typeof status === 'string' && valid.includes(status as RoomStatus)
        ? (status as RoomStatus)
        : undefined;
    const rooms = await this.roomService.listRooms(parsed);
    return rooms.map(sanitizeRoom);
  }

  @Get(':code')
  async getRoom(@Param('code') code: string) {
    const room = await this.roomService.getRoom(code);
    if (!room) {
      throw new NotFoundException(`Room "${code}" not found`);
    }
    return sanitizeRoom(room);
  }

  @Post()
  createRoom(@Body('gameType') gameType?: string, @Body('maxRounds') maxRounds?: number) {
    const type = typeof gameType === 'string' && gameType.trim() ? gameType.trim() : 'tic-tac-toe';
    return this.roomService.createRoom(type, maxRounds);
  }
}
