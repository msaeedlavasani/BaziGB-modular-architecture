'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CalendarDays,
  CheckCircle2,
  Crown,
  RefreshCw,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getMessages } from '@/i18n/messages';
import { localizedAppRoute, localizedTournamentRoute } from '@/i18n/routing';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import {
  fetchTournaments,
  joinTournament,
  type JoinResult,
  type Tournament,
  type TournamentStatus,
} from '../../lib/tournaments';

const STATUS_COLORS: Record<TournamentStatus, 'success' | 'warning' | 'default'> = {
  registration: 'success',
  in_progress: 'warning',
  completed: 'default',
};

function GameIcon({ game, size = 20 }: { game: string; size?: number }) {
  if (game === 'chess') {
    return (
      <Box component="span" sx={{ fontSize: size * 1.15, lineHeight: 1, userSelect: 'none' }} aria-hidden>
        ♞
      </Box>
    );
  }

  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' }}
      aria-hidden
    >
      <path d="M3 8h18M3 16h18M8 3v18M16 3v18" />
    </Box>
  );
}

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Filter = 'all' | TournamentStatus;

export default function TournamentsPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const locale = useAppLocale();
  const messages = getMessages(locale);
  const dateLocale = locale === 'fa' ? 'fa-IR' : 'en-US';
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [joined, setJoined] = useState<Record<string, JoinResult>>({});
  const [joining, setJoining] = useState<string | null>(null);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: messages.tournaments.filterAll },
    { key: 'registration', label: messages.tournaments.filterOpen },
    { key: 'in_progress', label: messages.tournaments.inProgress },
    { key: 'completed', label: messages.tournaments.completed },
  ];

  const statusLabel = (status: TournamentStatus): string => {
    if (status === 'registration') return messages.tournaments.registrationOpen;
    if (status === 'in_progress') return messages.tournaments.inProgress;
    return messages.tournaments.completed;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTournaments(await fetchTournaments());
    } catch (err: any) {
      setError(err?.message || messages.tournaments.loadError);
    } finally {
      setLoading(false);
    }
  }, [messages.tournaments.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => (filter === 'all' ? tournaments : tournaments.filter((tournament) => tournament.status === filter)),
    [filter, tournaments],
  );

  const handleJoin = async (tournament: Tournament) => {
    if (tournament.status !== 'registration' || joined[tournament.id]?.joined || !user) return;

    setJoining(tournament.id);
    try {
      const result = await joinTournament(tournament.id, user.id);
      setJoined((previous) => ({ ...previous, [tournament.id]: result }));
      if (result.joined) {
        setTournaments((previous) => previous.map((item) =>
          item.id === tournament.id
            ? { ...item, playersJoined: Math.min(item.maxPlayers, item.playersJoined + 1) }
            : item,
        ));
      }
    } catch (err: any) {
      setError(err?.message || messages.tournaments.joinError);
    } finally {
      setJoining(null);
    }
  };

  const openCount = tournaments.filter((tournament) => tournament.status === 'registration').length;

  return (
    <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
      <Container maxWidth="md" sx={{ py: { xs: 5, sm: 8 } }}>
        <Box
          component="header"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 2,
            mb: 4,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Swords size={30} color={theme.palette.primary.main} />
              {messages.tournaments.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
              {openCount > 0 ? messages.tournaments.openSummary(openCount) : messages.tournaments.emptySummary}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={() => void load()}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshCw size={16} />}
            sx={{ borderColor: 'divider', color: 'text.secondary' }}
          >
            {messages.common.refresh}
          </Button>
        </Box>

        <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 4, flexWrap: 'wrap' }}>
          {filters.map((item) => {
            const selected = filter === item.key;
            return (
              <Button
                key={item.key}
                size="small"
                variant={selected ? 'contained' : 'outlined'}
                onClick={() => setFilter(item.key)}
                aria-pressed={selected}
                sx={{
                  borderRadius: 2.5,
                  px: 2.5,
                  fontWeight: 800,
                  ...(!selected && { color: 'text.secondary', borderColor: 'divider' }),
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>

        {error && (
          <Alert
            severity="error"
            variant="outlined"
            sx={{ mb: 4, borderRadius: 3 }}
            action={<Button color="inherit" size="small" onClick={() => void load()}>{messages.common.retry}</Button>}
          >
            {error}
          </Alert>
        )}

        <Box component="section" aria-label={messages.tournaments.title}>
          {loading ? (
            <LoadingSkeleton count={4} height={236} columns={{ xs: 1, sm: 2, md: 2 }} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<Trophy size={28} />}
              title={messages.tournaments.noTournaments}
              description={messages.tournaments.noTournamentsHint}
              actionLabel={messages.common.refresh}
              onAction={() => void load()}
            />
          ) : (
            <Grid container spacing={2.5}>
              {visible.map((tournament) => {
                const isJoined = Boolean(joined[tournament.id]?.joined);
                const joinResult = joined[tournament.id];
                const full = tournament.playersJoined >= tournament.maxPlayers;
                const progress = Math.min(100, (tournament.playersJoined / tournament.maxPlayers) * 100);

                return (
                  <Grid key={tournament.id} xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.background.paper, 0.56),
                        transition: 'border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.38) },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            flexShrink: 0,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: alpha(theme.palette.primary.main, 0.28),
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'primary.main',
                          }}
                        >
                          <GameIcon game={tournament.gameType} size={tournament.gameType === 'chess' ? 28 : 24} />
                        </Box>
                        <Chip
                          label={statusLabel(tournament.status)}
                          size="small"
                          color={STATUS_COLORS[tournament.status]}
                          variant="outlined"
                          sx={{ fontWeight: 800 }}
                        />
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.25, mb: 1 }}>
                        {tournament.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2.5,
                          lineHeight: 1.7,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {tournament.description || messages.tournaments.fallbackDescription}
                      </Typography>

                      <Stack spacing={1.25} sx={{ mb: 2.5 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <CalendarDays size={16} color={theme.palette.text.disabled} />
                          <Typography variant="body2" color="text.secondary">
                            {messages.tournaments.starts(formatDate(tournament.startsAt, dateLocale))}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Users size={16} color={theme.palette.text.disabled} />
                          <Typography variant="body2" color="text.secondary">
                            {messages.tournaments.players(tournament.playersJoined, tournament.maxPlayers)}
                          </Typography>
                        </Stack>
                        {tournament.prize && (
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Crown size={16} color={theme.palette.warning.main} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.light' }}>
                              {tournament.prize}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>

                      <Box sx={{ mt: 'auto', mb: 3 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          aria-label={messages.tournaments.players(tournament.playersJoined, tournament.maxPlayers)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.text.primary, 0.1),
                            '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'primary.main' },
                          }}
                        />
                      </Box>

                      {tournament.status === 'registration' && isJoined ? (
                        <Box
                          sx={{
                            p: 1.25,
                            textAlign: 'center',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: alpha(theme.palette.success.main, 0.35),
                            bgcolor: alpha(theme.palette.success.main, 0.08),
                            color: 'success.light',
                          }}
                        >
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={16} />
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{messages.tournaments.joined}</Typography>
                          </Stack>
                          {joinResult?.message && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                              {joinResult.message}
                            </Typography>
                          )}
                        </Box>
                      ) : tournament.status === 'registration' ? (
                        !user ? (
                          <Button
                            fullWidth
                            component={Link}
                            href={localizedAppRoute(locale, 'login')}
                            variant="contained"
                            sx={{ py: 1.25, fontWeight: 900 }}
                          >
                            {messages.tournaments.signInToJoin}
                          </Button>
                        ) : (
                          <Button
                            fullWidth
                            disabled={full || joining === tournament.id}
                            onClick={() => void handleJoin(tournament)}
                            variant="contained"
                            sx={{ py: 1.25, fontWeight: 900 }}
                          >
                            {joining === tournament.id
                              ? <CircularProgress size={18} color="inherit" />
                              : full
                                ? messages.tournaments.full
                                : messages.tournaments.join}
                          </Button>
                        )
                      ) : (
                        <Button
                          fullWidth
                          component={Link}
                          href={localizedTournamentRoute(locale, tournament.id)}
                          variant="outlined"
                          sx={{ py: 1.25, fontWeight: 800, borderColor: 'divider', color: 'text.secondary' }}
                        >
                          {tournament.status === 'in_progress'
                            ? messages.tournaments.viewBracket
                            : messages.tournaments.viewResults}
                        </Button>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </Container>
    </Box>
  );
}
