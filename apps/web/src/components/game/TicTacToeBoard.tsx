'use client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { TTTMove, TTTState } from '@bazigb/game-tic-tac-toe';

interface Props {
  state: TTTState;
  onMove: (move: TTTMove) => void;
  disabled?: boolean;
}

/** برد دوز — Honey Bronze با سایه داخلی خانه‌ها */
export default function TicTacToeBoard({ state, onMove, disabled }: Props) {
  const humanColor = state.players[0]?.color;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%', minWidth: 0 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          width: 'min(100%, 340px)',
          p: 1.5,
          borderRadius: 3,
          background: 'linear-gradient(160deg, #3A2A18 0%, #241708 100%)',
          border: '1px solid #5A4126',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        {state.board.map((cell, i) => (
          <Box
            key={i}
            onClick={() => {
              if (disabled || cell !== null) return;
              onMove({ player: state.turn, kind: 'place', to: i });
            }}
            sx={{
              aspectRatio: '1',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: { xs: 40, sm: 52 },
              fontWeight: 900,
              cursor: disabled || cell !== null ? 'default' : 'pointer',
              background: 'radial-gradient(circle at 50% 35%, #1E2C3E 0%, #0B1622 100%)',
              boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.7)',
              border: '1px solid',
              borderColor: 'divider',
              color: cell === 'x' ? '#EEAC2F' : '#7FA8D9',
              textShadow: cell === 'x' ? '0 0 14px rgba(238,172,47,0.55)' : '0 0 14px rgba(127,168,217,0.5)',
              transition: 'box-shadow .15s ease',
              '&:hover': !disabled && cell === null ? { boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.7), 0 0 12px rgba(238,172,47,0.35)' } : {},
            }}
          >
            {cell === 'x' ? '✕' : cell === 'o' ? '◯' : ''}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          نوبت: <b style={{ color: state.turn === state.players[0]?.id ? '#EEAC2F' : '#7FA8D9' }}>{state.turn === state.players[0]?.id ? 'شما' : 'ربات'}</b>
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          شما {humanColor === 'x' ? '✕' : '◯'} — امتیاز:{' '}
          {state.scores[state.players[0]?.id ?? ''] ?? 0} : {state.scores[state.players[1]?.id ?? ''] ?? 0}
        </Typography>
        {state.phase === 'finished' && (
          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
            {state.winner === state.players[0]?.id ? '🎉 شما برنده شدید!' : 'ربات برنده شد'}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
