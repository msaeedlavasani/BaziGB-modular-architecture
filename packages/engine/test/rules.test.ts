import { describe, expect, it } from 'vitest';
import {
  isMatchFinished,
  sanitizeMatch,
  supportsMatchPoint,
  updateMatchScore,
} from '../src/rules';

describe('Rule Segregation — Match Point فقط برای نرد و دوز', () => {
  it('نرد و دوز از Match Point پشتیبانی میکنند', () => {
    expect(supportsMatchPoint('backgammon')).toBe(true);
    expect(supportsMatchPoint('tic-tac-toe')).toBe(true);
  });

  it('شطرنج و وگاس هرگز Match Point ندارند', () => {
    expect(supportsMatchPoint('chess')).toBe(false);
    expect(supportsMatchPoint('vegas')).toBe(false);
  });

  it('sanitizeMatch قوانین ممنوعه شطرنج را غیرفعال میکند', () => {
    const m = sanitizeMatch('chess', { matchPoint: true, winByTwo: true, targetScore: 7 });
    expect(m.matchPoint).toBe(false);
    expect(m.winByTwo).toBe(false);
  });

  it('winByTwo بدون matchPoint غیرفعال میشود', () => {
    const m = sanitizeMatch('backgammon', { matchPoint: false, winByTwo: true, targetScore: 7 });
    expect(m.winByTwo).toBe(false);
  });
});

describe('updateMatchScore — امتیازدهی مسابقه', () => {
  it('بدون matchPoint فقط شمارنده راندها', () => {
    const r = updateMatchScore('backgammon', { p1: 0, p2: 0 }, 'p1', {
      matchPoint: false,
      winByTwo: false,
      targetScore: 1,
    });
    expect(r.scores.p1).toBe(1);
    expect(r.matchWinner).toBeNull();
  });

  it('updateMatchScore با پارامتر points اختیاری', () => {
    const r = updateMatchScore('backgammon', { p1: 0, p2: 0 }, 'p1', {
      matchPoint: false,
      winByTwo: false,
      targetScore: 1,
    }, 2);
    expect(r.scores.p1).toBe(2);
  });

  it('matchPoint: رسیدن به targetScore = برنده مسابقه', () => {
    const r = updateMatchScore('backgammon', { p1: 6, p2: 4 }, 'p1', {
      matchPoint: true,
      winByTwo: false,
      targetScore: 7,
    });
    expect(r.scores.p1).toBe(7);
    expect(r.matchWinner).toBe('p1');
  });

  it('winByTwo: با اختلاف ۱ امتیاز مسابقه ادامه مییابد', () => {
    const match = { matchPoint: true, winByTwo: true, targetScore: 7 };
    const r1 = updateMatchScore('backgammon', { p1: 6, p2: 6 }, 'p1', match);
    expect(r1.scores.p1).toBe(7);
    expect(r1.matchWinner).toBeNull(); // اختلاف ۱ → ادامه

    const r2 = updateMatchScore('backgammon', { p1: 7, p2: 6 }, 'p1', match);
    expect(r2.scores.p1).toBe(8);
    expect(r2.matchWinner).toBe('p1'); // اختلاف ۲ → برنده
  });

  it('isMatchFinished با قوانین winByTwo', () => {
    const match = { matchPoint: true, winByTwo: true, targetScore: 7 };
    expect(isMatchFinished('backgammon', { p1: 7, p2: 6 }, match)).toBe(false);
    expect(isMatchFinished('backgammon', { p1: 7, p2: 5 }, match)).toBe(true);
  });
});
