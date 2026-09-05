import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { randomBytes } from 'crypto';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameState, MatchConfig, Player, type GameId } from '@bazigb/engine';
import { RoomService, RoomWithParsedData } from '../rooms/room.service';
import { HistoryService } from '../history/history.service';
import { COLORS, REGISTRY } from './game-engine.service';
import {
  chatSchema,
  gameActionSchema,
  joinRoomSchema,
  leaveRoomSchema,
  reactionSchema,
  makeMoveSchema,
  newGameSchema,
  nextRoundSchema,
  undoSchema,
  doubleSchema,
  doubleResponseSchema,
} from '../socket-validation';
import { WsRateLimitGuard } from '../common/ws-rate-limit.guard';

/**
 * GameGateway — لایه انتقال چندنفره (PvP) با معماری مدولار جدید.
 *
 * بازسازی شده از گیتوی قدیمی روی رابط GameAdapter جدید (createState /
 * applyMove / applyChain) — بدون وابستگی به موتور boardgame.io قدیمی.
 *
 * پروتکل Socket.IO با نسخه قدیمی سازگار است (joinRoom, startGame,
 * makeMove, rollDice, gameAction, nextRound, newGame, undo, chatMessage
 * و رویدادهای gameState, gameOver, matchScore, roomUpdate, systemMessage,
 * seatKey, turnStarted/turnWarning/turnTimeout, error).
 */
const MAX_CHAT_LENGTH = 500;
const TURN_MS = 120_000;
const TURN_WARN_MS = 10_000;
const SEAT_CLAIM_TTL = 10 * 60 * 1000;
const TIC_TAC_TOE_RECONNECT_GRACE_MS = 60_000;
const UNDO_DEPTH = 20;
const MAX_MOVE_CHAIN_ACTIONS = 32;

type PresenceRole = 'creator' | 'player' | 'spectator';
type PresenceConnection = 'connected' | 'reconnecting';

interface PresenceParticipant {
  id: string;
  name: string;
  role: PresenceRole;
  connection: PresenceConnection;
}

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly socketUsers = new Map<string, string>();
  private readonly socketUsernames = new Map<string, string>();
  private readonly vacatedUsers = new Map<
    string,
    { value: string | null; at: number; socketId: string; seatKey?: string }
  >();
  private readonly seatKeys = new Map<string, { value: string; at: number }>();
  /** پشتهٔ آندو (هر اتاق): اسنپشات state قبل از هر اقدام + شناسهٔ انجام‌دهنده */
  private readonly undoStacks = new Map<string, { state: GameState; actorId: string }[]>();
  private readonly turnTimers = new Map<string, NodeJS.Timeout>();
  private readonly turnWarnTimers = new Map<string, NodeJS.Timeout>();
  private readonly socketRooms = new Map<string, Set<string>>();
  private readonly roomSpectators = new Map<string, Set<string>>();
  private readonly reconnectTimers = new Map<string, NodeJS.Timeout>();
  private readonly rematchVotes = new Map<string, Set<string>>();

  constructor(
    private readonly roomService: RoomService,
    private readonly historyService: HistoryService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // ------------------------------------------------------------------ utils

  private resolveGame(gameType?: string) {
    return (gameType && REGISTRY[gameType as GameId]) || REGISTRY['tic-tac-toe'];
  }

  private clearTurnTimers(roomCode: string) {
    const t = this.turnTimers.get(roomCode);
    if (t) clearTimeout(t);
    this.turnTimers.delete(roomCode);
    const w = this.turnWarnTimers.get(roomCode);
    if (w) clearTimeout(w);
    this.turnWarnTimers.delete(roomCode);
  }

  /** امتیاز هدف در بهترین از N (best-of-N) */
  private matchTarget(maxRounds: number): number {
    return Math.max(1, Math.ceil(maxRounds / 2));
  }

  /** ساخت بازیکنان با رنگهای درست برای یک بازی */
  private makePlayers(room: RoomWithParsedData): Player[] {
    const colors = COLORS[room.gameType as GameId] ?? COLORS['tic-tac-toe'];
    return room.players.map((id, i) => ({
      id,
      name: this.socketUsernames.get(id) ?? `بازیکن ${i + 1}`,
      color: colors[i % colors.length],
    }));
  }

  /** ساخت وضعیت اولیه با ۱ راند در هر state (مدیریت راندها با گیتوی) */
  private initialState(room: RoomWithParsedData): GameState {
    const match: MatchConfig = room.gameType === 'backgammon'
      ? { matchPoint: room.maxRounds > 1, winByTwo: false, targetScore: room.maxRounds }
      : { matchPoint: true, winByTwo: room.gameType === 'tic-tac-toe', targetScore: this.matchTarget(room.maxRounds) };
    return this.resolveGame(room.gameType).createState(this.makePlayers(room), match) as GameState;
  }

  private emitSystemMessage(roomCode: string, message: string, userId?: string, type = 'info', username?: string) {
    this.server.to(roomCode).emit('systemMessage', {
      type,
      message,
      userId,
      username,
      timestamp: new Date().toISOString(),
    });
  }

  private rememberRoom(socketId: string, roomCode: string) {
    const rooms = this.socketRooms.get(socketId) ?? new Set<string>();
    rooms.add(roomCode);
    this.socketRooms.set(socketId, rooms);
  }

  private forgetRoom(socketId: string, roomCode: string) {
    const rooms = this.socketRooms.get(socketId);
    rooms?.delete(roomCode);
    if (rooms?.size === 0) this.socketRooms.delete(socketId);
    this.roomSpectators.get(roomCode)?.delete(socketId);
    this.rematchVotes.get(roomCode)?.delete(socketId);
  }

  private isRoomMember(socketId: string, roomCode: string): boolean {
    return this.socketRooms.get(socketId)?.has(roomCode) ?? false;
  }

  private assertSeatedMember(client: Socket, room: RoomWithParsedData) {
    if (!this.isRoomMember(client.id, room.code) || !room.players.includes(client.id)) {
      throw new BadRequestException('فقط بازیکنان این اتاق مجاز به انجام این اقدام هستند');
    }
  }

  /** Replace client-supplied actors without traversing arbitrary nested input. */
  private bindMoveActor(move: unknown, actorId: string, gameType: string): unknown {
    const bindAction = (action: unknown): Record<string, unknown> => {
      if (!action || typeof action !== 'object' || Array.isArray(action)) {
        throw new BadRequestException('ساختار حرکت نامعتبر است');
      }
      const source = action as Record<string, unknown>;
      const kind = source.kind;
      if (typeof kind !== 'string' || kind.length > 16) {
        throw new BadRequestException('نوع حرکت نامعتبر است');
      }

      // Keep only the primitive fields defined by each public game contract.
      // Unknown/nested client data must never enter authoritative state/history.
      if (gameType === 'tic-tac-toe') {
        if (kind !== 'place' || typeof source.to !== 'number') {
          throw new BadRequestException('ساختار حرکت دوز نامعتبر است');
        }
        return { player: actorId, kind, to: source.to };
      }
      if (gameType === 'chess') {
        if (
          kind !== 'move' ||
          typeof source.from !== 'number' ||
          typeof source.to !== 'number' ||
          (source.promotion !== undefined && !['q', 'r', 'b', 'n'].includes(String(source.promotion)))
        ) {
          throw new BadRequestException('ساختار حرکت شطرنج نامعتبر است');
        }
        return {
          player: actorId,
          kind,
          from: source.from,
          to: source.to,
          ...(source.promotion === undefined ? {} : { promotion: source.promotion }),
        };
      }
      if (gameType === 'vegas') {
        if (
          !['roll', 'place', 'nextRound'].includes(kind) ||
          (source.value !== undefined && typeof source.value !== 'number')
        ) {
          throw new BadRequestException('ساختار حرکت وگاس نامعتبر است');
        }
        return {
          player: actorId,
          kind,
          ...(source.value === undefined ? {} : { value: source.value }),
        };
      }
      if (gameType === 'backgammon') {
        const validFrom = source.from === undefined || source.from === 'bar' || typeof source.from === 'number';
        const validTo = source.to === undefined || source.to === 'off' || typeof source.to === 'number';
        if (
          !['roll', 'move'].includes(kind) ||
          !validFrom ||
          !validTo ||
          (source.amount !== undefined && typeof source.amount !== 'number')
        ) {
          throw new BadRequestException('ساختار حرکت تخته نامعتبر است');
        }
        return {
          player: actorId,
          kind,
          ...(source.from === undefined ? {} : { from: source.from }),
          ...(source.to === undefined ? {} : { to: source.to }),
          ...(source.amount === undefined ? {} : { amount: source.amount }),
        };
      }
      throw new BadRequestException('بازی ناشناخته است');
    };

    if (!Array.isArray(move)) return bindAction(move);
    if (move.length === 0 || move.length > MAX_MOVE_CHAIN_ACTIONS) {
      throw new BadRequestException('زنجیرهٔ حرکت نامعتبر است');
    }
    return move.map(bindAction);
  }

  private participantName(socketId: string, fallback: string): string {
    return this.socketUsernames.get(socketId) ?? fallback;
  }

  private async emitPresence(roomCode: string, room?: RoomWithParsedData | null) {
    const currentRoom = room ?? await this.roomService.getRoom(roomCode);
    if (!currentRoom) return;
    const connectedIds = new Set(this.server.sockets.adapter.rooms.get(roomCode) ?? []);
    const players: PresenceParticipant[] = currentRoom.players.map((id, index) => ({
      id,
      name: this.participantName(id, `بازیکن ${index + 1}`),
      role: currentRoom.ownerId === id ? 'creator' : 'player',
      connection: connectedIds.has(id) ? 'connected' : 'reconnecting',
    }));
    const spectators: PresenceParticipant[] = [...(this.roomSpectators.get(roomCode) ?? [])]
      .filter((id) => connectedIds.has(id))
      .map((id, index) => ({
        id,
        name: this.participantName(id, `تماشاچی ${index + 1}`),
        role: 'spectator',
        connection: 'connected',
      }));
    this.server.to(roomCode).emit('presenceUpdate', { room: roomCode, participants: [...players, ...spectators] });
  }

  private clearReconnectTimer(roomCode: string, socketId: string) {
    const key = `${roomCode}:${socketId}`;
    const timer = this.reconnectTimers.get(key);
    if (timer) clearTimeout(timer);
    this.reconnectTimers.delete(key);
  }

  private scheduleTicTacToeDisconnect(room: RoomWithParsedData, socketId: string) {
    this.clearReconnectTimer(room.code, socketId);
    const reconnectBy = Date.now() + TIC_TAC_TOE_RECONNECT_GRACE_MS;
    this.server.to(room.code).emit('sessionNotice', {
      kind: 'player-reconnecting',
      participantId: socketId,
      reconnectBy,
    });
    this.reconnectTimers.set(
      `${room.code}:${socketId}`,
      setTimeout(() => void this.finishDisconnectedTicTacToe(room.code, socketId), TIC_TAC_TOE_RECONNECT_GRACE_MS),
    );
  }

  private async finishDisconnectedTicTacToe(roomCode: string, socketId: string) {
    this.reconnectTimers.delete(`${roomCode}:${socketId}`);
    const room = await this.roomService.getRoom(roomCode);
    if (!room || room.status !== 'playing' || room.gameType !== 'tic-tac-toe' || !room.players.includes(socketId)) return;
    const winner = room.players.find((id) => id !== socketId) ?? null;
    const finalState = {
      ...(room.currentState ?? {}),
      phase: 'finished',
      winner,
    } as GameState;
    const finished = await this.roomService.finishRoom(roomCode, winner, finalState);
    this.clearTurnTimers(roomCode);
    this.server.to(roomCode).emit('gameState', finalState);
    this.server.to(roomCode).emit('gameOver', {
      room: roomCode,
      winner,
      scores: room.scores,
      state: finalState,
      reason: 'reconnect-timeout',
    });
    this.server.to(roomCode).emit('roomUpdate', finished);
    this.server.to(roomCode).emit('sessionNotice', {
      kind: 'game-ended-after-disconnect',
      participantId: socketId,
      winner,
    });
    await this.emitPresence(roomCode, finished);
  }

  private scheduleTurnTimer(roomCode: string, state: GameState | null) {
    this.clearTurnTimers(roomCode);
    if (!state || !state.turn) return;
    const endsAt = Date.now() + TURN_MS;
    this.server.to(roomCode).emit('turnStarted', { room: roomCode, player: state.turn, endsAt });
    this.turnWarnTimers.set(
      roomCode,
      setTimeout(() => {
        this.server.to(roomCode).emit('turnWarning', { room: roomCode, player: state.turn });
      }, TURN_MS - TURN_WARN_MS),
    );
    this.turnTimers.set(
      roomCode,
      setTimeout(() => {
        void this.expireTurn(roomCode, state);
      }, TURN_MS),
    );
  }

  private async expireTurn(roomCode: string, state: GameState) {
    this.turnTimers.delete(roomCode);
    const room = await this.roomService.getRoom(roomCode);
    if (!room || room.status !== 'playing' || !room.currentState) return;
    if (JSON.stringify(room.currentState) !== JSON.stringify(state)) return;
    this.server.to(roomCode).emit('turnTimeout', { room: roomCode, player: state.turn });

    // فقط در صورتی که بازیکن هیچ حرکت قانونی نداشته باشد، نوبت خودکار رد میشود
    // (قوانین بازی حفظ میشود؛ برخلاف نسخه قدیمی که اجباری رد میکرد).
    const adapter = this.resolveGame(room.gameType);
    const legal = adapter.getLegalMoves(room.currentState as GameState);
    if (legal.length === 0) {
      try {
        const next = adapter.applyChain(room.currentState as GameState, []) as GameState;
        await this.roomService.saveState(roomCode, next);
        this.server.to(roomCode).emit('gameState', next);
        this.scheduleTurnTimer(roomCode, next);
      } catch {
        /* اگر بازی تمام شده، نادیده بگیر */
      }
    }
  }

  // ------------------------------------------------------- connection/auth

  handleConnection(client: Socket) {
    const token = (client.handshake.auth as { token?: string } | undefined)?.token;
    if (token) void this.tryBindWithToken(client, token);
  }

  handleDisconnect(client: Socket) {
    void this.handleDisconnectInternal(client);
  }

  private async handleDisconnectInternal(client: Socket) {
    const userId = this.socketUsers.get(client.id);
    const rooms = this.socketRooms.get(client.id) ?? client.rooms;
    // Socket.IO may clear client.rooms before this callback; socketRooms keeps
    // the session context long enough to inform the other participants.
    for (const roomCode of rooms) {
      if (roomCode === client.id) continue;
      const room = await this.roomService.getRoom(roomCode);
      if (!room) continue;
      if (room.players.includes(client.id) && room.status !== 'finished') {
        const seatKey = this.seatKeys.get(`${roomCode}:${client.id}`)?.value;
        const entry = { value: userId ?? null, at: Date.now(), socketId: client.id, seatKey };
        // کلیدهای مختلف برای بازپسگیری: با socket قدیمی، با userId، با seatKey
        this.vacatedUsers.set(`${roomCode}:${client.id}`, entry);
        if (userId) this.vacatedUsers.set(`${roomCode}:user:${userId}`, entry);
        if (seatKey) this.vacatedUsers.set(`${roomCode}:key:${seatKey}`, entry);

        if (room.gameType === 'tic-tac-toe' && room.status === 'playing') {
          this.scheduleTicTacToeDisconnect(room, client.id);
          this.emitSystemMessage(roomCode, 'اتصال یکی از بازیکنان قطع شده؛ برای بازگشت او کمی صبر می‌کنیم', userId, 'info', this.socketUsernames.get(client.id));
        } else {
          const updated = await this.roomService.removePlayer(roomCode, client.id);
          this.server.to(roomCode).emit('roomUpdate', updated);
          this.emitSystemMessage(roomCode, 'یک بازیکن از اتاق خارج شد', userId, 'info', this.socketUsernames.get(client.id));
        }
        await this.emitPresence(roomCode);
      }
      this.roomSpectators.get(roomCode)?.delete(client.id);
      await this.emitPresence(roomCode);
    }
    this.socketRooms.delete(client.id);
    this.socketUsers.delete(client.id);
    this.socketUsernames.delete(client.id);
  }

  private async tryBindWithToken(client: Socket, token: string): Promise<boolean> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      if (!payload?.sub) return false;
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { username: true, deactivated: true },
      });
      if (!user || user.deactivated) return false;
      this.socketUsers.set(client.id, payload.sub);
      if (user.username) this.socketUsernames.set(client.id, user.username);
      return true;
    } catch {
      return false;
    }
  }

  /** یافتن نشستِ خالی‌شده با هر کلید (socketId / userId / seatKey) */
  private getVacatedEntry(
    key: string,
  ): { value: string | null; at: number; socketId: string; seatKey?: string } | null {
    const entry = this.vacatedUsers.get(key);
    if (!entry) return null;
    if (Date.now() - entry.at > SEAT_CLAIM_TTL) {
      this.clearVacatedBySocket(entry.socketId);
      return null;
    }
    return entry;
  }

  /** پاک کردن همهٔ کلیدهای یک نشست خالی‌شده */
  private clearVacatedBySocket(socketId: string) {
    for (const key of this.vacatedUsers.keys()) {
      if (key.endsWith(`:${socketId}`) || this.vacatedUsers.get(key)?.socketId === socketId) {
        this.vacatedUsers.delete(key);
      }
    }
  }

  /** جایگزینی شناسهٔ سوکت قدیمی با جدید در state جاری (پس از ریفرش/بازاتصال) */
  private swapPlayerIds(state: GameState, oldId: string, newId: string): GameState {
    const next = JSON.parse(JSON.stringify(state)) as Record<string, unknown> & {
      players?: { id: string }[];
      turn?: string;
      winner?: string | null;
      scores?: Record<string, number>;
      playerCash?: Record<string, number>;
      playerCards?: Record<string, number>;
      playerDice?: Record<string, unknown>;
      playerDiceRemaining?: Record<string, number>;
      board?: unknown;
    };
    if (Array.isArray(next.players)) {
      for (const p of next.players) if (p.id === oldId) p.id = newId;
    }
    if (next.turn === oldId) next.turn = newId;
    if (next.winner === oldId) next.winner = newId;
    if (next.scores && oldId in next.scores) {
      next.scores[newId] = next.scores[oldId];
      delete next.scores[oldId];
    }
    // وگاس: نقشه‌های کلیدخورده با playerId
    for (const mapName of ['playerCash', 'playerCards', 'playerDice', 'playerDiceRemaining'] as const) {
      const map = next[mapName] as Record<string, unknown> | undefined;
      if (map && oldId in map) {
        map[newId] = map[oldId];
        delete map[oldId];
      }
    }
    if (Array.isArray(next.board)) {
      for (const casino of next.board as { dice?: Record<string, number>; stack?: { winnerIndex?: string | null; runnerUpIndex?: string | null } }[]) {
        if (casino?.dice && oldId in casino.dice) {
          casino.dice[newId] = casino.dice[oldId];
          delete casino.dice[oldId];
        }
        if (casino?.stack) {
          if (casino.stack.winnerIndex === oldId) casino.stack.winnerIndex = newId;
          if (casino.stack.runnerUpIndex === oldId) casino.stack.runnerUpIndex = newId;
        }
      }
    }
    return next as GameState;
  }

  private issueSeatKey(client: Socket, roomCode: string) {
    const seatKey = randomBytes(16).toString('hex');
    this.seatKeys.set(`${roomCode}:${client.id}`, { value: seatKey, at: Date.now() });
    client.emit('seatKey', { room: roomCode, seatKey });
  }

  // --------------------------------------------------------------- events

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = joinRoomSchema.safeParse(payload);
    if (!parsed.success) {
      client.emit('error', { message: 'درخواست نامعتبر است' });
      return;
    }
    const data = parsed.data;
    const roomCode = typeof data === 'string' ? data : data.roomCode;
    const gameType = typeof data === 'string' ? undefined : data.gameType;
    const maxRounds = typeof data === 'string' ? undefined : data.maxRounds;
    const seatKey = typeof data === 'string' ? undefined : data.seatKey;
    const token = typeof data === 'string' ? undefined : data.token;
    if (!roomCode) return;

    if (token) await this.tryBindWithToken(client, token);

    try {
      let room = await this.roomService.getRoom(roomCode);

      // Room creation is intentionally bounded by the HTTP endpoint. Socket
      // joins may claim a seat only in an already-created room.
      if (!room) {
        client.emit('error', { message: 'اتاق یافت نشد' });
        return;
      }

      // ۲) بازپسگیری صندلی خالی شده (بعد از قطع اتصال/رفرش)
      if (!room.players.includes(client.id)) {
        const boundUserId = this.socketUsers.get(client.id);
        let oldSocketId: string | undefined;

        // (الف) کاربر لاگین‌شده: همان کاربر روی سوکت دیگری هنوز نشسته است (ریفرش)
        if (boundUserId) {
          oldSocketId = room.players.find(
            (p) => p !== client.id && this.socketUsers.get(p) === boundUserId,
          );
        }
        // (ب) صندلی خالی‌شده (disconnect اجرا شده) — با userId یا seatKey یا socketId
        if (!oldSocketId) {
          const reclaimEntry =
            (boundUserId ? this.getVacatedEntry(`${roomCode}:user:${boundUserId}`) : null) ??
            (seatKey ? this.getVacatedEntry(`${roomCode}:key:${seatKey}`) : null) ??
            this.getVacatedEntry(`${roomCode}:${client.id}`);
          oldSocketId = reclaimEntry?.socketId;
        }
        // (ج) race ریفرش: سوکت قدیمی هنوز متصل است و همین seatKey را دارد
        if (!oldSocketId && seatKey) {
          const hit = [...this.seatKeys.entries()].find(
            ([k, v]) => k.startsWith(`${roomCode}:`) && v.value === seatKey,
          );
          oldSocketId = hit ? hit[0].split(':').pop() : undefined;
        }

        if (oldSocketId && room.players.includes(oldSocketId)) {
          // همان نشست/کاربر دوباره متصل شد → جابه‌جایی به صندلی قبلی
          await this.roomService.swapPlayer(roomCode, oldSocketId, client.id);
          if (room.currentState) {
            const swapped = this.swapPlayerIds(room.currentState, oldSocketId, client.id);
            await this.roomService.saveState(roomCode, swapped);
            this.server.to(roomCode).emit('gameState', swapped);
            this.scheduleTurnTimer(roomCode, swapped);
          }
          this.clearVacatedBySocket(oldSocketId);
          this.clearReconnectTimer(roomCode, oldSocketId);
          this.issueSeatKey(client, roomCode);
          await client.join(roomCode);
          this.rememberRoom(client.id, roomCode);
          this.forgetRoom(oldSocketId, roomCode);
          const freshRoom = await this.roomService.getRoom(roomCode);
          this.server.to(roomCode).emit('roomUpdate', freshRoom);
          this.server.to(roomCode).emit('sessionNotice', {
            kind: 'player-reconnected',
            participantId: client.id,
          });
          this.emitSystemMessage(roomCode, 'بازیکن دوباره متصل شد', this.socketUsers.get(client.id), 'success', this.socketUsernames.get(client.id));
          await this.emitPresence(roomCode, freshRoom);
          return;
        }
      }

      // ۳) نشستن در صندلی خالی
      if (!room.players.includes(client.id)) {
        const maxPlayers = room.gameType === 'vegas' ? 5 : 2;
        if (room.players.length >= maxPlayers) {
          // اتاق پر است → تماشاچی: فقط به اتاق میپیوندد، بازی را زنده میبیند
          await client.join(roomCode);
          this.rememberRoom(client.id, roomCode);
          const spectators = this.roomSpectators.get(roomCode) ?? new Set<string>();
          spectators.add(client.id);
          this.roomSpectators.set(roomCode, spectators);
          if (room.currentState) client.emit('gameState', room.currentState);
          client.emit('roomUpdate', room);
          client.emit('spectate', { room: roomCode });
          this.emitSystemMessage(roomCode, 'یک تماشاچی به بازی پیوست', this.socketUsers.get(client.id), 'info', this.socketUsernames.get(client.id));
          await this.emitPresence(roomCode, room);
          return;
        }
        room = await this.roomService.joinRoom(roomCode, client.id);
        this.issueSeatKey(client, roomCode);
        await client.join(roomCode);
        this.rememberRoom(client.id, roomCode);
        this.server.to(roomCode).emit('roomUpdate', room);
        this.emitSystemMessage(roomCode, 'یک بازیکن وارد اتاق شد', this.socketUsers.get(client.id), 'info', this.socketUsernames.get(client.id));
        await this.emitPresence(roomCode, room);
        return;
      }

      // ۴) عضو موجود — فقط به اتاق ملحق شو
      await client.join(roomCode);
      this.rememberRoom(client.id, roomCode);
      if (room.currentState) {
        client.emit('gameState', room.currentState);
        this.scheduleTurnTimer(roomCode, room.currentState);
      }
      this.server.to(roomCode).emit('roomUpdate', room);
      await this.emitPresence(roomCode, room);
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا در پیوستن به اتاق' });
    }
  }

  @UseGuards(WsRateLimitGuard)
  @SubscribeMessage('startGame')
  async handleStartGame(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomCode: string }) {
    try {
      const room = await this.roomService.getRoom(payload.roomCode);
      if (!room) throw new BadRequestException('اتاق یافت نشد');
      this.assertSeatedMember(client, room);
      if (room.ownerId && room.ownerId !== client.id) throw new BadRequestException('فقط سازنده اتاق میتواند بازی را شروع کند');
      if (room.players.length < 2) throw new BadRequestException('برای شروع بازی حداقل دو بازیکن لازم است');
      const state = this.initialState(room);
      const updated = await this.roomService.startGame(payload.roomCode, state, { resetScores: true });
      this.server.to(payload.roomCode).emit('gameState', state);
      this.server.to(payload.roomCode).emit('roomUpdate', updated);
      this.server.to(payload.roomCode).emit('sessionNotice', { kind: 'game-started' });
      this.emitSystemMessage(payload.roomCode, 'بازی شروع شد');
      this.scheduleTurnTimer(payload.roomCode, state);
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا در شروع بازی' });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = leaveRoomSchema.safeParse(payload);
    if (!parsed.success) return;
    const roomCode = parsed.data.roomCode;
    try {
      const room = await this.roomService.getRoom(roomCode);
      if (!room) return;
      const seated = room.players.includes(client.id);

      if (seated && room.gameType === 'tic-tac-toe' && room.status === 'playing') {
        const winner = room.players.find((id) => id !== client.id) ?? null;
        const finalState = {
          ...(room.currentState ?? {}),
          phase: 'finished',
          winner,
        } as GameState;
        const finished = await this.roomService.finishRoom(roomCode, winner, finalState);
        this.clearTurnTimers(roomCode);
        this.clearReconnectTimer(roomCode, client.id);
        this.server.to(roomCode).emit('gameState', finalState);
        this.server.to(roomCode).emit('gameOver', {
          room: roomCode,
          winner,
          scores: room.scores,
          state: finalState,
          reason: room.ownerId === client.id ? 'creator-ended' : 'player-left',
        });
        this.server.to(roomCode).emit('roomUpdate', finished);
        this.server.to(roomCode).emit('sessionNotice', {
          kind: room.ownerId === client.id ? 'game-ended-by-creator' : 'game-ended-by-player',
          participantId: client.id,
          winner,
        });
      } else if (seated && room.status !== 'finished') {
        const updated = await this.roomService.removePlayer(roomCode, client.id);
        this.server.to(roomCode).emit('roomUpdate', updated);
      }

      this.forgetRoom(client.id, roomCode);
      await client.leave(roomCode);
      await this.emitPresence(roomCode);
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خروج از اتاق ممکن نشد' });
    }
  }

  /** پایان یک راند: بهروزرسانی امتیازها و بررسی پایان مسابقه */
  private async handleRoundOver(room: RoomWithParsedData, finalState: GameState) {
    if (room.gameType === 'backgammon') {
      const scores = { ...(finalState.scores ?? {}) };
      await this.roomService.saveScores(room.code, scores);
      this.undoStacks.delete(room.code);
      this.clearTurnTimers(room.code);
      this.server.to(room.code).emit('matchScore', { room: room.code, scores });

      if (finalState.phase === 'roundEnd') {
        this.server.to(room.code).emit('roundOver', {
          room: room.code,
          winner: (finalState as { gameWinner?: string | null }).gameWinner ?? null,
          points: (finalState as { gamePoints?: number }).gamePoints ?? 1,
          scores,
          state: finalState,
        });
        this.emitSystemMessage(room.code, 'این دست تمام شد؛ نتیجه را ببینید و دست بعدی را شروع کنید');
        return;
      }

      const matchWinner = finalState.winner ?? '';
      await this.roomService.finishRoom(room.code, matchWinner, finalState);
      const finalRoom = await this.roomService.getRoom(room.code);
      this.server.to(room.code).emit('gameOver', {
        room: room.code,
        winner: matchWinner,
        scores,
        state: finalState,
      });
      this.server.to(room.code).emit('roomUpdate', finalRoom);
      this.emitSystemMessage(room.code, 'مسابقه تخته تمام شد', matchWinner || undefined, 'success');
      return;
    }

    // وگاس: راندهای ۴گانه داخل خود بازی است — پایان state یعنی پایان کل مسابقه
    if (room.gameType === 'vegas') {
      await this.roomService.finishRoom(room.code, finalState.winner ?? '', finalState);
      this.undoStacks.delete(room.code);
      const finalRoom = await this.roomService.getRoom(room.code);
      this.server.to(room.code).emit('gameOver', {
        room: room.code,
        winner: finalState.winner,
        scores: {},
        state: finalState,
      });
      this.server.to(room.code).emit('roomUpdate', finalRoom);
      this.emitSystemMessage(room.code, 'بازی وگاس تمام شد', finalState.winner ?? undefined, 'success');
      this.clearTurnTimers(room.code);
      return;
    }

    const winnerId = finalState.winner ?? null;
    const scores = { ...room.scores };
    if (winnerId) {
      // Get points from state (handles Mars/Cube)
      const points = (finalState as any).scores?.[winnerId] ?? 1;
      scores[winnerId] = (scores[winnerId] ?? 0) + points;
    }

    await this.roomService.saveScores(room.code, scores);
    this.server.to(room.code).emit('matchScore', { room: room.code, scores });

    const target = this.matchTarget(room.maxRounds);
    const loserId = room.players.find((id) => id !== winnerId);
    const loserScore = loserId ? (scores[loserId] ?? 0) : 0;
    const winnerScore = winnerId ? (scores[winnerId] ?? 0) : 0;
    const leadOk = room.gameType !== 'tic-tac-toe' || (winnerScore - loserScore >= 2);
    const matchWinner = winnerId && winnerScore >= target && leadOk ? winnerId : null;

    if (matchWinner) {
      await this.roomService.finishRoom(room.code, matchWinner, finalState);
      this.undoStacks.delete(room.code);
      const finalRoom = await this.roomService.getRoom(room.code);
      this.server.to(room.code).emit('gameOver', {
        room: room.code,
        winner: matchWinner,
        scores,
        state: finalState,
      });
      this.server.to(room.code).emit('roomUpdate', finalRoom);
      this.emitSystemMessage(room.code, 'بازی تمام شد', matchWinner, 'success', this.socketUsernames.get(matchWinner));
      this.clearTurnTimers(room.code);

      // ثبت تاریخچه + آمار (فقط کاربران احراز هویت شده)
      const authedPlayers = room.players
        .map((socketId) => this.socketUsers.get(socketId))
        .filter((userId): userId is string => Boolean(userId));
      const realWinner = this.socketUsers.get(matchWinner) ?? null;
      if (authedPlayers.length >= 2) {
        await this.historyService.recordGameResult({
          roomCode: room.code,
          gameName: room.gameType,
          winnerId: realWinner,
          players: authedPlayers,
          finalState,
        });
      }
    } else {
      // راند تمام شد، مسابقه ادامه دارد → راند بعدی
      await this.roomService.startGame(room.code, this.initialState(room));
      const updated = await this.roomService.getRoom(room.code);
      this.server.to(room.code).emit('gameState', updated?.currentState);
      this.server.to(room.code).emit('roomUpdate', updated);
      this.emitSystemMessage(room.code, `راند بعدی — امتیاز: ${JSON.stringify(scores)}`);
      if (updated?.currentState) this.scheduleTurnTimer(room.code, updated.currentState);
    }
  }

  /** اعتبارسنجی و اعمال یک حرکت با تطبیقگر جدید */
  private async applyValidatedMove(room: RoomWithParsedData, move: unknown) {
    const adapter = this.resolveGame(room.gameType);
    const state = room.currentState as GameState;
    if (!state || state.phase === 'finished') throw new BadRequestException('بازی فعال نیست');

    let next: GameState;
    if (Array.isArray(move)) {
      next = adapter.applyChain(state, move) as GameState;
    } else if (room.gameType === 'backgammon' && (move as { kind?: string }).kind === 'roll') {
      next = adapter.applyChain(state, [move as never]) as GameState;
    } else {
      next = adapter.applyMove(state, move as never) as GameState;
    }

    // Undo policy belongs to the game. Random actions such as Backgammon rolls
    // must never become a transport-level reversible snapshot.
    const actions = Array.isArray(move) ? move : [move];
    const undoable = actions.some((action) =>
      adapter.canUndoMove ? adapter.canUndoMove(state as never, action as never) : true,
    );
    if (undoable) {
      const stack = this.undoStacks.get(room.code) ?? [];
      const actorId = (actions[0] as { player?: string } | undefined)?.player ?? state.turn;
      stack.push({ state, actorId });
      if (stack.length > UNDO_DEPTH) stack.shift();
      this.undoStacks.set(room.code, stack);
    }

    await this.roomService.saveState(room.code, next);
    const updated = await this.roomService.getRoom(room.code);
    this.server.to(room.code).emit('gameState', next);
    this.server.to(room.code).emit('roomUpdate', updated);

    if (next.phase === 'finished' || next.phase === 'roundEnd') {
      await this.handleRoundOver(updated!, next);
    } else {
      this.scheduleTurnTimer(room.code, next);
    }
  }

  @UseGuards(WsRateLimitGuard)
  @SubscribeMessage('makeMove')
  async handleMakeMove(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    try {
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new BadRequestException('درخواست حرکت نامعتبر است');
      }
      const { roomCode, move } = body as { roomCode?: unknown; move?: unknown };
      if (typeof roomCode !== 'string' || roomCode.length < 1 || roomCode.length > 16) {
        throw new BadRequestException('کد اتاق نامعتبر است');
      }
      const room = await this.roomService.getRoom(roomCode);
      if (!room) throw new BadRequestException('اتاق یافت نشد');
      this.assertSeatedMember(client, room);
      const state = room.currentState as GameState;
      if (!state || state.turn !== client.id) throw new BadRequestException('نوبت شما نیست');
      await this.applyValidatedMove(room, this.bindMoveActor(move, client.id, room.gameType));
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'حرکت نامعتبر' });
    }
  }

  @UseGuards(WsRateLimitGuard)
  @SubscribeMessage('rollDice')
  async handleRollDice(@ConnectedSocket() client: Socket, @MessageBody() body: { roomCode: string }) {
    try {
      const room = await this.roomService.getRoom(body.roomCode);
      if (!room) throw new BadRequestException('اتاق یافت نشد');
      this.assertSeatedMember(client, room);
      const state = room.currentState as GameState;
      if (!state || state.turn !== client.id) throw new BadRequestException('نوبت شما نیست');
      await this.applyValidatedMove(room, { player: client.id, kind: 'roll' });
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا در ریختن تاس' });
    }
  }

  @UseGuards(WsRateLimitGuard)
  @SubscribeMessage('gameAction')
  async handleGameAction(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = gameActionSchema.safeParse(payload);
    if (!parsed.success) return;
    const { room, moveName, endTurn } = parsed.data;
    const action = moveName ?? (endTurn ? 'endTurn' : null);
    if (!action) return;
    const roomCode = room;
    try {
      const room = await this.roomService.getRoom(roomCode);
      if (!room) throw new BadRequestException('اتاق یافت نشد');
      this.assertSeatedMember(client, room);
      const state = room.currentState as GameState;
      if (!state || state.turn !== client.id) throw new BadRequestException('نوبت شما نیست');

      if (action === 'endTurn') {
        const adapter = this.resolveGame(room.gameType);
        const legal = adapter.getLegalMoves(state);
        if (legal.length > 0) throw new BadRequestException('ابتدا حرکت قانونی انجام دهید');
        await this.applyValidatedMove(room, []);
      } else if (action === 'rollDice') {
        await this.applyValidatedMove(room, { player: client.id, kind: 'roll' });
      } else {
        throw new BadRequestException('اکشن نامعتبر است');
      }
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا' });
    }
  }

  @SubscribeMessage('nextRound')
  @UseGuards(WsRateLimitGuard)
  async handleNextRound(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = nextRoundSchema.safeParse(payload);
    if (!parsed.success) return;
    try {
      const room = await this.roomService.getRoom(parsed.data.room);
      if (!room || room.status !== 'playing') return;
      if (!this.isRoomMember(client.id, room.code) || !room.players.includes(client.id)) {
        throw new BadRequestException('فقط بازیکنان این اتاق می‌توانند بازی را ادامه دهند');
      }
      if (room.gameType !== 'backgammon') {
        throw new BadRequestException('این بازی ادامهٔ دستی راند را پشتیبانی نمی‌کند');
      }
      const current = room.currentState as GameState | null;
      if (!current || current.phase !== 'roundEnd') {
        throw new BadRequestException('دست بعدی هنوز آماده شروع نیست');
      }
      const adapter = this.resolveGame(room.gameType);
      if (!adapter.startNextGame) throw new BadRequestException('این بازی ادامه مسابقه را پشتیبانی نمی‌کند');
      await this.roomService.startGame(room.code, adapter.startNextGame(current as never) as GameState);
      this.undoStacks.delete(room.code);
      const updated = await this.roomService.getRoom(room.code);
      this.server.to(room.code).emit('gameState', updated?.currentState);
      this.server.to(room.code).emit('roomUpdate', updated);
      if (updated?.currentState) this.scheduleTurnTimer(room.code, updated.currentState);
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا' });
    }
  }

  @SubscribeMessage('newGame')
  @UseGuards(WsRateLimitGuard)
  async handleNewGame(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = newGameSchema.safeParse(payload);
    if (!parsed.success) return;
    try {
      const room = await this.roomService.getRoom(parsed.data.roomCode);
      if (!room) throw new BadRequestException('اتاق یافت نشد');
      if (!this.isRoomMember(client.id, room.code) || !room.players.includes(client.id)) {
        throw new BadRequestException('فقط بازیکنان این اتاق می‌توانند درخواست بازی دوباره بدهند');
      }
      if (room.status !== 'finished' && room.currentState?.phase !== 'finished') {
        throw new BadRequestException('بازی فعلی هنوز تمام نشده است');
      }

      if (room.gameType === 'tic-tac-toe') {
        const votes = this.rematchVotes.get(room.code) ?? new Set<string>();
        votes.add(client.id);
        this.rematchVotes.set(room.code, votes);
        const requiredPlayers = room.players.filter((playerId) => this.isRoomMember(playerId, room.code));
        const accepted = requiredPlayers.length >= 2 && requiredPlayers.every((playerId) => votes.has(playerId));
        this.server.to(room.code).emit('rematchUpdate', {
          requesterId: client.id,
          voterIds: [...votes],
          required: requiredPlayers.length,
          status: accepted ? 'accepted' : 'waiting',
        });
        if (!accepted) return;
      }

      const state = this.initialState(room);
      const updated = await this.roomService.startGame(room.code, state, { resetScores: true });
      this.rematchVotes.delete(room.code);
      this.server.to(room.code).emit('gameState', state);
      this.server.to(room.code).emit('roomUpdate', updated);
      this.server.to(room.code).emit('sessionNotice', { kind: 'game-started' });
      this.emitSystemMessage(room.code, 'بازی جدید شروع شد');
      this.scheduleTurnTimer(room.code, state);
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا' });
    }
  }

  @SubscribeMessage('undo')
  @UseGuards(WsRateLimitGuard)
  async handleUndo(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = undoSchema.safeParse(payload);
    if (!parsed.success) return;
    const { room: roomCode } = parsed.data;
    const room = await this.roomService.getRoom(roomCode);
    if (!room) return;
    try {
      this.assertSeatedMember(client, room);
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'اقدام غیرمجاز' });
      return;
    }
    const stack = this.undoStacks.get(roomCode) ?? [];
    if (stack.length === 0) {
      client.emit('error', { message: 'حرکتی برای بازگرداندن نیست' });
      return;
    }
    const last = stack[stack.length - 1];
    if (last.actorId !== client.id) {
      client.emit('error', { message: 'فقط بازیکن آخرین حرکت میتواند آن را برگرداند' });
      return;
    }
    stack.pop();
    await this.roomService.saveState(roomCode, last.state);
    this.server.to(roomCode).emit('gameState', last.state);
    this.emitSystemMessage(roomCode, 'حرکت بازگردانی شد', this.socketUsers.get(client.id), 'success', this.socketUsernames.get(client.id));
    this.scheduleTurnTimer(roomCode, last.state);
  }

  @SubscribeMessage('chatMessage')
  @UseGuards(WsRateLimitGuard)
  async handleChatMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = chatSchema.safeParse(payload);
    if (!parsed.success) return;
    const { room: roomCode, message } = parsed.data;
    if (!this.isRoomMember(client.id, roomCode)) return;
    if (!await this.roomService.getRoom(roomCode)) return;
    if (!message || message.trim().length === 0) return;
    const trimmed = message.trim().slice(0, MAX_CHAT_LENGTH);
    this.server.to(roomCode).emit('systemMessage', {
      type: 'chat',
      userId: this.socketUsers.get(client.id),
      username: this.socketUsernames.get(client.id) ?? 'مهمان',
      message: trimmed,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('reaction')
  @UseGuards(WsRateLimitGuard)
  handleReaction(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = reactionSchema.safeParse(payload);
    if (!parsed.success || !this.socketRooms.get(client.id)?.has(parsed.data.room)) return;
    this.server.to(parsed.data.room).emit('reaction', {
      participantId: client.id,
      username: this.socketUsernames.get(client.id) ?? 'مهمان',
      reaction: parsed.data.reaction,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('double')
  @UseGuards(WsRateLimitGuard)
  async handleDouble(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = doubleSchema.safeParse(payload);
    if (!parsed.success) return;
    try {
      const room = await this.roomService.getRoom(parsed.data.room);
      if (!room || room.status !== 'playing' || room.gameType !== 'backgammon') return;
      this.assertSeatedMember(client, room);
      const state = room.currentState as any;
      if (state.turn !== client.id) throw new BadRequestException('نوبت شما نیست');

      // Import directly from rules to be safe
      const { offerDouble } = await import('@bazigb/game-backgammon');
      const next = offerDouble(state, client.id);

      await this.roomService.saveState(room.code, next);
      this.server.to(room.code).emit('gameState', next);
      this.emitSystemMessage(room.code, 'پیشنهاد دابل (دوبرابر کردن امتیاز) داده شد', client.id, 'info', this.socketUsernames.get(client.id));
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا در پیشنهاد دابل' });
    }
  }

  @SubscribeMessage('doubleResponse')
  @UseGuards(WsRateLimitGuard)
  async handleDoubleResponse(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = doubleResponseSchema.safeParse(payload);
    if (!parsed.success) return;
    try {
      const room = await this.roomService.getRoom(parsed.data.room);
      if (!room || room.status !== 'playing' || room.gameType !== 'backgammon') return;
      this.assertSeatedMember(client, room);
      const state = room.currentState as any;
      const expectedResponder = room.players.find((playerId) => playerId !== state.doubling?.offeredBy);
      if (!state.doubling || expectedResponder !== client.id) throw new BadRequestException('پاسخ غیرمجاز');

      const { respondDouble } = await import('@bazigb/game-backgammon');
      const next = respondDouble(state, client.id, parsed.data.accept);

      await this.roomService.saveState(room.code, next);
      const updated = await this.roomService.getRoom(room.code);
      this.server.to(room.code).emit('gameState', next);
      this.server.to(room.code).emit('roomUpdate', updated);

      if (next.phase === 'finished' || next.phase === 'roundEnd') {
        this.emitSystemMessage(room.code, 'پیشنهاد دابل رد شد و راند به پایان رسید');
        await this.handleRoundOver(updated!, next);
      } else {
        this.emitSystemMessage(room.code, 'پیشنهاد دابل پذیرفته شد (امتیاز دوبرابر)', client.id, 'success', this.socketUsernames.get(client.id));
        this.scheduleTurnTimer(room.code, next);
      }
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا در پاسخ دابل' });
    }
  }
}
