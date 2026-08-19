import { describe, it, expect } from 'vitest';
import { 
  createState, 
  getLegalMoves, 
  applyMove, 
  isSquareAttacked, 
  kingInCheck 
} from '../src/index';
import { Player } from '@bazigb/engine';

const players: Player[] = [
  { id: 'p1', name: 'Ali', color: 'white' },
  { id: 'p2', name: 'Reza', color: 'black' }
];

describe('Chess Game Logic', () => {
  it('1. Starting position: white knight g1 moves', () => {
    const state = createState(players);
    const moves = getLegalMoves(state);
    
    // g1 = 62, target f3 = 45 or h3 = 47
    const knightMove = moves.find(m => m.from === 62 && (m.to === 45 || m.to === 47));
    expect(knightMove).toBeDefined();

    // e2 = 52, e3 = 44, e4 = 36
    const pawnSingle = moves.find(m => m.from === 52 && m.to === 44);
    const pawnDouble = moves.find(m => m.from === 52 && m.to === 36);
    expect(pawnSingle).toBeDefined();
    expect(pawnDouble).toBeDefined();
  });

  it('2. En passant capture', () => {
    let state = createState(players);
    
    // سفید e4 (52->36)
    state = applyMove(state, { player: 'p1', kind: 'move', from: 52, to: 36 });
    // سیاه a6 (8->16) - حرکت بیهوده برای نوبت
    state = applyMove(state, { player: 'p2', kind: 'move', from: 8, to: 16 });
    // سفید e5 (36->28)
    state = applyMove(state, { player: 'p1', kind: 'move', from: 36, to: 28 });
    // سیاه d5 (11->27) - دو پله‌ای
    state = applyMove(state, { player: 'p2', kind: 'move', from: 11, to: 27 });

    expect(state.enPassant).toBe(19); // d6 = 19
    
    const moves = getLegalMoves(state);
    const epMove = moves.find(m => m.from === 28 && m.to === 19);
    expect(epMove).toBeDefined();

    state = applyMove(state, epMove!);
    expect(state.board[27]).toBeNull(); // پیاده سیاه حذف شد
  });

  it('3. Castling rights and blocking', () => {
    let state = createState(players);
    
    // خالی کردن مسیر قلعه کوچک سفید (f1=61, g1=62)
    state.board[61] = null;
    state.board[62] = null;
    
    let moves = getLegalMoves(state);
    expect(moves.find(m => m.from === 60 && m.to === 62)).toBeDefined();

    // مسدود کردن با کیش
    state.board[45] = { type: 'n', color: 'black' }; // اسب سیاه در f3
    moves = getLegalMoves(state);
    expect(moves.find(m => m.from === 60 && m.to === 62)).toBeUndefined();
  });

  it('4. Scholar\'s Mate (Check detection)', () => {
    let state = createState(players);
    // e4, e5
    state = applyMove(state, { player: 'p1', kind: 'move', from: 52, to: 36 });
    state = applyMove(state, { player: 'p2', kind: 'move', from: 12, to: 28 });
    // Bc4 (فیل شاه f1→c4), Nc6
    state = applyMove(state, { player: 'p1', kind: 'move', from: 61, to: 34 });
    state = applyMove(state, { player: 'p2', kind: 'move', from: 1, to: 18 });
    // Qh5
    state = applyMove(state, { player: 'p1', kind: 'move', from: 59, to: 31 });

    expect(isSquareAttacked(state.board, 13, 'white')).toBe(true); // f7 is attacked
  });

  it('5. Fool\'s Mate (Checkmate)', () => {
    let state = createState(players);
    // f3, e5, g4, Qh4#
    state = applyMove(state, { player: 'p1', kind: 'move', from: 53, to: 45 });
    state = applyMove(state, { player: 'p2', kind: 'move', from: 12, to: 28 });
    state = applyMove(state, { player: 'p1', kind: 'move', from: 54, to: 38 });
    state = applyMove(state, { player: 'p2', kind: 'move', from: 3, to: 39 }); // Qh4

    expect(state.phase).toBe('finished');
    expect(state.winner).toBe('p2');
  });

  it('6. Promotion', () => {
    const state = createState(players);
    // قرار دادن پیاده سفید در a7 (نمایه ۸) و خالی کردن a8 (نمایه ۰)
    state.board[8] = { type: 'p', color: 'white' };
    state.board[0] = null;
    state.turn = 'p1';

    const moves = getLegalMoves(state);
    const promoMoves = moves.filter(m => m.from === 8 && m.to === 0);
    expect(promoMoves.length).toBe(4); // q, r, b, n

    const queenMove = promoMoves.find(m => m.promotion === 'q')!;
    const nextState = applyMove(state, queenMove);
    expect(nextState.board[0]?.type).toBe('q');
  });

  it('7. Stalemate', () => {
    const state = createState(players);
    state.board.fill(null);

    // سیاه: شاه در a8 (0) — سفید: شاه در c6 (42)، وزیر در c7 (10)
    state.board[0] = { type: 'k', color: 'black' };
    state.board[42] = { type: 'k', color: 'white' };
    state.board[10] = { type: 'q', color: 'white' };

    state.turn = 'p2'; // نوبت سیاه
    state.castling = { K: false, Q: false, k: false, q: false };

    // هیچ حرکت قانونی وجود ندارد و شاه در کیش نیست → پات
    expect(kingInCheck(state.board, 'black')).toBe(false);
    expect(getLegalMoves(state).length).toBe(0);
  });
});
