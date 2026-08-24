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
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Crown,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getTournamentDetailMessages } from '@/i18n/tournament-detail';
import { localizedAppRoute } from '@/i18n/routing';
import { getGameTitle, isWebGameId } from '@/lib/game-catalog';
import {
  type BracketMatch,
  fetchTournament,
  joinTournament,
  type TournamentDetail,
  type TournamentStatus,
} from '../../../lib/tournaments';

const STATUS_COLORS: Record<TournamentStatus, 'success' | 'warning' | 'default'> = {
  registration: 'success',
  in_progress: 'warning',
  completed: 'default',
};

function GameIcon({ game, size = 32 }: { game: string; size?: number }) {
  if (game === 'chess') {
    return (
      <Box component="span" sx={{ fontSize: size * 1.1, lineHeight: 1, userSelect: 'none' }} aria-hidden>
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
  const byKey = new Map(matches.map((m) => [`${m.round}:${m.slot}`, m] as const));
  const connectors: { path: string; isFinal: boolean }[] = [];

  for (const match of matches) {
    if (match.round <= 0 || maxSlots <= 0) continue;
    const childA = byKey.get(`${match.round - 1}:${match.slot * 2}`);
    const childB = byKey.get(`${match.round - 1}:${match.slot * 2 + 1}`);
    if (!childA || !childB) continue;

    const unitsAt = (round: number, slot: number) => slot * Math.pow(2, round) + Math.pow(2, round - 1);
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

function PlayerRow({
  name,
  isWinner,
  live,
  emptyLabel,
  liveLabel,
}: {
  name: string | null;
  isWinner: boolean;
  live: boolean;
  emptyLabel: string;
  liveLabel: string;
}) {
  const theme = useTheme();
  if (!name) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>
          {emptyLabel}
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
      <Typography noWrap variant="caption" sx={{ fontWeight: isWinner ? 700 : 500, color: isWinner ? '#10b981' : 'text.primary' }}>
        {name}
      </Typography>
      {isWinner && <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0, marginInlineStart: 'auto' }} />}
      {live && !isWinner && (
        <Stack direction="row" spacing={0.5} sx={{ marginInlineStart: 'auto', flexShrink: 0, alignItems: 'center' }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#fbbf24' }} />
          <Typography variant="caption" sx={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#fcd34d' }}>
            {liveLabel}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

function MatchCard({ match, emptyLabel, liveLabel }: { match: BracketMatch; emptyLabel: string; liveLabel: string }) {
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
      }}
    >
      {[match.playerA, match.playerB].map((name, index) => (
        <React.Fragment key={index}>
          {index === 1 && <Box sx={{ height: '1px', bgcolor: 'divider', mx: 1, opacity: 0.6 }} />}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minHeight: 0 }}>
            <PlayerRow
              name={name}
              isWinner={match.winnerId === name}
              live={isInProgress}
              emptyLabel={emptyLabel}
              liveLabel={liveLabel}
            />
            {match.score && (
              <Typography variant="caption" sx={{ fontWeight: 700, px: 1, color: 'text.disabled', display: { xs: 'none', sm: 'block' } }}>
                {match.score.split('–')[index]}
              </Typography>
            )}
          </Box>
        </React.Fragment>
      ))}
    </Paper>
  );
}

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const theme = useTheme();
  const locale = useAppLocale();
  const messages = getTournamentDetailMessages(locale);
  const tournamentsHref = localizedAppRoute(locale, 'tournaments');
  const loginHref = `/${locale}/login`;

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
      setTournament(await fetchTournament(params.id));
    } catch (e: any) {
      setError(e?.message || messages.loadError);
    } finally {
      setLoading(false);
    }
  }, [params.id, messages.loadError]);

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
          prev ? { ...prev, playersJoined: Math.min(prev.maxPlayers, prev.playersJoined + 1) } : prev,
        );
      }
    } catch (e: any) {
      setError(e?.message || messages.joinError);
    } finally {
      setJoining(false);
    }
  };

  const { maxSlots, gapPct, colW } = useBracketGeometry(tournament?.rounds ?? 0);
  const connectors = useMemo(
    () => tournament && tournament.rounds > 0
      ? buildConnectors(tournament.matches, tournament.rounds, maxSlots, gapPct, colW)
      : [],
    [tournament, maxSlots, gapPct, colW],
  );

  const matchesByRound = useMemo(() => {
    if (!tournament) return [];
    const groups: BracketMatch[][] = Array.from({ length: tournament.rounds }, () => []);
    for (const match of tournament.matches) {
      if (match.round >= 0 && match.round < groups.length) groups[match.round].push(match);
    }
    return groups;
  }, [tournament]);

  const champion = useMemo(() => {
    if (!tournament || tournament.rounds === 0) return null;
    const final = tournament.matches.find((match) => match.round === tournament.rounds - 1);
    return final?.status === 'completed' ? final.winnerId : null;
  }, [tournament]);

  const formatDate = useCallback((iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [locale]);

  const roundLabel = useCallback((round: number, rounds: number) => {
    const fromEnd = rounds - round;
    if (fromEnd === 1) return messages.rounds.final;
    if (fromEnd === 2) return messages.rounds.semifinals;
    if (fromEnd === 3) return messages.rounds.quarterfinals;
    return messages.rounds.round(round + 1);
  }, [messages.rounds]);

  if (loading) {
    return (
      <Box sx={{ flex: 1, bgcolor: 'background.default', display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error && !tournament) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 4 }}>{error}</Typography>
        <Button component={Link} href={tournamentsHref} variant="contained">{messages.backToTournaments}</Button>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <Swords size={40} style={{ color: theme.palette.text.disabled, margin: '0 auto' }} />
        <Typography variant="h5" sx={{ mt: 2, fontWeight: 800 }}>{messages.notFound}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 4 }}>{messages.notFoundHint}</Typography>
        <Button component={Link} href={tournamentsHref} variant="contained">{messages.backToTournaments}</Button>
      </Container>
    );
  }

  const statusLabel = tournament.status === 'registration'
    ? messages.status.registration
    : tournament.status === 'in_progress'
      ? messages.status.inProgress
      : messages.status.completed;
  const hasBracket = tournament.rounds > 0 && tournament.matches.length > 0;
  const gameTitle = isWebGameId(tournament.gameType) ? getGameTitle(tournament.gameType, locale) : tournament.gameType;

  return (
    <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Button component={Link} href={tournamentsHref} startIcon={<ChevronLeft size={16} />} sx={{ p: 0, mb: 4, color: 'text.secondary' }}>
          {messages.allTournaments}
        </Button>

        <Box component="header" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4, mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.3), bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.light', flexShrink: 0 }}>
              <GameIcon game={tournament.gameType} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{tournament.name}</Typography>
                <Chip label={statusLabel} size="small" color={STATUS_COLORS[tournament.status]} variant="outlined" />
              </Stack>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>{gameTitle}</Typography>
              <Stack direction="row" spacing={3} useFlexGap sx={{ mb: 1.5, color: 'text.secondary', flexWrap: 'wrap' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <CalendarDays size={16} style={{ opacity: 0.6 }} />
                  <Typography variant="body2">{formatDate(tournament.startsAt)}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Users size={16} style={{ opacity: 0.6 }} />
                  <Typography variant="body2">{messages.players(tournament.playersJoined, tournament.maxPlayers)}</Typography>
                </Stack>
                {tournament.prize && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Trophy size={16} style={{ color: '#fbbf24' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#fcd34d' }}>{tournament.prize}</Typography>
                  </Stack>
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
                {tournament.description || messages.fallbackDescription}
              </Typography>
            </Box>
          </Box>

          {tournament.status === 'registration' && (
            !user ? (
              <Button component={Link} href={loginHref} variant="contained" sx={{ px: 4, py: 1.5, fontWeight: 800 }}>
                {messages.signInToJoin}
              </Button>
            ) : (
              <Button
                onClick={() => void handleJoin()}
                disabled={joining || joined || tournament.playersJoined >= tournament.maxPlayers}
                variant="contained"
                sx={{ px: 4, py: 1.5, fontWeight: 800 }}
              >
                {joining ? <CircularProgress size={20} color="inherit" /> : joined ? messages.joined : tournament.playersJoined >= tournament.maxPlayers ? messages.full : messages.joinTournament}
              </Button>
            )
          )}
        </Box>

        {joinNote && <Alert severity="success" variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>{joinNote}</Alert>}
        {error && <Alert severity="error" variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}

        {champion && (
          <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 3, mb: 6, borderRadius: 4, border: '1px solid', borderColor: alpha('#fbbf24', 0.3), background: alpha('#F59E0B', 0.1) }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha('#f59e0b', 0.2), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={28} style={{ color: '#fbbf24' }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#f59e0b' }}>{messages.champion}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{champion}</Typography>
            </Box>
          </Paper>
        )}

        <Box component="section" aria-label={messages.ariaBracket}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{messages.bracket}</Typography>
            {hasBracket && (
              <Stack direction="row" spacing={2.5} useFlexGap sx={{ color: 'text.disabled', flexWrap: 'wrap' }}>
                <Typography variant="caption">✓ {messages.winner}</Typography>
                <Typography variant="caption">● {messages.live}</Typography>
                <Typography variant="caption">○ {messages.upcoming}</Typography>
              </Stack>
            )}
          </Box>

          {!hasBracket ? (
            <Paper variant="outlined" sx={{ p: 10, textAlign: 'center', borderRadius: 4, borderStyle: 'dashed', bgcolor: 'transparent' }}>
              <Trophy size={40} style={{ color: theme.palette.text.disabled, margin: '0 auto' }} />
              <Typography sx={{ mt: 2, fontWeight: 600, color: 'text.secondary' }}>
                {tournament.status === 'registration' ? messages.bracketNotGenerated : messages.noBracketData}
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                {tournament.status === 'registration' ? messages.bracketPendingHint : messages.bracketUnavailableHint}
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ overflowX: 'auto', pb: 4 }}>
              {/* Bracket geometry stays LTR so connector math is deterministic; labels remain localized. */}
              <Box sx={{ minWidth: 720, direction: 'ltr' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${tournament.rounds}, minmax(180px, 1fr))`, columnGap: `${gapPct}%`, mb: 3 }}>
                  {matchesByRound.map((_, round) => (
                    <Typography key={round} variant="caption" sx={{ textAlign: 'center', fontWeight: 800, textTransform: 'uppercase', color: 'text.disabled' }}>
                      {roundLabel(round, tournament.rounds)}
                    </Typography>
                  ))}
                </Box>

                <Box sx={{ position: 'relative' }}>
                  <Box component="svg" sx={{ pointerEvents: 'none', position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                    {connectors.map((connector, index) => (
                      <path
                        key={index}
                        d={connector.path}
                        fill="none"
                        strokeWidth={1.5}
                        vectorEffect="non-scaling-stroke"
                        style={{ stroke: connector.isFinal ? alpha(theme.palette.primary.light, 0.6) : alpha(theme.palette.divider, 0.4) }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${tournament.rounds}, minmax(180px, 1fr))`, gridAutoRows: '5rem', columnGap: `${gapPct}%` }}>
                    {matchesByRound.flatMap((roundMatches) => roundMatches.map((match) => {
                      const span = Math.pow(2, match.round);
                      return (
                        <Box key={match.id} sx={{ display: 'flex', alignItems: 'center', gridRow: `${match.slot * span + 1} / span ${span}` }}>
                          <MatchCard match={match} emptyLabel={messages.tbd} liveLabel={messages.live} />
                        </Box>
                      );
                    }))}
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
