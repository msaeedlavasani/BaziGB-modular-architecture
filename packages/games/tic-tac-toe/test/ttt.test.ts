import { describe, expect, it } from 'vitest';
import {
  TicTacToe,
  applyMove,
  createState,
  getBestMove,
  getLegalMoves,
  getRoundWinner,
} from '../src/index';
import type { TTTState } from '../src/index';

const players = () => [
  { id: 'p1', name: 'بازیکن ۱', color: 'x' as const },
  { id: 'p2', name: 'بازیکن ۲', color: 'o' as const },
];

function stateWith(history: number[]): TTTState {
  let s = createState(players(), { matchPoint: false, winByTwo: false, targetScore: 1 });
  for (const cell of history) {
    s = applyMove(s, { player: s.turn, kind: 'place', to: cell });
  }
  return s;
}

describe('قوانین دوز', () => {
  it('برد اولیه خالی است و بازیکن اول شروع میکند', () => {
    const s = createState(players());
    expect(s.board).toEqual(Array(9).fill(null));
    expect(s.turn).toBe('p1');
    expect(getLegalMoves(s)).toHaveLength(9);
  });

  it('حرکت در خانه پر رد میشود', () => {
    let s = createState(players());
    s = applyMove(s, { player: 'p1', kind: 'place', to: 0 });
    expect(() => applyMove(s, { player: 'p2', kind: 'place', to: 0 })).toThrow();
  });

  it('حرکت خارج از نوبت رد میشود', () => {
    const s = createState(players());
    expect(() => applyMove(s, { player: 'p2', kind: 'place', to: 0 })).toThrow();
  });

  it('خط عمودی برنده را تشخیص میدهد', () => {
    let s = createState(players(), { matchPoint: false, winByTwo: false, targetScore: 1 });
    for (const cell of [0, 3, 1, 4]) {
      s = applyMove(s, { player: s.turn, kind: 'place', to: cell });
    }
    expect(getRoundWinner(s.board)).toBeNull(); // هنوز برنده نیست
    s = applyMove(s, { player: s.turn, kind: 'place', to: 2 }); // x در 0،1،2
    expect(getRoundWinner(s.board)).toBeNull(); // برد تشخیص داده شده و راند ریست شده
    expect(s.scores.p1).toBe(1);
    expect(s.round).toBe(2); // راند جدید
  });

  it('مساوی → راند جدید بدون امتیاز', () => {
    const s = stateWith([0, 1, 2, 4, 3, 5, 7, 6, 8]);
    expect(getRoundWinner(s.board)).toBeNull();
    expect(s.scores.p1).toBe(0);
    expect(s.round).toBe(2);
  });

  it('Match Point: رسیدن به امتیاز هدف = پایان مسابقه', () => {
    let s = createState(players(), { matchPoint: true, winByTwo: false, targetScore: 2 });
    // ۳ راند؛ هر راند را «شروعکننده راند» میبرد (نوبت شروع هر راند جابهجا میشود)
    for (let round = 1; round <= 3; round++) {
      s = applyMove(s, { player: s.turn, kind: 'place', to: 0 });
      s = applyMove(s, { player: s.turn, kind: 'place', to: 3 });
      s = applyMove(s, { player: s.turn, kind: 'place', to: 1 });
      s = applyMove(s, { player: s.turn, kind: 'place', to: 4 });
      s = applyMove(s, { player: s.turn, kind: 'place', to: 2 });
    }
    // راند ۱: p1، راند ۲: p2، راند ۳: p1 → p1 به امتیاز ۲ رسید
    expect(s.scores.p1).toBe(2);
    expect(s.scores.p2).toBe(1);
    expect(s.phase).toBe('finished');
    expect(s.winner).toBe('p1');
  });

  it('تطبیقگر رسمی حرکت زنجیرهای را اعتبارسنجی میکند', () => {
    const s = createState(players());
    const next = TicTacToe.applyChain(s, [
      { player: 'p1', kind: 'place', to: 0 },
      { player: 'p2', kind: 'place', to: 1 },
    ]);
    expect(next.board[0]).toBe('x');
    expect(next.board[1]).toBe('o');
  });
});

describe('AI دوز', () => {
  it('easy: همیشه حرکت قانونی برمیگرداند', () => {
    const s = createState(players());
    const m = getBestMove(s, 'easy');
    expect(m).not.toBeNull();
    expect(s.board[m!.to]).toBeNull();
  });

  it('hard: حرکت برنده را در یک حرکت پیدا میکند', () => {
    // p1 (x) دو مهره در خانههای 0 و 1 دارد؛ خانه 2 خالی است
    let s = createState(players());
    s = applyMove(s, { player: 'p1', kind: 'place', to: 0 });
    s = applyMove(s, { player: 'p2', kind: 'place', to: 3 });
    s = applyMove(s, { player: 'p1', kind: 'place', to: 1 });
    s = applyMove(s, { player: 'p2', kind: 'place', to: 4 });
    const m = getBestMove(s, 'hard');
    expect(m!.to).toBe(2);
  });

  it('hard: حرکت بلاک را پیدا میکند', () => {
    // p2 (o) دو مهره دارد؛ p1 باید بلاک کند
    let s = createState(players());
    s = applyMove(s, { player: 'p1', kind: 'place', to: 3 });
    s = applyMove(s, { player: 'p2', kind: 'place', to: 0 });
    s = applyMove(s, { player: 'p1', kind: 'place', to: 4 });
    s = applyMove(s, { player: 'p2', kind: 'place', to: 1 });
    const m = getBestMove(s, 'hard');
    expect(m!.to).toBe(2);
  });
});
