import type { ReactNode } from 'react';
import { getRequestLocale } from '@/lib/request-locale';
import { localizedMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const locale = await getRequestLocale();
  return localizedMetadata({
    locale,
    pathname: '/contact',
    title: locale === 'fa' ? 'تماس و پشتیبانی | BaziGB' : 'Contact and support | BaziGB',
    description: locale === 'fa' ? 'راه ارتباط آنلاین با تیم BaziGB برای حساب، بازی، ایمنی و حریم خصوصی.' : 'Contact the online BaziGB team about accounts, games, safety and privacy.',
  });
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
