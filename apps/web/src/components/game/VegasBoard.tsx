'use client';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { Banknote, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Flame, Loader2, Trophy } from 'lucide-react';
import type { CasinoData, VegasMove, VegasState } from '@bazigb/game-vegas';
import Dice3D from './Dice3D';
import { soundService } from '@/lib/sound-service';

interface Props {
  state: VegasState;
  onMove: (move: VegasMove) => void;
  disabled?: boolean;
  /** شناسه بازیکن محلی (برای برچسب «شما») */
  youId?: string;
}

const DiceIcons = [null, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
const DICE_PALETTE = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ef4444'];

function playerColor(pIdx: number): string {
  return DICE_PALETTE[pIdx % DICE_PALETTE.length];
}

/** کارت پول یک کازینو */
function MoneyCard({
  value,
  ownerIdx,
  resolved,
  swept,
}: {
  value: number;
  ownerIdx: string | null;
  resolved: boolean;
  swept: boolean;
}) {
  const color = ownerIdx !== null ? playerColor(parseInt(ownerIdx, 10) % DICE_PALETTE.length) : undefined;
  const burned = resolved && ownerIdx === null;
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        borderRadius: 2,
        border: '1px solid',
        px: 2,
        py: 1.5,
        boxShadow: swept ? '0 0 14px rgba(250,204,21,0.45)' : 1,
        transition: 'all 0.2s',
        opacity: burned ? 0.4 : 1,
        filter: burned ? 'grayscale(1)' : 'none',
        bgcolor: color ? `${color}1f` : 'rgba(16,185,129,0.08)',
        borderColor: color ? color : swept ? 'rgba(250,204,21,0.6)' : 'rgba(16,185,129,0.25)',
      }}
    >
      <Banknote size={12} style={{ color: color ?? '#34d399' }} />
      <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 900, lineHeight: 1, color: color ?? '#34d399' }}>
        ${value.toLocaleString()}
      </Typography>
      {burned && (
        <Box
          sx={{
            position: 'absolute',
            top: -6,
            right: -6,
            borderRadius: '50%',
            bgcolor: '#2C3A45',
            p: 0.5,
            color: '#94A3B8',
            display: 'flex',
          }}
          title="Burned"
        >
          <Flame size={10} />
        </Box>
      )}
    </Box>
  );
}

export default function VegasBoard({ state, onMove, disabled = false, youId }: Props) {
  const myId = youId ?? state.players[0]?.id ?? '';
  const players = state.players;
  const hand = state.playerDice[myId] ?? [];
  const handCounts: Record<number, number> = {};
  hand.forEach((v) => {
    handCounts[v] = (handCounts[v] || 0) + 1;
  });

  const myIndex = players.findIndex((p) => p.id === myId);
  const myColor = myIndex !== -1 ? playerColor(myIndex) : undefined;
  const isMyTurn = state.turn === myId && state.phase === 'playing' && !disabled;

  const handleValueClick = (value: number) => {
    if (disabled || !isMyTurn || state.phase !== 'playing' || hand.length === 0) return;
    soundService.play('move');
    onMove({ player: state.turn, kind: 'place', value });
  };

  const handleRollClick = () => {
    if (disabled || !isMyTurn || state.phase !== 'playing' || hand.length > 0) return;
    soundService.play('dice');
    onMove({ player: state.turn, kind: 'roll' });
  };

  const leaderboard = players
    .map((p, pIdx) => ({
      pIdx,
      id: p.id,
      cash: state.playerCash[p.id] ?? 0,
      cards: state.playerCards[p.id] ?? 0,
    }))
    .sort((a, b) => b.cash - a.cash || b.cards - a.cards);

  const isFinalRound = state.round >= state.totalRounds;

  return (
    <Paper
      elevation={24}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        width: '100%',
        maxWidth: 960,
        mx: 'auto',
        p: { xs: 1.5, sm: 3 },
        borderRadius: 5,
        border: { xs: '6px solid #2a1408', sm: '9px solid #2a1408' },
        background: [
          'repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, transparent 2px, transparent 7px)',
          'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 11px)',
          'linear-gradient(155deg, #6e3c1d 0%, #4e2912 40%, #331a0b 72%, #241105 100%)',
        ].join(', '),
        boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6)',
      }}
    >
      {/* سربرگ راند + نوار پول */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`راند ${state.round}/${state.totalRounds}`}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: 'rgba(178, 93, 22, 0.15)',
              color: '#F5A306',
              border: '1px solid',
              borderColor: 'rgba(245, 163, 6, 0.3)',
            }}
            variant="outlined"
          />
          {state.phase === 'roundEnd' && (
            <Chip
              icon={<Trophy size={14} />}
              label="پایان راند — پرداخت‌ها انجام شد"
              size="small"
              sx={{
                fontWeight: 800,
                bgcolor: 'rgba(245, 158, 11, 0.12)',
                color: '#FBBF24',
                border: '1px solid',
                borderColor: 'rgba(251, 191, 36, 0.4)',
              }}
              variant="outlined"
            />
          )}
          {isFinalRound && state.phase === 'roundEnd' && (
            <Chip
              label="راند پایانی!"
              size="small"
              sx={{
                fontWeight: 800,
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                color: '#34D399',
                border: '1px solid',
                borderColor: 'rgba(52, 211, 153, 0.4)',
              }}
              variant="outlined"
            />
          )}
        </Box>

        {/* نوار پول بازیکن‌ها */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          {leaderboard.map(({ pIdx, cash, cards }) => {
            const color = playerColor(pIdx);
            const isYou = players[pIdx]?.id === myId;
            return (
              <Chip
                key={pIdx}
                variant="outlined"
                size="small"
                avatar={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, ml: 1 }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                      {isYou ? 'شما' : players[pIdx]?.name ?? `بازیکن ${pIdx + 1}`}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'success.light' }}>
                      ${cash.toLocaleString()}
                    </Typography>
                    {cards > 0 && (
                      <Typography variant="caption" sx={{ fontSize: '9px', fontWeight: 600, color: 'text.disabled' }}>
                        {cards} کارت
                      </Typography>
                    )}
                  </Box>
                }
                sx={{ bgcolor: 'rgba(3, 10, 21, 0.7)', borderColor: 'divider', px: 0.5 }}
              />
            );
          })}
        </Box>
      </Box>

      {/* شبکه کازینوها */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {state.board.map((casino: CasinoData, idx: number) => {
          const value = idx + 1;
          const DiceIcon = DiceIcons[value]!;
          const totalDice = Object.values(casino.dice).reduce((a, b) => a + b, 0);
          const resolved = state.phase === 'roundEnd' || state.phase === 'finished';
          const stack = casino.stack;

          return (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                p: 2,
                borderRadius: 4,
                bgcolor: 'rgba(3, 10, 21, 0.55)',
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 150,
                opacity: stack === null ? 0.6 : 1,
              }}
            >
              {/* سربرگ کازینو */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: 'rgba(178, 93, 22, 0.12)', color: '#F5A306', display: 'flex' }}>
                    <DiceIcon size={22} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                    کازینو {value}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {stack?.swept && (
                    <Chip
                      label="SWEEP!"
                      size="small"
                      sx={{
                        fontSize: '9px',
                        fontWeight: 900,
                        bgcolor: 'rgba(245, 158, 11, 0.2)',
                        color: '#FBBF24',
                        borderColor: 'rgba(251, 191, 36, 0.5)',
                        height: 20,
                      }}
                      variant="outlined"
                    />
                  )}
                  {stack?.burned && (
                    <Chip
                      label="سوخت"
                      size="small"
                      sx={{
                        fontSize: '9px',
                        fontWeight: 900,
                        bgcolor: 'rgba(244, 63, 94, 0.15)',
                        color: '#FB7185',
                        borderColor: 'rgba(251, 113, 133, 0.4)',
                        height: 20,
                      }}
                      variant="outlined"
                    />
                  )}
                  {totalDice > 0 && (
                    <Chip
                      icon={<Dice6 size={12} />}
                      label={totalDice}
                      size="small"
                      sx={{
                        fontSize: '10px',
                        fontWeight: 900,
                        bgcolor: 'background.paper',
                        borderColor: 'divider',
                        height: 20,
                        '& .MuiChip-icon': { color: 'text.disabled' },
                      }}
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>

              {/* دسته پول: ۲ کارت روی هم */}
              <Box sx={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>
                {stack ? (
                  <Box sx={{ display: 'flex', '& > * + *': { ml: -1 } }}>
                    {stack.cards.map((cardVal, i) => {
                      const ownerIdx = i === 0 ? stack.winnerIndex : stack.runnerUpIndex;
                      const resolvedOwner = resolved ? ownerIdx : null;
                      return (
                        <MoneyCard key={i} value={cardVal} ownerIdx={resolvedOwner} resolved={resolved} swept={stack.swept} />
                      );
                    })}
                  </Box>
                ) : (
                  <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 600, color: 'text.disabled' }}>
                    پولی این راند نیست
                  </Typography>
                )}
              </Box>

              {/* تاس‌های بازیکن‌ها روی کازینو */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 'auto' }}>
                {players.map((p, pIdx) => {
                  const count = casino.dice[p.id] ?? 0;
                  if (count === 0) return null;
                  const color = playerColor(pIdx);
                  const isYou = p.id === myId;
                  return (
                    <Box key={p.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label={isYou ? 'شما' : p.name ?? `P${pIdx + 1}`}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '8px',
                          fontWeight: 900,
                          bgcolor: `${color}26`,
                          color,
                          border: 'none',
                          '& .MuiChip-label': { px: 1 },
                        }}
                      />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.25, maxWidth: 84 }}>
                        {Array.from({ length: count }).map((_, i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: 0.5,
                              border: '1px solid rgba(255,255,255,0.2)',
                              boxShadow: 1,
                              bgcolor: color,
                            }}
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 900, color }}>
                        {count}
                      </Typography>
                    </Box>
                  );
                })}
                {totalDice === 0 && (
                  <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.disabled', fontStyle: 'italic' }}>
                    — هنوز تاسی نرفته
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* پنل پایین: جدول رتبه‌بندی / دست شما */}
      {state.phase === 'roundEnd' ? (
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: { xs: 2, sm: 3 },
            borderRadius: 4,
            bgcolor: 'rgba(3, 10, 21, 0.5)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Trophy size={20} color="#fbbf24" />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.disabled' }}>
              جدول امتیاز
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {leaderboard.map(({ pIdx, cash, cards }, rank) => {
              const color = playerColor(pIdx);
              const isYou = players[pIdx]?.id === myId;
              return (
                <Paper
                  key={pIdx}
                  elevation={0}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderRadius: 3,
                    border: '1px solid',
                    px: 2,
                    py: 1.5,
                    bgcolor: rank === 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(3, 10, 21, 0.6)',
                    borderColor: rank === 0 ? 'rgba(251, 191, 36, 0.4)' : 'divider',
                  }}
                >
                  <Typography
                    sx={{ width: 20, textAlign: 'center', fontWeight: 900, color: rank === 0 ? '#FBBF24' : 'text.disabled' }}
                  >
                    {rank + 1}
                  </Typography>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color }} />
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {isYou ? 'شما' : players[pIdx]?.name ?? `بازیکن ${pIdx + 1}`}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled' }}>
                    {cards} کارت
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 'auto', fontWeight: 900, color: 'success.light' }}>
                    ${cash.toLocaleString()}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
          <Button
            fullWidth
            onClick={() => {
              soundService.play('move');
              onMove({ player: state.turn, kind: 'nextRound' });
            }}
            disabled={disabled}
            variant="contained"
            size="large"
            startIcon={<Dice6 size={20} />}
            sx={{
              py: 1.5,
              fontWeight: 900,
              borderRadius: 3,
              background: '#F5A306',
              boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.2)',
              '&:hover': { background: '#B25D16', opacity: 0.9 },
              textTransform: 'none',
            }}
          >
            {isFinalRound ? 'نتایج نهایی' : `شروع راند ${state.round + 1}`}
          </Button>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            p: { xs: 2, sm: 3 },
            borderRadius: 4,
            bgcolor: 'rgba(3, 10, 21, 0.5)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.disabled' }}>
              دست شما
            </Typography>
            {isMyTurn && hand.length > 0 && (
              <Chip
                label="یک مقدار را انتخاب کن"
                size="small"
                sx={{
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  bgcolor: `${myColor}20`,
                  color: myColor,
                  border: 'none',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 2,
              minHeight: 100,
              alignItems: 'center',
              width: '100%',
            }}
          >
            {hand.length > 0 ? (
              Object.entries(handCounts)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([valStr, count]) => {
                  const val = Number(valStr);
                  return (
                    <Button
                      key={val}
                      onClick={() => handleValueClick(val)}
                      disabled={disabled || !isMyTurn}
                      variant="outlined"
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'rgba(11, 22, 34, 0.8)',
                        borderColor: isMyTurn ? `${myColor}40` : 'divider',
                        '&:hover': {
                          bgcolor: 'rgba(44, 58, 69, 0.8)',
                          borderColor: isMyTurn ? myColor : 'divider',
                        },
                        '&:disabled': { opacity: 0.5 },
                        textTransform: 'none',
                        minWidth: 'auto',
                      }}
                    >
                      <Box sx={{ display: 'flex', '& > * + *': { ml: -1 } }}>
                        {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                          <Dice3D key={i} value={val} size={32} color={myColor} />
                        ))}
                        {count > 5 && (
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 2,
                              bgcolor: '#2C3A45',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              color: 'white',
                              zIndex: 10,
                              border: '1px solid',
                              borderColor: '#475569',
                            }}
                          >
                            +{count - 5}
                          </Box>
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 800, color: isMyTurn ? `${myColor}cc` : 'text.disabled', transition: 'color 0.2s' }}
                      >
                        گذاشتن {count} × {val}
                      </Typography>
                    </Button>
                  );
                })
            ) : isMyTurn ? (
              <Button
                onClick={handleRollClick}
                disabled={disabled}
                variant="contained"
                size="large"
                startIcon={<Dice6 size={24} />}
                sx={{
                  px: 5,
                  py: 2,
                  borderRadius: 4,
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  background: '#F5A306',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  '&:hover': { transform: 'scale(1.05)' },
                  '&:active': { transform: 'scale(0.95)' },
                  transition: 'all 0.2s',
                  '&:disabled': { opacity: 0.5, filter: 'grayscale(1)' },
                  textTransform: 'none',
                }}
              >
                🎲 ریختن تاس
              </Button>
            ) : (
              <Box sx={{ color: 'text.disabled', fontWeight: 500, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 1 }}>
                {disabled ? <Loader2 size={16} className="spin" /> : <CircularProgress size={16} color="inherit" />}
                {disabled ? 'تماشای بازی…' : 'در انتظار حریف…'}
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Paper>
  );
}
