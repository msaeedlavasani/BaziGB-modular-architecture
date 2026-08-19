import { pickRandom, AIDifficulty } from '@bazigb/engine';
import { VegasState } from './types';

/**
 * هوش مصنوعی وگاس: بعد از ریختن تاس، کدام مقدار (۱-۶) را روی کدام کازینو
 * بگذارد؟ معیارها: ارزش دستهٔ پول آن کازینو، تقویت تاس‌های قبلی خودمان،
 * اجتناب از کازینویی که حریف در آن جلوتر است.
 */
export const getBestMove = (state: VegasState, difficulty: AIDifficulty): number | null => {
  if (!state.rolled || state.phase !== 'playing') return null;
  const hand = state.playerDice[state.turn] ?? [];
  const counts: Record<number, number> = {};
  for (const d of hand) counts[d] = (counts[d] ?? 0) + 1;
  const values = Object.keys(counts).map(Number).filter((v) => v >= 1 && v <= 6);
  if (values.length === 0) return null;

  if (difficulty === 'easy') return pickRandom(values);

  let best = values[0];
  let bestScore = -Infinity;
  for (const v of values) {
    const casino = state.board[v - 1];
    const stackTotal = casino.stack ? casino.stack.cards[0] + casino.stack.cards[1] : 0;
    let score = (counts[v] ?? 0) * (stackTotal / 10000);
    // تقویت کازینویی که قبلاً تاس گذاشته‌ایم
    score += (casino.dice[state.turn] ?? 0) * 1.5;
    // جریمه اگر حریف در این کازینو جلوتر است
    let oppLead = 0;
    for (const [pId, c] of Object.entries(casino.dice)) {
      if (pId !== state.turn && c > (casino.dice[state.turn] ?? 0)) oppLead += c;
    }
    score -= oppLead * 0.8;
    // کازینوی بدون پول ارزش کمتری دارد
    if (casino.stack === null) score -= 2;

    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best;
};
