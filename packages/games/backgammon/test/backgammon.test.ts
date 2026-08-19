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
    // بازیکن ۱ (روشن) در جهت عقربه‌های ساعت: از نقطه ۱۱ (۵ مهره) با ۳ به ۱۴ و با ۵ به ۱۶
    expect(moves.some(m => m.from === 11 && m.to === 14 && m.amount === 3)).toBe(true);
    expect(moves.some(m => m.from === 11 && m.to === 16 && m.amount === 5)).toBe(true);
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

  it('should play all 4 dice with doubles after a hit (bar entry + moves)', () => {
    // سیاه مهرهٔ سفید را زده → سفید روی بار (بار[1]=1)
    let state = createState(players);
    state.bar[1] = 1;
    state.board.fill(0);
    state.board[0] = 1; // سفید باقی‌مانده در خانه امن
    state.dice = [6, 6, 6, 6];
    state.rolled = true;
    state.turn = 'p1';

    // ورود از بار با تاس ۶ → نقطه ۵ (6-1)، سپس ۵→۱۱→۱۷→۲۳
    const chain = [
      { player: 'p1', kind: 'move', from: 'bar', to: 5, amount: 6 },
      { player: 'p1', kind: 'move', from: 5, to: 11, amount: 6 },
      { player: 'p1', kind: 'move', from: 11, to: 17, amount: 6 },
      { player: 'p1', kind: 'move', from: 17, to: 23, amount: 6 },
    ] as any;

    state = applyChain(state, chain);
    expect(state.dice.length).toBe(0);
    expect(state.turn).toBe('p2');
    expect(state.bar[1]).toBe(0);
    expect(state.board[23]).toBe(1);
  });

  it('should pass automatically when bar entry is blocked with doubles', () => {
    let state = createState(players);
    state.bar[1] = 1;
    state.board.fill(0);
    state.board[5] = -3; // نقطه ۵ با ۳ مهرهٔ سیاه بسته است
    state.board[0] = 1;
    state.dice = [6, 6, 6, 6];
    state.rolled = true;
    state.turn = 'p1';

    const moves = getLegalMoves(state);
    expect(moves.length).toBe(0);

    state = applyChain(state, []);
    expect(state.turn).toBe('p2');
    expect(state.bar[1]).toBe(1); // سفید هنوز روی بار است
  });

  it('should enforce bar entry rules', () => {
    let state = createState(players);
    state.bar[1] = 1;
    state.dice = [2, 5];
    state.rolled = true;

    const moves = getLegalMoves(state);
    // فقط حرکت از بار مجاز است
    expect(moves.every(m => m.from === 'bar')).toBe(true);
    // مقاصد برای رنگ ۱ (روشن): die-1 → 2-1=1 و 5-1=4
    expect(moves.some(m => m.to === 1)).toBe(true);
    expect(moves.some(m => m.to === 4)).toBe(true);
  });

  it('should handle bear off logic', () => {
    let state = createState(players);
    // تمام مهره‌ها در خانه امن بازیکن ۱ (۱۸-۲۳)
    state.board.fill(0);
    state.board[18] = 15;
    expect(canBearOff(state, 'p1')).toBe(true);

    // با تاس ۱ و ۲: از نقطه ۲۳ (+۱=off) و از نقطه ۲۲ (+۲=off)
    state.board.fill(0);
    state.board[22] = 7;
    state.board[23] = 8;
    state.dice = [1, 2];
    state.rolled = true;
    const moves = getLegalMoves(state);
    expect(moves.some(m => m.from === 23 && m.to === 'off' && m.amount === 1)).toBe(true);
    expect(moves.some(m => m.from === 22 && m.to === 'off' && m.amount === 2)).toBe(true);
  });

  it('should switch turns after applying a full chain', () => {
    let state = createState(players);
    state.dice = [3, 4];
    state.rolled = true;
    
    const chain = [
      { player: 'p1', kind: 'move', from: 11, to: 14, amount: 3 },
      { player: 'p1', kind: 'move', from: 18, to: 22, amount: 4 }
    ] as any;

    state = applyChain(state, chain);
    expect(state.turn).toBe('p2');
    expect(state.dice.length).toBe(0);
    expect(state.rolled).toBe(false);
  });

  it('should give 4 moves on doubles (not 2)', () => {
    let state = createState(players);
    state.dice = [6, 6, 6, 6];
    state.rolled = true;
    state.turn = 'p1';
    // از نقطه ۱۱ (۵ مهره) چهار بار ۶ → مقصد ۱۷
    const move = { player: 'p1', kind: 'move', from: 11, to: 17, amount: 6 };
    expect(getLegalMoves(state).some((m) => m.from === 11 && m.to === 17 && m.amount === 6)).toBe(true);

    // بعد از ۲ حرکت هنوز نوبت p1 است
    state = applyChain(state, [move, move] as any);
    expect(state.turn).toBe('p1');
    expect(state.dice.length).toBe(2);

    // بعد از ۴ حرکت نوبت عوض می‌شود
    state = applyChain(state, [move, move] as any);
    expect(state.dice.length).toBe(0);
    expect(state.turn).toBe('p2');
    expect(state.board[17]).toBe(4);
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
    state.board[23] = 1; // یک مهره باقی‌مانده در انتهای خانه امن (نقطه ۲۴)
    state.dice = [1];
    state.rolled = true;
    
    const chain = [{ player: 'p1', kind: 'move', from: 23, to: 'off', amount: 1 }] as any;
    state = applyChain(state, chain);
    
    expect(state.scores['p1']).toBe(1);
  });
});
