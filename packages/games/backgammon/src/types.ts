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
  /** Winner of the completed game while a points match may still continue. */
  gameWinner: string | null;
  /** Points awarded for the most recently completed game. */
  gamePoints: number;
  /** Player who opens the next game after result acknowledgement. */
  nextStarter: string | null;
  /** The current game is the one Crawford game; doubling is disabled. */
  crawfordGame: boolean;
  /** The match has already consumed its Crawford game. */
  crawfordUsed: boolean;
};
