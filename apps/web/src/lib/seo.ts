import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { localePath } from '@/i18n/routing';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bazigb.ir').replace(/\/$/, '');

export function localizedMetadata(input: {
  locale: Locale;
  pathname: string;
  title: string;
  description: string;
}): Metadata {
  const canonicalPath = localePath(input.locale, input.pathname);
  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        fa: localePath('fa', input.pathname),
        en: localePath('en', input.pathname),
        'x-default': localePath('fa', input.pathname),
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'BaziGB',
      title: input.title,
      description: input.description,
      url: canonicalPath,
      locale: input.locale === 'fa' ? 'fa_IR' : 'en_US',
    },
    robots: { index: true, follow: true },
  };
}

export const privateRouteMetadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};
