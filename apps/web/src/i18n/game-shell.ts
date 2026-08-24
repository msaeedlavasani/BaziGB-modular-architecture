import type { Locale } from './config';

export interface GameShellMessages {
  lobby: string;
  connected: string;
  connecting: string;
  reconnecting: string;
  room: string;
  copied: string;
  copyRoomCode: string;
  matchScore: (a: number, b: number) => string;
  bestOf: (maxRounds: number, winsNeeded: number) => string;
  rematch: string;
  backToLobby: string;
  waitingForOpponent: string;
}

const GAME_SHELL_MESSAGES: Record<Locale, GameShellMessages> = {
  fa: {
    lobby: 'لابی',
    connected: 'متصل',
    connecting: 'در حال اتصال…',
    reconnecting: 'در حال اتصال مجدد…',
    room: 'اتاق',
    copied: 'کپی شد!',
    copyRoomCode: 'کپی کد اتاق',
    matchScore: (a, b) => `مسابقه ${a} - ${b}`,
    bestOf: (maxRounds, winsNeeded) => `بهترین از ${maxRounds} — اولین نفر با ${winsNeeded} برد`,
    rematch: 'بازی دوباره',
    backToLobby: 'بازگشت به لابی',
    waitingForOpponent: 'در انتظار حریف… کد اتاق را به اشتراک بگذارید',
  },
  en: {
    lobby: 'Lobby',
    connected: 'Connected',
    connecting: 'Connecting…',
    reconnecting: 'Reconnecting…',
    room: 'Room',
    copied: 'Copied!',
    copyRoomCode: 'Copy room code',
    matchScore: (a, b) => `Match ${a} - ${b}`,
    bestOf: (maxRounds, winsNeeded) => `Best of ${maxRounds} — first to ${winsNeeded} wins`,
    rematch: 'Play again',
    backToLobby: 'Back to Lobby',
    waitingForOpponent: 'Waiting for an opponent… Share the room code to invite them.',
  },
};

export function getGameShellMessages(locale: Locale): GameShellMessages {
  return GAME_SHELL_MESSAGES[locale];
}
