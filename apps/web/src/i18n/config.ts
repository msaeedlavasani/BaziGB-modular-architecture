export const SUPPORTED_LOCALES = ['fa', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type TextDirection = 'rtl' | 'ltr';

export const DEFAULT_LOCALE: Locale = 'fa';

export interface LocaleConfig {
  locale: Locale;
  htmlLang: string;
  direction: TextDirection;
  fontFamily: string;
  metadata: {
    title: string;
    description: string;
  };
}

const LOCALE_CONFIG: Record<Locale, LocaleConfig> = {
  fa: {
    locale: 'fa',
    htmlLang: 'fa',
    direction: 'rtl',
    fontFamily: '"Vazirmatn Variable", Vazirmatn, "Segoe UI", Tahoma, sans-serif',
    metadata: {
      title: 'BaziGB — تخته، دوز، شطرنج و وگاس',
      description: 'پلتفرم بازی‌های ایرانی با معماری مدولار',
    },
  },
  en: {
    locale: 'en',
    htmlLang: 'en',
    direction: 'ltr',
    fontFamily: '"Segoe UI", Inter, Arial, sans-serif',
    metadata: {
      title: 'BaziGB — Backgammon, Tic-Tac-Toe, Chess & Vegas',
      description: 'A modular online board-game platform',
    },
  },
};

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function getLocaleConfig(locale: Locale): LocaleConfig {
  return LOCALE_CONFIG[locale];
}

export function getTextDirection(locale: Locale): TextDirection {
  return LOCALE_CONFIG[locale].direction;
}
