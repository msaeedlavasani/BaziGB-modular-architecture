import type { MetadataRoute } from 'next';
import { WEB_GAME_IDS } from '@/lib/game-catalog';
import { localePath } from '@/i18n/routing';
import { SITE_URL } from '@/lib/seo';

const PUBLIC_PATHS = [
  '/lobby',
  '/leaderboard',
  '/rules',
  '/privacy',
  '/contact',
  ...WEB_GAME_IDS.map((gameId) => `/games/${gameId}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.flatMap((pathname) =>
    (['fa', 'en'] as const).map((locale) => ({
      url: `${SITE_URL}${localePath(locale, pathname)}`,
      changeFrequency: pathname === '/leaderboard' ? 'daily' as const : 'weekly' as const,
      priority: pathname === '/lobby' ? 1 : pathname.startsWith('/games/') ? 0.9 : 0.7,
      alternates: {
        languages: {
          fa: `${SITE_URL}${localePath('fa', pathname)}`,
          en: `${SITE_URL}${localePath('en', pathname)}`,
          'x-default': `${SITE_URL}${localePath('fa', pathname)}`,
        },
      },
    })),
  );
}
