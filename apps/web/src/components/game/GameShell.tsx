'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  Paper,
  Typography,
  alpha,
  useTheme,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ArrowLeft,
  Copy,
  Check,
  Timer,
  Trophy,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useState } from 'react';

/**
 * GameShell — قاب مشترک صفحه بازی (بازسازی UI قبلی روی MUI).
 * هدر بازی، اسکوربورد مسابقه (best-of-N)، نوار راند و بنر برنده.
 * هم برای بازی محلی با ربات و هم برای چندنفره آنلاین استفاده می‌شود.
 */

export interface WinnerBanner {
  label: string;
  sub?: string;
  onRematch?: () => void;
}

export interface MatchScores {
  a: number;
  b: number;
}

interface Props {
  /** عنوان بازی (فارسی) */
  title: string;
  /** چیپ نام بازی، مثلاً «♞ شطرنج» */
  gameChip?: string;
  backHref?: string;
  onBack?: () => void;
  /** متن نوبت، مثلاً «نوبت شما» / «نوبت حریف» */
  turnText?: string | null;
  /** برچسب تایمر (ثانیه‌های باقی‌مانده) یا هشدار انقضا */
  timerLabel?: string | null;
  connStatus?: 'connected' | 'connecting' | 'reconnecting';
  /** کد اتاق (فقط آنلاین) */
  roomCode?: string | null;
  onCopyRoom?: () => void;
  copied?: boolean;
  /** اسکوربورد مسابقه */
  scores?: MatchScores | null;
  maxRounds?: number;
  roundNotice?: string | null;
  /** نوار تنظیمات (سطح ربات، حالت مسابقه…) — فقط ربات */
  settings?: React.ReactNode;
  /** بنر برنده (جایگزین برد می‌شود) */
  winner?: WinnerBanner | null;
  children: React.ReactNode;
}

export default function GameShell({
  title,
  gameChip,
  backHref = '/lobby',
  onBack,
  turnText,
  timerLabel,
  connStatus,
  roomCode,
  onCopyRoom,
  copied = false,
  scores,
  maxRounds = 1,
  roundNotice,
  settings,
  winner,
  children,
}: Props) {
  const theme = useTheme();
  const isMultiRound = maxRounds > 1 && scores !== null && scores !== undefined;

  const connChip =
    connStatus === 'connected'
      ? {
          label: 'متصل',
          Icon: Wifi,
          bgcolor: alpha(theme.palette.success.main, 0.1),
          color: theme.palette.success.light,
          borderColor: alpha(theme.palette.success.main, 0.3),
        }
      : {
          label: connStatus === 'reconnecting' ? 'در حال اتصال مجدد…' : 'در حال اتصال…',
          Icon: WifiOff,
          bgcolor: alpha(theme.palette.warning.main, 0.1),
          color: theme.palette.warning.light,
          borderColor: alpha(theme.palette.warning.main, 0.3),
        };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: { xs: 1.5, sm: 3 },
        bgcolor: 'background.default',
        color: 'text.primary',
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          maxWidth: 'md',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          textAlign: 'center',
          minWidth: 0,
        }}
      >
        {/* هدر */}
        <Box
          component="header"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.5,
            flexWrap: 'wrap',
          }}
        >
          <Button
            component={Link}
            href={backHref}
            onClick={onBack}
            startIcon={<ArrowLeft size={18} />}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
              textTransform: 'none',
              fontWeight: 600,
              minWidth: { xs: 'auto', sm: 64 },
              px: { xs: 1, sm: 2 },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
            }}
          >
            لابی
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 }, flexWrap: 'wrap', justifyContent: 'center' }}>
            {timerLabel && (
              <Chip
                icon={<Timer size={14} />}
                label={timerLabel}
                size="small"
                variant="outlined"
                sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.12),
                  color: theme.palette.warning.light,
                  borderColor: alpha(theme.palette.warning.main, 0.35),
                  fontWeight: 700,
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                }}
              />
            )}
            {roomCode && (
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  borderRadius: 10,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  px: 1.5,
                  py: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}
                >
                  اتاق
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em' }}
                >
                  {roomCode}
                </Typography>
                <Tooltip title={copied ? 'کپی شد!' : 'کپی کد اتاق'}>
                  <IconButton size="small" onClick={onCopyRoom} sx={{ color: copied ? 'success.main' : 'text.disabled', p: 0.25 }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </IconButton>
                </Tooltip>
              </Paper>
            )}
          </Box>
        </Box>

        {/* چیپ‌های وضعیت */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          {connStatus && (
            <Chip
              icon={<connChip.Icon size={14} />}
              label={connChip.label}
              size="small"
              variant="outlined"
              sx={{
                bgcolor: connChip.bgcolor,
                color: connChip.color,
                borderColor: connChip.borderColor,
                fontWeight: 700,
                fontSize: '0.7rem',
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
          )}
          {turnText && (
            <Chip
              label={turnText}
              size="small"
              sx={{
                fontSize: '0.72rem',
                fontWeight: 800,
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: theme.palette.success.light,
                border: '1px solid',
                borderColor: alpha(theme.palette.success.main, 0.3),
              }}
            />
          )}
          {gameChip && (
            <Chip
              label={gameChip}
              size="small"
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.light',
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.25),
              }}
            />
          )}
          <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, mr: 0.5 }}>
            {title}
          </Typography>
        </Box>

        {/* اسکوربورد مسابقه + نوار راند */}
        {(isMultiRound || roundNotice) && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            {isMultiRound && (
              <Chip
                icon={<Trophy size={14} />}
                label={`مسابقه ${scores.a} - ${scores.b}`}
                size="small"
                title={`بهترین از ${maxRounds} — اولی به ${Math.ceil(maxRounds / 2)}`}
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.warning.main, 0.12),
                  color: '#fbbf24',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.warning.main, 0.3),
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            )}
            {roundNotice && (
              <Chip
                label={roundNotice}
                size="small"
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.success.main, 0.15),
                  color: 'success.light',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.success.main, 0.3),
                }}
              />
            )}
          </Box>
        )}

        {/* تنظیمات (ربات) */}
        {settings && <Box sx={{ display: 'flex', justifyContent: 'center' }}>{settings}</Box>}

        {/* برد یا بنر برنده */}
        {winner ? (
          <Paper
            elevation={8}
            sx={{
              p: 3.5,
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 4,
              boxShadow: `0 8px 32px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {winner.label}
            </Typography>
            {winner.sub && (
              <Typography variant="body2" sx={{ fontWeight: 500, color: alpha('#fff', 0.85) }}>
                {winner.sub}
              </Typography>
            )}
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              {winner.onRematch && (
                <Button
                  variant="contained"
                  onClick={winner.onRematch}
                  sx={{
                    bgcolor: 'success.main',
                    color: 'white',
                    fontWeight: 700,
                    '&:hover': { bgcolor: 'success.dark' },
                  }}
                >
                  بازی دوباره
                </Button>
              )}
              <Button
                component={Link}
                href={backHref}
                variant="contained"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontWeight: 700,
                  '&:hover': { bgcolor: alpha('#fff', 0.9) },
                }}
              >
                بازگشت به لابی
              </Button>
            </Box>
          </Paper>
        ) : (
          children
        )}

        {/* تعداد بازیکنان اتاق (صبر برای حریف) */}
        {roomCode && !children && (
          <Chip
            icon={<Users size={16} />}
            label="در انتظار حریف… کد اتاق را به اشتراک بگذارید"
            variant="outlined"
            sx={{ alignSelf: 'center', borderColor: 'divider', bgcolor: 'background.paper' }}
          />
        )}
      </Box>
    </Box>
  );
}
