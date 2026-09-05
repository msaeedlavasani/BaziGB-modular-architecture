import { Body, Controller, Get, HttpException, HttpStatus, NotFoundException, Param, Post, Query, Req } from '@nestjs/common';
import { RoomService, RoomStatus } from './room.service';
import { RateLimiterService } from '../common/rate-limiter.service';
import { trustedClientAddress } from '../common/client-identity';

interface RoomRequest {
  socket?: { remoteAddress?: string };
  headers?: { 'x-forwarded-for'?: string | string[] };
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
  constructor(
    private readonly roomService: RoomService,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  @Get()
  listRooms(@Query('status') status?: string) {
    const valid: RoomStatus[] = ['waiting', 'playing', 'finished'];
    const parsed =
      typeof status === 'string' && valid.includes(status as RoomStatus)
        ? (status as RoomStatus)
        : undefined;
    return this.roomService.listRooms(parsed);
  }

  @Get(':code')
  async getRoom(@Param('code') code: string) {
    const room = await this.roomService.getRoom(code);
    if (!room) {
      throw new NotFoundException(`Room "${code}" not found`);
    }
    return room;
  }

  @Post()
  createRoom(
    @Req() request: RoomRequest,
    @Body('gameType') gameType?: string,
    @Body('maxRounds') maxRounds?: number,
  ) {
    const address = trustedClientAddress(
      request.socket?.remoteAddress,
      request.headers?.['x-forwarded-for'],
    );
    if (this.rateLimiter.isRateLimited(
      `http:rooms:create:address:${address}`,
      5,
      15 * 60,
    )) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (this.rateLimiter.isRateLimited(
      'http:rooms:create:global-emergency',
      60,
      60,
    )) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    const type = typeof gameType === 'string' && gameType.trim() ? gameType.trim() : 'tic-tac-toe';
    return this.roomService.createRoom(type, maxRounds);
  }
}
