import { api } from './api';
import type { Locale } from '@/i18n/config';

export interface FooterContent {
  tagline: string;
  links: { label: string; href: string }[];
  copyright: string;
}

export const FOOTER_DEFAULTS_BY_LOCALE: Record<Locale, FooterContent> = {
  fa: {
    tagline: 'همه‌ی بازی‌ها، توی جیبت',
    links: [],
    copyright: '© 2026 BaziGB',
  },
  en: {
    tagline: 'All your games, in your pocket',
    links: [],
    copyright: '© 2026 BaziGB',
  },
};

/** Backward-compatible alias for the current Persian-first admin/editor flow. */
export const FOOTER_DEFAULTS: FooterContent = FOOTER_DEFAULTS_BY_LOCALE.fa;

interface SiteSettingsResponse {
  /** Legacy single-locale footer payload kept during migration. */
  footer?: Partial<FooterContent>;
  /** New locale-aware payload. */
  footers?: Partial<Record<Locale, Partial<FooterContent>>>;
}

function mergeFooter(locale: Locale, data?: SiteSettingsResponse): FooterContent {
  const defaults = FOOTER_DEFAULTS_BY_LOCALE[locale];
  const localized = data?.footers?.[locale];

  if (localized) return { ...defaults, ...localized };

  // Existing production data is Persian and lives under the legacy `footer`
  // key. Reuse it only for Persian; English must not silently inherit Persian
  // managed copy.
  if (locale === 'fa' && data?.footer) {
    return { ...defaults, ...data.footer };
  }

  return defaults;
}

/**
 * Fetch current site settings for one locale. The endpoint remains backward
 * compatible while the server/admin migrate from the legacy `footer` object
 * to locale-specific content.
 */
export async function fetchSiteSettings(
  locale: Locale = 'fa',
): Promise<{ footer: FooterContent }> {
  try {
    const data = await api.get<SiteSettingsResponse>('/site-settings');
    return { footer: mergeFooter(locale, data) };
  } catch {
    return { footer: FOOTER_DEFAULTS_BY_LOCALE[locale] };
  }
}

/**
 * Legacy admin write retained while the Admin editor is still Persian-first.
 * This preserves existing production behavior during the staged migration.
 */
export async function saveFooterSettings(footer: FooterContent): Promise<void> {
  await api.patch('/admin/site-settings', { key: 'footer', value: footer });
}

/** Locale-aware write for the future bilingual Admin editor. */
export async function saveLocalizedFooterSettings(
  locale: Locale,
  footer: FooterContent,
): Promise<void> {
  await api.patch('/admin/site-settings', { key: `footer.${locale}`, value: footer });
}
