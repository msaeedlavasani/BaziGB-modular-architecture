export type CubeDockPosition = 'top' | 'bottom' | null;

/**
 * The doubling cube owns a dedicated rail beside the bar. Player one is
 * presented at the bottom of the local board and player two at the top.
 */
export function getBackgammonCubeDockPosition(
  cubeOwner: string | null,
  playerOneId: string | undefined,
  playerTwoId: string | undefined,
): CubeDockPosition {
  if (cubeOwner && cubeOwner === playerOneId) return 'bottom';
  if (cubeOwner && cubeOwner === playerTwoId) return 'top';
  return null;
}
