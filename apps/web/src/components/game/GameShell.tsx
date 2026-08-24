'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
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
        minWidth: 0,
        display: 'flex',
        justifyContent: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
        px: { xs: 2, sm: 4 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 'lg',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2, sm: 2.5 },
        }}
      >
        <Box
          component="header"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            minWidth: 0,
          }}
        >
          <Button
            component={Link}
            href={backHref}
            onClick={onBack}
            startIcon={<BackIcon size={18} />}
            sx={{
              flexShrink: 0,
              color: 'text.secondary',
              textTransform: 'none',
              fontWeight: 700,
              px: { xs: 1, sm: 2 },
              '&:hover': { color: 'text.primary', bgcolor: alpha(theme.palette.text.primary, 0.04) },
              '& .MuiButton-startIcon': {
                marginInlineEnd: { xs: 0.5, sm: 1 },
                marginInlineStart: 0,
              },
            }}
          >
            {messages.lobby}
          </Button>

          <Box
            sx={{
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            {timerLabel && (
              <Chip
                icon={<Timer size={14} />}
                label={timerLabel}
                size="small"
                variant="outlined"
                sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.light,
                  borderColor: alpha(theme.palette.warning.main, 0.3),
                  fontWeight: 700,
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            )}

            {roomCode && (
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  minWidth: 0,
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
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                  }}
                >
                  {messages.room}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.08em', direction: 'ltr' }}
                >
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

        <Box sx={{ textAlign: 'center', minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              color: 'text.primary',
              fontWeight: 900,
              lineHeight: 1.25,
              fontSize: { xs: '1.45rem', sm: '2rem' },
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              mt: 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
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
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            )}
            {turnText && (
              <Chip
                label={turnText}
                size="small"
                sx={{
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
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.light',
                  borderColor: alpha(theme.palette.primary.main, 0.25),
                }}
              />
            )}
            {isMultiRound && (
              <Chip
                icon={<Trophy size={14} />}
                label={messages.matchScore(scores.a, scores.b)}
                size="small"
                title={messages.bestOf(maxRounds, Math.ceil(maxRounds / 2))}
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.light,
                  borderColor: alpha(theme.palette.warning.main, 0.3),
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            )}
            {roundNotice && (
              <Chip
                label={roundNotice}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.light,
                  borderColor: alpha(theme.palette.success.main, 0.3),
                }}
              />
            )}
          </Box>
        </Box>

        {settings && (
          <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
            {settings}
          </Box>
        )}

        {winner ? (
          <Paper
            elevation={0}
            role="status"
            sx={{
              alignSelf: 'center',
              width: '100%',
              maxWidth: 680,
              p: { xs: 3, sm: 4 },
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'text.primary',
              borderRadius: 4,
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.4),
              boxShadow: `0 12px 36px ${alpha(theme.palette.primary.main, 0.12)}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.light' }}>
              {winner.label}
            </Typography>
            {winner.sub && (
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                {winner.sub}
              </Typography>
            )}
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              {winner.onRematch && (
                <Button variant="contained" onClick={winner.onRematch} sx={{ fontWeight: 800 }}>
                  {messages.rematch}
                </Button>
              )}
              <Button component={Link} href={backHref} variant="outlined" sx={{ fontWeight: 800 }}>
                {messages.backToLobby}
              </Button>
            </Box>
          </Paper>
        ) : (
          <Box
            component="main"
            sx={{
              width: '100%',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {children}
          </Box>
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
