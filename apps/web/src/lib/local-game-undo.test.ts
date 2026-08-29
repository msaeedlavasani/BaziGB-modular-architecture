import { describe, expect, it } from 'vitest';
import { canRetainLocalUndoHistory } from './local-game-undo';

describe('local game Undo boundary', () => {
  it('retains snapshots only during the active human turn', () => {
    expect(canRetainLocalUndoHistory({ phase: 'playing', turn: 'p1' }, 'p1')).toBe(true);
  });

  it('seals snapshots as soon as control passes to the bot', () => {
    expect(canRetainLocalUndoHistory({ phase: 'playing', turn: 'p2' }, 'p1')).toBe(false);
  });

  it('does not reopen committed history on the next human turn', () => {
    const states = [
      { phase: 'playing', turn: 'p1' },
      { phase: 'playing', turn: 'p2' },
      { phase: 'playing', turn: 'p1' },
    ];
    let history = ['snapshot'];
    for (const state of states) {
      if (!canRetainLocalUndoHistory(state, 'p1')) history = [];
    }
    expect(history).toEqual([]);
  });

  it.each(['roundEnd', 'finished'])('seals snapshots in %s', (phase) => {
    expect(canRetainLocalUndoHistory({ phase, turn: 'p1' }, 'p1')).toBe(false);
  });
});
