/**
 * API عمومی بازی وگاس — قوانین قدیمی (کازینوها، کارت‌های پول، ۸ تاس، ۴ راند)
 */
export { Vegas, applyChain, applyMove, createState, getLegalMoves, isFinished, serialize } from './rules';
export { getBestMove } from './ai';
export type { CasinoData, MoneyStackData, VegasMove, VegasState } from './types';
export { DICE_PER_PLAYER, TOTAL_ROUNDS } from './types';
