import { headers } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/config';

export async function getRequestLocale(): Promise<Locale> {
  const value = (await headers()).get('x-bazigb-locale');
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}
