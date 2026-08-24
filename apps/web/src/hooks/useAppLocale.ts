'use client';

import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { resolveLocaleFromPathname } from '@/i18n/routing';

/**
 * Resolve the active application locale from the current pathname.
 * Locale-neutral routes intentionally resolve to the default Persian locale
 * until the route tree migrates atomically to /fa/* and /en/*.
 */
export function useAppLocale(): Locale {
  const pathname = usePathname();
  return resolveLocaleFromPathname(pathname ?? '/');
}
