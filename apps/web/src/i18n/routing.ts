import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

/**
 * Language-neutral application routes. Consumers should compose these with a
 * locale instead of hard-coding `/fa` or `/en` throughout the UI.
 *
 * These helpers are intentionally introduced before the route-tree migration;
 * locale-neutral production routes remain active until the migration is done
 * atomically.
 */
export const APP_ROUTES = {
  lobby: '/lobby',
  leaderboard: '/leaderboard',
  tournaments: '/tournaments',
  profile: '/profile',
  rules: '/rules',
  contact: '/contact',
  admin: '/admin',
} as const;

export type AppRouteKey = keyof typeof APP_ROUTES;

export function gameRoute(gameId: string): string {
  return `/game/${encodeURIComponent(gameId)}`;
}

export function playRoute(roomId: string): string {
  return `/play/${encodeURIComponent(roomId)}`;
}

export function localePath(locale: Locale, pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `/${locale}${normalized === '/' ? '' : normalized}`;
}

export function stripLocale(pathname: string): {
  locale: Locale | null;
  pathname: string;
} {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const [, firstSegment, ...rest] = normalized.split('/');

  if (!firstSegment || !isLocale(firstSegment)) {
    return { locale: null, pathname: normalized };
  }

  const remainder = `/${rest.join('/')}`;
  return {
    locale: firstSegment,
    pathname: remainder === '/' ? '/' : remainder.replace(/\/$/, ''),
  };
}

export function resolveLocaleFromPathname(pathname: string): Locale {
  return stripLocale(pathname).locale ?? DEFAULT_LOCALE;
}

/**
 * Route helper for the future locale-scoped tree. Do not switch production
 * links to this helper piecemeal; use it when `/[locale]/...` routes are
 * introduced as one coherent migration.
 */
export function localizedAppRoute(locale: Locale, route: AppRouteKey): string {
  return localePath(locale, APP_ROUTES[route]);
}
