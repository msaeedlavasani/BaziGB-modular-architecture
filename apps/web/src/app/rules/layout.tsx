import type { ReactNode } from 'react';
import { getRequestLocale } from '@/lib/request-locale';
import { localizedMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const locale = await getRequestLocale();
  return localizedMetadata({
    locale,
    pathname: '/rules',
    title: locale === 'fa' ? 'قوانین استفاده | BaziGB' : 'Terms of Use | BaziGB',
    description: locale === 'fa' ? 'قوانین حساب، بازی منصفانه و استفاده از نسخه آلفای BaziGB.' : 'Account, fair-play and Alpha usage terms for BaziGB.',
  });
}

export default function RulesLayout({ children }: { children: ReactNode }) {
  return children;
}
