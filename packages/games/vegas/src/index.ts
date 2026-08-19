/**
 * API عمومی بازی وگاس (MOD-005)
 * فقط: Vegas، getBestMove و تایپها — بدون جزئیات داخلی
 */
export { Vegas, applyChain, applyMove, createState, getLegalMoves, isFinished, reachedEnd, serialize } from './rules';
export { getBestMove, getBet } from './ai';
export type { VegasBetMove, VegasBoard, VegasMove, VegasMoveMove, VegasPhase, VegasRollMove, VegasState } from './types';
export { INITIAL_CHIPS, MAX_BET, TRACK_LENGTH } from './types';
