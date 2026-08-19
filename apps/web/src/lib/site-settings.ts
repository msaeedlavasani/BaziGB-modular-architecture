import { api } from './api';

export interface FooterContent {
  tagline: string;
  links: { label: string; href: string }[];
  copyright: string;
}

export const FOOTER_DEFAULTS: FooterContent = {
  tagline: 'همه‌ی بازی‌ها، توی جیبت',
  links: [],
  copyright: '© 2026 BaziGB',
};

/**
 * Fetch current site settings (footer content). Falls back to defaults when
 * the server is unreachable or the setting was never saved — the footer must
 * never break the page.
 */
export async function fetchSiteSettings(): Promise<{ footer: FooterContent }> {
  try {
    const data = await api.get<{ footer: Partial<FooterContent> }>(
      '/site-settings',
    );
    return { footer: { ...FOOTER_DEFAULTS, ...data.footer } };
  } catch {
    return { footer: FOOTER_DEFAULTS };
  }
}

/** Admin-only: persist the footer content (visible site-wide without redeploy). */
export async function saveFooterSettings(footer: FooterContent): Promise<void> {
  await api.patch('/admin/site-settings', { key: 'footer', value: footer });
}
