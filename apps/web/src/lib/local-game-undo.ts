export interface LocalUndoState {
  phase: string;
  turn: string;
}

/**
 * Local Undo is a pending-turn editing aid, not a game-history rewind.
 * Once control leaves the human player or play ends, earlier snapshots are
 * committed and must never become available again on a later turn.
 */
export function canRetainLocalUndoHistory(
  state: LocalUndoState | null | undefined,
  humanPlayerId: string,
): boolean {
  return state?.phase === 'playing' && state.turn === humanPlayerId;
}
