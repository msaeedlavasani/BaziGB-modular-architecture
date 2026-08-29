import { describe, it, expect } from 'vitest';
import { 
  createState, 
  rollDiceFor, 
  getLegalMoves, 
  applyMove, 
  applyChain, 
  canBearOff,
  canOfferDouble,
  offerDouble,
  respondDouble,
  getGameMultiplier,
  serialize,
  checkerInventory,
  canUndoMove,
  getRequiredMoveChains,
  isValidTurnDraft,
  applyTurnDraft,
  canCommitTurn,
  commitTurn,
  startNextGame,
} from '../src/index';
import type { BackgammonMove } from '../src/index';

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
    expect(state.cube).toBe(1);
    expect(state.cubeOwner).toBeNull();
    
    const totalP1 = state.board.reduce((acc, val) => acc + (val > 0 ? val : 0), 0);
    expect(totalP1).toBe(15);
  });

  it('should roll dice and update state', () => {
    let state = createState(players);
    state = rollDiceFor(state);
    expect(state.rolled).toBe(true);
    expect(state.dice!.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects a second roll and never permits undoing random dice', () => {
    const state = createState(players);
    const rolled = rollDiceFor(state);
    expect(() => rollDiceFor(rolled)).toThrow();
    expect(canUndoMove(state, { player: 'p1', kind: 'roll' })).toBe(false);
  });

  it('ends a single game instead of silently starting another board', () => {
    let state = createState(players);
    state.board.fill(0);
    state.board[23] = 1;
    state.off[1] = 14;
    state.board[0] = -15;
    state.dice = [1];
    state.rolled = true;

    state = applyChain(state, [{ player: 'p1', kind: 'move', from: 23, to: 'off', amount: 1 }]);

    expect(state.phase).toBe('finished');
    expect(state.winner).toBe('p1');
    expect(state.gameWinner).toBe('p1');
  });

  it('pauses a points match at roundEnd and resets the cube only after acknowledgement', () => {
    let state = createState(players, { matchPoint: true, winByTwo: false, targetScore: 5 });
    state.board.fill(0);
    state.board[23] = 1;
    state.off[1] = 14;
    state.board[0] = -14;
    state.off[-1] = 1;
    state.dice = [1];
    state.rolled = true;
    state.cube = 2;
    state.cubeOwner = 'p1';

    state = applyChain(state, [{ player: 'p1', kind: 'move', from: 23, to: 'off', amount: 1 }]);
    expect(state.phase).toBe('roundEnd');
    expect(state.winner).toBeNull();
    expect(state.gameWinner).toBe('p1');
    expect(state.gamePoints).toBe(2);
    expect(() => applyChain(state, [])).toThrow();

    const next = startNextGame(state);
    expect(next.phase).toBe('playing');
    expect(next.round).toBe(2);
    expect(next.scores.p1).toBe(2);
    expect(next.turn).toBe('p2');
    expect(next.cube).toBe(1);
    expect(next.cubeOwner).toBeNull();
  });

  it('activates Crawford once when a player becomes one-away', () => {
    let state = createState(players, { matchPoint: true, winByTwo: false, targetScore: 5 });
    state.phase = 'roundEnd';
    state.scores = { p1: 4, p2: 2 };
    state.gameWinner = 'p1';
    state.gamePoints = 1;
    state.nextStarter = 'p2';

    const crawford = startNextGame(state);
    expect(crawford.crawfordGame).toBe(true);
    expect(crawford.crawfordUsed).toBe(true);
    expect(canOfferDouble(crawford, 'p2')).toBe(false);

    crawford.phase = 'roundEnd';
    crawford.nextStarter = 'p1';
    const afterCrawford = startNextGame(crawford);
    expect(afterCrawford.crawfordGame).toBe(false);
    expect(afterCrawford.crawfordUsed).toBe(true);
  });

  it('prevents a dead-cube offer that would add no match value', () => {
    const state = createState(players, { matchPoint: true, winByTwo: false, targetScore: 5 });
    state.scores = { p1: 4, p2: 1 };
    expect(canOfferDouble(state, 'p1')).toBe(false);
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
    expect(serialize(state)).toMatchObject({ bar: { '-1': 1 } });
  });

  it('conserves both 15-checker inventories through a legal hit', () => {
    let state = createState(players);
    state.board[3] = -1;
    state.board[5] = -4;
    state.dice = [3];
    state.rolled = true;

    state = applyMove(state, { player: 'p1', kind: 'move', from: 0, to: 3, amount: 3 });
    expect(checkerInventory(state)).toEqual({ 1: 15, '-1': 15 });
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
    expect(state.dice!.length).toBe(0);
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
    expect(state.dice!.length).toBe(0);
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
    expect(state.dice!.length).toBe(2);

    // بعد از ۴ حرکت نوبت عوض می‌شود
    state = applyChain(state, [move, move] as any);
    expect(state.dice!.length).toBe(0);
    expect(state.turn).toBe('p2');
    expect(state.board[17]).toBe(4);
  });

  describe('Turn transaction contract', () => {
    it('keeps ownership after the second drafted die until explicit commit', () => {
      const state = createState(players);
      state.dice = [3, 4];
      state.rolled = true;
      const draft = [
        { player: 'p1', kind: 'move', from: 11, to: 14, amount: 3 },
        { player: 'p1', kind: 'move', from: 18, to: 22, amount: 4 },
      ] as BackgammonMove[];

      const first = applyTurnDraft(state, draft.slice(0, 1));
      expect(first.turn).toBe('p1');
      expect(first.dice).toEqual([4]);
      expect(isValidTurnDraft(state, draft.slice(0, 1))).toBe(true);
      expect(canCommitTurn(state, draft.slice(0, 1))).toBe(false);

      const completeDraft = applyTurnDraft(state, draft);
      expect(completeDraft.turn).toBe('p1');
      expect(completeDraft.dice).toEqual([]);
      expect(canCommitTurn(state, draft)).toBe(true);

      const committed = commitTurn(state, draft);
      expect(committed.turn).toBe('p2');
      expect(committed.rolled).toBe(false);
    });

    it('rejects a shorter chain when another die can still be played', () => {
      const state = createState(players);
      state.dice = [3, 4];
      state.rolled = true;
      const firstMove = getRequiredMoveChains(state)[0][0];

      expect(isValidTurnDraft(state, [firstMove])).toBe(true);
      expect(canCommitTurn(state, [firstMove])).toBe(false);
      expect(() => commitTurn(state, [firstMove])).toThrow('incomplete');
    });

    it('requires the higher die when only one unequal die can be used', () => {
      const state = createState(players);
      state.board.fill(0);
      state.board[23] = 1;
      state.off[1] = 14;
      state.board[0] = -15;
      state.dice = [1, 6];
      state.rolled = true;

      const chains = getRequiredMoveChains(state);
      expect(chains.length).toBeGreaterThan(0);
      expect(chains.every((chain) => chain.length === 1 && chain[0].amount === 6)).toBe(true);
      expect(isValidTurnDraft(state, [{ player: 'p1', kind: 'move', from: 23, to: 'off', amount: 1 }])).toBe(false);
    });

    it('supports an explicit no-move commit', () => {
      const state = createState(players);
      state.board.fill(0);
      state.board[0] = 14;
      state.bar[1] = 1;
      state.board[5] = -15;
      state.dice = [6, 6, 6, 6];
      state.rolled = true;

      expect(getRequiredMoveChains(state)).toEqual([[]]);
      expect(canCommitTurn(state, [])).toBe(true);
      expect(commitTurn(state, []).turn).toBe('p2');
    });

    it('keeps all four double moves in one reversible draft', () => {
      const state = createState(players);
      state.board.fill(0);
      state.board[0] = 15;
      state.dice = [1, 1, 1, 1];
      state.rolled = true;
      const chain = getRequiredMoveChains(state)[0];

      expect(chain).toHaveLength(4);
      expect(isValidTurnDraft(state, chain.slice(0, 3))).toBe(true);
      expect(canCommitTurn(state, chain.slice(0, 3))).toBe(false);
      expect(canCommitTurn(state, chain)).toBe(true);
    });
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
    
    // Mars (gammon) چون p2 هیچ مهره‌ای خارج نکرده است → امتیاز ۲
    expect(state.scores['p1']).toBe(2);
  });

  describe('Doubling Cube', () => {
    it('canOfferDouble: rules validation', () => {
      let state = createState(players);
      expect(canOfferDouble(state, 'p1')).toBe(true);

      state.rolled = true;
      expect(canOfferDouble(state, 'p1')).toBe(false); // بعد از roll مجاز نیست

      state.rolled = false;
      state.cube = 64;
      expect(canOfferDouble(state, 'p1')).toBe(false); // cube=64 مجاز نیست

      state.cube = 2;
      state.cubeOwner = 'p1';
      expect(canOfferDouble(state, 'p1')).toBe(true); // مالک کیوب مجاز است

      state.cubeOwner = 'p2';
      expect(canOfferDouble(state, 'p1')).toBe(false); // غیرمالک نامجاز است

      state.doubling = { offeredBy: 'p2' };
      expect(canOfferDouble(state, 'p1')).toBe(false); // وقتی doubling معلق نامجاز
    });

    it('offerDouble should set pending offer', () => {
      let state = createState(players);
      state = offerDouble(state, 'p1');
      expect(state.doubling).toEqual({ offeredBy: 'p1' });
    });

    it('respondDouble accept: double cube and transfer ownership', () => {
      let state = createState(players);
      state.doubling = { offeredBy: 'p1' };
      state.turn = 'p1';

      state = respondDouble(state, 'p2', true);
      expect(state.cube).toBe(2);
      expect(state.cubeOwner).toBe('p2');
      expect(state.doubling).toBeNull();
      expect(state.turn).toBe('p1'); // turn ثابت میماند
    });

    it('respondDouble decline: finish game and award points', () => {
      let state = createState(players);
      state.cube = 2;
      state.doubling = { offeredBy: 'p1' };
      
      state = respondDouble(state, 'p2', false);
      expect(state.phase).toBe('finished');
      expect(state.round).toBe(1);
      expect(state.winner).toBe('p1');
      expect(state.scores['p1']).toBe(2); // cube=2
    });
  });

  describe('Game Multipliers (Mars & Backgammon)', () => {
    it('getGameMultiplier: normal win (multiplier 1)', () => {
      let state = createState(players);
      state.off[-1] = 1;
      // Move p2 checkers out of p1's home (18-23)
      state.board[23] = 0;
      state.board[12] = -7;
      expect(getGameMultiplier(state, 1)).toBe(1);
    });

    it('getGameMultiplier: gammon (multiplier 2)', () => {
      let state = createState(players);
      state.off[-1] = 0;
      // هیچ مهره‌ای در خانه برنده یا بار نیست
      state.board.fill(0);
      state.board[10] = -15; // همه در نیمه اول
      expect(getGameMultiplier(state, 1)).toBe(2);
    });

    it('getGameMultiplier: backgammon (multiplier 3) - checker in winner home', () => {
      let state = createState(players);
      state.off[-1] = 0;
      state.board.fill(0);
      state.board[20] = -1; // در خانه بازیکن ۱ (۱۸-۲۳)
      expect(getGameMultiplier(state, 1)).toBe(3);
    });

    it('getGameMultiplier: backgammon (multiplier 3) - checker in bar', () => {
      let state = createState(players);
      state.off[-1] = 0;
      state.bar[-1] = 1;
      expect(getGameMultiplier(state, 1)).toBe(3);
    });

    it('Combined Cube and Multiplier', () => {
      let state = createState(players);
      state.cube = 2;
      state.off[1] = 14;
      state.board.fill(0);
      state.board[23] = 1; // یک مهره p1 باقی‌مانده
      // p2 هیچ مهره‌ای خارج نکرده (gammon)
      state.off[-1] = 0;
      state.dice = [1];
      state.rolled = true;
      
      const chain = [{ player: 'p1', kind: 'move', from: 23, to: 'off', amount: 1 }] as any;
      state = applyChain(state, chain);
      
      // 2 (cube) * 2 (gammon) = 4
      expect(state.scores['p1']).toBe(4);
    });
  });

  it('new games reset the cube instead of carrying it across a match', () => {
    let state = createState(players, { matchPoint: true, winByTwo: false, targetScore: 9 });
    state.cube = 4;
    state.cubeOwner = 'p2';
    state.off[1] = 14;
    state.board.fill(0);
    state.board[23] = 1;
    state.off[-1] = 1; // Normal win (multiplier 1)
    state.dice = [1];
    state.rolled = true;
    
    const chain = [{ player: 'p1', kind: 'move', from: 23, to: 'off', amount: 1 }] as any;
    state = applyChain(state, chain);
    
    expect(state.phase).toBe('roundEnd');
    expect(state.round).toBe(1);
    const next = startNextGame(state);
    expect(next.round).toBe(2);
    expect(next.cube).toBe(1);
    expect(next.cubeOwner).toBeNull();
  });

  it('serialize should include cube fields', () => {
    let state = createState(players);
    state.cube = 2;
    state.cubeOwner = 'p1';
    state.doubling = { offeredBy: 'p1' };
    
    const data = serialize(state);
    expect(data.cube).toBe(2);
    expect(data.cubeOwner).toBe('p1');
    expect(data.doubling).toEqual({ offeredBy: 'p1' });
  });
});
