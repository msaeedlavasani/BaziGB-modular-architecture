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
