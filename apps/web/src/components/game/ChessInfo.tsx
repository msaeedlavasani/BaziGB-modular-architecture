'use client';

import { Fragment, useMemo } from 'react';
import { Box, Chip, Paper, Typography, alpha, useTheme } from '@mui/material';
import { getCapturedPieces, indexToSquare } from '@/lib/chess-fen';
import type { ChessState } from '@bazigb/game-chess';

const PIECE_GLYPHS: Record<string, string> = { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛' };
const MATERIAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

function CapturedRow({ label, pieces }: { label: string; pieces: string[] }) {
  const theme = useTheme();
  const value = pieces.reduce((sum, p) => sum + (MATERIAL[p] ?? 0), 0);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Typography
        variant="caption"
        sx={{ width: 56, flexShrink: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', minHeight: 24, flex: 1, flexWrap: 'wrap', alignItems: 'center', gap: 0.5, fontSize: '1.2rem', lineHeight: 1 }}>
        {pieces.length === 0 ? (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>
        ) : (
          pieces.map((piece, i) => (
            <Box key={i} component="span" sx={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}>
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

/** پنل‌های زیر برد شطرنج: مهره‌های خورده‌شده + تاریخچه حرکات */
export default function ChessInfo({ state }: { state: ChessState }) {
  const captured = useMemo(() => getCapturedPieces(state), [state]);

  const historyPairs = useMemo(() => {
    const out: { number: number; white?: string; black?: string }[] = [];
    (state.history ?? []).forEach((m, i) => {
      const san = `${indexToSquare(m.from)}–${indexToSquare(m.to)}${m.promotion ? '=' + m.promotion.toUpperCase() : ''}`;
      const num = Math.floor(i / 2) + 1;
      let pair = out.find((p) => p.number === num);
      if (!pair) {
        pair = { number: num };
        out.push(pair);
      }
      if (i % 2 === 0) pair.white = san;
      else pair.black = san;
    });
    return out;
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
        textAlign: 'left',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
          مهره‌های خورده‌شده
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <CapturedRow label="سفید" pieces={captured.white} />
          <CapturedRow label="سیاه" pieces={captured.black} />
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 200,
        }}
      >
        <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
          تاریخچه حرکات
        </Typography>
        {historyPairs.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            هنوز حرکتی نبود — نوبت سفید.
          </Typography>
        ) : (
          <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, fontFamily: 'monospace' }}>
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
