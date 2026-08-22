import { type GameAdapter, type GameId, type Player } from '@bazigb/engine';
import { TicTacToe, getBestMove as tttAI } from '@bazigb/game-tic-tac-toe';
import { Backgammon, getBestMoveSequence as bgAI } from '@bazigb/game-backgammon';
import { ChessGame, getBestMove as chessAI } from '@bazigb/game-chess';
import { Vegas, getBestMove as vegasAI } from '@bazigb/game-vegas';
import { Catan } from '@bazigb/game-catan';

export const REGISTRY: Record<string, GameAdapter> = {
  'tic-tac-toe': TicTacToe,
  backgammon: Backgammon,
  chess: ChessGame,
  vegas: Vegas,
  catan: Catan,
};

export const AI: Record<string, (state: any, d: any) => unknown> = {
  'tic-tac-toe': tttAI as never,
  backgammon: bgAI as never,
  chess: chessAI as never,
  vegas: vegasAI as never,
  catan: (() => null) as never,
};

export const COLORS: Record<string, Player['color'][]> = {
  'tic-tac-toe': ['x', 'o'],
  backgammon: [1, -1],
  chess: ['white', 'black'],
  vegas: ['gold', 'gold', 'gold', 'gold', 'gold'],
  // پالت مرجع catan-online: قرمز، آبی، نارنجی، سبز (هر چهار رنگ دارای asset مهره است)
  catan: ['#b23a2e', '#2b6ca3', '#e0952b', '#3f7d4a'],
};

export function getMaxPlayers(gameType: string): number {
  const adapter = REGISTRY[gameType];
  if (adapter) return adapter.maxPlayers;
  return 2; // Fallback
}

/**
 * وضعیت عمومی برای ارسال به کلاینتها.
 * کاتان دادهٔ خصوصی (منابع/کارتهای توسعه) را با serialize حذف میکند و امتیاز
 * کل (شامل کارتهای امتیاز پنهان) را هم خارج میکند؛ بقیهٔ بازیها بدون تغییر.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function publicGameState(gameType: string, state: unknown): any {
  if (gameType !== 'catan' || !state) return state;
  const adapter = REGISTRY[gameType];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pub = (adapter.serialize ? adapter.serialize(state as never) : state) as any;
  if (pub?.playerStates) {
    for (const pid of Object.keys(pub.playerStates)) delete pub.playerStates[pid].victoryPoints;
  }
  return pub;
}
