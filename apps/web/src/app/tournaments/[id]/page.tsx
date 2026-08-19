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
  Alert,
  CircularProgress,
  IconButton,
  alpha,
  useTheme,
  Grid,
} from '@mui/material';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Crown,
  Loader2,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  BracketMatch,
  fetchTournament,
  joinTournament,
  TournamentDetail,
  TournamentStatus,
} from '../../../lib/tournaments';

const FALLBACK_DESCRIPTION =
  'Single-elimination knockout. Winners advance, one player takes it all.';

/* ------------------------------- helpers --------------------------------- */

const STATUS_COLORS: Record<TournamentStatus, { color: 'success' | 'warning' | 'default'; label: string }> = {
  registration: { color: 'success', label: 'Registration Open' },
  in_progress: { color: 'warning', label: 'In Progress' },
  completed: { color: 'default', label: 'Completed' },
};

function GameIcon({ game, size = 32 }: { game: string; size?: number }) {
  if (game === 'chess') {
    return (
      <Box
        component="span"
        sx={{
          fontSize: size * 1.1,
          lineHeight: 1,
          userSelect: 'none',
        }}
        aria-hidden
      >
        ♞
      </Box>
    );
  }
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2.2,
        strokeLinecap: 'round',
      }}
      aria-hidden
    >
      <path d="M3 8h18M3 16h18M8 3v18M16 3v18" />
    </Box>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function roundLabel(round: number, rounds: number): string {
  const fromEnd = rounds - round; // 1 = final
  if (fromEnd === 1) return 'Final';
  if (fromEnd === 2) return 'Semifinals';
  if (fromEnd === 3) return 'Quarterfinals';
  return `Round ${round + 1}`;
}

/**
 * Bracket geometry: an 8-player knockout becomes a grid with 4 implicit rows
 * of 5rem each. A match in round `r` at slot `s` spans 2^r rows and is
 * vertically centred, which naturally forms the tree. Connector lines are
 * drawn with an overlay SVG using percentage coordinates that mirror the
 * grid geometry exactly (columns split the width minus a 3% gutter).
 */
function useBracketGeometry(rounds: number) {
  return useMemo(() => {
    if (rounds <= 0) return { maxSlots: 0, gapPct: 3, colW: 0 };
    const maxSlots = Math.pow(2, rounds - 1);
    const gapPct = 3;
    const colW = (100 - (rounds - 1) * gapPct) / rounds;
    return { maxSlots, gapPct, colW };
  }, [rounds]);
}

function buildConnectors(
  matches: BracketMatch[],
  rounds: number,
  maxSlots: number,
  gapPct: number,
  colW: number,
): { path: string; isFinal: boolean }[] {
  const byKey = new Map(
    matches.map((m) => [`${m.round}:${m.slot}`, m] as const),
  );
  const connectors: { path: string; isFinal: boolean }[] = [];

  for (const match of matches) {
    if (match.round <= 0) continue;

    const childA = byKey.get(`${match.round - 1}:${match.slot * 2}`);
    const childB = byKey.get(`${match.round - 1}:${match.slot * 2 + 1}`);
    if (!childA || !childB) continue;

    const unitsAt = (round: number, slot: number) =>
      slot * Math.pow(2, round) + Math.pow(2, round - 1);
    const yA = (unitsAt(match.round - 1, childA.slot) / maxSlots) * 100;
    const yB = (unitsAt(match.round - 1, childB.slot) / maxSlots) * 100;
    const yP = (unitsAt(match.round, match.slot) / maxSlots) * 100;

    const childRightX = (match.round - 1) * (colW + gapPct) + colW;
    const parentLeftX = match.round * (colW + gapPct);
    const midX = parentLeftX - gapPct / 2;

    connectors.push({
      path: `M ${childRightX} ${yA} H ${midX} M ${childRightX} ${yB} H ${midX} M ${midX} ${yA} V ${yB} M ${midX} ${yP} H ${parentLeftX}`,
      isFinal: match.round === rounds - 1,
    });
  }

  return connectors;
}

/* --------------------------- match card bits ----------------------------- */

function PlayerRow({
  name,
  isWinner,
  live,
}: {
  name: string | null;
  isWinner: boolean;
  live: boolean;
}) {
  const theme = useTheme();
  if (!name) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>
          TBD
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, minWidth: 0, flex: 1 }}>
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.text.primary, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 800,
          color: 'text.secondary',
          flexShrink: 0,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Box>
      <Typography
        noWrap
        variant="caption"
        sx={{
          fontWeight: isWinner ? 700 : 500,
          color: isWinner ? '#10b981' : 'text.primary',
        }}
      >
        {name}
      </Typography>
      {isWinner && <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0, marginLeft: 'auto' }} />}
      {live && !isWinner && (
        <Stack direction="row" spacing={0.5} sx={{ ml: 'auto', flexShrink: 0, alignItems: 'center' }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: '#fbbf24',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#fcd34d' }}
          >
            Live
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

function MatchCard({ match }: { match: BracketMatch }) {
  const theme = useTheme();
  const isCompleted = match.status === 'completed';
  const isInProgress = match.status === 'in_progress';

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: 64,
        width: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isCompleted
          ? alpha(theme.palette.success.main, 0.3)
          : isInProgress
            ? alpha(theme.palette.warning.main, 0.5)
            : 'divider',
        bgcolor: isCompleted
          ? alpha(theme.palette.success.main, 0.04)
          : isInProgress
            ? alpha(theme.palette.warning.main, 0.05)
            : alpha(theme.palette.background.paper, 0.5),
        boxShadow: isInProgress ? `0 4px 20px ${alpha(theme.palette.warning.main, 0.1)}` : 'none',
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minHeight: 0 }}>
        <PlayerRow
          name={match.playerA}
          isWinner={match.winnerId === match.playerA}
          live={isInProgress}
        />
        {match.score && (
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, px: 1, color: 'text.disabled', display: { xs: 'none', sm: 'block' } }}
          >
            {match.score.split('–')[0]}
          </Typography>
        )}
      </Box>
      <Box sx={{ height: '1px', bgcolor: 'divider', mx: 1, opacity: 0.6 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minHeight: 0 }}>
        <PlayerRow
          name={match.playerB}
          isWinner={match.winnerId === match.playerB}
          live={isInProgress}
        />
        {match.score && (
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, px: 1, color: 'text.disabled', display: { xs: 'none', sm: 'block' } }}
          >
            {match.score.split('–')[1]}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

/* --------------------------------- page ---------------------------------- */

export default function TournamentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useAuth();
  const theme = useTheme();
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [joinNote, setJoinNote] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTournament(params.id);
      setTournament(data);
    } catch (e: any) {
      setError(e?.message || 'Could not load this tournament.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleJoin = async () => {
    if (!tournament || tournament.status !== 'registration' || joined || !user) return;
    setJoining(true);
    try {
      const result = await joinTournament(tournament.id, user.id);
      setJoined(result.joined);
      setJoinNote(result.message);
      if (result.joined) {
        setTournament((prev) =>
          prev
            ? {
                ...prev,
                playersJoined: Math.min(prev.maxPlayers, prev.playersJoined + 1),
              }
            : prev,
        );
      }
    } catch (e: any) {
      setError(e?.message || 'Could not join the tournament.');
    } finally {
      setJoining(false);
    }
  };

  const { maxSlots, gapPct, colW } = useBracketGeometry(tournament?.rounds ?? 0);
  const connectors = useMemo(
    () =>
      tournament && tournament.rounds > 0
        ? buildConnectors(
            tournament.matches,
            tournament.rounds,
            maxSlots,
            gapPct,
            colW,
          )
        : [],
    [tournament, maxSlots, gapPct, colW],
  );

  const matchesByRound = useMemo(() => {
    if (!tournament) return [];
    const groups: BracketMatch[][] = Array.from(
      { length: tournament.rounds },
      () => [],
    );
    for (const m of tournament.matches) {
      if (m.round >= 0 && m.round < groups.length) groups[m.round].push(m);
    }
    return groups;
  }, [tournament]);

  const champion = useMemo(() => {
    if (!tournament || tournament.rounds === 0) return null;
    const final = tournament.matches.find(
      (m) => m.round === tournament.rounds - 1,
    );
    if (!final || final.status !== 'completed' || !final.winnerId) return null;
    return final.winnerId;
  }, [tournament]);

  if (loading) {
    return (
      <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={40} />
        </Box>
      </Box>
    );
  }

  if (error && !tournament) {
    return (
      <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 4 }}>{error}</Typography>
          <Button
            component={Link}
            href="/tournaments"
            variant="contained"
            sx={{ background: '#F5A306' }}
          >
            Back to Tournaments
          </Button>
        </Container>
      </Box>
    );
  }

  if (!tournament) {
    return (
      <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
          <Swords size={40} style={{ color: theme.palette.text.disabled, margin: '0 auto' }} />
          <Typography variant="h5" sx={{ mt: 2, fontWeight: 800 }}>Tournament not found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            The tournament you are looking for does not exist.
          </Typography>
          <Button
            component={Link}
            href="/tournaments"
            variant="contained"
            sx={{ background: '#F5A306' }}
          >
            Back to Tournaments
          </Button>
        </Container>
      </Box>
    );
  }

  const statusInfo = STATUS_COLORS[tournament.status];
  const hasBracket = tournament.rounds > 0 && tournament.matches.length > 0;

  return (
    <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Back link */}
        <Button
          component={Link}
          href="/tournaments"
          startIcon={<ChevronLeft size={16} />}
          sx={{
            p: 0,
            mb: 4,
            color: 'text.secondary',
            textTransform: 'none',
            fontSize: '0.875rem',
            '&:hover': { color: 'text.primary', bgcolor: 'transparent' },
          }}
        >
          All tournaments
        </Button>

        {/* Header */}
        <Box
          component="header"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 4,
            mb: 6,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.3),
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.light',
                flexShrink: 0,
              }}
            >
              <GameIcon game={tournament.gameType} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.025em' }}>
                  {tournament.name}
                </Typography>
                <Chip
                  label={statusInfo.label}
                  size="small"
                  color={statusInfo.color}
                  variant="outlined"
                  icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', ml: 1 }} />}
                  sx={{
                    height: 24,
                    fontWeight: 700,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    '& .MuiChip-icon': { ml: 0.5, mr: 0 },
                  }}
                />
              </Box>
              <Stack
                direction="row"
                spacing={3}
                useFlexGap
                sx={{ mb: 1.5, color: 'text.secondary', flexWrap: 'wrap' }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <CalendarDays size={16} style={{ opacity: 0.6 }} />
                  <Typography variant="body2">{formatDate(tournament.startsAt)}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Users size={16} style={{ opacity: 0.6 }} />
                  <Typography variant="body2">{tournament.playersJoined}/{tournament.maxPlayers} players</Typography>
                </Stack>
                {tournament.prize && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Trophy size={16} style={{ color: '#fbbf24' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#fcd34d' }}>{tournament.prize}</Typography>
                  </Stack>
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
                {tournament.description || FALLBACK_DESCRIPTION}
              </Typography>
            </Box>
          </Box>

          {/* Join action */}
          {tournament.status === 'registration' && (
            <Box>
              {!user ? (
                <Button
                  component={Link}
                  href="/login"
                  variant="contained"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontWeight: 800,
                    borderRadius: 3,
                    background: '#F5A306',
                    boxShadow: `0 8px 20px ${alpha('#B25D16', 0.4)}`,
                  }}
                >
                  Sign in to join
                </Button>
              ) : (
                <Button
                  onClick={() => void handleJoin()}
                  disabled={joining || joined || tournament.playersJoined >= tournament.maxPlayers}
                  variant="contained"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontWeight: 800,
                    borderRadius: 3,
                    background: '#F5A306',
                    boxShadow: `0 8px 20px ${alpha('#B25D16', 0.4)}`,
                  }}
                >
                  {joining ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : joined ? (
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <CheckCircle2 size={18} />
                      <span>Joined</span>
                    </Stack>
                  ) : tournament.playersJoined >= tournament.maxPlayers ? (
                    'Full'
                  ) : (
                    'Join Tournament'
                  )}
                </Button>
              )}
            </Box>
          )}
        </Box>

        {joinNote && (
          <Alert severity="success" variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
            {joinNote}
          </Alert>
        )}

        {/* Champion banner */}
        {champion && (
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              p: 3,
              mb: 6,
              borderRadius: 4,
              border: '1px solid',
              borderColor: alpha('#fbbf24', 0.3),
              background: alpha('#F59E0B', 0.1),
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: alpha('#f59e0b', 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Crown size={28} style={{ color: '#fbbf24' }} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#f59e0b', opacity: 0.8 }}
              >
                Champion
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{champion}</Typography>
            </Box>
          </Paper>
        )}

        {/* Bracket */}
        <Box component="section" aria-label="Tournament bracket">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Bracket</Typography>
            {hasBracket && (
              <Stack direction="row" spacing={2.5} useFlexGap sx={{ color: 'text.disabled', fontSize: '11px', flexWrap: 'wrap' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                  <Typography variant="inherit" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Winner</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#fbbf24', animation: 'pulse 2s infinite' }} />
                  <Typography variant="inherit" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Live</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: alpha(theme.palette.text.secondary, 0.4) }} />
                  <Typography variant="inherit" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Upcoming</Typography>
                </Stack>
              </Stack>
            )}
          </Box>

          {!hasBracket ? (
            <Paper
              variant="outlined"
              sx={{
                p: 10,
                textAlign: 'center',
                borderRadius: 4,
                borderStyle: 'dashed',
                bgcolor: 'transparent',
              }}
            >
              <Trophy size={40} style={{ color: theme.palette.text.disabled, margin: '0 auto' }} />
              <Typography sx={{ mt: 2, fontWeight: 600, color: 'text.secondary' }}>
                {tournament.status === 'registration'
                  ? 'Bracket not generated yet'
                  : 'No bracket data'}
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                {tournament.status === 'registration'
                  ? 'The bracket is built automatically once registration closes.'
                  : 'Results for this tournament are unavailable.'}
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ overflowX: 'auto', pb: 4 }}>
              <Box sx={{ minWidth: 720 }}>
                {/* Round labels */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${tournament.rounds}, minmax(180px, 1fr))`,
                    columnGap: `${gapPct}%`,
                    mb: 3,
                  }}
                >
                  {matchesByRound.map((_, r) => (
                    <Typography
                      key={r}
                      variant="caption"
                      sx={{
                        textAlign: 'center',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'text.disabled',
                      }}
                    >
                      {roundLabel(r, tournament.rounds)}
                    </Typography>
                  ))}
                </Box>

                {/* Bracket area */}
                <Box sx={{ position: 'relative' }}>
                  <Box
                    component="svg"
                    sx={{
                      pointerEvents: 'none',
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                    }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    {connectors.map((c, i) => (
                      <path
                        key={i}
                        d={c.path}
                        fill="none"
                        strokeWidth={1.5}
                        vectorEffect="non-scaling-stroke"
                        style={{
                          stroke: c.isFinal ? alpha(theme.palette.primary.light, 0.6) : alpha(theme.palette.divider, 0.4),
                        }}
                      />
                    ))}
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${tournament.rounds}, minmax(180px, 1fr))`,
                      gridAutoRows: '5rem',
                      columnGap: `${gapPct}%`,
                    }}
                  >
                    {matchesByRound.flatMap((roundMatches, r) =>
                      roundMatches.map((m) => {
                        const span = Math.pow(2, m.round);
                        return (
                          <Box
                            key={m.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gridRow: `${m.slot * span + 1} / span ${span}`,
                            }}
                          >
                            <MatchCard match={m} />
                          </Box>
                        );
                      }),
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
