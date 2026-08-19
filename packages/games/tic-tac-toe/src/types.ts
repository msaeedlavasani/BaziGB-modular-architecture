import type { GameState, Move, PlayerId } from '@bazigb/engine';

/** خانه دوز: 'x' یا 'o' یا خالی */
export type TTTCell = 'x' | 'o' | null;

/** برد دوز: آرایه ۹تایی (ردیفبهردیف) */
export type TTTBoard = TTTCell[];

/** حرکت دوز: قرار دادن مهره در خانه */
export interface TTTMove extends Move {
  kind: 'place';
  to: number;
}

/** وضعیت دوز */
export type TTTState = GameState<TTTBoard, TTTMove> & {
  /** بازیکنی که راند را شروع کرده (برای جابهجایی نوبت شروع در راند بعد) */
  roundStartPlayer: PlayerId;
};

/** خطوط برنده */
export const WIN_LINES: ReadonlyArray<readonly number[]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
