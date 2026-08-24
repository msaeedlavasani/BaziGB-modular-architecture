'use client';

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Banknote, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Flame, Trophy } from 'lucide-react';
import type { CasinoData, VegasMove, VegasState } from '@bazigb/game-vegas';
import Dice3D from './Dice3D';
import { soundService } from '@/lib/sound-service';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getVegasBoardMessages } from '@/i18n/vegas-board';

interface Props {
  state: VegasState;
  onMove: (move: VegasMove) => void;
  disabled?: boolean;
  /** Local player id used for private hand/"you" presentation. */
  youId?: string;
}

const DICE_ICONS = [null, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

/** Game-semantic colors: player identity requires simultaneous distinction. */
const PLAYER_COLORS = ['#EEAC2F', '#7FA8D9', '#4CAF7D', '#B98AD9', '#E26D5A'];

function playerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

function MoneyCard({
  value,
  ownerId,
  players,
  resolved,
  swept,
  burnedTitle,
}: {
  value: number;
  ownerId: string | null;
  players: VegasState['players'];
  resolved: boolean;
  swept: boolean;
  burnedTitle: string;
}) {
  const theme = useTheme();
  const ownerIndex = ownerId ? players.findIndex((player) => player.id === ownerId) : -1;
  const ownerColor = ownerIndex >= 0 ? playerColor(ownerIndex) : null;
  const burned = resolved && !ownerId;

  return (
    <Box
      sx={{
        position: 'relative',
        minWidth: 64,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        borderRadius: 2,
        border: '1px solid',
        px: 1.5,
        py: 1.25,
        opacity: burned ? 0.45 : 1,
        filter: burned ? 'grayscale(1)' : 'none',
        bgcolor: ownerColor
          ? alpha(ownerColor, 0.12)
          : alpha(theme.palette.success.main, 0.07),
        borderColor: ownerColor
          ? alpha(ownerColor, 0.55)
          : swept
            ? alpha(theme.palette.warning.main, 0.5)
            : alpha(theme.palette.success.main, 0.24),
      }}
    >
      <Banknote size={14} color={ownerColor ?? theme.palette.success.main} />
      <Typography variant="caption" sx={{ fontWeight: 900, lineHeight: 1, color: ownerColor ?? 'success.light' }}>
        ${value.toLocaleString()}
      </Typography>
      {burned && (
        <Box
          title={burnedTitle}
          sx={{
            position: 'absolute',
            insetBlockStart: -6,
            insetInlineEnd: -6,
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            color: 'text.disabled',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Flame size={11} />
        </Box>
      )}
    </Box>
  );
}

export default function VegasBoard({ state, onMove, disabled = false, youId }: Props) {
  const theme = useTheme();
  const locale = useAppLocale();
  const messages = getVegasBoardMessages(locale);
  const myId = youId ?? state.players[0]?.id ?? '';
  const players = state.players;
  const hand = state.playerDice[myId] ?? [];
  const handCounts: Record<number, number> = {};
  hand.forEach((value) => {
    handCounts[value] = (handCounts[value] || 0) + 1;
  });

  const myIndex = players.findIndex((player) => player.id === myId);
  const myColor = myIndex >= 0 ? playerColor(myIndex) : theme.palette.primary.main;
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
    .map((player, playerIndex) => ({
      playerIndex,
      id: player.id,
      cash: state.playerCash[player.id] ?? 0,
      cards: state.playerCards[player.id] ?? 0,
    }))
    .sort((a, b) => b.cash - a.cash || b.cards - a.cards);

  const isFinalRound = state.round >= state.totalRounds;

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 960,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 2, sm: 2.5 },
        p: { xs: 2, sm: 3 },
        borderRadius: 5,
        bgcolor: alpha(theme.palette.secondary.main, 0.72),
        borderColor: alpha(theme.palette.primary.main, 0.18),
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={messages.round(state.round, state.totalRounds)} size="small" color="warning" variant="outlined" />
          {state.phase === 'roundEnd' && (
            <Chip icon={<Trophy size={14} />} label={messages.roundPaid} size="small" color="warning" variant="outlined" />
          )}
          {isFinalRound && state.phase === 'roundEnd' && (
            <Chip label={messages.finalRound} size="small" color="success" variant="outlined" />
          )}
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          {leaderboard.map(({ playerIndex, cash, cards }) => {
            const color = playerColor(playerIndex);
            const isYou = players[playerIndex]?.id === myId;
            return (
              <Chip
                key={playerIndex}
                variant="outlined"
                size="small"
                avatar={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, marginInlineStart: 1 }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                      {isYou ? messages.you : players[playerIndex]?.name ?? messages.player(playerIndex + 1)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'success.light' }}>
                      ${cash.toLocaleString()}
                    </Typography>
                    {cards > 0 && (
                      <Typography variant="caption" sx={{ fontSize: '9px', color: 'text.disabled' }}>
                        {messages.cards(cards)}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{ bgcolor: alpha(theme.palette.background.default, 0.45), borderColor: 'divider', px: 0.5 }}
              />
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {state.board.map((casino: CasinoData, index: number) => {
          const value = index + 1;
          const DiceIcon = DICE_ICONS[value]!;
          const totalDice = Object.values(casino.dice).reduce((sum, count) => sum + count, 0);
          const resolved = state.phase === 'roundEnd' || state.phase === 'finished';
          const stack = casino.stack;

          return (
            <Paper
              key={index}
              elevation={0}
              sx={{
                minHeight: 164,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                p: 2,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.background.default, 0.48),
                opacity: stack === null ? 0.68 : 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                    <DiceIcon size={22} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                    {messages.casino(value)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {stack?.swept && <Chip label={messages.sweep} size="small" color="warning" variant="outlined" />}
                  {stack?.burned && <Chip label={messages.burned} size="small" color="error" variant="outlined" />}
                  {totalDice > 0 && <Chip icon={<Dice6 size={12} />} label={totalDice} size="small" variant="outlined" />}
                </Box>
              </Box>

              <Box sx={{ minHeight: 46, display: 'flex', alignItems: 'center' }}>
                {stack ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {stack.cards.map((cardValue, cardIndex) => {
                      const ownerId = cardIndex === 0 ? stack.winnerIndex : stack.runnerUpIndex;
                      return (
                        <MoneyCard
                          key={`${cardValue}-${cardIndex}`}
                          value={cardValue}
                          ownerId={resolved ? ownerId : null}
                          players={players}
                          resolved={resolved}
                          swept={stack.swept}
                          burnedTitle={messages.burnedTitle}
                        />
                      );
                    })}
                  </Box>
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>{messages.noMoney}</Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mt: 'auto' }}>
                {players.map((player, playerIndex) => {
                  const count = casino.dice[player.id] ?? 0;
                  if (count === 0) return null;
                  const color = playerColor(playerIndex);
                  const isYou = player.id === myId;

                  return (
                    <Box key={player.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '9px', fontWeight: 900, color }}>
                        {isYou ? messages.you : player.name ?? messages.player(playerIndex + 1)}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.25, maxWidth: 84 }}>
                        {Array.from({ length: count }).map((_, dieIndex) => (
                          <Box
                            key={dieIndex}
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: 0.75,
                              border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                              bgcolor: color,
                            }}
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 900, color }}>{count}</Typography>
                    </Box>
                  );
                })}
                {totalDice === 0 && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                    {messages.noDicePlaced}
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>

      {state.phase === 'roundEnd' ? (
        <Paper elevation={0} sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: { xs: 2, sm: 3 }, borderRadius: 4, bgcolor: alpha(theme.palette.background.default, 0.42) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Trophy size={20} color={theme.palette.warning.main} />
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.secondary' }}>{messages.standings}</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {leaderboard.map(({ playerIndex, cash, cards }, rank) => {
              const color = playerColor(playerIndex);
              const isYou = players[playerIndex]?.id === myId;
              return (
                <Paper
                  key={playerIndex}
                  elevation={0}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    borderRadius: 3,
                    px: 2,
                    py: 1.5,
                    bgcolor: rank === 0 ? alpha(theme.palette.warning.main, 0.08) : alpha(theme.palette.background.paper, 0.35),
                    borderColor: rank === 0 ? alpha(theme.palette.warning.main, 0.35) : 'divider',
                  }}
                >
                  <Typography sx={{ width: 20, textAlign: 'center', fontWeight: 900, color: rank === 0 ? 'warning.light' : 'text.disabled' }}>
                    {rank + 1}
                  </Typography>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                  <Typography variant="body2" noWrap sx={{ minWidth: 0, fontWeight: 800, color: 'text.primary' }}>
                    {isYou ? messages.you : players[playerIndex]?.name ?? messages.player(playerIndex + 1)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: { xs: 'none', sm: 'inline' } }}>
                    {messages.cards(cards)}
                  </Typography>
                  <Typography variant="body2" sx={{ marginInlineStart: 'auto', fontWeight: 900, color: 'success.light', flexShrink: 0 }}>
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
            sx={{ fontWeight: 900 }}
          >
            {isFinalRound ? messages.finalResults : messages.startRound(state.round + 1)}
          </Button>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: { xs: 2, sm: 3 }, borderRadius: 4, bgcolor: alpha(theme.palette.background.default, 0.42) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.secondary' }}>{messages.yourHand}</Typography>
            {isMyTurn && hand.length > 0 && (
              <Chip label={messages.chooseValue} size="small" sx={{ bgcolor: alpha(myColor, 0.12), color: myColor, borderColor: alpha(myColor, 0.35) }} variant="outlined" />
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5, minHeight: 96, alignItems: 'center', width: '100%' }}>
            {hand.length > 0 ? (
              Object.entries(handCounts)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([valueString, count]) => {
                  const value = Number(valueString);
                  return (
                    <Button
                      key={value}
                      onClick={() => handleValueClick(value)}
                      disabled={disabled || !isMyTurn}
                      variant="outlined"
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.background.paper, 0.45),
                        borderColor: isMyTurn ? alpha(myColor, 0.4) : 'divider',
                        '&:hover': { bgcolor: alpha(myColor, 0.08), borderColor: isMyTurn ? myColor : 'divider' },
                      }}
                    >
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                        {Array.from({ length: Math.min(count, 5) }).map((_, dieIndex) => (
                          <Dice3D key={dieIndex} value={value} size={32} color={myColor} />
                        ))}
                        {count > 5 && (
                          <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: 'text.primary', border: '1px solid', borderColor: 'divider' }}>
                            +{count - 5}
                          </Box>
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: isMyTurn ? myColor : 'text.disabled' }}>
                        {messages.placeDice(count, value)}
                      </Typography>
                    </Button>
                  );
                })
            ) : isMyTurn ? (
              <Button onClick={handleRollClick} disabled={disabled} variant="contained" size="large" startIcon={<Dice6 size={24} />} sx={{ px: 5, py: 1.75, fontWeight: 900 }}>
                {messages.rollDice}
              </Button>
            ) : (
              <Box sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {disabled ? messages.watching : messages.waiting}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Paper>
  );
}
