import type { Locale } from './config';

export interface LeaderboardMessages {
  title: string;
  subtitle: string;
  refresh: string;
  searchPlaceholder: string;
  loadError: string;
  topThree: string;
  gold: string;
  silver: string;
  bronze: string;
  rating: string;
  fullRankings: string;
  playerCount: (count: number) => string;
  noPlayers: string;
  noMatch: (query: string) => string;
  you: string;
  winsShort: (wins: number) => string;
  lossesShort: (losses: number) => string;
  games: (count: number) => string;
}

const LEADERBOARD_MESSAGES: Record<Locale, LeaderboardMessages> = {
  fa: {
    title: 'رتبه‌بندی',
    subtitle: '۵۰ بازیکن برتر بر اساس امتیاز رقابتی.',
    refresh: 'به‌روزرسانی',
    searchPlaceholder: 'جستجوی بازیکن با نام کاربری…',
    loadError: 'دریافت رتبه‌بندی ممکن نشد.',
    topThree: 'سه نفر برتر',
    gold: 'طلا',
    silver: 'نقره',
    bronze: 'برنز',
    rating: 'امتیاز',
    fullRankings: 'رتبه‌بندی کامل',
    playerCount: (count) => `${count} بازیکن`,
    noPlayers: 'بازیکنی پیدا نشد',
    noMatch: (query) => `هیچ نام کاربری با «${query}» مطابقت ندارد — عبارت دیگری امتحان کنید.`,
    you: 'شما',
    winsShort: (wins) => `${wins} برد`,
    lossesShort: (losses) => `${losses} باخت`,
    games: (count) => `${count} بازی`,
  },
  en: {
    title: 'Leaderboard',
    subtitle: 'Top 50 players ranked by competitive rating.',
    refresh: 'Refresh',
    searchPlaceholder: 'Search players by username…',
    loadError: 'Could not load the leaderboard.',
    topThree: 'Top 3',
    gold: 'Gold',
    silver: 'Silver',
    bronze: 'Bronze',
    rating: 'rating',
    fullRankings: 'Full rankings',
    playerCount: (count) => `${count} ${count === 1 ? 'player' : 'players'}`,
    noPlayers: 'No players found',
    noMatch: (query) => `Nobody matches “${query}” — try a different username.`,
    you: 'You',
    winsShort: (wins) => `${wins}W`,
    lossesShort: (losses) => `${losses}L`,
    games: (count) => `${count} ${count === 1 ? 'game' : 'games'}`,
  },
};

export function getLeaderboardMessages(locale: Locale): LeaderboardMessages {
  return LEADERBOARD_MESSAGES[locale];
}
