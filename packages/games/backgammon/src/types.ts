import { GameState, Move } from '@bazigb/engine';

/**
 * نمایش تخته بازی به صورت آرایه‌ای از ۲۴ نقطه.
 * اعداد مثبت برای بازیکن ۱ و اعداد منفی برای بازیکن ۲.
 */
export type BackgammonBoard = number[];

/**
 * ساختار حرکت در بازی نرد.
 */
export interface BackgammonMove extends Move {
  kind: 'roll' | 'move';
  from?: number | 'bar';
  to?: number | 'off';
  label?: string;
}

/**
 * وضعیت کامل بازی نرد.
 */
export type BackgammonState = GameState<BackgammonBoard, BackgammonMove> & {
  bar: Record<number, number>;
  off: Record<number, number>;
  rolled: boolean;
  cube: number;                             // 1|2|4|8|16|32|64
  cubeOwner: string | null;                 // playerId holder
  doubling: { offeredBy: string } | null;   // pending offer
};
