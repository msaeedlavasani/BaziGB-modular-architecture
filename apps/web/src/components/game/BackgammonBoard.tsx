'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  getLegalMoves,
  getMoveHints,
  canOfferDouble,
  type BackgammonMove,
  type BackgammonState,
} from '@bazigb/game-backgammon';
import Dice3D from './Dice3D';
import { soundService } from '@/lib/sound-service';
import { useAppLocale } from '@/hooks/useAppLocale';
import { formatBackgammonCount, getBackgammonBoardMessages } from '@/i18n/backgammon-board';
import { getBackgammonCubeDockPosition } from '@/lib/backgammon-cube-dock';

/**
 * Backgammon board with fixed LTR game geometry and locale-aware surrounding chrome.
 */
const CHECKER_LIGHT = '#F5EBD8';
const CHECKER_DARK = '#8FA2B8';
const BOARD_EDGE = '#1D3348';
const BOARD_FIELD = '#0D2133';
const BOARD_ACCENT = '#C88B2A';

interface Props {
  state: BackgammonState;
  onRoll?: () => void;
  onMove?: (move: BackgammonMove) => void;
  onChain?: (chain: BackgammonMove[]) => void;
  onEndTurn?: () => void;
  canEndTurn?: boolean;
  legalMovesOverride?: BackgammonMove[];
  onOfferDouble?: () => void;
  onRespondDouble?: (accept: boolean) => void;
  disabled?: boolean;
  isMyTurn?: boolean;
  myColor?: number;
}

type PieceMove = BackgammonMove & {
  kind: 'move';
  from: number | 'bar';
  to: number | 'off';
};

export default function BackgammonBoard({
  state,
  onRoll,
  onMove,
  onChain,
  onEndTurn,
  canEndTurn = false,
  legalMovesOverride,
  onOfferDouble,
  onRespondDouble,
  disabled = false,
  isMyTurn = false,
  myColor,
}: Props) {
  const locale = useAppLocale();
  const messages = getBackgammonBoardMessages(locale);
  const pointNumber = useMemo(() => new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { useGrouping: false }), [locale]);
  const myColorNum: number = myColor ?? ((state.players[0]?.color as number) || 1);
  const [selected, setSelected] = useState<number | 'bar' | null>(null);

  const board = state.board;
  const bar = state.bar;
  const off = state.off;
  const dice = state.dice ?? [];
  const rolled = !!state.rolled;

  const cube = (state as any)?.cube ?? 1;
  const cubeOwner = (state as any)?.cubeOwner ?? null;
  const doubling = (state as any)?.doubling ?? null;
  const myId = state.players.find((p) => p.color === myColorNum)?.id;

  const p1Id = state.players.find((p) => p.color === 1)?.id;
  const p2Id = state.players.find((p) => p.color === -1)?.id;
  const cubeDockPosition = getBackgammonCubeDockPosition(cubeOwner, p1Id, p2Id);

  const legalMoves = useMemo(() => legalMovesOverride ?? getLegalMoves(state), [legalMovesOverride, state]);

  const pieceMoves = useMemo(
    () =>
      legalMoves.filter(
        (m): m is PieceMove => m.kind === 'move' && m.from !== undefined && m.to !== undefined,
      ),
    [legalMoves],
  );

  const destinations = useMemo(() => {
    if (selected === null) return new Set<number | 'off'>();
    return new Set(pieceMoves.filter((m) => m.from === selected).map((m) => m.to));
  }, [selected, pieceMoves]);

  const combinedChains = useMemo(() => {
    if (selected === null || !rolled || !onChain) return [];
    const hints = getMoveHints(state);
    return hints.filter(
      (chain) =>
        chain.length > 1 &&
        (chain.every((m) => m.from === selected) ||
          (chain[0].from === selected && chain.every((m, i) => i === 0 || m.from === chain[i - 1].to))),
    );
  }, [selected, rolled, onChain, state]);
  const combinedDests = useMemo(
    () => new Set(combinedChains.map((chain) => chain[chain.length - 1].to).filter((t) => t !== undefined)),
    [combinedChains],
  );

  const myBarCount = bar[myColorNum] ?? 0;
  const mustFromBar = myBarCount > 0;
  const myCheckerOnPoint = (i: number) => (myColorNum === 1 ? board[i] > 0 : board[i] < 0);

  const handleMove = (move: BackgammonMove) => {
    if (disabled || !isMyTurn || move.kind !== 'move') return;
    const to = move.to;
    const isHit = typeof to === 'number' && board[to] === -myColorNum;
    onMove?.(move);
    setSelected(null);
    soundService.play(isHit ? 'capture' : 'move');
  };

  const handlePointClick = (index: number) => {
    if (disabled || !isMyTurn || !rolled) return;
    if (selected === index) {
      setSelected(null);
      return;
    }
    if (destinations.has(index)) {
      const move = pieceMoves.find((m) => m.from === selected && m.to === index);
      if (move) handleMove(move);
      return;
    }
    if (combinedDests.has(index)) {
      const chain = combinedChains.find((c) => c[c.length - 1].to === index);
      if (chain) {
        setSelected(null);
        soundService.play('move');
        onChain?.(chain);
      }
      return;
    }
    if (!mustFromBar && myCheckerOnPoint(index)) {
      setSelected(index);
    } else {
      setSelected(null);
    }
  };

  const handleBarClick = () => {
    if (disabled || !isMyTurn || !rolled) return;
    if (selected === 'bar') {
      setSelected(null);
      return;
    }
    if (myBarCount > 0) setSelected('bar');
  };

  const handleOffClick = () => {
    if (disabled || !isMyTurn || !rolled) return;
    if (selected !== null && destinations.has('off')) {
      const move = pieceMoves.find((m) => m.from === selected && m.to === 'off');
      if (move) handleMove(move);
      return;
    }
    if (selected === null && !mustFromBar) {
      const bearOffFrom = pieceMoves.find((m) => m.to === 'off')?.from;
      if (typeof bearOffFrom === 'number') setSelected(bearOffFrom);
    }
  };

  const renderCheckers = (count: number, isTop: boolean, keyPrefix: string, isBar = false) => {
    if (count === 0) return null;
    const absCount = Math.abs(count);
    const light = count > 0;
    const color = light ? CHECKER_LIGHT : CHECKER_DARK;
    const maxVisible = 5;
    const shown = Math.min(absCount, maxVisible);
    const size = isBar ? 'min(88%, 2.25rem)' : '94%';
    return (
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          position: 'relative',
        }}
      >
        {Array.from({ length: shown }, (_, i) => (
          <Box
            key={`${keyPrefix}-${i}`}
            sx={{
              width: size,
              minWidth: isBar ? 24 : 0,
              maxWidth: 110,
              aspectRatio: '1',
              borderRadius: '50%',
              mb: i < shown - 1 ? (isBar ? '-42%' : '-48%') : 0,
              zIndex: i + 1,
              background: `radial-gradient(circle at 32% 28%, ${light ? '#FFFDF5' : '#6B6B74'} 0%, ${color} 45%, ${light ? '#9A8A62' : '#16161A'} 100%)`,
              boxShadow: [
                'inset 0 2px 3px rgba(255,255,255,0.45)',
                'inset 0 -3px 6px rgba(0,0,0,0.4)',
                'inset 0 0 0 2px rgba(255,255,255,0.18)',
                '0 2px 2px rgba(0,0,0,0.5)',
                '0 6px 10px rgba(0,0,0,0.3)',
              ].join(', '),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {i === shown - 1 && absCount > maxVisible && (
              <Typography
                component="span"
                sx={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: light ? '#3A2E18' : '#F4F4F6',
                  lineHeight: 1,
                }}
              >
                {formatBackgammonCount(locale, absCount)}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  const cubeMarker = cube > 1 && cubeDockPosition ? (
    <Paper
      elevation={6}
      aria-label={`doubling cube ${pointNumber.format(cube)}`}
      sx={{
        width: 'min(82%, 1.875rem)',
        aspectRatio: '1',
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#2a1408',
        color: '#f0d9b5',
        fontWeight: 900,
        fontSize: { xs: 10, sm: 13 },
        borderRadius: 1,
        border: '1px solid #b58863',
        boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
        pointerEvents: 'none',
      }}
    >
      {pointNumber.format(cube)}
    </Paper>
  ) : null;

  const Point = ({ index }: { index: number }) => {
    const count = board[index];
    const isTop = index >= 12;
    const isDark = (index % 2 === 0) === isTop;
    const isSelected = selected === index;
    const isTarget = destinations.has(index);
    const isCombined = combinedDests.has(index) && !isTarget;
    const path = isTop ? 'M 3 0 L 18 100 L 33 0 Z' : 'M 3 100 L 18 0 L 33 100 Z';
    const fill = isDark ? 'url(#bgPtDark)' : 'url(#bgPtLight)';
    const stroke = isDark ? '#3e220c' : '#a97f45';
    const hasMine = myCheckerOnPoint(index);

    return (
      <Box
        onClick={() => handlePointClick(index)}
        sx={{
          position: 'relative',
          height: '100%',
          minWidth: 0,
          flex: 1,
          cursor:
            isMyTurn && !disabled && rolled && (hasMine || isTarget || isCombined)
              ? 'pointer'
              : 'default',
          userSelect: 'none',
        }}
      >
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 36 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={path} fill={fill} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
          <path
            d={path}
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)'}
            strokeWidth={1}
            strokeLinejoin="round"
            transform="translate(-1.5 0)"
          />
        </svg>

        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            top: isTop ? 2 : undefined,
            bottom: isTop ? undefined : 2,
          }}
        >
          {renderCheckers(count, isTop, String(index))}
        </Box>

        {isSelected && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              pointerEvents: 'none',
              bgcolor: 'rgba(245,158,11,0.28)',
              boxShadow: 'inset 0 0 0 2px rgba(245,158,11,0.75)',
            }}
          />
        )}
        {isTarget && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              pointerEvents: 'none',
              bgcolor: 'rgba(34,197,94,0.28)',
              boxShadow: 'inset 0 0 0 2px rgba(34,197,94,0.65)',
            }}
          />
        )}
        {isCombined && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              pointerEvents: 'none',
              bgcolor: 'rgba(96,165,250,0.30)',
              boxShadow: 'inset 0 0 0 2px rgba(96,165,250,0.75)',
            }}
          />
        )}

        <Typography
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            zIndex: 20,
            pointerEvents: 'none',
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 'clamp(0.38rem, 1.8cqi, 0.55rem)',
            color: 'rgba(232,238,246,0.48)',
            bottom: isTop ? 1 : undefined,
            top: isTop ? undefined : 1,
          }}
        >
          {pointNumber.format(index + 1)}
        </Typography>
      </Box>
    );
  };

  const topLeft = [12, 13, 14, 15, 16, 17];
  const topRight = [18, 19, 20, 21, 22, 23];
  const bottomLeft = [11, 10, 9, 8, 7, 6];
  const bottomRight = [5, 4, 3, 2, 1, 0];

  const renderHalf = (top: number[], bottom: number[]) => (
    <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          width: '100%',
          aspectRatio: '5/4',
          borderBottom: `1px solid ${BOARD_EDGE}`,
        }}
      >
        {top.map((i) => (
          <Point key={i} index={i} />
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', width: '100%', aspectRatio: '5/4' }}>
        {bottom.map((i) => (
          <Point key={i} index={i} />
        ))}
      </Box>
    </Box>
  );

  const canRoll = isMyTurn && !disabled && !rolled && state.phase === 'playing';
  const showEndTurn = isMyTurn && !disabled && canEndTurn;
  const showDice = dice.length > 0;

  const canDouble = isMyTurn && !disabled && canOfferDouble(state, state.turn);

  return (
    <Paper
      elevation={24}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 1.5, sm: 2 },
        width: '100%',
        maxWidth: 960,
        mx: 'auto',
        p: { xs: 1, sm: 2.5 },
        borderRadius: { xs: 3, sm: 5 },
        containerType: 'inline-size',
        border: { xs: `4px solid ${BOARD_EDGE}`, sm: `7px solid ${BOARD_EDGE}` },
        background: [
          'radial-gradient(circle at 50% 0%, rgba(200,139,42,0.12), transparent 52%)',
          'linear-gradient(155deg, #162D43 0%, #10263A 48%, #091A29 100%)',
        ].join(', '),
        boxShadow: '0 24px 48px -18px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          direction: 'ltr',
          width: '100%',
          userSelect: 'none',
          overflow: 'hidden',
          borderRadius: 1.5,
          border: `2px solid ${BOARD_EDGE}`,
          background: [
            'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%)',
            'radial-gradient(130% 120% at 50% 115%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 55%)',
            'repeating-linear-gradient(45deg, rgba(0,0,0,0.045) 0px, rgba(0,0,0,0.045) 1px, transparent 1px, transparent 5px)',
            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 5px)',
            `radial-gradient(ellipse 150% 110% at 50% 50%, #18364E 0%, ${BOARD_FIELD} 62%, #081827 100%)`,
          ].join(', '),
        }}
      >
        <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="bgPtDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D59A37" />
              <stop offset="55%" stopColor={BOARD_ACCENT} />
              <stop offset="100%" stopColor="#8D5D17" />
            </linearGradient>
            <linearGradient id="bgPtLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B9C7D6" />
              <stop offset="55%" stopColor="#7F96AD" />
              <stop offset="100%" stopColor="#526B84" />
            </linearGradient>
          </defs>
        </svg>

        {renderHalf(topLeft, bottomLeft)}

        <Box
          onClick={handleBarClick}
          sx={{
            position: 'relative',
            zIndex: 30,
            width: 'clamp(2.5rem, 9cqi, 3.75rem)',
            cursor: isMyTurn && !disabled && rolled && myBarCount > 0 ? 'pointer' : 'default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 0.75,
            borderInline: `1px solid ${BOARD_EDGE}`,
            bgcolor:
              selected === 'bar'
                ? 'rgba(240, 217, 181, 0.4)'
                : [
                    'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 10px)',
                    'linear-gradient(180deg, #24435D 0%, #112A40 50%, #24435D 100%)',
                  ].join(', '),
          }}
        >
          <Box aria-label={`bar ${pointNumber.format(bar[-1] ?? 0)}`} sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, pt: 0.5 }}>
            {cubeDockPosition === 'top' && cubeMarker}
            {renderCheckers(-(bar[-1] ?? 0), true, 'bar-b', true)}
            {(bar[-1] ?? 0) > 0 && (
              <Typography sx={{ px: 0.75, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.82)', color: '#17171B', fontSize: 11, fontWeight: 900 }}>{pointNumber.format(bar[-1])}</Typography>
            )}
          </Box>
          <Box aria-hidden sx={{ width: 4, height: 24, flex: '0 0 auto', borderRadius: 99, bgcolor: 'rgba(200,139,42,0.7)' }} />
          <Box aria-label={`bar ${pointNumber.format(bar[1] ?? 0)}`} sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, pb: 0.5 }}>
            {renderCheckers(bar[1] ?? 0, false, 'bar-g', true)}
            {(bar[1] ?? 0) > 0 && (
              <Typography sx={{ px: 0.75, borderRadius: 99, bgcolor: 'rgba(16,24,32,0.85)', color: '#FFF8E8', fontSize: 11, fontWeight: 900 }}>{pointNumber.format(bar[1])}</Typography>
            )}
            {cubeDockPosition === 'bottom' && cubeMarker}
          </Box>
        </Box>

        {renderHalf(topRight, bottomRight)}

        <Box
          onClick={handleOffClick}
          sx={{
            position: 'relative',
            zIndex: 30,
            width: 'clamp(1.25rem, 8cqi, 3.25rem)',
            cursor: isMyTurn && !disabled && rolled && destinations.has('off') ? 'pointer' : 'default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderInlineStart: `1px solid ${BOARD_EDGE}`,
            py: 1,
            bgcolor: destinations.has('off')
              ? 'rgba(34, 197, 94, 0.28)'
              : [
                  'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 7px)',
                  'linear-gradient(180deg, #38543f 0%, #26392c 50%, #152319 100%)',
                ].join(', '),
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700 }}>
              {messages.off}
            </Typography>
            {Array.from({ length: Math.min(Math.abs(off[-1] ?? 0), 3) }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: 'min(80%, 2.1rem)',
                  height: 5,
                  borderRadius: 0.5,
                  border: '1px solid rgba(20,50,80,0.8)',
                  background: 'linear-gradient(180deg, #5A5A62 0%, #1A1A1E 100%)',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
                }}
              />
            ))}
            {(off[-1] ?? 0) > 0 && (
              <Typography sx={{ px: 0.5, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.82)', color: '#17171B', fontSize: 10, fontWeight: 900, lineHeight: 1.5 }}>
                {formatBackgammonCount(locale, off[-1])}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            {(off[1] ?? 0) > 0 && (
              <Typography sx={{ px: 0.5, borderRadius: 99, bgcolor: 'rgba(16,24,32,0.85)', color: '#FFF8E8', fontSize: 10, fontWeight: 900, lineHeight: 1.5 }}>
                {formatBackgammonCount(locale, off[1])}
              </Typography>
            )}
            {Array.from({ length: Math.min(Math.abs(off[1] ?? 0), 3) }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: 'min(80%, 2.1rem)',
                  height: 5,
                  borderRadius: 0.5,
                  border: '1px solid rgba(60,50,20,0.8)',
                  background: 'linear-gradient(180deg, #F1E6CF 0%, #9A8A62 100%)',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
                }}
              />
            ))}
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700 }}>
              {messages.off}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            pointerEvents: 'none',
            borderRadius: 1,
            boxShadow: 'inset 0 0 70px rgba(0,0,0,0.55)',
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          direction: 'ltr',
          gap: 1.5,
          px: { xs: 0.5, sm: 1.5 },
        }}
      >
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
          {showDice ? (
            (() => {
              const groups: { value: number; count: number }[] = [];
              for (const d of dice) {
                const g = groups.find((x) => x.value === d);
                if (g) g.count++;
                else groups.push({ value: d, count: 1 });
              }
              return (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {groups.map((g) => (
                    <Box key={g.value} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Dice3D value={g.value} size={44} />
                      {g.count > 1 && (
                        <Typography
                          component="span"
                          sx={{
                            bgcolor: 'rgba(245,158,11,0.18)',
                            color: '#FBBF24',
                            border: '1px solid rgba(251,191,36,0.35)',
                            borderRadius: 2,
                            px: 0.75,
                            py: 0.25,
                            fontSize: '0.7rem',
                            fontWeight: 900,
                          }}
                        >
                          ×{g.count}
                        </Typography>
                      )}
                    </Box>
                  ))}
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', marginInlineStart: 0.5 }}>
                    {groups.map((g) => g.value).join(messages.diceSeparator)}
                  </Typography>
                </Box>
              );
            })()
          ) : (
            <Typography
              variant="overline"
              sx={{
                color: 'primary.main',
                fontWeight: 'bold',
                letterSpacing: '0.12em',
                animation: 'bg-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                fontSize: { xs: '0.68rem', sm: '0.8rem' },
                lineHeight: 1.2,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                '@keyframes bg-pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.45 },
                },
              }}
            >
              {isMyTurn && state.phase === 'playing' ? messages.yourRoll : messages.waiting}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', direction: 'ltr' }}>
          {state.crawfordGame && (
            <Chip size="small" variant="outlined" color="warning" label={messages.crawford} sx={{ direction: locale === 'fa' ? 'rtl' : 'ltr' }} />
          )}
          {canDouble && (
            <Button
              variant="contained"
              size="small"
              onClick={() => onOfferDouble?.()}
              sx={{
                minHeight: 44,
                direction: locale === 'fa' ? 'rtl' : 'ltr',
                px: { xs: 1.5, sm: 2 },
                bgcolor: 'primary.dark',
                '&:hover': { bgcolor: 'primary.main' },
                color: 'secondary.main',
                fontWeight: 'bold',
                fontSize: { xs: '0.68rem', sm: '0.75rem' },
                borderRadius: 2,
              }}
            >
              {messages.double}
            </Button>
          )}
          {showEndTurn && (
            <Button
              variant="outlined"
              onClick={() => {
                soundService.play('move');
                onEndTurn?.();
              }}
              sx={{
                minHeight: 44,
                direction: locale === 'fa' ? 'rtl' : 'ltr',
                px: { xs: 1.5, sm: 2.5 },
                borderColor: 'divider',
                color: 'text.primary',
                fontWeight: 'bold',
                fontSize: { xs: '0.68rem', sm: '0.75rem' },
                borderRadius: 2,
              }}
            >
              {messages.endTurn}
            </Button>
          )}
          {canRoll && (
            <Button
              variant="contained"
              onClick={() => {
                soundService.play('dice');
                onRoll?.();
              }}
              sx={{
                minHeight: 48,
                minWidth: 112,
                direction: locale === 'fa' ? 'rtl' : 'ltr',
                touchAction: 'manipulation',
                px: { xs: 2, sm: 3 },
                py: 1,
                bgcolor: 'primary.main',
                color: 'secondary.main',
                fontWeight: 900,
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                borderRadius: 3,
                transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { transform: 'scale(1.03)', bgcolor: 'primary.light' },
                '&:active': { transform: 'scale(0.98)' },
                '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
              }}
            >
              🎲 {messages.rollDice}
            </Button>
          )}
        </Box>
      </Box>

      {doubling && doubling.offeredBy === myId && (
        <Typography variant="caption" sx={{ color: 'primary.main', mt: 1 }}>
          {messages.waitingDoubleResponse}
        </Typography>
      )}

      <Dialog open={!!(doubling && doubling.offeredBy !== myId && !disabled)} dir={locale === 'fa' ? 'rtl' : 'ltr'}>
        <DialogTitle>{messages.doubleOffer}</DialogTitle>
        <DialogContent>
          <DialogContentText>{messages.doubleOfferDescription}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onRespondDouble?.(false)} color="error">
            {messages.decline}
          </Button>
          <Button onClick={() => onRespondDouble?.(true)} variant="contained" color="primary">
            {messages.accept}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
