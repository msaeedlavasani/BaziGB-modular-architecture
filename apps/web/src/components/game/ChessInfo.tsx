'use client';

import { Fragment, useMemo } from 'react';
import { Box, Chip, Paper, Typography, alpha, useTheme } from '@mui/material';
import { getCapturedPieces, indexToSquare } from '@/lib/chess-fen';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getChessInfoMessages } from '@/i18n/chess-info';
import type { ChessState } from '@bazigb/game-chess';

const PIECE_GLYPHS: Record<string, string> = { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛' };
const MATERIAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

function CapturedRow({ label, pieces }: { label: string; pieces: string[] }) {
  const theme = useTheme();
  const value = pieces.reduce((sum, piece) => sum + (MATERIAL[piece] ?? 0), 0);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Typography
        variant="caption"
        sx={{ minWidth: 56, flexShrink: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', minHeight: 24, flex: 1, flexWrap: 'wrap', alignItems: 'center', gap: 0.5, fontSize: '1.2rem', lineHeight: 1 }}>
        {pieces.length === 0 ? (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>
        ) : (
          pieces.map((piece, index) => (
            <Box key={`${piece}-${index}`} component="span" sx={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}>
              {PIECE_GLYPHS[piece] ?? piece}
            </Box>
          ))
        )}
      </Box>
      {value > 0 && (
        <Chip
          label={`+${value}`}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.625rem',
            fontWeight: 700,
            bgcolor: alpha(theme.palette.success.main, 0.15),
            color: 'success.light',
            border: '1px solid',
            borderColor: alpha(theme.palette.success.main, 0.3),
          }}
        />
      )}
    </Box>
  );
}

/** Captured pieces + move history below the chess board. */
export default function ChessInfo({ state }: { state: ChessState }) {
  const locale = useAppLocale();
  const messages = getChessInfoMessages(locale);
  const captured = useMemo(() => getCapturedPieces(state), [state]);

  const historyPairs = useMemo(() => {
    const output: { number: number; white?: string; black?: string }[] = [];
    (state.history ?? []).forEach((move, index) => {
      const san = `${indexToSquare(move.from)}–${indexToSquare(move.to)}${move.promotion ? '=' + move.promotion.toUpperCase() : ''}`;
      const number = Math.floor(index / 2) + 1;
      let pair = output.find((item) => item.number === number);
      if (!pair) {
        pair = { number };
        output.push(pair);
      }
      if (index % 2 === 0) pair.white = san;
      else pair.black = san;
    });
    return output;
  }, [state]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
        width: '100%',
        maxWidth: 560,
        mx: 'auto',
        textAlign: 'start',
      }}
    >
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper' }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
          {messages.captured}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <CapturedRow label={messages.white} pieces={captured.white} />
          <CapturedRow label={messages.black} pieces={captured.black} />
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', maxHeight: 200 }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
          {messages.history}
        </Typography>
        {historyPairs.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {messages.noMoves}
          </Typography>
        ) : (
          <Box sx={{ flex: 1, overflowY: 'auto', paddingInlineEnd: 1, fontFamily: 'monospace', direction: 'ltr' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '2.5rem 1fr 1fr', gap: 1.5 }}>
              {historyPairs.map((pair) => (
                <Fragment key={pair.number}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', py: 0.5 }}>
                    {pair.number}.
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {pair.white ?? ''}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    {pair.black ?? ''}
                  </Typography>
                </Fragment>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
