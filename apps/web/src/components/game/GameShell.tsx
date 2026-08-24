'use client';

import React from 'react';
import Link from 'next/link';
import { useState } from 'react';
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
  ArrowRight,
  Copy,
  Check,
  Timer,
  Trophy,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getGameShellMessages } from '@/i18n/game-shell';

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
  title: string;
  gameChip?: string;
  backHref?: string;
  onBack?: () => void;
  turnText?: string | null;
  timerLabel?: string | null;
  connStatus?: 'connected' | 'connecting' | 'reconnecting';
  roomCode?: string | null;
  onCopyRoom?: () => void;
  copied?: boolean;
  scores?: MatchScores | null;
  maxRounds?: number;
  roundNotice?: string | null;
  settings?: React.ReactNode;
  winner?: WinnerBanner | null;
  children: React.ReactNode;
}

/** Shared game shell for both local/bot and realtime multiplayer game routes. */
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
  const locale = useAppLocale();
  const messages = getGameShellMessages(locale);
  const BackIcon = locale === 'fa' ? ArrowRight : ArrowLeft;
  const isMultiRound = maxRounds > 1 && scores !== null && scores !== undefined;

  const connChip =
    connStatus === 'connected'
      ? {
          label: messages.connected,
          Icon: Wifi,
          bgcolor: alpha(theme.palette.success.main, 0.1),
          color: theme.palette.success.light,
          borderColor: alpha(theme.palette.success.main, 0.3),
        }
      : {
          label: connStatus === 'reconnecting' ? messages.reconnecting : messages.connecting,
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
        <Box
          component="header"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Button
            component={Link}
            href={backHref}
            onClick={onBack}
            startIcon={<BackIcon size={18} />}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
              textTransform: 'none',
              fontWeight: 700,
              minWidth: { xs: 'auto', sm: 72 },
              px: { xs: 1, sm: 2 },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              '& .MuiButton-startIcon': {
                marginInlineEnd: { xs: 0.5, sm: 1 },
                marginInlineStart: 0,
              },
            }}
          >
            {messages.lobby}
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
                  bgcolor: alpha(theme.palette.background.paper, 0.72),
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
                  {messages.room}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.08em' }}>
                  {roomCode}
                </Typography>
                <Tooltip title={copied ? messages.copied : messages.copyRoomCode}>
                  <IconButton
                    size="small"
                    onClick={onCopyRoom}
                    aria-label={copied ? messages.copied : messages.copyRoomCode}
                    sx={{ color: copied ? 'success.main' : 'text.secondary', p: 0.25 }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </IconButton>
                </Tooltip>
              </Paper>
            )}
          </Box>
        </Box>

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
          <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, marginInlineStart: 0.5 }}>
            {title}
          </Typography>
        </Box>

        {(isMultiRound || roundNotice) && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            {isMultiRound && (
              <Chip
                icon={<Trophy size={14} />}
                label={messages.matchScore(scores.a, scores.b)}
                size="small"
                title={messages.bestOf(maxRounds, Math.ceil(maxRounds / 2))}
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.warning.main, 0.12),
                  color: theme.palette.warning.light,
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

        {settings && <Box sx={{ display: 'flex', justifyContent: 'center' }}>{settings}</Box>}

        {winner ? (
          <Paper
            elevation={8}
            sx={{
              p: { xs: 3, sm: 3.5 },
              bgcolor: 'primary.main',
              color: 'secondary.main',
              borderRadius: 4,
              boxShadow: `0 8px 32px 0 ${alpha(theme.palette.primary.main, 0.28)}`,
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
              <Typography variant="body2" sx={{ fontWeight: 600, color: alpha(theme.palette.secondary.main, 0.78) }}>
                {winner.sub}
              </Typography>
            )}
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              {winner.onRematch && (
                <Button
                  variant="contained"
                  onClick={winner.onRematch}
                  sx={{ bgcolor: 'secondary.main', color: 'text.primary', fontWeight: 800 }}
                >
                  {messages.rematch}
                </Button>
              )}
              <Button
                component={Link}
                href={backHref}
                variant="outlined"
                sx={{ borderColor: 'secondary.main', color: 'secondary.main', fontWeight: 800 }}
              >
                {messages.backToLobby}
              </Button>
            </Box>
          </Paper>
        ) : (
          children
        )}

        {roomCode && !children && (
          <Chip
            icon={<Users size={16} />}
            label={messages.waitingForOpponent}
            variant="outlined"
            sx={{ alignSelf: 'center', borderColor: 'divider', bgcolor: 'background.paper' }}
          />
        )}
      </Box>
    </Box>
  );
}
