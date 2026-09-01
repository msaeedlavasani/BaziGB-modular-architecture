import type { ReactNode } from 'react';
import { getRequestLocale } from '@/lib/request-locale';
import { localizedMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const locale = await getRequestLocale();
  return localizedMetadata({
    locale,
    pathname: '/privacy',
    title: locale === 'fa' ? 'حریم خصوصی | BaziGB' : 'Privacy Policy | BaziGB',
    description: locale === 'fa' ? 'داده‌های حساب، بازی، کوکی و حافظه مرورگر در نسخه آلفای BaziGB.' : 'Account, gameplay, cookie and browser-storage practices in the BaziGB Alpha.',
  });
}

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
