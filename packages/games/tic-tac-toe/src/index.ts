/**
 * API عمومی بازی دوز (MOD-004)
 * فقط: TicTacToe، getBestMove و تایپها — بدون جزئیات داخلی
 */
export { TicTacToe, applyMove, applyChain, createState, getLegalMoves, getRoundWinner, isFinished, isRoundOver, serialize } from './rules';
export { getBestMove } from './ai';
export type { TTTBoard, TTTCell, TTTMove, TTTState } from './types';
export { WIN_LINES } from './types';
