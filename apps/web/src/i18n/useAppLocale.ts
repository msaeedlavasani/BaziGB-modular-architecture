'use client';

import { usePathname } from 'next/navigation';
import { DEFAULT_LOCALE, type Locale } from './config';
import { resolveLocaleFromPathname } from './routing';

/**
 * Single client-side locale resolver for page/component consumers.
 *
 * During the pre-migration route phase, locale-neutral URLs resolve to the
 * Persian default. Once `/fa/*` and `/en/*` routes are activated, the same
 * consumers automatically resolve the active locale from the pathname.
 * Keeping this logic here prevents pages from inventing their own locale
 * detection while the route tree is migrated.
 */
export function useAppLocale(): Locale {
  const pathname = usePathname();
  return resolveLocaleFromPathname(pathname ?? '/') ?? DEFAULT_LOCALE;
}
