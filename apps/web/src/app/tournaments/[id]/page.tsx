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
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
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
import EmptyState from '@/components/shared/EmptyState';
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
  const byKey = new Map(matches.map((match) => [`${match.round}:${match.slot}`, match] as const));
  const connectors: { path: string; isFinal: boolean }[] = [];

  for (const match of matches) {
    if (match.round <= 0 || maxSlots <= 0) continue;
    const childA = byKey.get(`${match.round - 1}:${match.slot * 2}`);
    const childB = byKey.get(`${match.round - 1}:${match.slot * 2 + 1}`);
    if (!childA || !childB) continue;

    const unitsAt = (round: number, slot: number) => slot * Math.pow(2, round) + Math.pow(2, round - 1);
    const yA = (unitsAt(match.round - 1, childA.slot) / maxSlots) * 100;
    const yB = (unitsAt(match.round - 1, childB.slot) / maxSlots) * 100;
    const yParent = (unitsAt(match.round, match.slot) / maxSlots) * 100;
    const childRightX = (match.round - 1) * (colW + gapPct) + colW;
    const parentLeftX = match.round * (colW + gapPct);
    const midX = parentLeftX - gapPct / 2;

    connectors.push({
      path: `M ${childRightX} ${yA} H ${midX} M ${childRightX} ${yB} H ${midX} M ${midX} ${yA} V ${yB} M ${midX} ${yParent} H ${parentLeftX}`,
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
      <Typography noWrap variant="caption" sx={{ fontWeight: isWinner ? 800 : 500, color: isWinner ? 'success.light' : 'text.primary' }}>
        {name}
      </Typography>
      {isWinner && <CheckCircle2 size={14} color={theme.palette.success.main} style={{ flexShrink: 0, marginInlineStart: 'auto' }} />}
      {live && !isWinner && (
        <Stack direction="row" spacing={0.5} sx={{ marginInlineStart: 'auto', flexShrink: 0, alignItems: 'center' }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main' }} />
          <Typography variant="caption" sx={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'warning.light' }}>
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
        borderColor: isCompleted
          ? alpha(theme.palette.success.main, 0.3)
          : isInProgress
            ? alpha(theme.palette.warning.main, 0.42)
            : 'divider',
        bgcolor: isCompleted
          ? alpha(theme.palette.success.main, 0.04)
          : isInProgress
            ? alpha(theme.palette.warning.main, 0.06)
            : alpha(theme.palette.background.paper, 0.48),
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
  const BackIcon = locale === 'fa' ? ArrowRight : ArrowLeft;
  const tournamentsHref = localizedAppRoute(locale, 'tournaments');
  const loginHref = localizedAppRoute(locale, 'login');

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
    } catch (err: any) {
      setError(err?.message || messages.loadError);
    } finally {
      setLoading(false);
    }
  }, [messages.loadError, params.id]);

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
        setTournament((previous) => previous
          ? { ...previous, playersJoined: Math.min(previous.maxPlayers, previous.playersJoined + 1) }
          : previous,
        );
      }
    } catch (err: any) {
      setError(err?.message || messages.joinError);
    } finally {
      setJoining(false);
    }
  };

  const { maxSlots, gapPct, colW } = useBracketGeometry(tournament?.rounds ?? 0);
  const connectors = useMemo(
    () => tournament && tournament.rounds > 0
      ? buildConnectors(tournament.matches, tournament.rounds, maxSlots, gapPct, colW)
      : [],
    [colW, gapPct, maxSlots, tournament],
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
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error && !tournament) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 8, sm: 10 }, textAlign: 'center' }}>
        <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>{error}</Alert>
        <Button component={Link} href={tournamentsHref} variant="contained">{messages.backToTournaments}</Button>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 8, sm: 10 } }}>
        <EmptyState
          icon={<Swords size={28} />}
          title={messages.notFound}
          description={messages.notFoundHint}
          actionLabel={messages.backToTournaments}
          onAction={() => { window.location.href = tournamentsHref; }}
        />
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
      <Container maxWidth="lg" sx={{ py: { xs: 5, sm: 7 } }}>
        <Button component={Link} href={tournamentsHref} startIcon={<BackIcon size={16} />} sx={{ mb: 4, color: 'text.secondary' }}>
          {messages.allTournaments}
        </Button>

        <Box
          component="header"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'flex-start' },
            justifyContent: 'space-between',
            gap: 4,
            mb: 6,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'flex-start' }, gap: 2.5, minWidth: 0 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                flexShrink: 0,
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.3),
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.light',
              }}
            >
              <GameIcon game={tournament.gameType} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, fontSize: { xs: '1.65rem', sm: '2rem' }, overflowWrap: 'anywhere' }}>
                  {tournament.name}
                </Typography>
                <Chip label={statusLabel} size="small" color={STATUS_COLORS[tournament.status]} variant="outlined" />
              </Stack>

              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>{gameTitle}</Typography>

              <Stack direction="row" spacing={2.5} useFlexGap sx={{ mb: 1.5, color: 'text.secondary', flexWrap: 'wrap' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <CalendarDays size={16} opacity={0.65} />
                  <Typography variant="body2">{formatDate(tournament.startsAt)}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Users size={16} opacity={0.65} />
                  <Typography variant="body2">{messages.players(tournament.playersJoined, tournament.maxPlayers)}</Typography>
                </Stack>
                {tournament.prize && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Trophy size={16} color={theme.palette.warning.main} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.light' }}>{tournament.prize}</Typography>
                  </Stack>
                )}
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640, lineHeight: 1.75 }}>
                {tournament.description || messages.fallbackDescription}
              </Typography>
            </Box>
          </Box>

          {tournament.status === 'registration' && (
            !user ? (
              <Button component={Link} href={loginHref} variant="contained" sx={{ alignSelf: { xs: 'stretch', md: 'flex-start' }, fontWeight: 900 }}>
                {messages.signInToJoin}
              </Button>
            ) : (
              <Button
                onClick={() => void handleJoin()}
                disabled={joining || joined || tournament.playersJoined >= tournament.maxPlayers}
                variant="contained"
                sx={{ alignSelf: { xs: 'stretch', md: 'flex-start' }, fontWeight: 900 }}
              >
                {joining
                  ? <CircularProgress size={20} color="inherit" />
                  : joined
                    ? messages.joined
                    : tournament.playersJoined >= tournament.maxPlayers
                      ? messages.full
                      : messages.joinTournament}
              </Button>
            )
          )}
        </Box>

        {joinNote && <Alert severity="success" variant="outlined" sx={{ mb: 4 }}>{joinNote}</Alert>}
        {error && <Alert severity="error" variant="outlined" sx={{ mb: 4 }}>{error}</Alert>}

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
              borderColor: alpha(theme.palette.warning.main, 0.3),
              bgcolor: alpha(theme.palette.warning.main, 0.08),
            }}
          >
            <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: '50%', bgcolor: alpha(theme.palette.warning.main, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={27} color={theme.palette.warning.main} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'warning.light' }}>{messages.champion}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, overflowWrap: 'anywhere' }}>{champion}</Typography>
            </Box>
          </Paper>
        )}

        <Box component="section" aria-label={messages.ariaBracket}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>{messages.bracket}</Typography>
            {hasBracket && (
              <Stack direction="row" spacing={2} useFlexGap sx={{ color: 'text.disabled', flexWrap: 'wrap' }}>
                <Typography variant="caption">✓ {messages.winner}</Typography>
                <Typography variant="caption">● {messages.live}</Typography>
                <Typography variant="caption">○ {messages.upcoming}</Typography>
              </Stack>
            )}
          </Box>

          {!hasBracket ? (
            <EmptyState
              compact
              icon={<Trophy size={24} />}
              title={tournament.status === 'registration' ? messages.bracketNotGenerated : messages.noBracketData}
              description={tournament.status === 'registration' ? messages.bracketPendingHint : messages.bracketUnavailableHint}
            />
          ) : (
            <Box sx={{ overflowX: 'auto', pb: 4, WebkitOverflowScrolling: 'touch' }}>
              {/* Bracket geometry stays LTR so connector math is deterministic; surrounding content remains localized. */}
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
