'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  canBearOff,
  type BackgammonMove,
  type BackgammonState,
} from '@bazigb/game-backgammon';
import Dice3D from './Dice3D';
import { soundService } from '@/lib/sound-service';

/**
 * برد نرد — بازسازی UI قبلی (Elite) روی انجین جدید.
 *
 * - قاب گردویی + سطح چرمی سبز + مثلث‌های چوبی (SVG) + مهره‌های سه‌بعدی
 * - ریختن تاس با Dice3D، انتخاب نقطه و مقصدهای قانونی، بار و بیرون‌بردن
 * - کار با callback ها: onRoll / onMove / onEndTurn / onPlayChain
 *   (هم برای بازی محلی با ربات و هم برای چندنفره آنلاین)
 */

// مهره روشن (بازیکن پایین) و مهره تیره (بازیکن بالا) — مطابق رسم کاربر
const CHECKER_LIGHT = '#F1E6CF';
const CHECKER_DARK = '#3A3A40';

interface Props {
  state: BackgammonState;
  onRoll?: () => void;
  onMove?: (move: BackgammonMove) => void;
  /** اجرای زنجیرهٔ کامل (حرکت ترکیبی یک‌کلیک) */
  onChain?: (chain: BackgammonMove[]) => void;
  onEndTurn?: () => void;
  onOfferDouble?: () => void;
  onRespondDouble?: (accept: boolean) => void;
  disabled?: boolean;
  isMyTurn?: boolean;
  /** رنگ بازیکن جاری: 1 (روشن) یا -1 (تیره). پیش‌فرض: بازیکن اول. */
  myColor?: number;
}

/** حرکت مهره با from/to پر شده (نوع انجین آن‌ها را اختیاری اعلام کرده) */
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
  onOfferDouble,
  onRespondDouble,
  disabled = false,
  isMyTurn = false,
  myColor,
}: Props) {
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

  // همه حرکت‌های قانونی (شامل حرکت تاس وقتی ریخته نشده)
  const legalMoves = useMemo(() => getLegalMoves(state), [state]);

  const pieceMoves = useMemo(
    () =>
      legalMoves.filter(
        (m): m is PieceMove => m.kind === 'move' && m.from !== undefined && m.to !== undefined,
      ),
    [legalMoves],
  );

  // مقصدهای قانونی برای نقطه/بار انتخاب‌شده
  const destinations = useMemo(() => {
    if (selected === null) return new Set<number | 'off'>();
    return new Set(pieceMoves.filter((m) => m.from === selected).map((m) => m.to));
  }, [selected, pieceMoves]);

  // حرکت ترکیبی یک‌کلیک: زنجیره‌های حداکثری که همهٔ تاس‌ها را از همین نقطه مصرف می‌کنند
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

  // کلید وضعیت برای گارد حرکت خودکار
  const stateKey = [board.join(','), bar[1], bar[-1], off[1], off[-1], dice.join(',')].join('|');

  // حرکت خودکار وقتی فقط یک حرکت قانونی وجود دارد (بار یا بیرون‌بردن اجباری)
  const forcedPlayedRef = useRef<string | null>(null);
  useEffect(() => {
    if (disabled || !isMyTurn || !rolled || dice.length === 0) return;
    if (forcedPlayedRef.current === stateKey) return;
    if (pieceMoves.length !== 1) return;
    const only = pieceMoves[0];
    const allInHome = canBearOff(state, state.turn);
    if (myBarCount > 0 || allInHome) {
      forcedPlayedRef.current = stateKey;
      onMove?.(only);
    }
  }, [stateKey, disabled, isMyTurn, rolled, dice.length, pieceMoves, myBarCount, onMove, state]);

  // پاس خودکار وقتی تاس مانده ولی حرکتی ممکن نیست
  const passedRef = useRef<string | null>(null);
  useEffect(() => {
    if (disabled || !isMyTurn || !rolled || dice.length === 0) return;
    if (pieceMoves.length > 0) return;
    if (passedRef.current === stateKey) return;
    passedRef.current = stateKey;
    onEndTurn?.();
  }, [stateKey, disabled, isMyTurn, rolled, dice.length, pieceMoves, onEndTurn]);

  const handleMove = (move: BackgammonMove) => {
    if (disabled || !isMyTurn || move.kind !== 'move') return;
    const to = move.to;
    // تشخیص زدن مهره (Hit)
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
    // حرکت ترکیبی: یک کلیک روی مقصد نهایی → اجرای همهٔ تاس‌ها
    if (combinedDests.has(index)) {
      const chain = combinedChains.find((c) => c[c.length - 1].to === index);
      if (chain) {
        setSelected(null);
        soundService.play('move');
        onChain?.(chain);
      }
      return;
    }
    // انتخاب نقطه خودی (اگر مجبور به حرکت از بار نباشیم)
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
      // انتخاب نقطه‌ای که امکان بیرون‌بردن دارد
      const bearOffFrom = pieceMoves.find((m) => m.to === 'off')?.from;
      if (typeof bearOffFrom === 'number') setSelected(bearOffFrom);
    }
  };

  /* ------------------------------- رندر مهره ------------------------------ */

  const renderCheckers = (count: number, isTop: boolean, keyPrefix: string, isBar = false) => {
    if (count === 0) return null;
    const absCount = Math.abs(count);
    const light = count > 0;
    const color = light ? CHECKER_LIGHT : CHECKER_DARK;
    const maxVisible = 5;
    const shown = Math.min(absCount, maxVisible);
    const size = isBar ? 38 : '94%';
    return (
      <Box
        sx={{
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
              minWidth: 26,
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
                {absCount}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  };

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
            fontFamily: 'monospace',
            fontSize: 8,
            color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(60,30,5,0.6)',
            bottom: isTop ? 1 : undefined,
            top: isTop ? undefined : 1,
          }}
        >
          {index + 1}
        </Typography>
      </Box>
    );
  };

  // چینش استاندارد نرد (مثل برد قدیمی): ردیف بالا ۱۳..۲۴، ردیف پایین ۱۲..۱
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
          borderBottom: '2px solid rgba(43,21,9,0.85)',
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
  const canEndTurn = isMyTurn && !disabled && rolled && dice.length > 0 && pieceMoves.length === 0;
  const showDice = dice.length > 0;

  const canDouble =
    isMyTurn &&
    !disabled &&
    !rolled &&
    cube < 64 &&
    !doubling &&
    state.phase === 'playing' &&
    (cubeOwner === null || cubeOwner !== state.turn);

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
        border: { xs: '6px solid #2a1408', sm: '9px solid #2a1408' },
        background: [
          'repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, transparent 2px, transparent 7px)',
          'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 11px)',
          'linear-gradient(155deg, #6e3c1d 0%, #4e2912 40%, #331a0b 72%, #241105 100%)',
        ].join(', '),
        boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* سطح بازی — direction:ltr چون صفحه RTL است و چیدمان نرد LTR است
          (ستون «خارج» باید سمت راست بماند، نه آینه‌شده) */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          direction: 'ltr',
          width: '100%',
          userSelect: 'none',
          overflow: 'hidden',
          borderRadius: 1.5,
          border: '4px solid #2b1509',
          background: [
            'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%)',
            'radial-gradient(130% 120% at 50% 115%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 55%)',
            'repeating-linear-gradient(45deg, rgba(0,0,0,0.045) 0px, rgba(0,0,0,0.045) 1px, transparent 1px, transparent 5px)',
            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 5px)',
            'radial-gradient(ellipse 150% 110% at 50% 50%, #38543f 0%, #26392c 55%, #152319 100%)',
          ].join(', '),
        }}
      >
        <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="bgPtDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8a5a30" />
              <stop offset="45%" stopColor="#6b3f1e" />
              <stop offset="100%" stopColor="#45260f" />
            </linearGradient>
            <linearGradient id="bgPtLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5e0b2" />
              <stop offset="45%" stopColor="#dfbd85" />
              <stop offset="100%" stopColor="#bf9257" />
            </linearGradient>
          </defs>
        </svg>

        {renderHalf(topLeft, bottomLeft)}

        {/* بار */}
        <Box
          onClick={handleBarClick}
          sx={{
            position: 'relative',
            zIndex: 30,
            width: { xs: 28, sm: 44 },
            cursor: isMyTurn && !disabled && rolled && myBarCount > 0 ? 'pointer' : 'default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderLeft: '2px solid #2b1509',
            borderRight: '2px solid #2b1509',
            py: 0.75,
            bgcolor:
              selected === 'bar'
                ? 'rgba(180, 83, 9, 0.35)'
                : [
                    'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 7px)',
                    'linear-gradient(180deg, #3a2110 0%, #2a1408 100%)',
                  ].join(', '),
          }}
        >
          {cube > 1 && (
            <Paper
              elevation={6}
              sx={{
                position: 'absolute',
                left: '50%',
                width: { xs: 22, sm: 30 },
                height: { xs: 22, sm: 30 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#B97F12',
                color: '#FFFDF5',
                fontWeight: 900,
                fontSize: { xs: 11, sm: 15 },
                borderRadius: 1,
                zIndex: 100,
                border: '1px solid #D4A017',
                boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                ...(cubeOwner === p1Id
                  ? { top: '12%', transform: 'translateX(-50%)' }
                  : cubeOwner === p2Id
                    ? { bottom: '12%', transform: 'translateX(-50%)' }
                    : { top: '50%', transform: 'translate(-50%, -50%)' }),
              }}
            >
              {cube}
            </Paper>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1 }}>
            {renderCheckers(-(bar[-1] ?? 0), true, 'bar-b', true)}
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 8, fontWeight: 700 }}>BAR</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 1 }}>
            {renderCheckers(bar[1] ?? 0, false, 'bar-g', true)}
          </Box>
        </Box>

        {renderHalf(topRight, bottomRight)}

        {/* خارج */}
        <Box
          onClick={handleOffClick}
          sx={{
            position: 'relative',
            zIndex: 30,
            width: { xs: 34, sm: 52 },
            cursor: isMyTurn && !disabled && rolled && destinations.has('off') ? 'pointer' : 'default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderLeft: '2px solid #2b1509',
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
              خارج
            </Typography>
            {Array.from({ length: Math.min(Math.abs(off[-1] ?? 0), 8) }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: { xs: 22, sm: 34 },
                  height: 5,
                  borderRadius: 0.5,
                  border: '1px solid rgba(20,50,80,0.8)',
                  background: 'linear-gradient(180deg, #5A5A62 0%, #1A1A1E 100%)',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
                }}
              />
            ))}
            {(off[-1] ?? 0) > 8 && (
              <Typography sx={{ color: CHECKER_DARK, fontSize: 10, fontWeight: 800 }}>{off[-1]}</Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            {(off[1] ?? 0) > 8 && (
              <Typography sx={{ color: CHECKER_LIGHT, fontSize: 10, fontWeight: 800 }}>{off[1]}</Typography>
            )}
            {Array.from({ length: Math.min(Math.abs(off[1] ?? 0), 8) }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: { xs: 22, sm: 34 },
                  height: 5,
                  borderRadius: 0.5,
                  border: '1px solid rgba(60,50,20,0.8)',
                  background: 'linear-gradient(180deg, #F1E6CF 0%, #9A8A62 100%)',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
                }}
              />
            ))}
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700 }}>
              خارج
            </Typography>
          </Box>
        </Box>

        {/* وینیت عمق */}
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

      {/* نوار پایین: تاس + دکمه‌ها + راهنمای حرکت ترکیبی */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: 1.5,
          px: { xs: 0.5, sm: 1.5 },
        }}
      >
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
          {showDice ? (
            (() => {
              // گروه‌بندی تاس‌ها (جفت → ۴ تاس، هر حرکت یکی مصرف می‌شود)
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
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', ml: 0.5 }}>
                    {groups.map((g) => g.value).join(' و ')}
                  </Typography>
                </Box>
              );
            })()
          ) : (
            <Typography
              variant="overline"
              sx={{
                color: '#f59e0b',
                fontWeight: 'bold',
                letterSpacing: '0.12em',
                animation: 'bg-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                fontSize: { xs: '0.68rem', sm: '0.8rem' },
                lineHeight: 1.2,
                '@keyframes bg-pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.45 },
                },
              }}
            >
              {isMyTurn && state.phase === 'playing' ? 'نوبت شما برای ریختن تاس' : 'در انتظار حریف...'}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
          {canDouble && (
            <Button
              variant="contained"
              size="small"
              onClick={() => onOfferDouble?.()}
              sx={{
                px: { xs: 1.5, sm: 2 },
                bgcolor: '#B97F12',
                '&:hover': { bgcolor: '#EEAC2F' },
                color: 'white',
                fontWeight: 'bold',
                fontSize: { xs: '0.68rem', sm: '0.75rem' },
                borderRadius: 2,
              }}
            >
              دابل
            </Button>
          )}
          {canEndTurn && (
            <Button
              variant="contained"
              onClick={() => {
                soundService.play('move');
                onEndTurn?.();
              }}
              sx={{
                px: { xs: 1.5, sm: 2.5 },
                bgcolor: '#2C3A45',
                '&:hover': { bgcolor: '#5B6570' },
                color: 'white',
                fontWeight: 'bold',
                fontSize: { xs: '0.68rem', sm: '0.75rem' },
                borderRadius: 2,
              }}
            >
              پایان نوبت
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
                px: { xs: 2, sm: 3 },
                py: 1,
                background: '#EA580C',
                color: 'white',
                fontWeight: 900,
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                borderRadius: 3,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.04)', background: '#F97316' },
                '&:active': { transform: 'scale(0.95)' },
              }}
            >
              🎲 ریختن تاس
            </Button>
          )}
        </Box>
      </Box>

      {doubling && doubling.offeredBy === myId && (
        <Typography variant="caption" sx={{ color: 'primary.main', mt: 1 }}>
          در انتظار پاسخ حریف به پیشنهاد دابل...
        </Typography>
      )}

      <Dialog open={!!(doubling && doubling.offeredBy !== myId && !disabled)} dir="rtl">
        <DialogTitle>پیشنهاد دابل</DialogTitle>
        <DialogContent>
          <DialogContentText>
            حریف پیشنهاد دوبرابر کردن امتیاز داده. اگر رد کنید بازی را با امتیاز فعلی می‌بازید.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onRespondDouble?.(false)} color="error">
            رد
          </Button>
          <Button onClick={() => onRespondDouble?.(true)} variant="contained" color="primary">
            پذیرش
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
