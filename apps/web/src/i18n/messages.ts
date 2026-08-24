import type { Locale } from './config';

export interface AppMessages {
  navigation: {
    lobby: string;
    leaderboard: string;
    tournaments: string;
    profile: string;
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
    footer: {
      rules: 'Game rules',
      contact: 'Contact us',
    },
  },
};

export function getMessages(locale: Locale): AppMessages {
  return MESSAGES[locale];
}
