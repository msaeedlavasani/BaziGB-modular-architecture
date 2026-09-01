import type { ReactNode } from 'react';
import { getRequestLocale } from '@/lib/request-locale';
import { localizedMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const locale = await getRequestLocale();
  return localizedMetadata({
    locale,
    pathname: '/lobby',
    title: locale === 'fa' ? 'بازی آنلاین و دونفره | BaziGB' : 'Online and two-player games | BaziGB',
    description: locale === 'fa'
      ? 'دوز، تخته‌نرد، شطرنج و وگاس را آنلاین با دوستان یا در حالت تمرینی بازی کنید.'
      : 'Play Tic-Tac-Toe, Backgammon, Chess and Vegas online with friends or in practice mode.',
  });
}

export default function LobbyLayout({ children }: { children: ReactNode }) {
  return children;
}
