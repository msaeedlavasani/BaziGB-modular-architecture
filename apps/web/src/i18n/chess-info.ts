import type { Locale } from './config';

export interface ChessInfoMessages {
  captured: string;
  white: string;
  black: string;
  history: string;
  noMoves: string;
}

const CHESS_INFO_MESSAGES: Record<Locale, ChessInfoMessages> = {
  fa: {
    captured: 'مهره‌های خورده‌شده',
    white: 'سفید',
    black: 'سیاه',
    history: 'تاریخچه حرکات',
    noMoves: 'هنوز حرکتی انجام نشده — نوبت سفید است.',
  },
  en: {
    captured: 'Captured pieces',
    white: 'White',
    black: 'Black',
    history: 'Move history',
    noMoves: 'No moves yet — White to move.',
  },
};

export function getChessInfoMessages(locale: Locale): ChessInfoMessages {
  return CHESS_INFO_MESSAGES[locale];
}
