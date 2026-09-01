import type { ReactNode } from 'react';
import { getRequestLocale } from '@/lib/request-locale';
import { localizedMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const locale = await getRequestLocale();
  return localizedMetadata({
    locale,
    pathname: '/leaderboard',
    title: locale === 'fa' ? 'رتبه‌بندی بازی‌ها | BaziGB' : 'Game leaderboards | BaziGB',
    description: locale === 'fa'
      ? 'رتبه‌بندی جداگانهٔ دوز، تخته‌نرد، شطرنج و وگاس را ببینید.'
      : 'See separate rankings for Tic-Tac-Toe, Backgammon, Chess and Vegas.',
  });
}

export default function LeaderboardLayout({ children }: { children: ReactNode }) {
  return children;
}
