import type { ReactNode } from 'react';
import { getRequestLocale } from '@/lib/request-locale';
import { localizedMetadata } from '@/lib/seo';
import { getGameTitle, isWebGameId } from '@/lib/game-catalog';

export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }) {
  const locale = await getRequestLocale();
  const { gameId: rawGameId } = await params;
  const gameId = decodeURIComponent(rawGameId);
  if (!isWebGameId(gameId)) return { robots: { index: false, follow: false } };
  const title = getGameTitle(gameId, locale);
  return localizedMetadata({
    locale,
    pathname: `/games/${gameId}`,
    title: locale === 'fa' ? `بازی ${title} آنلاین | BaziGB` : `Play ${title} online | BaziGB`,
    description: locale === 'fa'
      ? `${title} را با دوستتان در اتاق آنلاین یا در حالت تمرینی شروع کنید؛ سریع، فارسی و مناسب موبایل.`
      : `Start ${title} with a friend in an online room or use practice mode on mobile and desktop.`,
  });
}

export default function GameHubLayout({ children }: { children: ReactNode }) {
  return children;
}
