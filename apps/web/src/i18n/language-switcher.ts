import type { Locale } from './config';

export interface LanguageSwitcherMessages {
  label: string;
  shortLabel: string;
}

const LANGUAGE_SWITCHER_MESSAGES: Record<Locale, LanguageSwitcherMessages> = {
  fa: {
    label: 'نمایش نسخه انگلیسی',
    shortLabel: 'EN',
  },
  en: {
    label: 'Show Persian version',
    shortLabel: 'FA',
  },
};

export function getLanguageSwitcherMessages(locale: Locale): LanguageSwitcherMessages {
  return LANGUAGE_SWITCHER_MESSAGES[locale];
}
