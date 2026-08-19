import { AIDifficulty, pickRandom, deepClone } from '@bazigb/engine';
import { ChessState, ChessMove, ChessBoard } from './types';
import { getLegalMoves, applyMove, kingInCheck } from './rules';

/** ارزش مهره‌ها */
const PIECE_VALUES: Record<string, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 900
};

/**
 * ارزیابی وضعیت صفحه (ساده)
 */
function evaluateBoard(board: ChessBoard, color: 'white' | 'black'): number {
  let score = 0;
  for (const cell of board) {
    if (cell) {
      const val = PIECE_VALUES[cell.type];
      score += cell.color === color ? val : -val;
    }
  }
  return score;
}

/**
 * الگوریتم مینیمکس با هرس آلفا-بتا
 */
function minimax(state: ChessState, depth: number, alpha: number, beta: number, isMaximizing: boolean, myColor: 'white' | 'black'): number {
  if (depth === 0 || state.phase === 'finished') {
    return evaluateBoard(state.board, myColor);
  }

  const moves = getLegalMoves(state);
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const evalResult = minimax(applyMove(deepClone(state), move), depth - 1, alpha, beta, false, myColor);
      maxEval = Math.max(maxEval, evalResult);
      alpha = Math.max(alpha, evalResult);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const evalResult = minimax(applyMove(deepClone(state), move), depth - 1, alpha, beta, true, myColor);
      minEval = Math.min(minEval, evalResult);
      beta = Math.min(beta, evalResult);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMove(state: ChessState, difficulty: AIDifficulty): ChessMove | null {
  const moves = getLegalMoves(state);
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    return pickRandom(moves);
  }

  const myColor = state.players.find(p => p.id === state.turn)!.color as 'white' | 'black';

  if (difficulty === 'medium') {
    // Greedy: بهترین مهره را بزن و وارد خطر نشو
    const scores = moves.map(move => {
      const target = state.board[move.to];
      let score = target ? PIECE_VALUES[target.type] : 0;
      
      const nextState = applyMove(deepClone(state), move);
      if (kingInCheck(nextState.board, myColor)) score -= 50; // خود را در کیش نگذار
      
      return { move, score };
    });
    
    const maxScore = Math.max(...scores.map(s => s.score));
    const bestMoves = scores.filter(s => s.score === maxScore).map(s => s.move);
    return pickRandom(bestMoves);
  }

  // Hard: Minimax Depth 2
  let bestMove = moves[0];
  let maxEval = -Infinity;

  for (const move of moves) {
    const evalResult = minimax(applyMove(deepClone(state), move), 1, -Infinity, Infinity, false, myColor);
    if (evalResult > maxEval) {
      maxEval = evalResult;
      bestMove = move;
    }
  }

  return bestMove;
}
