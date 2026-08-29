import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

/** Language-neutral application route identities. */
export const APP_ROUTES = {
  lobby: '/lobby',
  leaderboard: '/leaderboard',
  tournaments: '/tournaments',
  profile: '/profile',
  login: '/login',
  rules: '/rules',
  privacy: '/privacy',
  contact: '/contact',
  admin: '/admin',
} as const;

export type AppRouteKey = keyof typeof APP_ROUTES;

export function gameRoute(gameId: string): string {
  return `/game/${encodeURIComponent(gameId)}`;
}

export function gameHubRoute(gameId: string): string {
  return `/games/${encodeURIComponent(gameId)}`;
}

export function playRoute(roomId: string): string {
  return `/play/${encodeURIComponent(roomId)}`;
}

export function tournamentRoute(tournamentId: string): string {
  return `/tournaments/${encodeURIComponent(tournamentId)}`;
}

export function localePath(locale: Locale, pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `/${locale}${normalized === '/' ? '' : normalized}`;
}

export function localizedGameRoute(locale: Locale, gameId: string): string {
  return localePath(locale, gameRoute(gameId));
}

export function localizedGameHubRoute(locale: Locale, gameId: string): string {
  return localePath(locale, gameHubRoute(gameId));
}

export function localizedPlayRoute(locale: Locale, roomId: string): string {
  return localePath(locale, playRoute(roomId));
}

export function localizedTournamentRoute(locale: Locale, tournamentId: string): string {
  return localePath(locale, tournamentRoute(tournamentId));
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

export function localizedAppRoute(locale: Locale, route: AppRouteKey): string {
  return localePath(locale, APP_ROUTES[route]);
}
