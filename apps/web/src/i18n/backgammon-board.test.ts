import { describe, expect, it } from 'vitest';
import { formatBackgammonCount } from './backgammon-board';

describe('Backgammon localized counters', () => {
  it('uses Persian digits for every count in the Persian locale', () => {
    expect(formatBackgammonCount('fa', 1)).toBe('۱');
    expect(formatBackgammonCount('fa', 13)).toBe('۱۳');
    expect(formatBackgammonCount('fa', -15)).toBe('۱۵');
  });

  it('uses Latin digits for every count in the English locale', () => {
    expect(formatBackgammonCount('en', 1)).toBe('1');
    expect(formatBackgammonCount('en', 13)).toBe('13');
    expect(formatBackgammonCount('en', -15)).toBe('15');
  });
});
