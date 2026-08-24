import type { Locale } from './config';

export interface AppMessages {
  navigation: {
    lobby: string;
    leaderboard: string;
    tournaments: string;
    profile: string;
  };
  common: {
    loading: string;
    retry: string;
    close: string;
    refresh: string;
    back: string;
    newGame: string;
  };
  sound: {
    enable: string;
    disable: string;
  };
  games: {
    ticTacToe: string;
    chess: string;
    backgammon: string;
    vegas: string;
  };
  gameShell: {
    yourTurn: string;
    botTurn: string;
    invalidMove: string;
    botError: string;
    preparing: string;
    difficulty: string;
    easy: string;
    medium: string;
    hard: string;
    match: string;
    winByTwo: string;
    target: string;
    points: string;
    undo: string;
    undoLastMove: string;
    youWon: string;
    botWon: string;
    draw: string;
  };
  lobby: {
    waiting: string;
    inProgress: string;
    recentlyPlayed: string;
    activeRooms: string;
    noRecentGames: string;
    noActiveRooms: string;
  };
  tournaments: {
    registrationOpen: string;
    inProgress: string;
    completed: string;
    fallbackDescription: string;
  };
  footer: {
    rules: string;
    contact: string;
  };
}

const MESSAGES: Record<Locale, AppMessages> = {
  fa: {
    navigation: {
      lobby: 'لابی',
      leaderboard: 'رتبه‌بندی',
      tournaments: 'تورنمنت',
      profile: 'پروفایل',
    },
    common: {
      loading: 'در حال بارگذاری…',
      retry: 'تلاش دوباره',
      close: 'بستن',
      refresh: 'به‌روزرسانی',
      back: 'بازگشت',
      newGame: 'بازی جدید',
    },
    sound: {
      enable: 'فعال‌سازی صدا',
      disable: 'قطع صدا',
    },
    games: {
      ticTacToe: 'دوز',
      chess: 'شطرنج',
      backgammon: 'نرد',
      vegas: 'وگاس',
    },
    gameShell: {
      yourTurn: 'نوبت شما',
      botTurn: 'نوبت ربات',
      invalidMove: 'حرکت نامعتبر',
      botError: 'خطای ربات',
      preparing: 'در حال آماده‌سازی بازی…',
      difficulty: 'سطح ربات',
      easy: 'آسان',
      medium: 'متوسط',
      hard: 'سخت',
      match: 'مسابقه',
      winByTwo: 'برد با ۲',
      target: 'هدف',
      points: 'امتیاز',
      undo: 'آندو',
      undoLastMove: 'بازگردانی آخرین حرکت',
      youWon: '🎉 شما برنده شدید!',
      botWon: 'ربات برنده شد',
      draw: 'مساوی!',
    },
    lobby: {
      waiting: 'در انتظار',
      inProgress: 'در حال بازی',
      recentlyPlayed: 'بازی‌های اخیر',
      activeRooms: 'اتاق‌های فعال',
      noRecentGames: 'هنوز بازی‌ای در تاریخچه شما ثبت نشده است.',
      noActiveRooms: 'در حال حاضر اتاق فعالی وجود ندارد.',
    },
    tournaments: {
      registrationOpen: 'ثبت‌نام باز',
      inProgress: 'در حال برگزاری',
      completed: 'پایان‌یافته',
      fallbackDescription: 'حذفی تک‌مرحله‌ای؛ برنده‌ها صعود می‌کنند و یک نفر قهرمان می‌شود.',
    },
    footer: {
      rules: 'قوانین بازی',
      contact: 'تماس با ما',
    },
  },
  en: {
    navigation: {
      lobby: 'Lobby',
      leaderboard: 'Leaderboard',
      tournaments: 'Tournaments',
      profile: 'Profile',
    },
    common: {
      loading: 'Loading…',
      retry: 'Try again',
      close: 'Close',
      refresh: 'Refresh',
      back: 'Back',
      newGame: 'New game',
    },
    sound: {
      enable: 'Enable sound',
      disable: 'Mute sound',
    },
    games: {
      ticTacToe: 'Tic-Tac-Toe',
      chess: 'Chess',
      backgammon: 'Backgammon',
      vegas: 'Vegas',
    },
    gameShell: {
      yourTurn: 'Your turn',
      botTurn: "Bot's turn",
      invalidMove: 'Invalid move',
      botError: 'Bot error',
      preparing: 'Preparing game…',
      difficulty: 'Bot difficulty',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      match: 'Match',
      winByTwo: 'Win by 2',
      target: 'Target',
      points: 'points',
      undo: 'Undo',
      undoLastMove: 'Undo last move',
      youWon: '🎉 You won!',
      botWon: 'Bot won',
      draw: 'Draw!',
    },
    lobby: {
      waiting: 'Waiting',
      inProgress: 'In progress',
      recentlyPlayed: 'Recently played',
      activeRooms: 'Active rooms',
      noRecentGames: 'You do not have any recorded games yet.',
      noActiveRooms: 'There are no active rooms right now.',
    },
    tournaments: {
      registrationOpen: 'Registration open',
      inProgress: 'In progress',
      completed: 'Completed',
      fallbackDescription: 'Single-elimination knockout. Winners advance and one player takes it all.',
    },
    footer: {
      rules: 'Game rules',
      contact: 'Contact us',
    },
  },
};

export function getMessages(locale: Locale): AppMessages {
  return MESSAGES[locale];
}
