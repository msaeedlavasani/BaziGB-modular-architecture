/**
 * BaziGBEngine — فاساد توابع عمومی هسته (Turn/Dice/Phase Engine)
 * طبق حسابرسی فاز ۰: پکیج engine هسته منطق بازی‌هاست و API عمومی شفاف دارد.
 */
import {
  deepClone,
  diceSteps,
  pickRandom,
  randomInt,
  rollDice,
  rollDicePair,
  shuffle,
  switchTurn,
  totalScore,
} from './utils';
import {
  isMatchFinished,
  MATCH_POINT_GAMES,
  sanitizeMatch,
  supportsMatchPoint,
  updateMatchScore,
} from './rules';

export const BaziGBEngine = {
  // Turn / Dice
  rollDice,
  rollDicePair,
  diceSteps,
  switchTurn,
  // Random helpers
  randomInt,
  pickRandom,
  shuffle,
  // State helpers
  deepClone,
  totalScore,
  // Match rules (Match Point / Win by 2 — فقط نرد و دوز)
  supportsMatchPoint,
  sanitizeMatch,
  updateMatchScore,
  isMatchFinished,
  MATCH_POINT_GAMES,
};

export type BaziGBEngine = typeof BaziGBEngine;
