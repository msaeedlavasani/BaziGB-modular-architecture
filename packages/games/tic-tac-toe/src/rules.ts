/**
 * قوانین خالص دوز — حالت تغییرناپذیر (Immutable)
 */
import {
  DEFAULT_MATCH,
  sanitizeMatch,
  switchTurn,
  updateMatchScore,
  type GameAdapter,
  type MatchConfig,
  type Player,
} from '@bazigb/engine';
import { WIN_LINES, type TTTBoard, type TTTMove, type TTTState } from './types';

/** برد خالی */
export function emptyBoard(): TTTBoard {
  return Array<TTTState['board'][number]>(9).fill(null);
}

/** بازیکن برنده راند (بر اساس رنگ) یا null */
export function getRoundWinner(board: TTTBoard): 'x' | 'o' | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

/** آیا راند تمام شده؟ (برنده یا برد پر) */
export function isRoundOver(board: TTTBoard): boolean {
  return getRoundWinner(board) !== null || board.every((cell) => cell !== null);
}

/** ساخت وضعیت اولیه */
export function createState(players: Player[], match?: MatchConfig): TTTState {
  const safe = sanitizeMatch('tic-tac-toe', match ?? DEFAULT_MATCH);
  const [p1, p2] = players;
  return {
    gameId: 'tic-tac-toe',
    board: emptyBoard(),
    turn: p1.id,
    phase: 'playing',
    winner: null,
    history: [],
    match: safe,
    scores: { [p1.id]: 0, [p2.id]: 0 },
    round: 1,
    players: [p1, p2],
    roundStartPlayer: p1.id,
  };
}

/** حرکات قانونی: خانههای خالی */
export function getLegalMoves(state: TTTState): TTTMove[] {
  if (state.phase !== 'playing') return [];
  const moves: TTTMove[] = [];
  state.board.forEach((cell, i) => {
    if (cell === null) {
      moves.push({ player: state.turn, kind: 'place', to: i });
    }
  });
  return moves;
}

/** شروع راند جدید با جابهجایی بازیکن شروعکننده */
function startNextRound(state: TTTState): TTTState {
  const nextStarter = state.players.find((p) => p.id !== state.roundStartPlayer)?.id ?? state.roundStartPlayer;
  return {
    ...state,
    board: emptyBoard(),
    turn: nextStarter,
    round: state.round + 1,
    roundStartPlayer: nextStarter,
  };
}

/** اعمال حرکت (با اعتبارسنجی کامل) */
export function applyMove(state: TTTState, move: TTTMove): TTTState {
  if (state.phase !== 'playing') throw new Error('بازی تمام شده است');
  if (move.player !== state.turn) throw new Error('نوبت این بازیکن نیست');
  if (move.kind !== 'place') throw new Error('حرکت نامعتبر است');
  const idx = move.to;
  if (idx < 0 || idx > 8 || state.board[idx] !== null) throw new Error('خانه پر یا نامعتبر است');

  const board = [...state.board];
  const color = state.players.find((p) => p.id === state.turn)?.color as 'x' | 'o';
  board[idx] = color;

  const winnerColor = getRoundWinner(board);
  const roundOver = isRoundOver(board);
  const history = [...state.history, move];

  if (!roundOver) {
    return {
      ...state,
      board,
      history,
      turn: switchTurn(state.turn, state.players),
    };
  }

  const roundWinner = winnerColor ? state.players.find((p) => p.color === winnerColor)?.id ?? null : null;
  const result = updateMatchScore('tic-tac-toe', state.scores, roundWinner, state.match);

  if (result.matchWinner) {
    return {
      ...state,
      board,
      history,
      phase: 'finished',
      winner: result.matchWinner,
      scores: result.scores,
    };
  }

  // راند تمام شد؛ مسابقه ادامه دارد → راند جدید
  return startNextRound({ ...state, board, history, scores: result.scores });
}

/** اعتبارسنجی و اعمال زنجیره (در دوز زنجیره فقط یک حرکت است) */
export function applyChain(state: TTTState, chain: TTTMove[]): TTTState {
  if (chain.length === 0) throw new Error('زنجیره خالی است');
  let s = state;
  for (const step of chain) {
    s = applyMove(s, step);
  }
  return s;
}

export function isFinished(state: TTTState): boolean {
  return state.phase === 'finished';
}

export function getWinner(state: TTTState): string | null {
  return state.winner;
}

/** وضعیت برای کلاینت */
export function serialize(state: TTTState) {
  return {
    gameId: state.gameId,
    board: state.board,
    turn: state.turn,
    phase: state.phase,
    winner: state.winner,
    scores: state.scores,
    round: state.round,
    match: state.match,
  };
}

/** تطبیقگر رسمی بازی دوز (قرارداد GameAdapter) */
export const TicTacToe: GameAdapter<TTTBoard, TTTMove> = {
  gameId: 'tic-tac-toe',
  name: 'دوز',
  minPlayers: 2,
  maxPlayers: 2,
  createState,
  getLegalMoves,
  applyMove,
  applyChain,
  isFinished,
  getWinner,
  serialize,
};
