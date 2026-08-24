import type { Locale } from './config';

export interface VegasBoardMessages {
  round: (round: number, total: number) => string;
  roundPaid: string;
  finalRound: string;
  you: string;
  player: (index: number) => string;
  cards: (count: number) => string;
  casino: (value: number) => string;
  sweep: string;
  burned: string;
  noMoney: string;
  noDicePlaced: string;
  standings: string;
  finalResults: string;
  startRound: (round: number) => string;
  yourHand: string;
  chooseValue: string;
  placeDice: (count: number, value: number) => string;
  rollDice: string;
  watching: string;
  waiting: string;
  burnedTitle: string;
}

const VEGAS_BOARD_MESSAGES: Record<Locale, VegasBoardMessages> = {
  fa: {
    round: (round, total) => `راند ${round}/${total}`,
    roundPaid: 'پایان راند — پرداخت‌ها انجام شد',
    finalRound: 'راند پایانی',
    you: 'شما',
    player: (index) => `بازیکن ${index}`,
    cards: (count) => `${count} کارت`,
    casino: (value) => `کازینو ${value}`,
    sweep: 'SWEEP!',
    burned: 'سوخت',
    noMoney: 'پولی در این راند نیست',
    noDicePlaced: 'هنوز تاسی قرار نگرفته',
    standings: 'جدول امتیاز',
    finalResults: 'نتایج نهایی',
    startRound: (round) => `شروع راند ${round}`,
    yourHand: 'دست شما',
    chooseValue: 'یک مقدار را انتخاب کنید',
    placeDice: (count, value) => `گذاشتن ${count} × ${value}`,
    rollDice: 'ریختن تاس',
    watching: 'تماشای بازی…',
    waiting: 'در انتظار حریف…',
    burnedTitle: 'سوخته',
  },
  en: {
    round: (round, total) => `Round ${round}/${total}`,
    roundPaid: 'Round complete — payouts resolved',
    finalRound: 'Final round',
    you: 'You',
    player: (index) => `Player ${index}`,
    cards: (count) => `${count} cards`,
    casino: (value) => `Casino ${value}`,
    sweep: 'SWEEP!',
    burned: 'Burned',
    noMoney: 'No money stack this round',
    noDicePlaced: 'No dice placed yet',
    standings: 'Standings',
    finalResults: 'Final results',
    startRound: (round) => `Start round ${round}`,
    yourHand: 'Your hand',
    chooseValue: 'Choose a value',
    placeDice: (count, value) => `Place ${count} × ${value}`,
    rollDice: 'Roll dice',
    watching: 'Watching game…',
    waiting: 'Waiting for opponent…',
    burnedTitle: 'Burned',
  },
};

export function getVegasBoardMessages(locale: Locale): VegasBoardMessages {
  return VEGAS_BOARD_MESSAGES[locale];
}
