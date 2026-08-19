import type { GameState, Move, PlayerId } from '@bazigb/engine';

/** طول مسیر وگاس (نقطه ۱۲ = پایان) */
export const TRACK_LENGTH = 12;

/** چیپ اولیه هر بازیکن */
export const INITIAL_CHIPS = 100;

/** حداکثر شرط در هر نوبت */
export const MAX_BET = 10;

export type VegasPhase = 'bet' | 'roll' | 'move' | 'finished';

/** حرکت شرط */
export interface VegasBetMove extends Move {
  kind: 'bet';
  amount: number;
}

/** حرکت ریختن تاس */
export interface VegasRollMove extends Move {
  kind: 'roll';
}

/** حرکت ترکیبی: زنجیره گامها (هر تاس یک گام) */
export interface VegasMoveMove extends Move {
  kind: 'move';
  from: number;
  to: number;
  chain: Move[];
}

export type VegasMove = VegasBetMove | VegasRollMove | VegasMoveMove;

export interface VegasBoard {
  /** طول مسیر */
  length: number;
}

export type VegasState = GameState<VegasBoard, VegasMove> & {
  /** موقعیت مهره هر بازیکن (۰ = شروع) */
  positions: Record<PlayerId, number>;
  /** پات (مجموع شرطهای راند) */
  pot: number;
  /** شرط هر بازیکن در راند */
  bets: Record<PlayerId, number>;
  /** آخرین تاس */
  dice: number[];
  /** فاز نوبت */
  phase: VegasPhase;
  /** حداکثر راندها برای جلوگیری از بازی بیپایان */
  maxRounds: number;
};
