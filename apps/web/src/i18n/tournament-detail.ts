import type { Locale } from './config';

export interface TournamentDetailMessages {
  status: {
    registration: string;
    inProgress: string;
    completed: string;
  };
  loadError: string;
  joinError: string;
  backToTournaments: string;
  notFound: string;
  notFoundHint: string;
  allTournaments: string;
  fallbackDescription: string;
  players: (current: number, max: number) => string;
  signInToJoin: string;
  joined: string;
  full: string;
  joinTournament: string;
  champion: string;
  bracket: string;
  winner: string;
  live: string;
  upcoming: string;
  tbd: string;
  bracketNotGenerated: string;
  noBracketData: string;
  bracketPendingHint: string;
  bracketUnavailableHint: string;
  ariaBracket: string;
  rounds: {
    final: string;
    semifinals: string;
    quarterfinals: string;
    round: (number: number) => string;
  };
}

const TOURNAMENT_DETAIL_MESSAGES: Record<Locale, TournamentDetailMessages> = {
  fa: {
    status: {
      registration: 'ثبت‌نام باز',
      inProgress: 'در حال برگزاری',
      completed: 'پایان‌یافته',
    },
    loadError: 'دریافت اطلاعات این تورنمنت ممکن نشد.',
    joinError: 'عضویت در تورنمنت ممکن نشد.',
    backToTournaments: 'بازگشت به تورنمنت‌ها',
    notFound: 'تورنمنت پیدا نشد',
    notFoundHint: 'تورنمنت موردنظر شما وجود ندارد.',
    allTournaments: 'همه تورنمنت‌ها',
    fallbackDescription: 'حذفی تک‌مرحله‌ای؛ برنده‌ها صعود می‌کنند و یک نفر قهرمان می‌شود.',
    players: (current, max) => `${current}/${max} بازیکن`,
    signInToJoin: 'برای عضویت وارد شوید',
    joined: 'عضو شدید',
    full: 'ظرفیت تکمیل',
    joinTournament: 'عضویت در تورنمنت',
    champion: 'قهرمان',
    bracket: 'جدول مسابقات',
    winner: 'برنده',
    live: 'زنده',
    upcoming: 'پیش رو',
    tbd: 'مشخص نشده',
    bracketNotGenerated: 'جدول هنوز ساخته نشده است',
    noBracketData: 'اطلاعات جدول موجود نیست',
    bracketPendingHint: 'پس از پایان ثبت‌نام، جدول به‌صورت خودکار ساخته می‌شود.',
    bracketUnavailableHint: 'نتایج این تورنمنت در دسترس نیست.',
    ariaBracket: 'جدول تورنمنت',
    rounds: {
      final: 'فینال',
      semifinals: 'نیمه‌نهایی',
      quarterfinals: 'یک‌چهارم نهایی',
      round: (number) => `مرحله ${number}`,
    },
  },
  en: {
    status: {
      registration: 'Registration open',
      inProgress: 'In progress',
      completed: 'Completed',
    },
    loadError: 'Could not load this tournament.',
    joinError: 'Could not join the tournament.',
    backToTournaments: 'Back to tournaments',
    notFound: 'Tournament not found',
    notFoundHint: 'The tournament you are looking for does not exist.',
    allTournaments: 'All tournaments',
    fallbackDescription: 'Single-elimination knockout. Winners advance and one player takes it all.',
    players: (current, max) => `${current}/${max} players`,
    signInToJoin: 'Sign in to join',
    joined: 'Joined',
    full: 'Full',
    joinTournament: 'Join tournament',
    champion: 'Champion',
    bracket: 'Bracket',
    winner: 'Winner',
    live: 'Live',
    upcoming: 'Upcoming',
    tbd: 'TBD',
    bracketNotGenerated: 'Bracket not generated yet',
    noBracketData: 'No bracket data',
    bracketPendingHint: 'The bracket is built automatically once registration closes.',
    bracketUnavailableHint: 'Results for this tournament are unavailable.',
    ariaBracket: 'Tournament bracket',
    rounds: {
      final: 'Final',
      semifinals: 'Semifinals',
      quarterfinals: 'Quarterfinals',
      round: (number) => `Round ${number}`,
    },
  },
};

export function getTournamentDetailMessages(locale: Locale): TournamentDetailMessages {
  return TOURNAMENT_DETAIL_MESSAGES[locale];
}
