import { describe, expect, it } from 'vitest';
import { getBackgammonCubeDockPosition } from './backgammon-cube-dock';

describe('Backgammon cube dock', () => {
  it('hides an unowned cube instead of inventing a board position', () => {
    expect(getBackgammonCubeDockPosition(null, 'p1', 'p2')).toBeNull();
    expect(getBackgammonCubeDockPosition('unknown', 'p1', 'p2')).toBeNull();
  });

  it('places the cube beside its owner without using the checker bar lane', () => {
    expect(getBackgammonCubeDockPosition('p1', 'p1', 'p2')).toBe('bottom');
    expect(getBackgammonCubeDockPosition('p2', 'p1', 'p2')).toBe('top');
  });
});
