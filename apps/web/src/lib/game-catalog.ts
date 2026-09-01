import type { GameId } from '@bazigb/engine';
import type { Locale } from '@/i18n/config';
import { getMessages, type AppMessages } from '@/i18n/messages';

export type GameMessageKey = keyof AppMessages['games'];

export interface GameCatalogEntry {
  id: GameId;
  messageKey: GameMessageKey;
  /** Presentation fallback only; authoritative runtime capability stays in GameAdapter. */
  maxPlayers: number;
  /** Intrinsic board geometry, not a breakpoint or pixel width. */
  surfaceRatio?: number;
}

/**
 * Canonical web presentation catalog for stable game identities.
 *
 * Game rules, engine state and runtime capabilities stay in the engine/game
 * packages. Localized names stay in i18n messages. This catalog only bridges
 * those stable identities to web presentation metadata that was previously
 * duplicated across Lobby and game entry pages.
 */
export const GAME_CATALOG: Record<GameId, GameCatalogEntry> = {
  'tic-tac-toe': {
    id: 'tic-tac-toe',
    messageKey: 'ticTacToe',
    maxPlayers: 2,
    surfaceRatio: 1,
  },
  backgammon: {
    id: 'backgammon',
    messageKey: 'backgammon',
    maxPlayers: 2,
    surfaceRatio: 1.25,
  },
  chess: {
    id: 'chess',
    messageKey: 'chess',
    maxPlayers: 2,
    surfaceRatio: 1,
  },
  vegas: {
    id: 'vegas',
    messageKey: 'vegas',
    maxPlayers: 5,
  },
};

export const WEB_GAME_IDS = Object.freeze(Object.keys(GAME_CATALOG) as GameId[]);

const GAME_SUMMARIES: Record<GameId, Record<Locale, string>> = {
  'tic-tac-toe': {
    fa: 'دوز آنلاین دونفره؛ یک اتاق بسازید، کد دعوت را بفرستید یا با ربات تمرین کنید.',
    en: 'Two-player online Tic-Tac-Toe: create a room, share an invite code, or practice with the bot.',
  },
  backgammon: {
    fa: 'تخته‌نرد آنلاین با قوانین مسابقه، تاس، دابل و امکان دعوت مستقیم از دوست.',
    en: 'Online Backgammon with match play, dice, doubling, and direct friend invitations.',
  },
  chess: {
    fa: 'شطرنج آنلاین دونفره یا تمرین با ربات، با صفحهٔ خوانا در موبایل و دسکتاپ.',
    en: 'Play two-player Chess online or practice with the bot on a clear mobile and desktop board.',
  },
  vegas: {
    fa: 'وگاس چندنفره؛ اتاق بسازید، دوستان را دعوت کنید و بازی را زنده دنبال کنید.',
    en: 'Multiplayer Vegas: create a room, invite friends, and follow the live game together.',
  },
};

export function isWebGameId(value: string): value is GameId {
  return Object.prototype.hasOwnProperty.call(GAME_CATALOG, value);
}

export function getGameCatalogEntry(gameId: GameId): GameCatalogEntry {
  return GAME_CATALOG[gameId];
}

export function getGameTitle(gameId: GameId, locale: Locale): string {
  const entry = getGameCatalogEntry(gameId);
  return getMessages(locale).games[entry.messageKey];
}

export function getGameSummary(gameId: GameId, locale: Locale): string {
  return GAME_SUMMARIES[gameId][locale];
}
