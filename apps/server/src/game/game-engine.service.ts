import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DEFAULT_MATCH, type AIDifficulty, type GameAdapter, type GameId, type Player } from '@bazigb/engine';
import { TicTacToe, getBestMove as tttAI } from '@bazigb/game-tic-tac-toe';
import { Backgammon, getBestMoveSequence as bgAI } from '@bazigb/game-backgammon';
import { ChessGame, getBestMove as chessAI } from '@bazigb/game-chess';
import { Vegas, getBestMove as vegasAI } from '@bazigb/game-vegas';

/**
 * GameEngineService — منطق خالص بازی‌ها (MOD-007)
 * گیتوی فقط لایه انتقال است؛ این سرویس: resolve game, apply move, next round
 */
const REGISTRY: Record<GameId, GameAdapter> = {
  'tic-tac-toe': TicTacToe,
  backgammon: Backgammon,
  chess: ChessGame,
  vegas: Vegas,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AI: Record<GameId, (state: any, d: AIDifficulty) => unknown> = {
  'tic-tac-toe': tttAI as never,
  backgammon: bgAI as never,
  chess: chessAI as never,
  vegas: vegasAI as never,
};

const COLORS: Record<GameId, [Player['color'], Player['color']]> = {
  'tic-tac-toe': ['x', 'o'],
  backgammon: [1, -1],
  chess: ['white', 'black'],
  vegas: ['gold', 'gold'],
};

export interface BaziGBRoom {
  id: string;
  gameId: GameId;
  status: 'waiting' | 'playing' | 'finished';
  mode: 'bot' | 'pvp';
  difficulty: AIDifficulty;
  players: Player[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
  createdAt: number;
  updatedAt: number;
}

@Injectable()
export class GameEngineService {
  adapter(gameId: GameId): GameAdapter {
    const a = REGISTRY[gameId];
    if (!a) throw new Error('بازی نامعتبر است');
    return a;
  }

  createRoom(gameId: GameId, mode: 'bot' | 'pvp' = 'bot', difficulty: AIDifficulty = 'medium'): BaziGBRoom {
    const adapter = this.adapter(gameId);
    const players: Player[] = [
      { id: 'p1', name: 'شما', color: COLORS[gameId][0] },
      ...(mode === 'bot'
        ? [{ id: 'bot', name: 'ربات', color: COLORS[gameId][1], isBot: true }]
        : [{ id: 'p2', name: 'بازیکن ۲', color: COLORS[gameId][1] }]),
    ];
    const state = adapter.createState(players, DEFAULT_MATCH);
    const now = Date.now();
    const room: BaziGBRoom = {
      id: randomUUID().slice(0, 8),
      gameId,
      status: 'playing',
      mode,
      difficulty,
      players,
      state,
      createdAt: now,
      updatedAt: now,
    };
    // اگر ربات شروع‌کننده باشد
    if (state.phase === 'playing' && state.turn === 'bot') {
      this.runBot(room);
    }
    return room;
  }

  /** اعمال حرکت بازیکن با اعتبارسنجی کامل هر گام زنجیره */
  applyMove(room: BaziGBRoom, move: unknown): BaziGBRoom {
    const adapter = this.adapter(room.gameId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = move as any;
    let state = room.state;
    if (Array.isArray(m)) {
      state = adapter.applyChain(state, m);
    } else if (room.gameId === 'backgammon' && m?.kind === 'roll') {
      state = adapter.applyChain(state, [m]);
    } else {
      state = adapter.applyMove(state, m);
    }
    room.state = state;
    room.updatedAt = Date.now();
    if (state.phase === 'finished') room.status = 'finished';

    // پاسخ ربات
    if (state.phase === 'playing' && state.turn === 'bot') {
      this.runBot(room);
    }
    return room;
  }

  /** اجرای حرکت ربات (حلقه امن با گارد) */
  runBot(room: BaziGBRoom): void {
    const adapter = this.adapter(room.gameId);
    const difficulty = room.difficulty ?? 'medium';
    let guard = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let state: any = room.state;

    while (state.phase === 'playing' && state.turn === 'bot' && guard++ < 10) {
      // نرد: اول تاس
      if (room.gameId === 'backgammon' && !(state.dice && state.dice.length)) {
        state = adapter.applyChain(state, [{ player: state.turn, kind: 'roll' }]);
      }
      const move = AI[room.gameId](state, difficulty);
      if (move === null || (Array.isArray(move) && move.length === 0)) {
        state = room.gameId === 'backgammon' ? adapter.applyChain(state, []) : state;
        break;
      } else if (Array.isArray(move)) {
        state = adapter.applyChain(state, move as never);
      } else {
        state = adapter.applyMove(state, move as never);
      }
    }

    room.state = state;
    room.updatedAt = Date.now();
    if (state.phase === 'finished') room.status = 'finished';
  }

  serialize(room: BaziGBRoom) {
    return {
      id: room.id,
      gameId: room.gameId,
      status: room.status,
      mode: room.mode,
      players: room.players,
      state: room.state,
    };
  }
}
