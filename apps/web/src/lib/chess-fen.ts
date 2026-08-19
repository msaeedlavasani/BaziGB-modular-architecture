/**
 * تبدیل state شطرنج انجین جدید (board[64] با ChessPiece) به رشته FEN
 * تا بردهای مبتنی بر chess.js / react-chessboard بتوانند از آن استفاده کنند.
 */
import type { ChessState } from '@bazigb/game-chess';

const PIECE_LETTER: Record<string, { white: string; black: string }> = {
  p: { white: 'P', black: 'p' },
  r: { white: 'R', black: 'r' },
  n: { white: 'N', black: 'n' },
  b: { white: 'B', black: 'b' },
  q: { white: 'Q', black: 'q' },
  k: { white: 'K', black: 'k' },
};

/** تبدیل شماره خانه (0..63) به مختصات جبری مثل e4 */
export function indexToSquare(i: number): string {
  const file = String.fromCharCode(97 + (i % 8)); // a-h
  const rank = 8 - Math.floor(i / 8); // 8..1
  return `${file}${rank}`;
}

/** تبدیل مختصات جبری به شماره خانه */
export function squareToIndex(sq: string): number {
  const file = sq.charCodeAt(0) - 97;
  const rank = 8 - Number(sq[1]);
  return rank * 8 + file;
}

/** ساخت FEN از state انجین */
export function stateToFen(state: ChessState): string {
  let placement = '';
  for (let row = 0; row < 8; row++) {
    let empty = 0;
    for (let col = 0; col < 8; col++) {
      const cell = state.board[row * 8 + col];
      if (!cell) {
        empty++;
        continue;
      }
      if (empty > 0) {
        placement += empty;
        empty = 0;
      }
      placement += PIECE_LETTER[cell.type][cell.color];
    }
    if (empty > 0) placement += empty;
    if (row < 7) placement += '/';
  }

  const active = state.turn === state.players[0]?.id ? 'w' : 'b';
  const castling =
    [state.castling?.K && 'K', state.castling?.Q && 'Q', state.castling?.k && 'k', state.castling?.q && 'q']
      .filter(Boolean)
      .join('') || '-';
  const enPassant = state.enPassant !== null && state.enPassant !== undefined ? indexToSquare(state.enPassant) : '-';
  const halfmove = state.halfmove ?? 0;
  const fullmove = 1 + Math.floor((state.history?.length ?? 0) / 2);

  return `${placement} ${active} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
}

/** مهره‌های خورده‌شده بر اساس وضعیت فعلی نسبت به چیدمان اولیه */
const INITIAL_COUNTS = { p: 8, r: 2, n: 2, b: 2, q: 1 } as const;
type PieceType = keyof typeof INITIAL_COUNTS;

export function getCapturedPieces(state: ChessState): { white: string[]; black: string[] } {
  const now = {
    white: { p: 0, r: 0, n: 0, b: 0, q: 0 } as Record<PieceType, number>,
    black: { p: 0, r: 0, n: 0, b: 0, q: 0 } as Record<PieceType, number>,
  };
  for (const cell of state.board) {
    if (cell && cell.type !== 'k') now[cell.color][cell.type as PieceType]++;
  }
  const captured: { white: string[]; black: string[] } = { white: [], black: [] };
  for (const type of Object.keys(INITIAL_COUNTS) as PieceType[]) {
    // مهره‌های سیاهِ خورده‌شده → در سینی سفید (چون سفیدها آنها را خورده‌اند)
    for (let i = 0; i < INITIAL_COUNTS[type] - now.black[type]; i++) captured.white.push(type);
    // مهره‌های سفیدِ خورده‌شده → در سینی سیاه
    for (let i = 0; i < INITIAL_COUNTS[type] - now.white[type]; i++) captured.black.push(type);
  }
  return captured;
}
