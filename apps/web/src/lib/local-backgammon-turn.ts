import {
  applyTurnDraft,
  canCommitTurn,
  commitTurn,
  getRequiredMoveChains,
  getValidNextTurnMoves,
  isValidTurnDraft,
  type BackgammonMove,
  type BackgammonState,
} from '@bazigb/game-backgammon';

export interface LocalBackgammonTurn {
  baseState: BackgammonState;
  moves: BackgammonMove[];
  /** Prevent an explicitly undone automatic move from immediately replaying. */
  autoPlaySuppressed?: boolean;
}

export function startLocalBackgammonTurn(baseState: BackgammonState): LocalBackgammonTurn {
  if (baseState.phase !== 'playing' || !baseState.rolled) throw new Error('Backgammon turn requires a rolled state');
  return { baseState, moves: [] };
}

export function addLocalBackgammonMove(
  transaction: LocalBackgammonTurn,
  moveOrMoves: BackgammonMove | BackgammonMove[],
): { transaction: LocalBackgammonTurn; state: BackgammonState } {
  const moves = [...transaction.moves, ...(Array.isArray(moveOrMoves) ? moveOrMoves : [moveOrMoves])];
  if (!isValidTurnDraft(transaction.baseState, moves)) throw new Error('Invalid Backgammon turn draft');
  return {
    transaction: { ...transaction, moves, autoPlaySuppressed: false },
    state: applyTurnDraft(transaction.baseState, moves),
  };
}

export function undoLocalBackgammonMove(
  transaction: LocalBackgammonTurn,
): { transaction: LocalBackgammonTurn; state: BackgammonState } {
  if (transaction.moves.length === 0) throw new Error('No Backgammon draft move to undo');
  const moves = transaction.moves.slice(0, -1);
  return {
    transaction: { ...transaction, moves, autoPlaySuppressed: true },
    state: applyTurnDraft(transaction.baseState, moves),
  };
}

export const canCommitLocalBackgammonTurn = (transaction: LocalBackgammonTurn | null): boolean =>
  !!transaction && canCommitTurn(transaction.baseState, transaction.moves);

export function commitLocalBackgammonTurnTransaction(transaction: LocalBackgammonTurn): BackgammonState {
  return commitTurn(transaction.baseState, transaction.moves);
}

export const getLocalBackgammonNextMoves = (transaction: LocalBackgammonTurn | null): BackgammonMove[] | undefined =>
  transaction ? getValidNextTurnMoves(transaction.baseState, transaction.moves) : undefined;

/**
 * Auto-draft only forced bearing-off moves. Different move orders may be
 * treated as one forced result when every complete legal chain bears off only
 * and produces the same final board state.
 */
export function autoDraftForcedBearOff(
  transaction: LocalBackgammonTurn,
): { transaction: LocalBackgammonTurn; state: BackgammonState; applied: BackgammonMove[] } {
  if (transaction.autoPlaySuppressed) {
    return { transaction, state: applyTurnDraft(transaction.baseState, transaction.moves), applied: [] };
  }

  let current = transaction;
  const applied: BackgammonMove[] = [];

  while (true) {
    const nextMoves = getValidNextTurnMoves(current.baseState, current.moves);
    if (nextMoves.length !== 1 || nextMoves[0].to !== 'off') break;
    const next = addLocalBackgammonMove(current, nextMoves[0]);
    current = next.transaction;
    applied.push(nextMoves[0]);
  }

  const sameMove = (left: BackgammonMove, right: BackgammonMove): boolean =>
    left.kind === right.kind
    && left.player === right.player
    && left.from === right.from
    && left.to === right.to
    && left.amount === right.amount;

  const candidateChains = getRequiredMoveChains(current.baseState).filter((chain) =>
    current.moves.length < chain.length
    && current.moves.every((move, index) => sameMove(move, chain[index])),
  );
  const remainingChains = candidateChains.map((chain) => chain.slice(current.moves.length));
  const allBearOffOnly = remainingChains.length > 1
    && remainingChains.every((chain) => chain.length > 0 && chain.every((move) => move.to === 'off'));

  if (allBearOffOnly) {
    const resultKeys = candidateChains.map((chain) => {
      const result = applyTurnDraft(current.baseState, chain);
      return JSON.stringify({ board: result.board, bar: result.bar, off: result.off, dice: result.dice });
    });
    if (resultKeys.every((key) => key === resultKeys[0])) {
      const chosen = remainingChains[0];
      const completed = addLocalBackgammonMove(current, chosen);
      current = completed.transaction;
      applied.push(...chosen);
    }
  }

  return { transaction: current, state: applyTurnDraft(current.baseState, current.moves), applied };
}

export function restoreLocalBackgammonTurn(value: unknown): LocalBackgammonTurn | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<LocalBackgammonTurn>;
  if (!candidate.baseState || !Array.isArray(candidate.moves)) return null;
  try {
    return isValidTurnDraft(candidate.baseState, candidate.moves)
      ? {
          baseState: candidate.baseState,
          moves: candidate.moves,
          // Suppression is intentionally interaction-scoped. A refresh starts
          // reconciliation again instead of persisting an old Undo decision.
          autoPlaySuppressed: false,
        }
      : null;
  } catch {
    return null;
  }
}
