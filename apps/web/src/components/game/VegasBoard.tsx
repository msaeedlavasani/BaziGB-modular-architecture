'use client';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import type { VegasMove, VegasState } from '@bazigb/game-vegas';
import { diceSteps } from '@bazigb/engine';
import Dice3D from './Dice3D';

interface Props {
  state: VegasState;
  onMove: (move: VegasMove) => void;
  disabled?: boolean;
}

const GOLD = '#EEAC2F';
const BLUE = '#7FA8D9';

/**
 * برد وگاس — مسیر ۱۲ نقطه‌ای با ظاهر میز کازینو (میز چرمی سبز، چیپ‌های
 * سه‌بعدی، تاس) روی قوانین انجین جدید: شرط → ریختن تاس → حرکت ترکیبی.
 */
export default function VegasBoard({ state, onMove, disabled }: Props) {
  const myId = state.players[0]?.id ?? 'p1';
  const botId = state.players[1]?.id ?? 'p2';
  const myPos = state.positions?.[myId] ?? 0;
  const botPos = state.positions?.[botId] ?? 0;
  const myChips = state.scores?.[myId] ?? 0;
  const botChips = state.scores?.[botId] ?? 0;
  const isMyTurn = state.turn === myId && state.phase !== 'finished';

  const renderToken = (pos: number, color: string) => {
    if (pos >= 12) {
      return (
        <Box sx={{ position: 'absolute', right: 8, top: color === GOLD ? 4 : 'auto', bottom: color === GOLD ? 'auto' : 4, fontSize: 22, zIndex: 3 }}>
          🏁
        </Box>
      );
    }
    return (
      <Box
        sx={{
          position: 'absolute',
          right: `calc(${(pos / 12) * 100}% + ${6 + (pos / 12) * 12}px)`,
          top: color === GOLD ? 6 : 'auto',
          bottom: color === GOLD ? 'auto' : 6,
          width: 26,
          height: 26,
          borderRadius: '50%',
          zIndex: 3,
          background: `radial-gradient(circle at 35% 30%, ${color === GOLD ? '#FFD27A' : '#9DBEDD'} 0%, ${color} 55%, ${color === GOLD ? '#8A6410' : '#16324F'} 100%)`,
          boxShadow: [
            'inset 0 2px 3px rgba(255,255,255,0.45)',
            'inset 0 -3px 6px rgba(0,0,0,0.4)',
            'inset 0 0 0 2px rgba(255,255,255,0.18)',
            '0 2px 3px rgba(0,0,0,0.55)',
            '0 8px 12px rgba(0,0,0,0.3)',
          ].join(', '),
        }}
      />
    );
  };

  const moveChain = () => {
    const steps = diceSteps(state.dice);
    let pos = myPos;
    const chain: { player: string; kind: 'move'; from: number; to: number }[] = [];
    for (const step of steps) {
      const from = pos;
      pos = Math.min(pos + step, 12);
      chain.push({ player: state.turn, kind: 'move', from, to: pos });
    }
    onMove({ player: state.turn, kind: 'move', from: myPos, to: pos, chain });
  };

  return (
    <Paper
      elevation={24}
      sx={{
        width: '100%',
        maxWidth: 720,
        mx: 'auto',
        p: { xs: 1.5, sm: 3 },
        borderRadius: { xs: 3, sm: 5 },
        border: { xs: '6px solid #2a1408', sm: '9px solid #2a1408' },
        background: [
          'repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, transparent 2px, transparent 7px)',
          'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 11px)',
          'linear-gradient(155deg, #6e3c1d 0%, #4e2912 40%, #331a0b 72%, #241105 100%)',
        ].join(', '),
        boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* میز کازینو */}
      <Box
        sx={{
          position: 'relative',
          height: 110,
          borderRadius: 2,
          border: '4px solid #2b1509',
          overflow: 'hidden',
          background: [
            'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%)',
            'radial-gradient(130% 120% at 50% 115%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 55%)',
            'repeating-linear-gradient(45deg, rgba(0,0,0,0.045) 0px, rgba(0,0,0,0.045) 1px, transparent 1px, transparent 5px)',
            'radial-gradient(ellipse 150% 110% at 50% 50%, #38543f 0%, #26392c 55%, #152319 100%)',
          ].join(', '),
          display: 'flex',
          alignItems: 'center',
          px: 1,
        }}
      >
        {/* خانه‌های مسیر */}
        {Array.from({ length: 12 }, (_, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: '100%',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.65rem' }}>
              {i + 1}
            </Typography>
            {i === 11 && (
              <Typography sx={{ position: 'absolute', top: 2, right: 2, fontSize: 12 }}>🎯</Typography>
            )}
          </Box>
        ))}

        {renderToken(myPos, GOLD)}
        {renderToken(botPos, BLUE)}

        {/* برچسب بازیکن‌ها */}
        <Box sx={{ position: 'absolute', top: 4, left: 8, display: 'flex', gap: 1.5 }}>
          <Chip size="small" label={`شما: ${myChips} چیپ`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(238,172,47,0.2)', color: GOLD, border: '1px solid rgba(238,172,47,0.4)' }} />
          <Chip size="small" label={`حریف: ${botChips} چیپ`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(127,168,217,0.2)', color: BLUE, border: '1px solid rgba(127,168,217,0.4)' }} />
        </Box>
        <Box sx={{ position: 'absolute', bottom: 4, left: 8, display: 'flex', gap: 1.5 }}>
          <Chip size="small" label={`پات: ${state.pot}`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.35)', color: 'text.secondary' }} />
        </Box>
      </Box>

      {/* تاس + وضعیت */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {state.dice?.length ? (
            <>
              {state.dice.map((d, i) => (
                <Dice3D key={i} value={d} size={40} />
              ))}
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', ml: 0.5 }}>
                {state.dice.join(' + ')}
              </Typography>
            </>
          ) : (
            <Typography variant="overline" sx={{ color: GOLD, fontWeight: 700, letterSpacing: '0.1em' }}>
              {isMyTurn ? 'نوبت شماست' : 'در انتظار حریف…'}
            </Typography>
          )}
        </Box>
        <Chip
          size="small"
          label={
            state.phase === 'bet' ? 'فاز شرطبندی' :
            state.phase === 'roll' ? 'فاز تاس' :
            state.phase === 'move' ? 'فاز حرکت' : 'پایان'
          }
          sx={{
            fontSize: '0.65rem',
            fontWeight: 800,
            bgcolor: 'rgba(238,172,47,0.12)',
            color: 'primary.light',
            border: '1px solid rgba(238,172,47,0.25)',
          }}
        />
      </Box>

      {/* کنترل‌ها */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
        {state.phase === 'bet' && !disabled && isMyTurn && (
          <>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>شرط:</Typography>
            {[1, 3, 5, 10].map((amount) => (
              <Button
                key={amount}
                size="small"
                variant="outlined"
                disabled={myChips < amount}
                onClick={() => onMove({ player: state.turn, kind: 'bet', amount })}
                sx={{
                  borderRadius: '50%',
                  minWidth: 44,
                  width: 44,
                  height: 44,
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  borderColor: 'rgba(238,172,47,0.5)',
                  color: GOLD,
                  background: `radial-gradient(circle at 35% 30%, #FFD27A 0%, #B8860B 55%, #8A6410 100%)`,
                  border: '2px solid #5A4126',
                  boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.4), 0 3px 6px rgba(0,0,0,0.5)',
                  '&.Mui-disabled': { opacity: 0.35, filter: 'grayscale(1)' },
                  '&:hover': { transform: 'scale(1.06)' },
                }}
              >
                {amount}
              </Button>
            ))}
          </>
        )}
        {state.phase === 'roll' && !disabled && isMyTurn && (
          <Button
            size="small"
            variant="contained"
            onClick={() => onMove({ player: state.turn, kind: 'roll' })}
            sx={{
              px: 3,
              py: 1,
              background: '#EA580C',
              color: 'white',
              fontWeight: 900,
              borderRadius: 3,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
              '&:hover': { transform: 'scale(1.04)', background: '#F97316' },
            }}
          >
            🎲 ریختن تاس
          </Button>
        )}
        {state.phase === 'move' && !disabled && isMyTurn && (
          <Button
            size="small"
            variant="contained"
            onClick={moveChain}
            sx={{
              px: 3,
              py: 1,
              background: '#EA580C',
              color: 'white',
              fontWeight: 900,
              borderRadius: 3,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
              '&:hover': { transform: 'scale(1.04)', background: '#F97316' },
            }}
          >
            حرکت ترکیبی ⬅
          </Button>
        )}
        {state.phase === 'finished' && (
          <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 800 }}>
            {state.winner ? (state.winner === myId ? '🎉 شما برنده شدید!' : 'حریف برنده شد') : 'مساوی!'}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
