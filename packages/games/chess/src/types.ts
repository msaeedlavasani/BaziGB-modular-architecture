import { Move, GameState } from '@bazigb/engine';

/** نوع مهره شطرنج */
export type ChessPiece = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';

/** سلول صفحه شطرنج */
export interface ChessCell {
  type: ChessPiece;
  color: 'white' | 'black';
}

/** صفحه شطرنج - آرایه ۶۴ تایی */
export type ChessBoard = (ChessCell | null)[];

/** حرکت شطرنج */
export interface ChessMove extends Move {
  kind: 'move';
  from: number;
  to: number;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

/** وضعیت بازی شطرنج */
export interface ChessState extends GameState<ChessBoard, ChessMove> {
  castling: {
    K: boolean; // سفید شاه‌قلعه (کوتاه)
    Q: boolean; // سفید وزیرقلعه (بلند)
    k: boolean; // سیاه شاه‌قلعه
    q: boolean; // سیاه وزیرقلعه
  };
  enPassant: number | null;
  halfmove: number;
}
