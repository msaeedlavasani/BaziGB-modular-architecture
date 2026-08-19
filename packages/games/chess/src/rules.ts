import {
  GameAdapter,
  Player,
  MatchConfig,
  DEFAULT_MATCH,
  sanitizeMatch,
  switchTurn,
  deepClone
} from '@bazigb/engine';
import { ChessBoard, ChessMove, ChessState, ChessPiece } from './types';

/**
 * ایجاد وضعیت اولیه بازی
 */
export function createState(players: Player[], match?: MatchConfig): ChessState {
  const board: ChessBoard = new Array(64).fill(null);

  // چیدمان مهره‌های سیاه (ردیف ۰ و ۱)
  const blackBackRank: ChessPiece[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let i = 0; i < 8; i++) {
    board[i] = { type: blackBackRank[i], color: 'black' };
    board[i + 8] = { type: 'p', color: 'black' };
  }

  // چیدمان مهره‌های سفید (ردیف ۶ و ۷)
  const whiteBackRank: ChessPiece[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let i = 0; i < 8; i++) {
    board[i + 48] = { type: 'p', color: 'white' };
    board[i + 56] = { type: whiteBackRank[i], color: 'white' };
  }

  // تخصیص رنگ‌ها (بدون تغییر ورودی — تغییرناپذیری)
  const coloredPlayers: Player[] = [
    { ...players[0], color: 'white' },
    { ...players[1], color: 'black' },
  ];

  return {
    gameId: 'chess',
    board,
    turn: players[0].id,
    phase: 'playing',
    winner: null,
    history: [],
    match: sanitizeMatch('chess', match ?? DEFAULT_MATCH),
    scores: { [players[0].id]: 0, [players[1].id]: 0 },
    round: 1,
    players: coloredPlayers,
    castling: { K: true, Q: true, k: true, q: true },
    enPassant: null,
    halfmove: 0
  };
}

/**
 * آیا خانه مورد نظر توسط رنگ خاصی تهدید می‌شود؟
 */
export function isSquareAttacked(board: ChessBoard, index: number, byColor: 'white' | 'black'): boolean {
  const row = Math.floor(index / 8);
  const col = index % 8;

  // جهات حرکت‌های مختلف
  const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const slidingMoves = {
    straight: [[-1, 0], [1, 0], [0, -1], [0, 1]],
    diagonal: [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  };

  // چک کردن اسب
  for (const [dr, dc] of knightMoves) {
    const r = row + dr, c = col + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r * 8 + c];
      if (target && target.type === 'n' && target.color === byColor) return true;
    }
  }

  // چک کردن رخ و وزیر (مستقیم)
  for (const [dr, dc] of slidingMoves.straight) {
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r * 8 + c];
      if (target) {
        if (target.color === byColor && (target.type === 'r' || target.type === 'q')) return true;
        break;
      }
      r += dr; c += dc;
    }
  }

  // چک کردن فیل و وزیر (مورب)
  for (const [dr, dc] of slidingMoves.diagonal) {
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r * 8 + c];
      if (target) {
        if (target.color === byColor && (target.type === 'b' || target.type === 'q')) return true;
        break;
      }
      r += dr; c += dc;
    }
  }

  // چک کردن پیاده
  const pawnDir = byColor === 'white' ? 1 : -1; // اگر سفید حمله می‌کند، از ردیف بالاتر می‌آید
  for (const dc of [-1, 1]) {
    const r = row + pawnDir, c = col + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r * 8 + c];
      if (target && target.type === 'p' && target.color === byColor) return true;
    }
  }

  // چک کردن شاه
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr, c = col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = board[r * 8 + c];
        if (target && target.type === 'k' && target.color === byColor) return true;
      }
    }
  }

  return false;
}

/**
 * آیا شاه رنگ خاصی در کیش است؟
 */
export function kingInCheck(board: ChessBoard, color: 'white' | 'black'): boolean {
  const kingIndex = board.findIndex(cell => cell && cell.type === 'k' && cell.color === color);
  if (kingIndex === -1) return false;
  return isSquareAttacked(board, kingIndex, color === 'white' ? 'black' : 'white');
}

/**
 * تولید حرکات شبه-قانونی (بدون در نظر گرفتن کیش شدن شاه خودی)
 */
function getPseudoLegalMoves(state: ChessState): ChessMove[] {
  const moves: ChessMove[] = [];
  const { board, turn, players, enPassant, castling } = state;
  const player = players.find(p => p.id === turn)!;
  const color = player.color as 'white' | 'black';
  const enemyColor = color === 'white' ? 'black' : 'white';

  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (!piece || piece.color !== color) continue;

    const row = Math.floor(i / 8);
    const col = i % 8;

    if (piece.type === 'p') {
      const dir = color === 'white' ? -1 : 1;
      const startRank = color === 'white' ? 6 : 1;
      const promoRank = color === 'white' ? 0 : 7;

      // حرکت رو به جلو
      const nextIdx = i + dir * 8;
      if (nextIdx >= 0 && nextIdx < 64 && !board[nextIdx]) {
        if (Math.floor(nextIdx / 8) === promoRank) {
          (['q', 'r', 'b', 'n'] as const).forEach(p => moves.push({ player: turn, kind: 'move', from: i, to: nextIdx, promotion: p }));
        } else {
          moves.push({ player: turn, kind: 'move', from: i, to: nextIdx });
          // حرکت دو خانه‌ای
          const doubleIdx = i + dir * 16;
          if (row === startRank && !board[doubleIdx]) {
            moves.push({ player: turn, kind: 'move', from: i, to: doubleIdx });
          }
        }
      }

      // گرفتن مهره (مورب)
      for (const dc of [-1, 1]) {
        const targetCol = col + dc;
        if (targetCol < 0 || targetCol > 7) continue;
        const targetIdx = i + dir * 8 + dc;
        if (targetIdx < 0 || targetIdx >= 64) continue;
        
        const target = board[targetIdx];
        if (target && target.color === enemyColor) {
          if (Math.floor(targetIdx / 8) === promoRank) {
            (['q', 'r', 'b', 'n'] as const).forEach(p => moves.push({ player: turn, kind: 'move', from: i, to: targetIdx, promotion: p }));
          } else {
            moves.push({ player: turn, kind: 'move', from: i, to: targetIdx });
          }
        } else if (targetIdx === enPassant) {
          moves.push({ player: turn, kind: 'move', from: i, to: targetIdx });
        }
      }
    } else if (piece.type === 'n') {
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => {
        const r = row + dr, c = col + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const idx = r * 8 + c;
          if (!board[idx] || board[idx]!.color === enemyColor) {
            moves.push({ player: turn, kind: 'move', from: i, to: idx });
          }
        }
      });
    } else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
      const dirs: number[][] = [];
      if (piece.type !== 'b') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      if (piece.type !== 'r') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);

      dirs.forEach(([dr, dc]) => {
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const idx = r * 8 + c;
          if (!board[idx]) {
            moves.push({ player: turn, kind: 'move', from: i, to: idx });
          } else {
            if (board[idx]!.color === enemyColor) moves.push({ player: turn, kind: 'move', from: i, to: idx });
            break;
          }
          r += dr; c += dc;
        }
      });
    } else if (piece.type === 'k') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const r = row + dr, c = col + dc;
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const idx = r * 8 + c;
            if (!board[idx] || board[idx]!.color === enemyColor) {
              moves.push({ player: turn, kind: 'move', from: i, to: idx });
            }
          }
        }
      }

      // قلعه رفتن
      if (color === 'white') {
        if (castling.K && !board[61] && !board[62] && !kingInCheck(board, 'white') && 
            !isSquareAttacked(board, 61, 'black') && !isSquareAttacked(board, 62, 'black')) {
          moves.push({ player: turn, kind: 'move', from: 60, to: 62 });
        }
        if (castling.Q && !board[59] && !board[58] && !board[57] && !kingInCheck(board, 'white') && 
            !isSquareAttacked(board, 59, 'black') && !isSquareAttacked(board, 58, 'black')) {
          moves.push({ player: turn, kind: 'move', from: 60, to: 58 });
        }
      } else {
        if (castling.k && !board[5] && !board[6] && !kingInCheck(board, 'black') && 
            !isSquareAttacked(board, 5, 'white') && !isSquareAttacked(board, 6, 'white')) {
          moves.push({ player: turn, kind: 'move', from: 4, to: 6 });
        }
        if (castling.q && !board[3] && !board[2] && !board[1] && !kingInCheck(board, 'black') && 
            !isSquareAttacked(board, 3, 'white') && !isSquareAttacked(board, 2, 'white')) {
          moves.push({ player: turn, kind: 'move', from: 4, to: 2 });
        }
      }
    }
  }

  return moves;
}

/**
 * دریافت تمامی حرکات قانونی (با چک کردن وضعیت کیش)
 */
export function getLegalMoves(state: ChessState): ChessMove[] {
  if (state.phase === 'finished') return [];
  const pseudoMoves = getPseudoLegalMoves(state);
  const color = state.players.find(p => p.id === state.turn)!.color as 'white' | 'black';

  return pseudoMoves.filter(move => {
    const nextState = applyMoveInternal(deepClone(state), move, true);
    return !kingInCheck(nextState.board, color);
  });
}

/**
 * اعمال حرکت (داخلی - برای شبیه‌سازی و استفاده نهایی)
 */
function applyMoveInternal(state: ChessState, move: ChessMove, isSimulation: boolean): ChessState {
  const { from, to, promotion } = move;
  const piece = state.board[from]!;
  const color = piece.color;
  const target = state.board[to];

  // ثبت در تاریخچه (اگر شبیه‌سازی نباشد)
  if (!isSimulation) {
    state.history.push(move);
  }

  // مدیریت آن‌پاسان (حذف پیاده حریف)
  if (piece.type === 'p' && to === state.enPassant) {
    const capturedIdx = to + (color === 'white' ? 8 : -8);
    state.board[capturedIdx] = null;
  }

  // جابجایی مهره
  state.board[to] = promotion ? { type: promotion, color } : piece;
  state.board[from] = null;

  // مدیریت قلعه‌رفتن (حرکت رخ)
  if (piece.type === 'k') {
    if (Math.abs(from - to) === 2) {
      if (to === 62) { state.board[61] = state.board[63]; state.board[63] = null; }
      else if (to === 58) { state.board[59] = state.board[56]; state.board[56] = null; }
      else if (to === 6) { state.board[5] = state.board[7]; state.board[7] = null; }
      else if (to === 2) { state.board[3] = state.board[0]; state.board[0] = null; }
    }
  }

  // بروزرسانی حقوق قلعه
  if (piece.type === 'k') {
    if (color === 'white') { state.castling.K = false; state.castling.Q = false; }
    else { state.castling.k = false; state.castling.q = false; }
  }
  if (piece.type === 'r') {
    if (from === 56) state.castling.Q = false;
    if (from === 63) state.castling.K = false;
    if (from === 0) state.castling.q = false;
    if (from === 7) state.castling.k = false;
  }
  // اگر رخ در گوشه زده شود
  if (to === 56) state.castling.Q = false;
  if (to === 63) state.castling.K = false;
  if (to === 0) state.castling.q = false;
  if (to === 7) state.castling.k = false;

  // بروزرسانی هدف آن‌پاسان
  if (piece.type === 'p' && Math.abs(from - to) === 16) {
    state.enPassant = from + (color === 'white' ? -8 : 8);
  } else {
    state.enPassant = null;
  }

  // ۵۰ حرکت (ساده‌سازی شده)
  if (piece.type === 'p' || target) state.halfmove = 0;
  else state.halfmove++;

  if (!isSimulation) {
    const nextTurn = switchTurn(state.turn, state.players);
    state.turn = nextTurn;
    
    const nextMoves = getLegalMoves(state);
    const inCheck = kingInCheck(state.board, state.players.find(p => p.id === nextTurn)!.color as 'white' | 'black');

    if (nextMoves.length === 0) {
      state.phase = 'finished';
      state.winner = inCheck ? move.player : null; // کیش‌مات یا پات
    }
  }

  return state;
}

export function applyMove(state: ChessState, move: ChessMove): ChessState {
  // اعتبارسنجی
  const legal = getLegalMoves(state);
  const isValid = legal.some(m => m.from === move.from && m.to === move.to && m.promotion === move.promotion);
  if (!isValid) throw new Error('حرکت غیرمجاز');

  return applyMoveInternal(deepClone(state), move, false);
}

export function applyChain(state: ChessState, chain: ChessMove[]): ChessState {
  let currentState = state;
  for (const move of chain) {
    currentState = applyMove(currentState, move);
  }
  return currentState;
}

export function isFinished(state: ChessState): boolean {
  return state.phase === 'finished';
}

export function getWinner(state: ChessState): string | null {
  return state.winner;
}

export function serialize(state: ChessState) {
  return {
    board: state.board,
    turn: state.turn,
    phase: state.phase,
    winner: state.winner,
    castling: state.castling,
    enPassant: state.enPassant,
    historyCount: state.history.length
  };
}

export const ChessGame: GameAdapter<ChessBoard, ChessMove> = {
  gameId: 'chess',
  name: 'شطرنج',
  minPlayers: 2,
  maxPlayers: 2,
  createState,
  getLegalMoves,
  applyMove,
  applyChain,
  isFinished,
  getWinner,
  serialize
};
