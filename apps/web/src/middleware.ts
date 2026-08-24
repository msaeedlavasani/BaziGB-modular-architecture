import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, isLocale } from './i18n/config';

const LOCALE_HEADER = 'x-bazigb-locale';

/**
 * Public application paths that are exposed under /fa and /en.
 * Admin remains an internal locale-neutral route for now; its bilingual content
 * editor is a separate migration stage.
 */
const LOCALIZED_ROOTS = new Set([
  'lobby',
  'leaderboard',
  'tournaments',
  'profile',
  'login',
  'game',
  'play',
  'rules',
  'contact',
]);

function withLocaleHeader(request: NextRequest, locale: string) {
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  return headers;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}/lobby`, request.url));
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  if (first && isLocale(first)) {
    const locale = first;
    const routeRoot = segments[1];

    // Locale root itself resolves to the locale's Lobby.
    if (!routeRoot) {
      return NextResponse.redirect(new URL(`/${locale}/lobby`, request.url));
    }

    // Admin is deliberately not part of the public bilingual route tree yet.
    if (routeRoot === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    if (!LOCALIZED_ROOTS.has(routeRoot)) {
      return NextResponse.next({ request: { headers: withLocaleHeader(request, locale) } });
    }

    // Keep the localized URL visible while reusing the existing single page tree.
    const internalPath = `/${segments.slice(1).join('/')}`;
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = internalPath;

    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: withLocaleHeader(request, locale) },
    });
  }

  if (first && LOCALIZED_ROOTS.has(first)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next({
    request: { headers: withLocaleHeader(request, DEFAULT_LOCALE) },
  });
}

export const config = {
  matcher: ['/((?!api|socket.io|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
