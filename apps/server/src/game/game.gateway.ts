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
import { COLORS, REGISTRY, getMaxPlayers, publicGameState } from '../game-registry';
import {
  chatSchema,
  gameActionSchema,
  joinRoomSchema,
  makeMoveSchema,
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
const UNDO_DEPTH = 20;

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
    const match: MatchConfig = { matchPoint: true, winByTwo: false, targetScore: 1 };
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

  // ------------------------------------------- public/private state delivery
  // کاتان دادهٔ خصوصی (منابع/کارتهای توسعه/امتیاز پنهان) دارد؛ بقیهٔ بازیها
  // وضعیت کامل را عمومی میگیرند (رفتار قبلی — بدون تغییر).
  // شناسهٔ بازیکن در state برابر شناسهٔ سوکت است؛ پس سوکت هر بازیکن با همان
  // شناسه پیدا میشود.

  private publicState(room: RoomWithParsedData, state: GameState): unknown {
    return publicGameState(room.gameType, state);
  }

  /** برای کاتان، currentState در roomUpdate فقط نسخهٔ عمومی باشد */
  private roomUpdatePayload(room: RoomWithParsedData | null): unknown {
    if (!room || room.gameType !== 'catan') return room;
    const { currentState, ...rest } = room;
    return { ...rest, currentState: currentState ? this.publicState(room, currentState) : null };
  }

  private privateStateFor(room: RoomWithParsedData, state: GameState, playerId: string): unknown {
    if (room.gameType !== 'catan') return null;
    const raw = state as unknown as {
      playerStates?: Record<string, { resources?: unknown; devCards?: unknown; victoryPoints?: number }>;
    };
    const ps = raw.playerStates?.[playerId];
    if (!ps) return null;
    return { resources: ps.resources, devCards: ps.devCards, victoryPoints: ps.victoryPoints ?? 0 };
  }

  /** پخش وضعیت عمومی به کل اتاق + وضعیت خصوصی هر بازیکن (فقط کاتان) */
  private broadcastGameState(room: RoomWithParsedData, state: GameState) {
    this.server.to(room.code).emit('gameState', this.publicState(room, state));
    if (room.gameType !== 'catan') return;
    for (const pid of room.players) {
      const sock = this.server.sockets.sockets.get(pid);
      const priv = this.privateStateFor(room, state, pid);
      if (sock && priv) sock.emit('myPrivateState', { playerId: pid, ...(priv as object) });
    }
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
        this.broadcastGameState(room, next);
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
    // تمام اتاقهایی که این سوکت در آن نشسته بود
    for (const roomCode of client.rooms) {
      if (roomCode === client.id) continue;
      const room = await this.roomService.getRoom(roomCode);
      if (!room) continue;
      if (room.players.includes(client.id) && room.status !== 'finished') {
        await this.roomService.removePlayer(roomCode, client.id);
        const seatKey = this.seatKeys.get(`${roomCode}:${client.id}`)?.value;
        const entry = { value: userId ?? null, at: Date.now(), socketId: client.id, seatKey };
        // کلیدهای مختلف برای بازپسگیری: با socket قدیمی، با userId، با seatKey
        this.vacatedUsers.set(`${roomCode}:${client.id}`, entry);
        if (userId) this.vacatedUsers.set(`${roomCode}:user:${userId}`, entry);
        if (seatKey) this.vacatedUsers.set(`${roomCode}:key:${seatKey}`, entry);
        this.server.to(roomCode).emit('roomUpdate', this.roomUpdatePayload(room));
        this.emitSystemMessage(roomCode, 'یک بازیکن از اتاق خارج شد', userId, 'info', this.socketUsernames.get(client.id));
      }
    }
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
      playerStates?: Record<string, unknown>;
      setupOrder?: string[];
      discardPlayers?: string[];
      robberActor?: string | null;
      stealCandidates?: string[] | null;
      longestRoad?: { ownerId?: string };
      tradeOffers?: { from?: string }[];
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
    // کاتان: وضعیت بازیکنان، ترتیب setup، دورریز/راهزن/دزدی، طولانی‌ترین جاده و پیشنهادهای معامله
    if (next.playerStates && oldId in next.playerStates) {
      const moved = next.playerStates[oldId] as { id?: string };
      if (moved && typeof moved === 'object') moved.id = newId;
      next.playerStates[newId] = moved;
      delete next.playerStates[oldId];
    }
    for (const arrName of ['setupOrder', 'discardPlayers', 'stealCandidates'] as const) {
      const arr = next[arrName];
      if (Array.isArray(arr)) for (let i = 0; i < arr.length; i++) if (arr[i] === oldId) arr[i] = newId;
    }
    if (next.robberActor === oldId) next.robberActor = newId;
    if (next.longestRoad?.ownerId === oldId) next.longestRoad.ownerId = newId;
    if (Array.isArray(next.tradeOffers)) {
      for (const o of next.tradeOffers) if (o.from === oldId) o.from = newId;
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
      const connectedIds = new Set(this.server.sockets.adapter.rooms.get(roomCode) ?? []);

      // ۱) ساخت اتاق اگر وجود ندارد (اولین عضو مینشیند)
      if (!room) {
        room = await this.roomService.joinRoom(roomCode, client.id, gameType, maxRounds);
        this.issueSeatKey(client, roomCode);
        await client.join(roomCode);
        this.server.to(roomCode).emit('roomUpdate', this.roomUpdatePayload(room));
        this.emitSystemMessage(roomCode, 'اتاق ساخته شد', this.socketUsers.get(client.id), 'info', this.socketUsernames.get(client.id));
        return;
      }

      // ۲) بازپسگیری صندلی خالی شده (بعد از قطع اتصال/رفرش)
      let reclaiming = false;
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

        if (oldSocketId) reclaiming = true;
        if (oldSocketId && room.players.includes(oldSocketId)) {
          // همان نشست/کاربر دوباره متصل شد → جابه‌جایی به صندلی قبلی
          await this.roomService.swapPlayer(roomCode, oldSocketId, client.id);
          if (room.currentState) {
            const swapped = this.swapPlayerIds(room.currentState, oldSocketId, client.id);
            await this.roomService.saveState(roomCode, swapped);
            const freshRoom = await this.roomService.getRoom(roomCode);
            if (freshRoom) this.broadcastGameState(freshRoom, swapped);
            this.scheduleTurnTimer(roomCode, swapped);
          }
          this.clearVacatedBySocket(oldSocketId);
          this.issueSeatKey(client, roomCode);
          await client.join(roomCode);
          const freshRoom = await this.roomService.getRoom(roomCode);
          this.server.to(roomCode).emit('roomUpdate', this.roomUpdatePayload(freshRoom));
          this.emitSystemMessage(roomCode, 'بازیکن دوباره متصل شد', this.socketUsers.get(client.id), 'success', this.socketUsernames.get(client.id));
          return;
        }
        // قطع اتصال قبلاً ثبت شده بود: بازیکن از room.players حذف شده ولی state
        // همچنان شناسهٔ سوکت قدیمی را دارد → شناسه‌های state را جابه‌جا کن تا بازی
        // با سوکت جدید ادامه یابد (رفرش/بازاتصال در حالت عادی)
        if (oldSocketId && !room.players.includes(oldSocketId) && room.currentState) {
          const swapped = this.swapPlayerIds(room.currentState, oldSocketId, client.id);
          await this.roomService.saveState(roomCode, swapped);
          room = { ...room, currentState: swapped };
        }
      }

      // ۳) نشستن در صندلی خالی
      if (!room.players.includes(client.id)) {
        const maxPlayers = getMaxPlayers(room.gameType);
        // کاتان: وسط بازی فقط بازیکنِ قطعشده (بازپسگیری صندلی) میتواند بنشیند؛
        // بازیکن جدید تماشاچی میشود (state شامل او نیست)
        const midGameBlock = room.gameType === 'catan' && room.status === 'playing' && !reclaiming;
        if (room.players.length >= maxPlayers || midGameBlock) {
          // اتاق پر است یا ورود وسط بازی مجاز نیست → تماشاچی: فقط به اتاق میپیوندد
          await client.join(roomCode);
          if (room.currentState) client.emit('gameState', this.publicState(room, room.currentState));
          client.emit('roomUpdate', this.roomUpdatePayload(room));
          client.emit('spectate', { room: roomCode });
          this.emitSystemMessage(roomCode, 'یک تماشاچی به بازی پیوست', this.socketUsers.get(client.id), 'info', this.socketUsernames.get(client.id));
          return;
        }
        room = await this.roomService.joinRoom(roomCode, client.id);
        this.issueSeatKey(client, roomCode);
        await client.join(roomCode);
        this.server.to(roomCode).emit('roomUpdate', this.roomUpdatePayload(room));
        if (room.currentState) {
          const priv = this.privateStateFor(room, room.currentState, client.id);
          if (priv) client.emit('myPrivateState', { playerId: client.id, ...(priv as object) });
        }
        this.emitSystemMessage(roomCode, 'یک بازیکن وارد اتاق شد', this.socketUsers.get(client.id), 'info', this.socketUsernames.get(client.id));
        return;
      }

      // ۴) عضو موجود — فقط به اتاق ملحق شو
      await client.join(roomCode);
      if (room.currentState) {
        client.emit('gameState', this.publicState(room, room.currentState));
        const priv = this.privateStateFor(room, room.currentState, client.id);
        if (priv) client.emit('myPrivateState', { playerId: client.id, ...(priv as object) });
        this.scheduleTurnTimer(roomCode, room.currentState);
      }
      this.server.to(roomCode).emit('roomUpdate', this.roomUpdatePayload(room));
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا در پیوستن به اتاق' });
    }
  }

  @SubscribeMessage('startGame')
  async handleStartGame(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomCode: string }) {
    try {
      const room = await this.roomService.getRoom(payload.roomCode);
      if (!room) throw new BadRequestException('اتاق یافت نشد');
      // فقط بازیکنهای نشسته میتوانند بازی را شروع کنند (تماشاچی نه)
      if (!room.players.includes(client.id)) throw new BadRequestException('فقط بازیکنان میتوانند بازی را شروع کنند');
      const state = this.initialState(room);
      const updated = await this.roomService.startGame(payload.roomCode, state, { resetScores: true });
      this.broadcastGameState(room, state);
      this.server.to(payload.roomCode).emit('roomUpdate', this.roomUpdatePayload(updated));
      this.emitSystemMessage(payload.roomCode, 'بازی شروع شد');
      this.scheduleTurnTimer(payload.roomCode, state);
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا در شروع بازی' });
    }
  }

  /** پایان یک راند: بهروزرسانی امتیازها و بررسی پایان مسابقه */
  private async handleRoundOver(room: RoomWithParsedData, finalState: GameState) {
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
      this.server.to(room.code).emit('roomUpdate', this.roomUpdatePayload(finalRoom));
      this.emitSystemMessage(room.code, 'بازی وگاس تمام شد', finalState.winner ?? undefined, 'success');
      this.clearTurnTimers(room.code);
      return;
    }

    // کاتان: یک بازی کامل (تا ۱۰ امتیاز) است — پایان state یعنی پایان کل بازی؛
    // مسیر عمومی (امتیازهای راند) برای کاتان اشتباه است (scores صفر میماند).
    if (room.gameType === 'catan') {
      await this.roomService.finishRoom(room.code, finalState.winner ?? '', finalState);
      this.undoStacks.delete(room.code);
      const finalRoom = await this.roomService.getRoom(room.code);
      this.server.to(room.code).emit('gameOver', {
        room: room.code,
        winner: finalState.winner,
        scores: {},
        state: this.publicState(room, finalState),
      });
      this.server.to(room.code).emit('roomUpdate', this.roomUpdatePayload(finalRoom));
      this.emitSystemMessage(
        room.code,
        'بازی کاتان تمام شد',
        finalState.winner ?? undefined,
        'success',
        this.socketUsernames.get(finalState.winner ?? ''),
      );
      this.clearTurnTimers(room.code);

      // ثبت تاریخچه (فقط کاربران احراز هویت شده)
      const userIds = room.players.map((p) => this.socketUsers.get(p) ?? p);
      const authedPlayers = userIds.filter((id) => this.socketUsers.has(room.players[room.players.indexOf(id)]));
      const realWinner = this.socketUsers.get(finalState.winner ?? '') ?? null;
      if (authedPlayers.length >= 2 || (authedPlayers.length === 1 && realWinner)) {
        await this.historyService.recordGameResult({
          roomCode: room.code,
          gameName: room.gameType,
          winnerId: realWinner,
          players: userIds,
          finalState,
        });
      }
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
      const userIds = room.players.map((p) => this.socketUsers.get(p) ?? p);
      const finalRoom = await this.roomService.getRoom(room.code);
      this.server.to(room.code).emit('gameOver', {
        room: room.code,
        winner: matchWinner,
        scores,
        state: this.publicState(room, finalState),
      });
      this.server.to(room.code).emit('roomUpdate', this.roomUpdatePayload(finalRoom));
      this.emitSystemMessage(room.code, 'بازی تمام شد', matchWinner, 'success', this.socketUsernames.get(matchWinner));
      this.clearTurnTimers(room.code);

      // ثبت تاریخچه + آمار (فقط کاربران احراز هویت شده)
      const authedPlayers = userIds.filter((id) => this.socketUsers.has(room.players[room.players.indexOf(id)]));
      const realWinner = this.socketUsers.get(matchWinner) ?? null;
      if (authedPlayers.length >= 2 || (authedPlayers.length === 1 && realWinner)) {
        await this.historyService.recordGameResult({
          roomCode: room.code,
          gameName: room.gameType,
          winnerId: realWinner,
          players: userIds,
          finalState,
        });
      }
    } else {
      // راند تمام شد، مسابقه ادامه دارد → راند بعدی
      await this.roomService.startGame(room.code, this.initialState(room));
      const updated = await this.roomService.getRoom(room.code);
      if (updated?.currentState) this.broadcastGameState(updated, updated.currentState);
      this.server.to(room.code).emit('roomUpdate', this.roomUpdatePayload(updated));
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

    // ذخیره اسنپشات برای undo
    const stack = this.undoStacks.get(room.code) ?? [];
    stack.push({ state, actorId: (move as { player?: string }).player ?? state.turn });
    if (stack.length > UNDO_DEPTH) stack.shift();
    this.undoStacks.set(room.code, stack);

    await this.roomService.saveState(room.code, next);
    const updated = await this.roomService.getRoom(room.code);
    this.broadcastGameState(updated!, next);
    this.server.to(room.code).emit('roomUpdate', this.roomUpdatePayload(updated));

    if (next.phase === 'finished') {
      await this.handleRoundOver(updated!, next);
    } else {
      this.scheduleTurnTimer(room.code, next);
    }
  }

  @UseGuards(WsRateLimitGuard)
  @SubscribeMessage('makeMove')
  async handleMakeMove(@ConnectedSocket() client: Socket, @MessageBody() body: { roomCode: string; move: unknown }) {
    try {
      const room = await this.roomService.getRoom(body.roomCode);
      if (!room) throw new BadRequestException('اتاق یافت نشد');
      // اعتبارسنجی نوبت بر عهدهٔ تطبیقگر بازی است (حرکات خاصی مثل دورریز/پذیرش
      // معامله متعلق به بازیکنِ غیرنوبت است؛ شناسهٔ بازیکن از خود move خوانده میشود)
      await this.applyValidatedMove(room, body.move);
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
  async handleNextRound(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = nextRoundSchema.safeParse(payload);
    if (!parsed.success) return;
    try {
      const room = await this.roomService.getRoom(parsed.data.room);
      if (!room || room.status !== 'playing') return;
      await this.roomService.startGame(room.code, this.initialState(room));
      const updated = await this.roomService.getRoom(room.code);
      if (updated?.currentState) this.broadcastGameState(updated, updated.currentState);
      this.server.to(room.code).emit('roomUpdate', this.roomUpdatePayload(updated));
      if (updated?.currentState) this.scheduleTurnTimer(room.code, updated.currentState);
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا' });
    }
  }

  @SubscribeMessage('newGame')
  async handleNewGame(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomCode: string }) {
    try {
      const room = await this.roomService.getRoom(payload.roomCode);
      if (!room) throw new BadRequestException('اتاق یافت نشد');
      const state = this.initialState(room);
      const updated = await this.roomService.startGame(payload.roomCode, state, { resetScores: true });
      this.broadcastGameState(room, state);
      this.server.to(payload.roomCode).emit('roomUpdate', this.roomUpdatePayload(updated));
      this.emitSystemMessage(payload.roomCode, 'بازی جدید شروع شد');
      this.scheduleTurnTimer(payload.roomCode, state);
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا' });
    }
  }

  @SubscribeMessage('undo')
  async handleUndo(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = undoSchema.safeParse(payload);
    if (!parsed.success) return;
    const { room: roomCode } = parsed.data;
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
    const undoRoom = await this.roomService.getRoom(roomCode);
    if (undoRoom) this.broadcastGameState(undoRoom, last.state);
    this.emitSystemMessage(roomCode, 'حرکت بازگردانی شد', this.socketUsers.get(client.id), 'success', this.socketUsernames.get(client.id));
    this.scheduleTurnTimer(roomCode, last.state);
  }

  @SubscribeMessage('chatMessage')
  async handleChatMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = chatSchema.safeParse(payload);
    if (!parsed.success) return;
    const { room: roomCode, message } = parsed.data;
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

  @SubscribeMessage('double')
  async handleDouble(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = doubleSchema.safeParse(payload);
    if (!parsed.success) return;
    try {
      const room = await this.roomService.getRoom(parsed.data.room);
      if (!room || room.status !== 'playing' || room.gameType !== 'backgammon') return;
      const state = room.currentState as any;
      if (state.turn !== client.id) throw new BadRequestException('نوبت شما نیست');

      // Import directly from rules to be safe
      const { offerDouble } = await import('@bazigb/game-backgammon');
      const next = offerDouble(state, client.id);

      await this.roomService.saveState(room.code, next);
      this.broadcastGameState(room, next);
      this.emitSystemMessage(room.code, 'پیشنهاد دابل (دوبرابر کردن امتیاز) داده شد', client.id, 'info', this.socketUsernames.get(client.id));
    } catch (error) {
      client.emit('error', { message: error instanceof Error ? error.message : 'خطا در پیشنهاد دابل' });
    }
  }

  @SubscribeMessage('doubleResponse')
  async handleDoubleResponse(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = doubleResponseSchema.safeParse(payload);
    if (!parsed.success) return;
    try {
      const room = await this.roomService.getRoom(parsed.data.room);
      if (!room || room.status !== 'playing' || room.gameType !== 'backgammon') return;
      const state = room.currentState as any;
      if (!state.doubling || state.doubling.offeredBy === client.id) throw new BadRequestException('پاسخ غیرمجاز');

      const { respondDouble } = await import('@bazigb/game-backgammon');
      const next = respondDouble(state, client.id, parsed.data.accept);

      await this.roomService.saveState(room.code, next);
      const updated = await this.roomService.getRoom(room.code);
      this.broadcastGameState(updated!, next);
      this.server.to(room.code).emit('roomUpdate', this.roomUpdatePayload(updated));

      if (next.phase === 'finished') {
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
