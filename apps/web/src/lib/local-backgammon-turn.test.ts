import { describe, expect, it } from 'vitest';
import { createState, commitTurn, type BackgammonMove } from '@bazigb/game-backgammon';
import {
  addLocalBackgammonMove,
  autoDraftForcedBearOff,
  canCommitLocalBackgammonTurn,
  commitLocalBackgammonTurnTransaction,
  getLocalBackgammonNextMoves,
  restoreLocalBackgammonTurn,
  startLocalBackgammonTurn,
  undoLocalBackgammonMove,
} from './local-backgammon-turn';

const players = [
  { id: 'p1', name: 'Human', color: 1 as const },
  { id: 'p2', name: 'Bot', color: -1 as const, isBot: true },
];

const rolledState = () => {
  const state = createState(players);
  state.dice = [3, 4];
  state.rolled = true;
  return state;
};

const moves = [
  { player: 'p1', kind: 'move', from: 11, to: 14, amount: 3 },
  { player: 'p1', kind: 'move', from: 18, to: 22, amount: 4 },
] as BackgammonMove[];

describe('local Backgammon turn controller', () => {
  it('keeps both moves draftable and undoable before commit', () => {
    let transaction = startLocalBackgammonTurn(rolledState());
    const first = addLocalBackgammonMove(transaction, moves[0]);
    transaction = first.transaction;
    const second = addLocalBackgammonMove(transaction, moves[1]);

    expect(second.state.turn).toBe('p1');
    expect(second.state.dice).toEqual([]);
    expect(canCommitLocalBackgammonTurn(second.transaction)).toBe(true);

    const undone = undoLocalBackgammonMove(second.transaction);
    expect(undone.state.turn).toBe('p1');
    expect(undone.state.dice).toEqual([4]);
    expect(undone.transaction.moves).toHaveLength(1);
  });

  it('exposes only next moves that preserve a required complete chain', () => {
    const transaction = startLocalBackgammonTurn(rolledState());
    const next = getLocalBackgammonNextMoves(transaction) ?? [];
    expect(next.length).toBeGreaterThan(0);
    expect(next.every((move) => move.kind === 'move')).toBe(true);
  });

  it('commits only after the complete draft', () => {
    let transaction = startLocalBackgammonTurn(rolledState());
    transaction = addLocalBackgammonMove(transaction, moves[0]).transaction;
    expect(canCommitLocalBackgammonTurn(transaction)).toBe(false);
    transaction = addLocalBackgammonMove(transaction, moves[1]).transaction;
    expect(commitTurn(transaction.baseState, transaction.moves).turn).toBe('p2');
  });

  it('restores only a valid persisted transaction', () => {
    const transaction = addLocalBackgammonMove(startLocalBackgammonTurn(rolledState()), moves[0]).transaction;
    expect(restoreLocalBackgammonTurn(JSON.parse(JSON.stringify(transaction)))?.moves).toHaveLength(1);
    expect(restoreLocalBackgammonTurn({ baseState: transaction.baseState, moves: [{ kind: 'move' }] })).toBeNull();
  });

  it('auto-drafts an unambiguous forced bear-off and keeps it undoable', () => {
    const state = createState(players);
    state.board.fill(0);
    state.board[23] = 1;
    state.off[1] = 14;
    state.board[0] = -15;
    state.dice = [1];
    state.rolled = true;

    const auto = autoDraftForcedBearOff(startLocalBackgammonTurn(state));
    expect(auto.applied).toHaveLength(1);
    expect(auto.applied[0].to).toBe('off');
    expect(auto.state.off[1]).toBe(15);
    expect(canCommitLocalBackgammonTurn(auto.transaction)).toBe(true);
    const committed = commitLocalBackgammonTurnTransaction(auto.transaction);
    expect(['roundEnd', 'finished']).toContain(committed.phase);
    expect(committed.winner ?? committed.gameWinner).toBe('p1');
    const undone = undoLocalBackgammonMove(auto.transaction);
    expect(undone.state.off[1]).toBe(14);
    expect(autoDraftForcedBearOff(undone.transaction).applied).toEqual([]);
  });

  it('clears auto-play suppression after a new manual move', () => {
    const transaction = addLocalBackgammonMove(startLocalBackgammonTurn(rolledState()), moves[0]).transaction;
    const undone = undoLocalBackgammonMove(transaction).transaction;
    expect(undone.autoPlaySuppressed).toBe(true);
    expect(addLocalBackgammonMove(undone, moves[0]).transaction.autoPlaySuppressed).toBe(false);
  });

  it('does not persist interaction-scoped auto-play suppression across refresh', () => {
    const transaction = addLocalBackgammonMove(startLocalBackgammonTurn(rolledState()), moves[0]).transaction;
    const undone = undoLocalBackgammonMove(transaction).transaction;
    const restored = restoreLocalBackgammonTurn(JSON.parse(JSON.stringify(undone)));
    expect(restored?.autoPlaySuppressed).toBe(false);
  });

  it('does not auto-play when bearing off still offers a meaningful choice', () => {
    const state = createState(players);
    state.board.fill(0);
    state.board[22] = 7;
    state.board[23] = 8;
    state.dice = [1, 2];
    state.rolled = true;

    const auto = autoDraftForcedBearOff(startLocalBackgammonTurn(state));
    expect(auto.applied).toEqual([]);
    expect(auto.transaction.moves).toEqual([]);
  });

  it('reconciles a restored forced bear-off transaction without a new click', () => {
    const state = createState(players);
    state.board.fill(0);
    state.board[18] = 14;
    state.board[19] = 1;
    state.off[1] = 0;
    state.board[0] = -13;
    state.board[23] = -2;
    state.dice = [5];
    state.rolled = true;

    const persisted = JSON.parse(JSON.stringify(startLocalBackgammonTurn(state)));
    const restored = restoreLocalBackgammonTurn(persisted);
    expect(restored).not.toBeNull();

    const reconciled = autoDraftForcedBearOff(restored!);
    expect(reconciled.applied).toEqual([
      expect.objectContaining({ from: 19, to: 'off', amount: 5 }),
    ]);
    expect(reconciled.state.off[1]).toBe(1);
    expect(undoLocalBackgammonMove(reconciled.transaction).state.off[1]).toBe(0);
  });
});
