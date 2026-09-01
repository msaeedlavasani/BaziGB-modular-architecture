import type { Locale } from './config';

export interface LeaderboardMessages {
  title: string;
  subtitle: (game: string) => string;
  chooseGame: string;
  refresh: string;
  searchPlaceholder: string;
  loadError: string;
  topThree: string;
  gold: string;
  silver: string;
  bronze: string;
  rankingMetric: string;
  winRateLabel: string;
  fullRankings: string;
  playerCount: (count: number) => string;
  noPlayers: string;
  emptyDescription: (game: string) => string;
  previousPage: string;
  nextPage: string;
  page: (current: number, total: number) => string;
  localDemoNotice: string;
  you: string;
  winsShort: (wins: number) => string;
  lossesShort: (losses: number) => string;
  games: (count: number) => string;
}

const LEADERBOARD_MESSAGES: Record<Locale, LeaderboardMessages> = {
  fa: {
    title: 'رتبه‌بندی',
    subtitle: (game) => `رتبه‌بندی بازیکنان ${game} بر اساس برد و نرخ موفقیت.`,
    chooseGame: 'انتخاب بازی',
    refresh: 'به‌روزرسانی',
    searchPlaceholder: 'جستجوی بازیکن با نام کاربری…',
    loadError: 'دریافت رتبه‌بندی ممکن نشد.',
    topThree: 'سه نفر برتر',
    gold: 'طلا',
    silver: 'نقره',
    bronze: 'برنز',
    rankingMetric: 'برد',
    winRateLabel: 'نرخ برد',
    fullRankings: 'رتبه‌بندی کامل',
    playerCount: (count) => `${count} بازیکن`,
    noPlayers: 'هنوز بازیکنی در رتبه‌بندی نیست',
    emptyDescription: (game) => `با ثبت اولین بازی‌های آنلاین ${game}، رتبه‌بندی اینجا شکل می‌گیرد.`,
    previousPage: 'قبلی',
    nextPage: 'بعدی',
    page: (current, total) => `صفحهٔ ${current} از ${total}`,
    localDemoNotice: 'دادهٔ نمایشی محلی است و در نسخهٔ منتشرشده نمایش داده نمی‌شود.',
    you: 'شما',
    winsShort: (wins) => `${wins} برد`,
    lossesShort: (losses) => `${losses} باخت`,
    games: (count) => `${count} بازی`,
  },
  en: {
    title: 'Leaderboard',
    subtitle: (game) => `${game} players ranked by wins and success rate.`,
    chooseGame: 'Choose game',
    refresh: 'Refresh',
    searchPlaceholder: 'Search players by username…',
    loadError: 'Could not load the leaderboard.',
    topThree: 'Top 3',
    gold: 'Gold',
    silver: 'Silver',
    bronze: 'Bronze',
    rankingMetric: 'wins',
    winRateLabel: 'win rate',
    fullRankings: 'Full rankings',
    playerCount: (count) => `${count} ${count === 1 ? 'player' : 'players'}`,
    noPlayers: 'No players are ranked yet',
    emptyDescription: (game) => `The ${game} leaderboard will appear after the first online matches are recorded.`,
    previousPage: 'Previous',
    nextPage: 'Next',
    page: (current, total) => `Page ${current} of ${total}`,
    localDemoNotice: 'This is local demo data and is never shown in a deployed build.',
    you: 'You',
    winsShort: (wins) => `${wins}W`,
    lossesShort: (losses) => `${losses}L`,
    games: (count) => `${count} ${count === 1 ? 'game' : 'games'}`,
  },
};

export function getLeaderboardMessages(locale: Locale): LeaderboardMessages {
  return LEADERBOARD_MESSAGES[locale];
}
