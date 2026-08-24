import type { GameId } from '@bazigb/engine';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';

export interface GameCatalogEntry {
  id: GameId;
  messageKey: keyof ReturnType<typeof getMessages>['games'];
  chipSymbol: string;
  maxPlayers: number;
}

/**
 * Language-neutral presentation metadata shared by game entry points.
 * Rules/state/adapter data stay in the engine/game packages; locale copy stays
 * in i18n messages. This catalog only connects stable game identity to UI
 * presentation properties that were previously duplicated across pages.
 */
export const GAME_CATALOG: Record<GameId, GameCatalogEntry> = {
  'tic-tac-toe': {
    id: 'tic-tac-toe',
    messageKey: 'ticTacToe',
    chipSymbol: '✕',
    maxPlayers: 2,
  },
  backgammon: {
    id: 'backgammon',
    messageKey: 'backgammon',
    chipSymbol: '🎲',
    maxPlayers: 2,
  },
  chess: {
    id: 'chess',
    messageKey: 'chess',
    chipSymbol: '♞',
    maxPlayers: 2,
  },
  vegas: {
    id: 'vegas',
    messageKey: 'vegas',
    chipSymbol: '💵',
    maxPlayers: 5,
  },
};

export function getGameTitle(gameId: GameId, locale: Locale): string {
  const entry = GAME_CATALOG[gameId];
  return getMessages(locale).games[entry.messageKey];
}

export function getGameChip(gameId: GameId, locale: Locale): string {
  const entry = GAME_CATALOG[gameId];
  return `${entry.chipSymbol} ${getGameTitle(gameId, locale)}`;
}
