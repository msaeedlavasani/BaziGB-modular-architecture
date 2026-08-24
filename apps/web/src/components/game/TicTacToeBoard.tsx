'use client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import type { TTTMove, TTTState } from '@bazigb/game-tic-tac-toe';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getMessages } from '@/i18n/messages';

interface Props {
  state: TTTState;
  onMove: (move: TTTMove) => void;
  disabled?: boolean;
}

/** BaziGB Tic-Tac-Toe board. Game geometry stays direction-independent. */
export default function TicTacToeBoard({ state, onMove, disabled }: Props) {
  const theme = useTheme();
  const locale = useAppLocale();
  const messages = getMessages(locale);
  const humanId = state.players[0]?.id ?? '';
  const botId = state.players[1]?.id ?? '';
  const humanColor = state.players[0]?.color;
  const isHumanTurn = state.turn === humanId;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%', minWidth: 0 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 1,
          width: 'min(100%, 340px)',
          p: 1.5,
          borderRadius: 3,
          background: `linear-gradient(160deg, ${alpha(theme.palette.background.paper, 0.92)} 0%, ${theme.palette.secondary.main} 100%)`,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.28)',
        }}
      >
        {state.board.map((cell, index) => {
          const interactive = !disabled && cell === null;
          const cellColor = cell === 'x' ? theme.palette.primary.main : theme.palette.text.primary;

          return (
            <Box
              key={index}
              component="button"
              type="button"
              disabled={!interactive}
              aria-label={`${messages.games.ticTacToe} ${index + 1}`}
              onClick={() => onMove({ player: state.turn, kind: 'place', to: index })}
              sx={{
                appearance: 'none',
                aspectRatio: '1',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit',
                fontSize: { xs: 40, sm: 52 },
                fontWeight: 900,
                cursor: interactive ? 'pointer' : 'default',
                background: `radial-gradient(circle at 50% 35%, ${alpha(theme.palette.secondary.light, 0.62)} 0%, ${theme.palette.background.default} 100%)`,
                boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.55)',
                border: '1px solid',
                borderColor: 'divider',
                color: cellColor,
                textShadow: cell ? `0 0 14px ${alpha(cellColor, 0.32)}` : 'none',
                transition: 'box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease',
                '&:hover': interactive
                  ? {
                      borderColor: alpha(theme.palette.primary.main, 0.42),
                      boxShadow: `inset 0 3px 8px rgba(0,0,0,0.55), 0 0 10px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }
                  : undefined,
                '&:focus-visible': {
                  outline: `3px solid ${alpha(theme.palette.primary.main, 0.34)}`,
                  outlineOffset: 2,
                },
                '&:disabled': { opacity: 1 },
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
            >
              {cell === 'x' ? '✕' : cell === 'o' ? '◯' : ''}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
          {isHumanTurn ? messages.gameShell.yourTurn : messages.gameShell.botTurn}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {messages.gameShell.you} {humanColor === 'x' ? '✕' : '◯'} · {state.scores[humanId] ?? 0} : {state.scores[botId] ?? 0} {messages.gameShell.bot}
        </Typography>
      </Box>
    </Box>
  );
}
