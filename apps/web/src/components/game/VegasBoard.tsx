'use client';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { VegasMove, VegasState } from '@bazigb/game-vegas';
import { diceSteps } from '@bazigb/engine';

interface Props {
  state: VegasState;
  onMove: (move: VegasMove) => void;
  disabled?: boolean;
}

/** برد وگاس — مسیر ۱۲ نقطه‌ای با مهره‌های فیزیکی */
export default function VegasBoard({ state, onMove, disabled }: Props) {
  const myId = state.players[0]?.id ?? 'p1';
  const myPos = state.positions[myId] ?? 0;
  const botId = state.players[1]?.id ?? 'p2';
  const botPos = state.positions[botId] ?? 0;

  const renderToken = (pos: number, color: string) =>
    pos < 12 ? (
      <Box
        sx={{
          position: 'absolute',
          right: `calc(${(pos / 12) * 100}% + ${4 + (pos / 12) * 10}px)`,
          top: color === '#EEAC2F' ? 8 : 'auto',
          bottom: color === '#EEAC2F' ? 'auto' : 8,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${color === '#EEAC2F' ? '#FFD27A' : '#2E5A8A'} 0%, ${color} 60%, ${color === '#EEAC2F' ? '#8A6410' : '#081120'} 100%)`,
          boxShadow: '0 2px 5px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.3)',
          zIndex: 2,
        }}
      />
    ) : (
      <Box
        sx={{
          position: 'absolute',
          left: 6,
          top: color === '#EEAC2F' ? 4 : 'auto',
          bottom: color === '#EEAC2F' ? 'auto' : 4,
          fontSize: 18,
        }}
      >
        🏁
      </Box>
    );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', minWidth: 0 }}>
      {/* مسیر */}
      <Box
        sx={{
          position: 'relative',
          height: 96,
          borderRadius: 3,
          background: 'linear-gradient(180deg, #14304A 0%, #0B1F33 100%)',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: '100%',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)' }}>
              {i + 1}
            </Typography>
          </Box>
        ))}
        {renderToken(myPos, '#EEAC2F')}
        {renderToken(botPos, '#7FA8D9')}
      </Box>

      {/* اطلاعات */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ color: '#EEAC2F' }}>
          شما: {state.scores[myId] ?? 0} چیپ
        </Typography>
        <Typography variant="body2" sx={{ color: '#7FA8D9' }}>
          ربات: {state.scores[botId] ?? 0} چیپ
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          پات: {state.pot}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          تاس: {state.dice.length ? state.dice.join(' و ') : '—'}
        </Typography>
      </Box>

      {/* کنترل‌ها */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {state.phase === 'bet' && !disabled && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              شرط:
            </Typography>
            {[1, 3, 5, 10].map((amount) => (
              <Button
                key={amount}
                size="small"
                variant="outlined"
                color="primary"
                disabled={(state.scores[myId] ?? 0) < amount}
                onClick={() => onMove({ player: state.turn, kind: 'bet', amount })}
              >
                {amount}
              </Button>
            ))}
          </Box>
        )}
        {state.phase === 'roll' && !disabled && (
          <Button size="small" variant="contained" color="primary" onClick={() => onMove({ player: state.turn, kind: 'roll' })}>
            ریختن تاس 🎲
          </Button>
        )}
        {state.phase === 'move' && !disabled && (
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => {
              // ساخت زنجیره حرکات ترکیبی از روی تاس‌ها (Combined Moves)
              const steps = diceSteps(state.dice);
              let pos = myPos;
              const chain: { player: string; kind: 'move'; from: number; to: number }[] = [];
              for (const step of steps) {
                const from = pos;
                pos = Math.min(pos + step, 12);
                chain.push({ player: state.turn, kind: 'move', from, to: pos });
              }
              onMove({ player: state.turn, kind: 'move', from: myPos, to: pos, chain });
            }}
          >
            حرکت ⬅
          </Button>
        )}
        {state.phase === 'finished' && (
          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
            {state.winner === myId ? '🎉 شما برنده شدید!' : 'ربات برنده شد'}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
