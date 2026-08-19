import { describe, expect, it } from 'vitest';
import { Vegas, applyMove, createState, getBestMove, getBet, getLegalMoves } from '../src/index';
import type { VegasState } from '../src/index';

const players = () => [
  { id: 'p1', name: 'بازیکن ۱', color: 'gold' as const },
  { id: 'p2', name: 'بازیکن ۲', color: 'gold' as const },
];

/** یک نوبت کامل: شرط → تاس → حرکت */
function fullTurn(s: VegasState, amount: number): VegasState {
  let next = applyMove(s, { player: s.turn, kind: 'bet', amount });
  next = applyMove(next, { player: next.turn, kind: 'roll' });
  const move = getLegalMoves(next).find((m) => m.kind === 'move');
  return applyMove(next, move!);
}

describe('قوانین وگاس', () => {
  it('وضعیت اولیه: ۱۰۰ چیپ، موقعیت صفر، فاز شرط', () => {
    const s = createState(players());
    expect(s.scores.p1).toBe(100);
    expect(s.positions.p1).toBe(0);
    expect(s.phase).toBe('bet');
    expect(s.match.matchPoint).toBe(false); // قانون جداسازی
  });

  it('شرط از چیپها کم و به پات اضافه میکند', () => {
    let s = createState(players());
    s = applyMove(s, { player: 'p1', kind: 'bet', amount: 5 });
    expect(s.scores.p1).toBe(95);
    expect(s.pot).toBe(5);
    expect(s.phase).toBe('roll');
  });

  it('شرط بیش از چیپ رد میشود', () => {
    const s = createState(players());
    expect(() => applyMove(s, { player: 'p1', kind: 'bet', amount: 1000 })).toThrow();
  });

  it('زنجیره حرکات ترکیبی گامبهگام اعتبارسنجی میشود', () => {
    let s = createState(players());
    s = applyMove(s, { player: 'p1', kind: 'bet', amount: 3 });
    s = applyMove(s, { player: 'p1', kind: 'roll' });
    // تاس را قطعی میکنیم تا تست پایدار باشد (۱ و ۲ → دو گام)
    s = { ...s, dice: [1, 2] };
    const legal = getLegalMoves(s);
    const move = legal.find((m) => m.kind === 'move')!;
    expect((move as { chain: unknown[] }).chain.length).toBe(2);
    const next = applyMove(s, move);
    expect(next.positions.p1).toBe(3); // 0 → 1 → 3
    expect(next.turn).toBe('p2');
    expect(next.phase).toBe('bet');
  });

  it('رسیدن به پایان مسیر → برنده راند پات را میگیرد', () => {
    let s = createState(players());
    // p1 را به نقطه ۱۱ میرسانیم (با مقداردهی مستقیم برای تست)
    s = { ...s, positions: { ...s.positions, p1: 11 } };
    s = applyMove(s, { player: 'p1', kind: 'bet', amount: 5 });
    s = applyMove(s, { player: 'p1', kind: 'roll' });
    // تاس اجباری ۱-۱ → 11+1+1 = پایان راند
    s = { ...s, dice: [1, 1], phase: 'move' };
    const move = getLegalMoves(s).find((m) => m.kind === 'move')!;
    const next = applyMove(s, move);
    // چیپها: ۱۰۰ - ۵ (شرط) + ۵ (پات) = ۱۰۰
    expect(next.scores.p1).toBe(100);
    expect(next.round).toBe(2);
    expect(next.phase).toBe('bet');
    expect(next.positions.p1).toBe(0); // راند جدید از صفر
  });

  it('تطبیقگر رسمی: تطبیق ID و نام', () => {
    expect(Vegas.gameId).toBe('vegas');
    expect(Vegas.name).toBe('وگاس');
  });
});

describe('AI وگاس', () => {
  it('easy: شرط قانونی انتخاب میکند', () => {
    const s = createState(players());
    const bet = getBestMove(s, 'easy');
    expect(bet.kind).toBe('bet');
    expect((bet as { amount: number }).amount).toBeGreaterThanOrEqual(1);
  });

  it('medium: وقتی جلوتر است شرط بیشتری میبندد', () => {
    const s: VegasState = { ...createState(players()), positions: { p1: 8, p2: 2 } };
    const bet = getBet(s, 'medium') as { amount: number };
    expect(bet.amount).toBeGreaterThan(1);
  });
});
