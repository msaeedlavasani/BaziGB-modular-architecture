import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { GameState } from '@bazigb/engine';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export const MAX_PLAYERS = 2;
export const VEGAS_MAX_PLAYERS = 5;

export function getMaxPlayers(gameType: string): number {
  return gameType === 'vegas' ? VEGAS_MAX_PLAYERS : MAX_PLAYERS;
}

/**
 * Minimum number of players required for a game to start. All games start as
 * soon as 2 players are seated (the lobby has no player-count selector yet),
 * even though a Vegas room can later host up to 5 while still waiting.
 */
export function getMinPlayers(): number {
  return 2;
}
export type RoomStatus = 'waiting' | 'playing' | 'finished';

// Ambiguous characters (0, O, 1, I) are excluded so codes are easy to share by voice.
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 5;
const MAX_ACTIVE_ALPHA_ROOMS = 200;
// An HTTP-created room has no player until its creator's socket joins. If that
// never happens, release the capacity promptly; joined private rooms follow
// their separate lifecycle and are not affected by this cleanup.
const EMPTY_WAITING_ROOM_TTL_MS = 15 * 60 * 1000;
const PUBLIC_ROOM_LIST_LIMIT = 100;

export interface RoomWithParsedData {
  id: string;
  code: string;
  status: string;
  gameType: string;
  players: string[];
  currentState: GameState | null;
  winnerId: string | null;
  ownerId: string | null;
  /** Best-of-N match length: 1 = single game, 3 = first to 2, 5 = first to 3. */
  maxRounds: number;
  /** Round wins per player id ({ [playerId]: wins }) for multi-round matches. */
  scores: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

/** Allowed best-of-N match lengths. 1 keeps the legacy single-game behavior. */
export const MATCH_ROUND_OPTIONS = [1, 3, 5, 7, 9, 11, 13] as const;
export type MaxRounds = (typeof MATCH_ROUND_OPTIONS)[number];

/** Coerce any input to a valid maxRounds value (defaults to 1 = single game). */
export function normalizeMaxRounds(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && MATCH_ROUND_OPTIONS.includes(parsed as MaxRounds)
    ? (parsed as MaxRounds)
    : 1;
}

/**
 * All database operations for game rooms.
 *
 * Room lifecycle: create/join -> start -> play (saveState) -> finish.
 * Replaces the in-memory `games` / `roomPlayers` maps that used to live in
 * GameGateway. Rooms (players + current game state) are persisted in the
 * `rooms` table so they survive server restarts.
 */
@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Per-room mutation lock. The `players` JSON column is read-modify-written
   * (join/remove/swap/start/finish) and two concurrent joins on a freshly
   * HTTP-created room used to lose a player (last write wins). The server is
   * a single instance, so an in-process promise chain per room code is enough.
   */
  private readonly roomLocks = new Map<string, Promise<unknown>>();

  private withRoomLock<T>(code: string, fn: () => Promise<T>): Promise<T> {
    const tail = this.roomLocks.get(code) ?? Promise.resolve();
    const run = tail.then(fn, fn);
    const tracked = run.then(
      () => undefined,
      () => undefined,
    );
    this.roomLocks.set(code, tracked);
    tracked.finally(() => {
      if (this.roomLocks.get(code) === tracked) this.roomLocks.delete(code);
    });
    return run;
  }

  /**
   * Load a room by its invite code, with the JSON `players` / `currentState`
   * columns decoded. Returns null when the room does not exist.
   */
  async getRoom(code: string): Promise<RoomWithParsedData | null> {
    const room = await this.prisma.room.findUnique({ where: { code } });
    return room ? this.toParsed(room) : null;
  }

  /**
   * Create the room if it does not exist yet, otherwise seat `playerId`.
   * `gameType` / `maxRounds` are only used when a room is created here
   * (socket-side join without a preceding HTTP create); existing rooms keep
   * their own values. Throws when the room is already full.
   */
  async joinRoom(
    code: string,
    playerId: string,
    gameType = 'tic-tac-toe',
    maxRounds: unknown = 1,
  ): Promise<RoomWithParsedData> {
    return this.withRoomLock(code, () =>
      this.joinRoomUnlocked(code, playerId, gameType, normalizeMaxRounds(maxRounds)),
    );
  }

  private async joinRoomUnlocked(
    code: string,
    playerId: string,
    gameType = 'tic-tac-toe',
    maxRounds = 1,
  ): Promise<RoomWithParsedData> {
    const existing = await this.prisma.room.findUnique({ where: { code } });

    if (!existing) {
      const room = await this.prisma.room.create({
        data: {
          code,
          gameType,
          status: 'waiting',
          players: JSON.stringify([playerId]),
          ownerId: playerId,
          maxRounds,
        },
      });
      return this.toParsed(room);
    }

    const players = this.parsePlayers(existing.players);
    if (players.includes(playerId)) {
      return this.toParsed(existing); // re-join is a no-op
    }

    const maxPlayers = getMaxPlayers(existing.gameType);
    if (players.length >= maxPlayers) {
      throw new BadRequestException(`Room "${code}" is full`);
    }

    // Seat the player and (only for the very first joiner of an HTTP-created
    // room) claim ownership in ONE atomic update — no read-modify-write race.
    const room = await this.prisma.room.update({
      where: { id: existing.id },
      data: {
        players: JSON.stringify([...players, playerId]),
        ...(existing.ownerId ? {} : { ownerId: playerId }),
        // Reuse a finished room for a rematch.
        ...(existing.status === 'finished'
          ? { status: 'waiting', winnerId: null, currentState: null, scores: '{}' }
          : {}),
      },
    });
    return this.toParsed(room);
  }

  /**
   * Create an empty room with a fresh invite code and persist it to the DB.
   * Players are not seated here; they join later through the socket.io
   * `joinRoom` event (GameGateway) which seats them by socket id.
   */
  async createRoom(gameType = 'tic-tac-toe', maxRounds: unknown = 1): Promise<RoomWithParsedData> {
    return this.withRoomLock('__alpha-room-creation__', () =>
      this.createRoomUnlocked(gameType, maxRounds),
    );
  }

  private async createRoomUnlocked(gameType: string, maxRounds: unknown): Promise<RoomWithParsedData> {
    const normalizedRounds = normalizeMaxRounds(maxRounds);
    await this.prisma.room.deleteMany({
      where: {
        status: 'waiting',
        players: '[]',
        createdAt: { lt: new Date(Date.now() - EMPTY_WAITING_ROOM_TTL_MS) },
      },
    });
    const activeRooms = await this.prisma.room.count({
      where: { status: { in: ['waiting', 'playing'] } },
    });
    if (activeRooms >= MAX_ACTIVE_ALPHA_ROOMS) {
      throw new ServiceUnavailableException('ظرفیت اتاق‌های فعال موقتاً تکمیل است');
    }
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = this.generateCode();
      try {
        const room = await this.prisma.room.create({
          data: {
            code,
            gameType,
            status: 'waiting',
            players: '[]',
            maxRounds: normalizedRounds,
          },
        });
        return this.toParsed(room);
      } catch (error) {
        // P2002 = unique constraint violation on `code` -> retry with a new code.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }
    throw new Error('Could not allocate a unique room code');
  }

  async swapPlayer(code: string, oldPlayerId: string, newPlayerId: string): Promise<RoomWithParsedData | null> {
    return this.withRoomLock(code, () => this.swapPlayerUnlocked(code, oldPlayerId, newPlayerId));
  }

  private async swapPlayerUnlocked(code: string, oldPlayerId: string, newPlayerId: string): Promise<RoomWithParsedData | null> {
    const existing = await this.prisma.room.findUnique({ where: { code } });
    if (!existing) return null;
    const players = this.parsePlayers(existing.players);
    if (!players.includes(oldPlayerId)) return this.toParsed(existing);
    const updated = await this.prisma.room.update({
      where: { id: existing.id },
      data: {
        players: JSON.stringify(players.map((p) => (p === oldPlayerId ? newPlayerId : p))),
        // Keep ownership when the owner's stale socket is swapped on reconnect.
        ...(existing.ownerId === oldPlayerId ? { ownerId: newPlayerId } : {}),
      },
    });
    return this.toParsed(updated);
  }

  /**
   * Remove `playerId` from the room's seats. Used on socket disconnect so a
   * player who refreshes / drops can re-join without being blocked by their
   * stale socket id filling the room (which turned them into spectators).
   */
  async removePlayer(code: string, playerId: string): Promise<RoomWithParsedData | null> {
    return this.withRoomLock(code, () => this.removePlayerUnlocked(code, playerId));
  }

  private async removePlayerUnlocked(code: string, playerId: string): Promise<RoomWithParsedData | null> {
    const existing = await this.prisma.room.findUnique({ where: { code } });
    if (!existing || existing.status === 'finished') return existing ? this.toParsed(existing) : null;

    const players = this.parsePlayers(existing.players).filter((p) => p !== playerId);
    if (players.length === this.parsePlayers(existing.players).length) {
      return this.toParsed(existing); // not seated — nothing to do
    }

    const updated = await this.prisma.room.update({
      where: { id: existing.id },
      data: {
        players: JSON.stringify(players),
        ...(existing.ownerId === playerId ? { ownerId: players[0] ?? null } : {}),
      },
    });
    return this.toParsed(updated);
  }

  /**
   * Mark a room as playing and store the initial game state.
   *
   * `opts.resetScores` wipes the match scoreboard — pass true when a brand-new
   * match begins (first start, Vegas start, rematch). Mid-match rounds reuse
   * this method WITHOUT reset so the accumulated round wins survive.
   */
  async startGame(
    code: string,
    initialState: GameState,
    opts: { resetScores?: boolean } = {},
  ): Promise<RoomWithParsedData> {
    return this.withRoomLock(code, () => this.startGameUnlocked(code, initialState, opts));
  }

  private async startGameUnlocked(
    code: string,
    initialState: GameState,
    opts: { resetScores?: boolean } = {},
  ): Promise<RoomWithParsedData> {
    const room = await this.prisma.room.findUnique({ where: { code } });
    if (!room) {
      throw new NotFoundException(`Room "${code}" not found`);
    }
    const updated = await this.prisma.room.update({
      where: { id: room.id },
      data: {
        status: 'playing',
        currentState: JSON.stringify(initialState),
        ...(opts.resetScores ? { scores: '{}' } : {}),
      },
    });
    return this.toParsed(updated);
  }

  /** Persist the match scoreboard ({ [playerId]: roundWins }) after a round. */
  async saveScores(code: string, scores: Record<string, number>): Promise<RoomWithParsedData> {
    return this.withRoomLock(code, () => this.saveScoresUnlocked(code, scores));
  }

  private async saveScoresUnlocked(code: string, scores: Record<string, number>): Promise<RoomWithParsedData> {
    const room = await this.prisma.room.findUnique({ where: { code } });
    if (!room) {
      throw new NotFoundException(`Room "${code}" not found`);
    }
    const updated = await this.prisma.room.update({
      where: { id: room.id },
      data: { scores: JSON.stringify(scores) },
    });
    return this.toParsed(updated);
  }

  /** Persist the current game state after every accepted move. */
  async saveState(code: string, state: GameState): Promise<RoomWithParsedData> {
    const room = await this.prisma.room.findUnique({ where: { code } });
    if (!room) {
      throw new NotFoundException(`Room "${code}" not found`);
    }
    const updated = await this.prisma.room.update({
      where: { id: room.id },
      data: { currentState: JSON.stringify(state) },
    });
    return this.toParsed(updated);
  }

  /** Mark a room as finished and store the final state + winner. */
  async finishRoom(
    code: string,
    winnerId: string | null,
    finalState: GameState,
  ): Promise<RoomWithParsedData> {
    return this.withRoomLock(code, () => this.finishRoomUnlocked(code, winnerId, finalState));
  }

  private async finishRoomUnlocked(
    code: string,
    winnerId: string | null,
    finalState: GameState,
  ): Promise<RoomWithParsedData> {
    const room = await this.prisma.room.findUnique({ where: { code } });
    if (!room) {
      throw new NotFoundException(`Room "${code}" not found`);
    }
    const updated = await this.prisma.room.update({
      where: { id: room.id },
      data: { status: 'finished', winnerId, currentState: JSON.stringify(finalState) },
    });
    return this.toParsed(updated);
  }

  /** Delete a room by its code. */
  async deleteRoom(code: string): Promise<boolean> {
    const existing = await this.prisma.room.findUnique({ where: { code } });
    if (!existing) return false;
    await this.prisma.room.delete({ where: { code } });
    return true;
  }

  /** Delete multiple rooms by their codes. */
  async deleteRoomsBulk(codes: string[]): Promise<number> {
    const { count } = await this.prisma.room.deleteMany({
      where: {
        code: { in: codes },
      },
    });
    return count;
  }

  /** List rooms, optionally filtered by status. */
  async listRooms(status?: RoomStatus): Promise<RoomWithParsedData[]> {
    const rooms = await this.prisma.room.findMany({
      ...(status ? { where: { status } } : {}),
      orderBy: { createdAt: 'desc' },
      take: PUBLIC_ROOM_LIST_LIMIT,
    });
    return rooms.map((room) => this.toParsed(room));
  }

  private generateCode(): string {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }
    return code;
  }

  private parsePlayers(players: string): string[] {
    try {
      const parsed = JSON.parse(players);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private toParsed(room: {
    id: string;
    code: string;
    status: string;
    gameType: string;
    players: string;
    currentState: string | null;
    winnerId: string | null;
    ownerId: string | null;
    maxRounds: number;
    scores: string;
    createdAt: Date;
    updatedAt: Date;
  }): RoomWithParsedData {
    let currentState: GameState | null = null;
    if (room.currentState) {
      try {
        currentState = JSON.parse(room.currentState) as GameState;
      } catch {
        currentState = null;
      }
    }
    let scores: Record<string, number> = {};
    try {
      const parsed = JSON.parse(room.scores);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        scores = parsed as Record<string, number>;
      }
    } catch {
      scores = {};
    }
    return {
      id: room.id,
      code: room.code,
      status: room.status,
      gameType: room.gameType,
      players: this.parsePlayers(room.players),
      currentState,
      winnerId: room.winnerId,
      ownerId: room.ownerId,
      maxRounds: room.maxRounds,
      scores,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}
