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
import StatusCluster from '@/components/shared/StatusCluster';
import StatusPill from '@/components/shared/StatusPill';
import { gameSurfaceTrack, layoutContract } from '@/design-system/layout-contract';

export interface WinnerBanner {
  label: string;
  sub?: string;
  onRematch?: () => void;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export interface MatchScores {
  a: number;
  b: number;
}

interface Props {
  title: string;
  surfaceRatio?: number;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  turnText?: string | null;
  timerLabel?: string | null;
  connStatus?: 'connected' | 'connecting' | 'reconnecting';
  roomCode?: string | null;
  onCopyRoom?: () => void;
  copied?: boolean;
  scores?: MatchScores | null;
  maxRounds?: number;
  scoreTitle?: string;
  roundNotice?: string | null;
  settings?: React.ReactNode;
  settingsPresentation?: 'responsive' | 'collapsed';
  winner?: WinnerBanner | null;
  children: React.ReactNode;
}

/** Shared game shell for both local/bot and realtime multiplayer game routes. */
export default function GameShell({
  title,
  surfaceRatio,
  backHref = '/lobby',
  backLabel,
  onBack,
  turnText,
  timerLabel,
  connStatus,
  roomCode,
  onCopyRoom,
  copied = false,
  scores,
  maxRounds = 1,
  scoreTitle,
  roundNotice,
  settings,
  settingsPresentation = 'responsive',
  winner,
  children,
}: Props) {
  const theme = useTheme();
  const locale = useAppLocale();
  const messages = getGameShellMessages(locale);
  const BackIcon = locale === 'fa' ? ArrowRight : ArrowLeft;
  const isMultiRound = maxRounds > 1 && scores !== null && scores !== undefined;
  const surfaceInlineSize = gameSurfaceTrack(surfaceRatio);

  const connChip =
    connStatus === 'connected'
      ? {
          label: messages.connected,
          Icon: Wifi,
        }
      : {
          label: connStatus === 'reconnecting' ? messages.reconnecting : messages.connecting,
          Icon: WifiOff,
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
        px: layoutContract.game.shellInlineGutter,
        py: layoutContract.game.shellBlockPadding,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 'lg',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: layoutContract.game.shellGap,
          '@media (orientation: landscape) and (max-height: 36rem)': {
            display: 'grid',
            gridTemplateColumns: 'minmax(12rem, 0.7fr) minmax(0, 1fr)',
            gridTemplateRows: 'auto auto 1fr',
            gridTemplateAreas: `
              "shellNav shellNav"
              "shellTitle shellSurface"
              "shellSettings shellSurface"
            `,
            gap: 0.75,
            alignItems: 'start',
          },
        }}
      >
        <Box
          component="header"
          sx={{
            gridArea: 'shellNav',
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
            onClick={(event) => {
              if (!onBack) return;
              event.preventDefault();
              onBack();
            }}
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
            {backLabel ?? messages.lobby}
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

        <Box sx={{ gridArea: 'shellTitle', textAlign: 'center', minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              color: 'text.primary',
              fontWeight: 900,
              lineHeight: 1.25,
              fontSize: layoutContract.game.titleSize,
              '@media (orientation: landscape) and (max-height: 36rem)': {
                fontSize: '1.25rem',
              },
            }}
          >
            {title}
          </Typography>

          <StatusCluster sx={{ mt: { xs: 0.75, sm: 1.25 } }}>
            {connStatus && (
              <StatusPill
                icon={<connChip.Icon />}
                label={connChip.label}
                tone={connStatus === 'connected' ? 'success' : 'warning'}
              />
            )}
            {turnText && (
              <StatusPill
                label={turnText}
                tone="success"
              />
            )}
            {isMultiRound && (
              <StatusPill
                icon={<Trophy />}
                label={messages.matchScore(scores.a, scores.b)}
                title={scoreTitle ?? messages.bestOf(maxRounds, Math.ceil(maxRounds / 2))}
                tone="warning"
              />
            )}
            {roundNotice && (
              <StatusPill
                label={roundNotice}
                tone="success"
              />
            )}
          </StatusCluster>
        </Box>

        {settings && settingsPresentation === 'collapsed' && (
          <Paper
            component="details"
            elevation={0}
            sx={{
              gridArea: 'shellSettings',
              width: '100%',
              maxWidth: surfaceInlineSize,
              alignSelf: 'center',
              minWidth: 0,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.background.paper, 0.32),
              '& > summary': { cursor: 'pointer', listStylePosition: 'inside', px: 1.5, py: 1, fontWeight: 800 },
              '&[open] > summary': { borderBottom: '1px solid', borderBottomColor: 'divider' },
              '& > div': { p: 1.25 },
            }}
          >
            <Typography component="summary" variant="body2">{messages.settings}</Typography>
            <Box>{settings}</Box>
          </Paper>
        )}

        {settings && settingsPresentation === 'responsive' && (
          <Paper
            component="details"
            elevation={0}
            sx={{
              gridArea: 'shellSettings',
              display: { xs: 'block', sm: 'none' },
              width: '100%',
              minWidth: 0,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.background.paper, 0.42),
              '& > summary': { cursor: 'pointer', listStylePosition: 'inside', px: 1.5, py: 1, fontWeight: 800 },
              '&[open] > summary': { borderBottom: '1px solid', borderBottomColor: 'divider' },
              '& > div': { p: 1.25 },
            }}
          >
            <Typography component="summary" variant="body2">{messages.settings}</Typography>
            <Box>{settings}</Box>
          </Paper>
        )}

        {settings && settingsPresentation === 'responsive' && (
          <Paper
            elevation={0}
            sx={{
              gridArea: 'shellSettings',
              display: { xs: 'none', sm: 'block' },
              alignSelf: 'center',
              width: '100%',
              maxWidth: surfaceInlineSize,
              minWidth: 0,
              p: { xs: 1.5, sm: 2 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.background.paper, 0.42),
            }}
          >
            {settings}
          </Paper>
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
                  {winner.actionLabel ?? messages.rematch}
                </Button>
              )}
              <Button component={Link} href={backHref} variant="outlined" sx={{ fontWeight: 800 }}>
                {backLabel ?? messages.backToLobby}
              </Button>
              {winner.secondaryHref && winner.secondaryLabel && (
                <Button component={Link} href={winner.secondaryHref} variant="text" sx={{ fontWeight: 800 }}>
                  {winner.secondaryLabel}
                </Button>
              )}
            </Box>
          </Paper>
        ) : (
          <Box
            component="main"
            sx={{
              gridArea: 'shellSurface',
              width: '100%',
              maxWidth: surfaceInlineSize,
              alignSelf: 'center',
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
