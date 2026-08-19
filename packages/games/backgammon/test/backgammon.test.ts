import { describe, it, expect } from 'vitest';
import { 
  createState, 
  rollDiceFor, 
  getLegalMoves, 
  applyMove, 
  applyChain, 
  canBearOff 
} from '../src/index';

const players = [
  { id: 'p1', name: 'Player 1', color: 1 as const },
  { id: 'p2', name: 'Player 2', color: -1 as const }
];

describe('Backgammon Game Logic', () => {
  it('should setup the board correctly', () => {
    const state = createState(players);
    expect(state.board[0]).toBe(2);
    expect(state.board[23]).toBe(-2);
    expect(state.bar[1]).toBe(0);
    expect(state.bar[-1]).toBe(0);
    
    const totalP1 = state.board.reduce((acc, val) => acc + (val > 0 ? val : 0), 0);
    expect(totalP1).toBe(15);
  });

  it('should roll dice and update state', () => {
    let state = createState(players);
    state = rollDiceFor(state);
    expect(state.rolled).toBe(true);
    expect(state.dice.length).toBeGreaterThanOrEqual(2);
  });

  it('should identify legal moves with a single die', () => {
    let state = createState(players);
    state.dice = [3, 5];
    state.rolled = true;

    const moves = getLegalMoves(state);
    // بازیکن ۱ از نقطه ۱۱ (۵ مهره) میتواند ۳ تا به ۸ یا ۵ تا به ۶ برود
    expect(moves.some(m => m.from === 11 && m.to === 8 && m.amount === 3)).toBe(true);
    expect(moves.some(m => m.from === 11 && m.to === 6 && m.amount === 5)).toBe(true);
  });

  it('should handle hitting an opponent checker', () => {
    let state = createState(players);
    // قرار دادن یک مهره تنها از بازیکن ۲ در نقطه ۳
    state.board[3] = -1;
    state.dice = [3];
    state.rolled = true;

    const move = { player: 'p1', kind: 'move', from: 0, to: 3, amount: 3 } as const;
    state = applyMove(state, move);

    expect(state.board[3]).toBe(1);
    expect(state.bar[-1]).toBe(1);
  });

  it('should enforce bar entry rules', () => {
    let state = createState(players);
    state.bar[1] = 1;
    state.dice = [2, 5];
    state.rolled = true;

    const moves = getLegalMoves(state);
    // فقط حرکت از بار مجاز است
    expect(moves.every(m => m.from === 'bar')).toBe(true);
    // مقاصد: 24-2=22 و 24-5=19
    expect(moves.some(m => m.to === 22)).toBe(true);
    expect(moves.some(m => m.to === 19)).toBe(true);
  });

  it('should handle bear off logic', () => {
    let state = createState(players);
    // تمام مهره‌ها در خانه امن بازیکن ۱ (۰-۵)
    state.board.fill(0);
    state.board[0] = 15;
    expect(canBearOff(state, 'p1')).toBe(true);

    state.dice = [1, 2];
    state.rolled = true;
    const moves = getLegalMoves(state);
    expect(moves.some(m => m.to === 'off')).toBe(true);
  });

  it('should switch turns after applying a full chain', () => {
    let state = createState(players);
    state.dice = [3, 4];
    state.rolled = true;
    
    const chain = [
      { player: 'p1', kind: 'move', from: 11, to: 8, amount: 3 },
      { player: 'p1', kind: 'move', from: 18, to: 14, amount: 4 }
    ] as any;

    state = applyChain(state, chain);
    expect(state.turn).toBe('p2');
    expect(state.dice.length).toBe(0);
    expect(state.rolled).toBe(false);
  });

  it('should handle doubles correctly', () => {
    let state = createState(players);
    state.dice = [4, 4, 4, 4]; // موتور بازی در صورت جفت بودن ۴ تاس می‌دهد
    state.rolled = true;
    
    const moves = getLegalMoves(state);
    expect(moves.every(m => m.amount === 4)).toBe(true);
  });

  it('should update match score and handle winner', () => {
    let state = createState(players);
    state.off[1] = 14;
    state.board.fill(0);
    state.board[0] = 1; // یک مهره باقی‌مانده
    state.dice = [1];
    state.rolled = true;
    
    const chain = [{ player: 'p1', kind: 'move', from: 0, to: 'off', amount: 1 }] as any;
    state = applyChain(state, chain);
    
    expect(state.scores['p1']).toBe(1);
  });
});
