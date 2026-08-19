/**
 * AI وگاس — سه سطح سختی
 * easy: شرط تصادفی کم
 * medium: شرط بر اساس موقعیت (جلو → بیشتر)
 * hard: استراتژی مارتینگل ساده (بعد از باخت شرط را دو برابر میکند)
 */
import { pickRandom, randomInt, type AIDifficulty } from '@bazigb/engine';
import { getLegalMoves } from './rules';
import type { VegasMove, VegasState } from './types';

function betMoves(state: VegasState): VegasMove[] {
  return getLegalMoves(state).filter((m) => m.kind === 'bet');
}

/** انتخاب شرط بر اساس سطح سختی */
export function getBet(state: VegasState, difficulty: AIDifficulty): VegasMove {
  const moves = betMoves(state);
  if (moves.length === 0) throw new Error('شرطی در دسترس نیست');

  if (difficulty === 'easy') return pickRandom(moves);

  const myId = state.turn;
  const myPos = state.positions[myId] ?? 0;
  const oppId = state.players.find((p) => p.id !== myId)?.id;
  const oppPos = oppId !== undefined ? (state.positions[oppId] ?? 0) : 0;
  const ahead = myPos - oppPos;

  if (difficulty === 'medium') {
    if (ahead > 0) return moves[Math.min(moves.length - 1, Math.floor(moves.length * 0.8))];
    return moves[Math.max(0, Math.floor(moves.length * 0.3))];
  }

  // hard: مارتینگل — بعد از باخت راند قبل، شرط بیشتر
  const lastRoundLost = state.round > 1 && state.positions[myId] === 0 && (state.bets[myId] ?? 0) > 0;
  const targetIndex = lastRoundLost ? moves.length - 1 : Math.min(moves.length - 1, Math.floor(moves.length * 0.6));
  return moves[targetIndex];
}

/** انتخاب حرکت تاس/حرکت (در این فازها فقط یک انتخاب وجود دارد) */
export function getBestMove(state: VegasState, difficulty: AIDifficulty): VegasMove {
  const legal = getLegalMoves(state);
  if (legal.length === 0) throw new Error('حرکتی در دسترس نیست');
  if (state.phase === 'bet') return getBet(state, difficulty);

  // roll و move فقط یک گزینه دارند؛ برای easy گاهی حرکت تصادفی
  if (difficulty === 'easy' && randomInt(1, 100) <= 15) return pickRandom(legal);
  return legal[0];
}
