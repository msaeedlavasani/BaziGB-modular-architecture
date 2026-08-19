import { pickRandom, AIDifficulty } from '@bazigb/engine';
import { BackgammonMove, BackgammonState } from './types';
import { getMoveHints, applyChain, applyMove } from './rules';

/**
 * امتیازدهی به یک زنجیره حرکت بر اساس معیارهای تعیین شده.
 */
const scoreChain = (state: BackgammonState, chain: BackgammonMove[]): number => {
  let score = 0;
  let curr = state;

  for (const move of chain) {
    // پیشرفت رو به جلو
    score += move.amount || 0;

    // ورود از بار
    if (move.from === 'bar') score += 8;

    // خارج کردن مهره
    if (move.to === 'off') score += 5;

    // زدن مهره حریف
    if (typeof move.to === 'number') {
      const targetVal = curr.board[move.to];
      const color = curr.players.find(p => p.id === curr.turn)?.color === 1 ? 1 : -1;
      if ((color === 1 && targetVal === -1) || (color === -1 && targetVal === 1)) {
        score += 10;
      }
    }

    // ایجاد Blot (تنها گذاشتن مهره) - امتیاز منفی
    // این بررسی ساده است: اگر بعد از حرکت در مبدا یا مقصد مهره تنها بماند
    const nextState = applyMove(curr, move);
    if (typeof move.to === 'number') {
      const count = Math.abs(nextState.board[move.to]);
      if (count === 1) score -= 3;
    }
    
    curr = nextState;
  }

  return score;
};

/**
 * یافتن بهترین توالی حرکت برای AI.
 */
export const getBestMoveSequence = (
  state: BackgammonState, 
  difficulty: AIDifficulty
): BackgammonMove[] | null => {
  const hints = getMoveHints(state);
  if (hints.length === 0) return null;

  if (difficulty === 'easy') {
    return pickRandom(hints);
  }

  if (difficulty === 'medium') {
    let bestScore = -Infinity;
    let bestChain = hints[0];

    for (const chain of hints) {
      const s = scoreChain(state, chain);
      if (s > bestScore) {
        bestScore = s;
        bestChain = chain;
      }
    }
    return bestChain;
  }

  // Hard Mode: 2-ply
  // برای هر زنجیره، آن را اعمال کرده و پتانسیل پاسخ حریف را می‌سنجیم
  let bestHardScore = -Infinity;
  let bestHardChain = hints[0];

  for (const chain of hints) {
    const myScore = scoreChain(state, chain);
    const nextState = applyChain(state, chain);
    
    // تخمین بهترین پاسخ حریف (بدون دانستن تاس حریف، فرض می‌کنیم حریف بهترین حرکت‌های ممکن را انجام می‌دهد)
    // برای سادگی، در حالت Hard، امتیاز را بر اساس وضعیت تخته بعد از حرکت من می‌سنجیم
    const oppColor = state.turn === state.players[0].id ? -1 : 1;
    let oppBestScore = 0;
    
    // شبیه‌سازی یک تاس فرضی برای حریف جهت تخمین پتانسیل
    const mockState = { ...nextState, dice: [3, 4], rolled: true }; 
    const oppHints = getMoveHints(mockState);
    if (oppHints.length > 0) {
      oppBestScore = Math.max(...oppHints.map(h => scoreChain(mockState, h)));
    }

    const totalScore = myScore - (0.5 * oppBestScore);
    if (totalScore > bestHardScore) {
      bestHardScore = totalScore;
      bestHardChain = chain;
    }
  }

  return bestHardChain;
};
