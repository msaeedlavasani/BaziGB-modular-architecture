import { GameState } from '@bazigb/engine';

/**
 * Vegas — Casino Dice Luck (بازسازی قوانین BaziGB قدیمی)
 *
 * - دسته پول: ۵۴ کارت — ۶ نسخه از هر ارزش ۱۰ تا ۹۰ هزار دلار.
 * - هر راند دسته برمی‌خورد و به ۶ دستهٔ دوکارته تقسیم می‌شود؛ باارزش‌ترین
 *   دسته روی کازینو ۶ و کم‌ارزش‌ترین روی کازینو ۱. بازی دقیقاً ۴ راند دارد.
 * - هر بازیکن در نوبتش تاس‌های باقی‌مانده را می‌ریزد، یک مقدار (۱-۶) انتخاب
 *   می‌کند و همهٔ تاس‌های همان مقدار را روی کازینوی متناظر می‌گذارد.
 * - وقتی همهٔ تاس‌ها گذاشته شد، راند حل می‌شود: در هر کازینو تنها بازیکنی
 *   که بیشترین تاس را دارد کارت بالاتر را می‌گیرد و نفر دوم کارت پایین‌تر.
 *   تساوی در هر جایگاه کارت‌ها را می‌سوزاند.
 * - قانون خانگی: بازیکنی که هر ۸ تاسش را روی یک کازینو بگذارد هر دو کارت
 *   را می‌برد (sweep) و نفر دوم چیزی نمی‌گیرد.
 * - بعد از ۴ راند، بازیکنی که بیشترین پول را دارد برنده است؛ تساوی با
 *   تعداد کارت‌ها و بعد مساوی.
 */

export interface MoneyStackData {
  /** ۲ کارت، مرتب‌شده نزولی: [بالاتر، پایین‌تر]. */
  cards: number[];
  /** بازیکنی که کارت بالاتر را برد. */
  winnerIndex: string | null;
  /** بازیکنی که کارت پایین‌تر را برد. */
  runnerUpIndex: string | null;
  /** حداقل یک کارت به‌دست نیامده (تساوی/شرط‌نشده) و سوخته است. */
  burned: boolean;
  /** دسته با قانون ۸ تاس یک‌جا برداشته شد. */
  swept: boolean;
}

export interface CasinoData {
  /** playerId -> تعداد تاس‌های گذاشته‌شده روی این کازینو. */
  dice: Record<string, number>;
  /** دسته پول این راند (null = پولی این راند نیست). */
  stack: MoneyStackData | null;
}

export type VegasMove =
  | { player: string; kind: 'roll' }
  | { player: string; kind: 'place'; value: number }
  | { player: string; kind: 'nextRound' };

/**
 * وضعیت وگاس — مطابق قرارداد GameState: `board` همان ۶ کازینو است.
 */
export interface VegasState extends GameState<CasinoData[], VegasMove> {
  /** playerId -> کل پول برده‌شده تاکنون. */
  playerCash: Record<string, number>;
  /** playerId -> تعداد کارت‌های برده‌شده (تساوی‌شکن). */
  playerCards: Record<string, number>;
  /** playerId -> تاس‌های ریخته‌شده در نوبت جاری (بعد از گذاشتن پاک می‌شود). */
  playerDice: Record<string, number[]>;
  /** playerId -> تاس‌های باقی‌مانده برای گذاشتن در این راند. */
  playerDiceRemaining: Record<string, number>;
  totalRounds: number;
  /** آیا بازیکن جاری در این نوبت تاس ریخته است. */
  rolled: boolean;
}

export const TOTAL_ROUNDS = 4;
export const DICE_PER_PLAYER = 8;
