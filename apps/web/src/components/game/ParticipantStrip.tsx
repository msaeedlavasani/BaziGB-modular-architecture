'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { layoutContract } from '@/design-system/layout-contract';
import { Crown, Eye, WifiOff } from 'lucide-react';

export interface RoomParticipant {
  id: string;
  name: string;
  role: 'creator' | 'player' | 'spectator';
  connection: 'connected' | 'reconnecting';
}

interface ParticipantStripProps {
  participants: RoomParticipant[];
  currentTurnId?: string | null;
  myId?: string | null;
  labels: {
    title: string;
    you: string;
    creator: string;
    player: string;
    spectator: string;
    reconnecting: (name: string) => string;
    reconnectingShort: string;
  };
}

function initial(name: string): string {
  return name.trim().slice(0, 1).toLocaleUpperCase() || '؟';
}

/** Compact room-presence surface; identity and connection never compete with the board. */
export default function ParticipantStrip({ participants, currentTurnId, myId, labels }: ParticipantStripProps) {
  const theme = useTheme();

  return (
    <Paper
      component="section"
      aria-label={labels.title}
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: layoutContract.game.supportInlineSize,
        mx: 'auto',
        px: { xs: 1, sm: 1.5 },
        py: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: alpha(theme.palette.background.paper, 0.42),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      {participants.map((participant) => {
        const isMe = participant.id === myId;
        const isTurn = participant.id === currentTurnId;
        const roleLabel = participant.role === 'creator'
          ? labels.creator
          : participant.role === 'spectator'
            ? labels.spectator
            : labels.player;
        const connectionLabel = participant.connection === 'reconnecting'
          ? labels.reconnecting(participant.name)
          : undefined;

        return (
          <Tooltip key={participant.id} title={connectionLabel ?? roleLabel}>
            <Box
              sx={{
                minWidth: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1,
                py: 0.5,
                borderRadius: 999,
                border: '1px solid',
                borderColor: isTurn ? alpha(theme.palette.primary.main, 0.65) : 'transparent',
                bgcolor: isTurn ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  bgcolor: isMe ? 'primary.main' : alpha(theme.palette.text.primary, 0.12),
                  color: isMe ? 'primary.contrastText' : 'text.secondary',
                  opacity: participant.connection === 'reconnecting' ? 0.55 : 1,
                }}
              >
                {initial(participant.name)}
              </Avatar>
              <Box sx={{ minWidth: 0, textAlign: 'start' }}>
                <Typography variant="caption" sx={{ display: 'block', maxWidth: 112, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isTurn ? 900 : 700 }}>
                  {isMe ? labels.you : participant.name}
                </Typography>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.35, color: participant.connection === 'reconnecting' ? 'warning.main' : 'text.disabled', fontSize: '0.64rem', lineHeight: 1.2 }}>
                  {participant.connection === 'reconnecting' ? <WifiOff size={10} /> : participant.role === 'creator' ? <Crown size={10} /> : participant.role === 'spectator' ? <Eye size={10} /> : null}
                  {participant.connection === 'reconnecting' ? labels.reconnectingShort : roleLabel}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        );
      })}
    </Paper>
  );
}
