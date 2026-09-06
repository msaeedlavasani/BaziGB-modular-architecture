import { describe, it, expect } from 'vitest';
import { createState, getLegalMoves, applyMove, applyChain, isFinished } from '../src/index';
import { rollDiceN } from '../src/rules';

const DENOMS = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000];

const players = [
  { id: 'p1', name: 'Player 1', color: 'gold' as const },
  { id: 'p2', name: 'Player 2', color: 'gold' as const },
];

/** شبیه‌سازی ریختن تاس برای بازیکن در تست (بدون random) */
function rollFor(state: ReturnType<typeof createState>, pid: string, dice: number[]) {
  return { ...state, rolled: true, playerDice: { ...state.playerDice, [pid]: dice } };
}

describe('Vegas Game Logic (old rules)', () => {
  it('should setup 6 casinos with money stacks, 8 dice per player', () => {
    const state = createState(players);
    expect(state.board.length).toBe(6);
    expect(state.board.every((c) => c.stack !== null)).toBe(true);
    for (const c of state.board) {
      const [a, b] = c.stack!.cards;
      expect(a).toBeGreaterThanOrEqual(b);
      expect(DENOMS.includes(a)).toBe(true);
      expect(DENOMS.includes(b)).toBe(true);
    }
    expect(state.playerDiceRemaining['p1']).toBe(8);
    expect(state.playerDiceRemaining['p2']).toBe(8);
    expect(state.round).toBe(1);
    expect(state.totalRounds).toBe(4);
    expect(state.phase).toBe('playing');
    expect(state.turn).toBe('p1');
  });

  it('should require a roll before placing', () => {
    const state = createState(players);
    const moves = getLegalMoves(state);
    expect(moves.length).toBe(1);
    expect(moves[0].kind).toBe('roll');

    const after = applyMove(state, { player: 'p1', kind: 'place', value: 3 });
    expect(after).toEqual(state);
  });

  it('should roll remaining dice and allow placing a chosen value', () => {
    let state = createState(players);
    const fakeRoll = [4, 4, 2, 2, 2, 5, 5, 5];
    state = { ...state, rolled: true, playerDice: { p1: fakeRoll } };

    const moves = getLegalMoves(state);
    expect(moves.map((m) => (m as { value?: number }).value)).toEqual([2, 4, 5]);

    state = applyMove(state, { player: 'p1', kind: 'place', value: 2 });
    expect(state.board[1].dice['p1']).toBe(3);
    expect(state.playerDiceRemaining['p1']).toBe(5);
    expect(state.playerDice['p1']).toEqual([]);
    expect(state.turn).toBe('p2');
  });

  it('should skip players with no dice left', () => {
    let state = createState(players);
    state = {
      ...state,
      playerDiceRemaining: { p1: 0, p2: 4 },
      rolled: true,
      playerDice: { p2: [3, 3] },
      turn: 'p2',
    };
    state = applyMove(state, { player: 'p2', kind: 'place', value: 3 });
    expect(state.playerDiceRemaining['p2']).toBe(2);
    expect(state.turn).toBe('p2'); // p1 تاس ندارد → دوباره p2
  });

  it('should resolve the round when all dice are placed', () => {
    let state = createState(players);
    state = {
      ...state,
      playerDiceRemaining: { p1: 1, p2: 1 },
      rolled: true,
      playerDice: { p1: [6], p2: [6] },
      turn: 'p1',
    };
    state = applyMove(state, { player: 'p1', kind: 'place', value: 6 });
    expect(state.phase).toBe('playing');
    expect(state.turn).toBe('p2');
    state = rollFor(state, 'p2', [6]);
    state = applyMove(state, { player: 'p2', kind: 'place', value: 6 });
    expect(state.phase).toBe('roundEnd');
  });

  it('should award the higher card to the unique leader and lower to runner-up', () => {
    let state = createState(players);
    const casinos = state.board.map((c, i) => ({
      ...c,
      dice: i === 0 ? { p1: 5, p2: 3 } : { ...c.dice },
    }));
    state = {
      ...state,
      board: casinos,
      playerDiceRemaining: { p1: 1, p2: 1 },
      playerDice: { p1: [1], p2: [1] },
      rolled: true,
      turn: 'p1',
    };
    state = applyMove(state, { player: 'p1', kind: 'place', value: 1 });
    state = rollFor(state, 'p2', [1]);
    state = applyMove(state, { player: 'p2', kind: 'place', value: 1 });
    expect(state.phase).toBe('roundEnd');
    const stack = state.board[0].stack!;
    expect(stack.burned).toBe(false);
    expect(stack.winnerIndex).toBe('p1');
    expect(stack.runnerUpIndex).toBe('p2');
    expect(state.playerCash['p1']).toBe(stack.cards[0]);
    expect(state.playerCash['p2']).toBe(stack.cards[1]);
  });

  it('should handle the sweep rule (all 8 dice on one casino)', () => {
    let state = createState(players);
    state = {
      ...state,
      playerDiceRemaining: { p1: 8, p2: 1 },
      rolled: true,
      playerDice: { p1: [3, 3, 3, 3, 3, 3, 3, 3] },
      turn: 'p1',
    };
    state = applyMove(state, { player: 'p1', kind: 'place', value: 3 });
    expect(state.phase).toBe('playing');
    state = rollFor(state, 'p2', [3]);
    state = applyMove(state, { player: 'p2', kind: 'place', value: 3 });
    expect(state.phase).toBe('roundEnd');
    const stack = state.board[2].stack!;
    expect(stack.swept).toBe(true);
    expect(stack.winnerIndex).toBe('p1');
    expect(state.playerCash['p1']).toBe(stack.cards[0] + stack.cards[1]);
    expect(state.playerCards['p1']).toBe(2);
  });

  it('should finish after 4 rounds with a winner', () => {
    let state = createState(players);
    state.round = 4;
    const casinos = state.board.map((c) => ({ ...c, dice: { ...c.dice } }));
    casinos[5].dice = { p1: 1 };
    state = {
      ...state,
      board: casinos,
      playerCash: { p1: 1_000_000, p2: 0 },
      playerDiceRemaining: { p1: 1, p2: 1 },
      playerDice: { p1: [6], p2: [6] },
      rolled: true,
      turn: 'p1',
    };
    state = applyMove(state, { player: 'p1', kind: 'place', value: 6 });
    expect(state.phase).toBe('playing');
    state = rollFor(state, 'p2', [6]);
    state = applyMove(state, { player: 'p2', kind: 'place', value: 6 });
    expect(state.phase).toBe('finished');
    expect(state.winner).toBe('p1');
    expect(isFinished(state)).toBe(true);
  });
});

describe('Vegas helpers', () => {
  it('rollDiceN returns n dice in 1..6', () => {
    const dice = rollDiceN(8);
    expect(dice.length).toBe(8);
    for (const d of dice) {
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
    }
  });

  it('applyChain validates each step', () => {
    const state = createState(players);
    expect(() => applyChain(state, [{ player: 'p1', kind: 'roll' }, { player: 'p1', kind: 'place', value: 7 }] as never)).toThrow();
  });
});
