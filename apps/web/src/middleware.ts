import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, isLocale, type Locale } from './i18n/config';

const LOCALE_HEADER = 'x-bazigb-locale';
const LOCALE_COOKIE = 'bazigb-locale';

/**
 * Public application paths exposed under /fa and /en. Admin stays an internal
 * locale-neutral route until its bilingual editor migration is complete.
 */
const LOCALIZED_ROOTS = new Set([
  'lobby',
  'leaderboard',
  'tournaments',
  'profile',
  'login',
  'game',
  'games',
  'play',
  'rules',
  'privacy',
  'contact',
]);

function withLocaleHeader(request: NextRequest, locale: Locale) {
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  return headers;
}

function preferredLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  return cookieLocale && isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
}

function rememberLocale(response: NextResponse, locale: Locale): NextResponse {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const fallbackLocale = preferredLocale(request);

  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${fallbackLocale}/lobby`, request.url));
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  if (first && isLocale(first)) {
    const locale = first;
    const routeRoot = segments[1];

    if (!routeRoot) {
      return rememberLocale(
        NextResponse.redirect(new URL(`/${locale}/lobby`, request.url)),
        locale,
      );
    }

    if (routeRoot === 'admin') {
      return rememberLocale(NextResponse.redirect(new URL('/admin', request.url)), locale);
    }

    if (!LOCALIZED_ROOTS.has(routeRoot)) {
      return rememberLocale(
        NextResponse.next({ request: { headers: withLocaleHeader(request, locale) } }),
        locale,
      );
    }

    const internalPath = `/${segments.slice(1).join('/')}`;
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = internalPath;

    return rememberLocale(
      NextResponse.rewrite(rewriteUrl, {
        request: { headers: withLocaleHeader(request, locale) },
      }),
      locale,
    );
  }

  if (first && LOCALIZED_ROOTS.has(first)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${fallbackLocale}${pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next({
    request: { headers: withLocaleHeader(request, fallbackLocale) },
  });
}

export const config = {
  matcher: ['/((?!api|socket.io|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
