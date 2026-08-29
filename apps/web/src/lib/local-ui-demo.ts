/**
 * Explicit local-only presentation data.
 *
 * A production build always evaluates this to false, even if an environment
 * accidentally contains the public variable. Local demos are never a fallback
 * for a failed real request: a developer must opt in before starting Next.
 */
export type LocalUiDemoSurface = 'leaderboard' | 'tournaments';

const enabledSurfaces = new Set(
  (process.env.NEXT_PUBLIC_BAZIGB_UI_DEMOS ?? '')
    .split(',')
    .map((surface) => surface.trim())
    .filter(Boolean),
);

export function isLocalUiDemoEnabled(surface: LocalUiDemoSurface): boolean {
  return process.env.NODE_ENV === 'development' && enabledSurfaces.has(surface);
}
