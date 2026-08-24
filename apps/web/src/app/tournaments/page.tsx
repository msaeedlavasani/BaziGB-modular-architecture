'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Button,
  Container,
  Stack,
  Paper,
  Chip,
  LinearProgress,
  Skeleton,
  Alert,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CalendarDays,
  CheckCircle2,
  Crown,
  Loader2,
  RefreshCw,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getMessages } from '@/i18n/messages';
import {
  fetchTournaments,
  joinTournament,
  JoinResult,
  Tournament,
  TournamentStatus,
} from '../../lib/tournaments';

const STATUS_COLORS: Record<TournamentStatus, 'success' | 'warning' | 'default'> = {
  registration: 'success',
  in_progress: 'warning',
  completed: 'default',
};

function GameIcon({ game, size = 20 }: { game: string; size?: number }) {
  if (game === 'chess') {
    return (
      <Box component="span" sx={{ fontSize: size * 1.2, lineHeight: 1, userSelect: 'none' }} aria-hidden>
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
      const data = await fetchTournaments();
      setTournaments(data);
    } catch (e: any) {
      setError(e?.message || messages.tournaments.loadError);
    } finally {
      setLoading(false);
    }
  }, [messages.tournaments.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => (filter === 'all' ? tournaments : tournaments.filter((t) => t.status === filter)),
    [tournaments, filter],
  );

  const handleJoin = async (t: Tournament) => {
    if (t.status !== 'registration' || joined[t.id]?.joined || !user) return;
    setJoining(t.id);
    try {
      const result = await joinTournament(t.id, user.id);
      setJoined((prev) => ({ ...prev, [t.id]: result }));
      if (result.joined) {
        setTournaments((prev) =>
          prev.map((x) =>
            x.id === t.id ? { ...x, playersJoined: Math.min(x.maxPlayers, x.playersJoined + 1) } : x,
          ),
        );
      }
    } catch (e: any) {
      setError(e?.message || messages.tournaments.joinError);
    } finally {
      setJoining(null);
    }
  };

  const openCount = tournaments.filter((t) => t.status === 'registration').length;

  return (
    <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}
            >
              <Swords size={32} style={{ color: theme.palette.primary.light }} />
              {messages.tournaments.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {openCount > 0 ? messages.tournaments.openSummary(openCount) : messages.tournaments.emptySummary}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => void load()}
            disabled={loading}
            startIcon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            sx={{
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'text.primary',
                color: 'text.primary',
                bgcolor: alpha(theme.palette.text.primary, 0.05),
              },
            }}
          >
            {messages.common.refresh}
          </Button>
        </Box>

        <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 4, flexWrap: 'wrap' }}>
          {filters.map((f) => (
            <Button
              key={f.key}
              size="small"
              variant={filter === f.key ? 'contained' : 'outlined'}
              onClick={() => setFilter(f.key)}
              sx={{
                borderRadius: 2,
                px: 2,
                fontWeight: 700,
                ...(filter === f.key
                  ? {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                      color: 'primary.light',
                      border: '1px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.3) },
                    }
                  : {
                      color: 'text.secondary',
                      borderColor: 'divider',
                      '&:hover': { borderColor: 'text.disabled', color: 'text.primary' },
                    }),
              }}
            >
              {f.label}
            </Button>
          ))}
        </Stack>

        {error && (
          <Alert severity="error" variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="section">
          {loading ? (
            <Grid container spacing={2}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid key={i} xs={12} sm={6}>
                  <Skeleton
                    variant="rectangular"
                    height={224}
                    sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.6) }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : visible.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 8, textAlign: 'center', borderRadius: 4, borderStyle: 'dashed', bgcolor: 'transparent' }}
            >
              <Trophy size={40} style={{ color: theme.palette.text.disabled, margin: '0 auto' }} />
              <Typography sx={{ mt: 2, fontWeight: 600, color: 'text.secondary' }}>
                {messages.tournaments.noTournaments}
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                {messages.tournaments.noTournamentsHint}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2.5}>
              {visible.map((t) => {
                const isJoined = Boolean(joined[t.id]?.joined);
                const joinResult = joined[t.id];
                const full = t.playersJoined >= t.maxPlayers;
                const progress = Math.min(100, (t.playersJoined / t.maxPlayers) * 100);

                return (
                  <Grid key={t.id} xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: alpha(theme.palette.background.paper, 0.6),
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                          boxShadow: `0 8px 30px ${alpha(theme.palette.common.black, 0.3)}`,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'primary.light',
                          }}
                        >
                          <GameIcon game={t.gameType} size={t.gameType === 'chess' ? 28 : 24} />
                        </Box>
                        <Chip
                          label={statusLabel(t.status)}
                          size="small"
                          color={STATUS_COLORS[t.status]}
                          variant="outlined"
                          icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', ms: 1 }} />}
                          sx={{
                            height: 24,
                            fontWeight: 700,
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            '& .MuiChip-icon': { ms: 0.5, me: 0 },
                          }}
                        />
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 1 }}>
                        {t.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {t.description || messages.tournaments.fallbackDescription}
                      </Typography>

                      <Stack spacing={1} sx={{ mb: 2.5 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <CalendarDays size={16} style={{ color: theme.palette.text.disabled }} />
                          <Typography variant="body2" color="text.secondary">
                            {messages.tournaments.starts(formatDate(t.startsAt, dateLocale))}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Users size={16} style={{ color: theme.palette.text.disabled }} />
                          <Typography variant="body2" color="text.secondary">
                            {messages.tournaments.players(t.playersJoined, t.maxPlayers)}
                          </Typography>
                        </Stack>
                        {t.prize && (
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Crown size={16} style={{ color: '#fbbf24' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#fcd34d' }}>
                              {t.prize}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>

                      <Box sx={{ mt: 'auto', mb: 3 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.text.primary, 0.1),
                            '& .MuiLinearProgress-bar': { borderRadius: 3, background: '#F5A306' },
                          }}
                        />
                      </Box>

                      <Box>
                        {t.status === 'registration' && isJoined ? (
                          <Box
                            sx={{
                              p: 1.25,
                              textAlign: 'center',
                              borderRadius: 3,
                              border: '1px solid',
                              borderColor: alpha(theme.palette.success.main, 0.4),
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              color: 'success.light',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                            }}
                          >
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                              <CheckCircle2 size={16} />
                              <span>{messages.tournaments.joined}</span>
                            </Stack>
                            {joinResult?.message && (
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.25, fontWeight: 400, opacity: 0.8 }}>
                                {joinResult.message}
                              </Typography>
                            )}
                          </Box>
                        ) : t.status === 'registration' ? (
                          !user ? (
                            <Button
                              fullWidth
                              component={Link}
                              href="/login"
                              variant="contained"
                              sx={{
                                py: 1.25,
                                fontWeight: 800,
                                background: '#F5A306',
                                boxShadow: `0 4px 14px 0 ${alpha('#B25D16', 0.4)}`,
                              }}
                            >
                              {messages.tournaments.signInToJoin}
                            </Button>
                          ) : (
                            <Button
                              fullWidth
                              disabled={full || joining === t.id}
                              onClick={() => void handleJoin(t)}
                              variant="contained"
                              sx={{
                                py: 1.25,
                                fontWeight: 800,
                                background: '#F5A306',
                                boxShadow: `0 4px 14px 0 ${alpha('#B25D16', 0.4)}`,
                              }}
                            >
                              {joining === t.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : full ? (
                                messages.tournaments.full
                              ) : (
                                messages.tournaments.join
                              )}
                            </Button>
                          )
                        ) : (
                          <Button
                            fullWidth
                            component={Link}
                            href={`/tournaments/${t.id}`}
                            variant="outlined"
                            sx={{
                              py: 1.25,
                              fontWeight: 800,
                              borderColor: 'divider',
                              color: 'text.secondary',
                              '&:hover': {
                                borderColor: alpha(theme.palette.primary.main, 0.5),
                                color: 'text.primary',
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                              },
                            }}
                          >
                            {t.status === 'in_progress'
                              ? messages.tournaments.viewBracket
                              : messages.tournaments.viewResults}
                          </Button>
                        )}
                      </Box>
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
