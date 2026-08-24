import type { Locale } from './config';

export interface BackgammonBoardMessages {
  off: string;
  yourRoll: string;
  waiting: string;
  double: string;
  endTurn: string;
  rollDice: string;
  waitingDoubleResponse: string;
  doubleOffer: string;
  doubleOfferDescription: string;
  decline: string;
  accept: string;
  diceSeparator: string;
}

const BACKGAMMON_BOARD_MESSAGES: Record<Locale, BackgammonBoardMessages> = {
  fa: {
    off: 'خارج',
    yourRoll: 'نوبت شما برای ریختن تاس',
    waiting: 'در انتظار حریف…',
    double: 'دابل',
    endTurn: 'پایان نوبت',
    rollDice: 'ریختن تاس',
    waitingDoubleResponse: 'در انتظار پاسخ حریف به پیشنهاد دابل…',
    doubleOffer: 'پیشنهاد دابل',
    doubleOfferDescription: 'حریف پیشنهاد دوبرابر کردن امتیاز داده است. اگر رد کنید، بازی را با امتیاز فعلی می‌بازید.',
    decline: 'رد',
    accept: 'پذیرش',
    diceSeparator: ' و ',
  },
  en: {
    off: 'Off',
    yourRoll: 'Your turn to roll',
    waiting: 'Waiting for opponent…',
    double: 'Double',
    endTurn: 'End turn',
    rollDice: 'Roll dice',
    waitingDoubleResponse: 'Waiting for the opponent to respond to the double…',
    doubleOffer: 'Double offer',
    doubleOfferDescription: 'Your opponent offered to double the match value. Declining concedes the game at its current value.',
    decline: 'Decline',
    accept: 'Accept',
    diceSeparator: ' & ',
  },
};

export function getBackgammonBoardMessages(locale: Locale): BackgammonBoardMessages {
  return BACKGAMMON_BOARD_MESSAGES[locale];
}
