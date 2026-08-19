import { describe, expect, it } from 'vitest';
import { diceSteps, rollDicePair, shuffle, switchTurn } from '../src/utils';

describe('دستگاه تاس (Dice Engine)', () => {
  it('تاس تکراری ۴ گام تولید میکند (۶-۶ → ۴ بار)', () => {
    expect(diceSteps([6, 6])).toEqual([6, 6, 6, 6]);
  });

  it('تاس غیرتکراری دو گام دارد', () => {
    expect(diceSteps([3, 5])).toEqual([3, 5]);
  });

  it('پرتاب دو تاس در بازه ۱ تا ۶ است', () => {
    for (let i = 0; i < 50; i++) {
      const [a, b] = rollDicePair();
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(6);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(6);
    }
  });
});

describe('ابزارهای نوبت', () => {
  it('switchTurn بین دو بازیکن جابهجا میشود', () => {
    const players = [{ id: 'p1' }, { id: 'p2' }];
    expect(switchTurn('p1', players)).toBe('p2');
    expect(switchTurn('p2', players)).toBe('p1');
  });

  it('shuffle همه عناصر را حفظ میکند', () => {
    const arr = [1, 2, 3, 4, 5];
    const s = shuffle(arr);
    expect(s.sort((a, b) => a - b)).toEqual(arr);
  });
});
