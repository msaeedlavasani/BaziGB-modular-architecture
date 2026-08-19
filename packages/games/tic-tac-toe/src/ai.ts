/**
 * AI دوز — سه سطح سختی
 * easy: حرکت کاملاً تصادفی
 * medium: حریصانه (برد/بلاک) با ۲۰٪ خطای عمدی انسانی
 * hard: Minimax با آلفا-بتا (بازیکن حرفهای)
 */
import { pickRandom, randomInt, type AIDifficulty } from '@bazigb/engine';
import { getLegalMoves, getRoundWinner, isRoundOver } from './rules';
import type { TTTBoard, TTTMove, TTTState } from './types';

function playerColor(state: TTTState, playerId: string): 'x' | 'o' {
  return state.players.find((p) => p.id === playerId)?.color as 'x' | 'o';
}

/** امتیاز ارزیابی برد برای minimax: x=+10، o=-10، مساوی ۰ */
function evaluate(board: TTTBoard): number {
  const w = getRoundWinner(board);
  if (w === 'x') return 10;
  if (w === 'o') return -10;
  return 0;
}

/** minimax با آلفا-بتا */
function minimax(
  board: TTTBoard,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  const score = evaluate(board);
  if (score !== 0 || isRoundOver(board) || depth === 0) return score;

  if (maximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'x';
        best = Math.max(best, minimax(board, depth - 1, alpha, beta, false));
        board[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
  let best = Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = 'o';
      best = Math.min(best, minimax(board, depth - 1, alpha, beta, true));
      board[i] = null;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
  }
  return best;
}

/** حرکت حریصانه: برد فوری، سپس بلاک، سپس مرکز/گوشه */
function greedyMove(state: TTTState, me: string): TTTMove | null {
  const legal = getLegalMoves(state);
  if (legal.length === 0) return null;
  const board = state.board;
  const myColor = playerColor(state, me);
  const oppColor = myColor === 'x' ? 'o' : 'x';

  const winning = legal.find((m) => {
    const b = [...board];
    b[m.to] = myColor;
    return getRoundWinner(b) === myColor;
  });
  if (winning) return winning;

  const blocking = legal.find((m) => {
    const b = [...board];
    b[m.to] = oppColor;
    return getRoundWinner(b) === oppColor;
  });
  if (blocking) return blocking;

  // ترجیح مرکز، سپس گوشهها
  const priority = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  for (const p of priority) {
    const m = legal.find((x) => x.to === p);
    if (m) return m;
  }
  return pickRandom(legal);
}

/**
 * انتخاب بهترین حرکت بر اساس سطح سختی.
 * در حالت hard، بازیکن با رنگ x حداکثرکننده فرض میشود.
 */
export function getBestMove(state: TTTState, difficulty: AIDifficulty): TTTMove | null {
  const legal = getLegalMoves(state);
  if (legal.length === 0) return null;

  if (difficulty === 'easy') {
    return pickRandom(legal);
  }

  if (difficulty === 'medium') {
    // ۲۰٪ خطای عمدی انسانی برای اجازه دادن به برد بازیکن
    if (randomInt(1, 100) <= 20) return pickRandom(legal);
    return greedyMove(state, state.turn) ?? pickRandom(legal);
  }

  // hard: minimax
  const board = [...state.board];
  const me = state.turn;
  const myColor = playerColor(state, me);
  const maximizing = myColor === 'x';

  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove: TTTMove | null = null;

  for (const move of legal) {
    board[move.to] = myColor;
    const score = minimax(board, 8, -Infinity, Infinity, !maximizing);
    board[move.to] = null;
    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}
