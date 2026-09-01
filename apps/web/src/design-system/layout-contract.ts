/**
 * Executable BaziGB layout contract.
 *
 * Feature pages select semantic roles. They do not own gutters, section rhythm,
 * repeated-item geometry, or the comfort limits of game surfaces.
 */
export const layoutContract = {
  page: {
    inlineGutter: 'clamp(1rem, 4vw, 2rem)',
    blockPadding: 'clamp(1.5rem, 5dvb, 3rem)',
  },
  section: {
    gap: 'clamp(1.5rem, 3vw, 2rem)',
  },
  grid: {
    compact: '8.5rem',
    standard: '14rem',
    action: '17rem',
    gap: 'clamp(1rem, 2.5cqi, 1.5rem)',
  },
  card: {
    padding: 'clamp(1rem, 4cqi, 1.5rem)',
  },
  header: {
    threeSlotTrack: 'minmax(0, 1fr) auto minmax(0, 1fr)',
    publicNavigationTrack: 'repeat(2, minmax(0, 1fr))',
  },
  game: {
    shellInlineGutter: 'clamp(1rem, 4vw, 2rem)',
    shellBlockPadding: 'clamp(0.75rem, 3dvb, 1.5rem)',
    shellGap: 'clamp(0.75rem, 2.5dvb, 1.25rem)',
    squareComfortInlineSize: '40rem',
    reservedBlockSize: 'clamp(8rem, 24dvb, 15rem)',
    titleSize: 'clamp(1.4rem, 2.5vw, 1.75rem)',
  },
} as const;

export type RepeatedItemSize = keyof typeof layoutContract.grid & ('compact' | 'standard' | 'action');

/** Shared intrinsic game track; feature metadata supplies only an aspect ratio. */
export function gameSurfaceTrack(surfaceRatio?: number): string {
  if (!surfaceRatio) return 'min(100%, 60rem)';

  return `min(100%, calc(${layoutContract.game.squareComfortInlineSize} * ${surfaceRatio}), calc((100dvb - ${layoutContract.game.reservedBlockSize}) * ${surfaceRatio}))`;
}
