'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Bot,
  Check,
  Copy,
  Gamepad2,
  History,
  Play,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import type { GameId } from '@bazigb/engine';
import { createRoom, fetchRooms, type Room } from '../../lib/rooms';
import { useAuth } from '@/hooks/useAuth';
import { useAppLocale } from '@/hooks/useAppLocale';
import { api } from '@/lib/api';
import { getMessages } from '@/i18n/messages';
import { localizedGameRoute, localizedPlayRoute } from '@/i18n/routing';
import {
  WEB_GAME_IDS,
  getGameCatalogEntry,
  getGameTitle,
  isWebGameId,
} from '@/lib/game-catalog';
import EmptyState from '@/components/shared/EmptyState';
import GameCard from '@/components/shared/GameCard';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';

const REFRESH_INTERVAL_MS = 5000;

interface HistoryMatch {
  id: string;
  winnerId: string | null;
  roomId: string;
  gameName: string;
  players: string;
  data: string;
  createdAt: string;
}

function normalizeGameName(name: string): GameId | null {
  const key = name.trim().toLowerCase();
  if (isWebGameId(key)) return key;
  const cleaned = key.replace(/[^a-z0-9]+/g, '-');
  return isWebGameId(cleaned) ? cleaned : null;
}

function GameIcon({ game, size = 24 }: { game: string; size?: number }) {
  if (game === 'chess') {
    return (
      <Box component="span" sx={{ fontSize: size, lineHeight: 1, userSelect: 'none' }} aria-hidden>
        ♞
      </Box>
    );
  }
  if (game === 'backgammon') {
    return (
      <Box component="span" sx={{ fontSize: size, lineHeight: 1, userSelect: 'none' }} aria-hidden>
        🎲
      </Box>
    );
  }
  if (game === 'vegas') return <Banknote size={size} aria-hidden />;

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

export default function LobbyPage() {
  const router = useRouter();
  const theme = useTheme();
  const locale = useAppLocale();
  const messages = getMessages(locale);
  const dateLocale = locale === 'fa' ? 'fa-IR' : 'en-US';
  const JoinArrow = locale === 'fa' ? ArrowLeft : ArrowRight;
  const { user } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [mode, setMode] = useState<'online' | 'bot'>('online');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameId>('tic-tac-toe');
  const [maxRounds, setMaxRounds] = useState<1 | 3 | 5>(1);
  const [recentMatches, setRecentMatches] = useState<HistoryMatch[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

  const statusLabel = useCallback(
    (status: Room['status']) => {
      if (status === 'waiting') return messages.lobby.waiting;
      if (status === 'playing') return messages.lobby.inProgress;
      return messages.lobby.finished;
    },
    [messages],
  );

  const recentResult = useCallback(
    (match: HistoryMatch, userId: string): { label: string; color: 'success' | 'error' | 'warning' } => {
      if (match.winnerId === null) return { label: messages.lobby.draw, color: 'warning' };
      return match.winnerId === userId
        ? { label: messages.lobby.win, color: 'success' }
        : { label: messages.lobby.loss, color: 'error' };
    },
    [messages],
  );

  const matchPointOptions: { value: 1 | 3 | 5; label: string }[] = [
    { value: 1, label: messages.lobby.singleGame },
    { value: 3, label: messages.lobby.bestOf3 },
    { value: 5, label: messages.lobby.bestOf5 },
  ];

  const loadRecent = useCallback(async () => {
    if (!user) return;
    setRecentLoading(true);
    setRecentError(null);
    try {
      const data = await api.get<{ userId: string; history: HistoryMatch[] }>(`/history/${user.id}`);
      setRecentMatches(data.history);
    } catch (err: any) {
      setRecentError(err?.message || messages.lobby.recentLoadError);
    } finally {
      setRecentLoading(false);
    }
  }, [messages.lobby.recentLoadError, user]);

  useEffect(() => {
    if (user) void loadRecent();
  }, [user, loadRecent]);

  const recentGames = useMemo(() => {
    const seen = new Set<GameId>();
    const output: { match: HistoryMatch; game: GameId }[] = [];
    for (const match of recentMatches) {
      const game = normalizeGameName(match.gameName);
      if (!game || seen.has(game)) continue;
      seen.add(game);
      output.push({ match, game });
      if (output.length >= 4) break;
    }
    return output;
  }, [recentMatches]);

  const loadRooms = useCallback(async () => {
    try {
      setRooms(await fetchRooms());
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err?.message || messages.lobby.loadRoomsError);
    } finally {
      setLoading(false);
    }
  }, [messages.lobby.loadRoomsError]);

  useEffect(() => {
    void loadRooms();
    const timer = setInterval(() => void loadRooms(), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadRooms]);

  const handleCreate = async () => {
    if (mode === 'bot') {
      router.push(localizedGameRoute(locale, gameType));
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const room = await createRoom(gameType, maxRounds);
      router.push(localizedPlayRoute(locale, room.code));
    } catch (err: any) {
      setCreateError(err?.message || messages.lobby.createError);
      setCreating(false);
    }
  };

  const handleJoinByCode = (event: React.FormEvent) => {
    event.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) {
      setJoinError(messages.lobby.enterRoomCode);
      return;
    }
    router.push(localizedPlayRoute(locale, code));
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      // Clipboard availability should not alter room state.
    }
  };

  const activeRooms = useMemo(
    () => rooms
      .filter((room) => room.status !== 'finished')
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'waiting' ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [rooms],
  );

  return (
    <Box sx={{ flex: 1, bgcolor: 'background.default', color: 'text.primary', px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 6 } }}>
      <Box sx={{ mx: 'auto', width: '100%', maxWidth: 'lg', display: 'flex', flexDirection: 'column', gap: { xs: 6, md: 8 } }}>
        <Box component="header" sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto' }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              color: 'primary.main',
              fontSize: { xs: '2rem', sm: '2.75rem' },
              letterSpacing: '-0.02em',
            }}
          >
            {messages.lobby.title}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1.5, color: 'text.secondary', lineHeight: 1.8 }}>
            {messages.lobby.subtitle}
          </Typography>
        </Box>

        {user && (
          <Box component="section" aria-label={messages.lobby.recentlyPlayed} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                <History size={22} color={theme.palette.primary.main} />
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {messages.lobby.recentlyPlayed}
                </Typography>
              </Box>
              <Tooltip title={messages.lobby.refreshRecent}>
                <span>
                  <IconButton
                    onClick={() => void loadRecent()}
                    disabled={recentLoading}
                    aria-label={messages.lobby.refreshRecent}
                    sx={{ color: 'text.secondary' }}
                  >
                    <RefreshCw size={18} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            {recentError ? (
              <Alert severity="error" variant="outlined" action={<Button color="inherit" size="small" onClick={() => void loadRecent()}>{messages.common.retry}</Button>}>
                {recentError}
              </Alert>
            ) : recentLoading ? (
              <LoadingSkeleton />
            ) : recentGames.length === 0 ? (
              <EmptyState compact icon={<History size={24} />} title={messages.lobby.noRecentGames} />
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 3 }}>
                {recentGames.map(({ match, game }) => {
                  const result = recentResult(match, user.id);
                  return (
                    <Paper
                      key={match.id}
                      elevation={0}
                      sx={{
                        minWidth: 0,
                        p: 3,
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5,
                        transition: 'border-color 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                          transform: 'translateY(-2px)',
                        },
                        '@media (prefers-reduced-motion: reduce)': {
                          transition: 'none',
                          '&:hover': { transform: 'none' },
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                        <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                          <GameIcon game={game} size={24} />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 900 }}>
                            {getGameTitle(game, locale)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {new Date(match.createdAt).toLocaleDateString(dateLocale)}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip label={result.label} color={result.color} size="small" variant="outlined" sx={{ alignSelf: 'flex-start', fontWeight: 800 }} />
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        startIcon={<Play size={16} />}
                        onClick={() => router.push(localizedGameRoute(locale, game))}
                        sx={{ mt: 'auto', fontWeight: 800 }}
                      >
                        {messages.lobby.playAgain}
                      </Button>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                p: { xs: 3, sm: 4 },
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.background.paper, 0.55),
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <Box>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900 }}>
                  {messages.lobby.chooseGame}
                </Typography>
                <Box sx={{ mt: 2.5, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                  {WEB_GAME_IDS.map((type) => (
                    <GameCard
                      key={type}
                      title={getGameTitle(type, locale)}
                      icon={<GameIcon game={type} size={28} />}
                      selected={gameType === type}
                      onClick={() => setGameType(type)}
                    />
                  ))}
                </Box>
              </Box>

              {(gameType === 'backgammon' || gameType === 'tic-tac-toe') && (
                <FormControl fullWidth>
                  <InputLabel id="match-points-label">{messages.lobby.matchPoints}</InputLabel>
                  <Select
                    labelId="match-points-label"
                    label={messages.lobby.matchPoints}
                    value={maxRounds}
                    onChange={(event) => setMaxRounds(event.target.value as 1 | 3 | 5)}
                  >
                    {matchPointOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {([
                  { value: 'online' as const, icon: <Users size={20} />, label: messages.lobby.onlineOpponent },
                  { value: 'bot' as const, icon: <Bot size={20} />, label: messages.lobby.practiceBot },
                ]).map((option) => {
                  const selected = mode === option.value;
                  return (
                    <ButtonBase
                      key={option.value}
                      onClick={() => setMode(option.value)}
                      aria-pressed={selected}
                      sx={{
                        minHeight: 64,
                        px: 3,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: selected ? 'primary.main' : 'divider',
                        bgcolor: selected ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.background.default, 0.2),
                        color: selected ? 'primary.main' : 'text.secondary',
                        '&:focus-visible': { outline: `3px solid ${alpha(theme.palette.primary.main, 0.35)}`, outlineOffset: 2 },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                        {option.icon}
                        <Typography variant="button" sx={{ fontWeight: 800 }}>{option.label}</Typography>
                      </Box>
                    </ButtonBase>
                  );
                })}
              </Box>

              {createError && <Alert severity="error" variant="outlined">{createError}</Alert>}

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => void handleCreate()}
                disabled={creating}
                startIcon={mode === 'bot' ? <Bot size={22} /> : <Plus size={22} />}
                sx={{ mt: 'auto', py: 1.5, fontWeight: 900 }}
              >
                {mode === 'bot' ? messages.lobby.startSolo : messages.lobby.createRoom}
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper
              component="form"
              onSubmit={handleJoinByCode}
              elevation={0}
              sx={{
                height: '100%',
                p: { xs: 3, sm: 4 },
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.background.paper, 0.55),
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <Box>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900 }}>
                  {messages.lobby.joinWithCode}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.8 }}>
                  {messages.lobby.joinDescription}
                </Typography>
              </Box>

              <TextField
                fullWidth
                value={codeInput}
                placeholder="ABCDE"
                inputProps={{ maxLength: 8, dir: 'ltr', 'aria-label': messages.lobby.enterRoomCode }}
                onChange={(event) => {
                  setCodeInput(event.target.value.toUpperCase());
                  setJoinError(null);
                }}
                sx={{
                  mt: 'auto',
                  '& input': {
                    fontFamily: 'monospace',
                    fontWeight: 900,
                    fontSize: '1.35rem',
                    letterSpacing: '0.22em',
                    textAlign: 'center',
                  },
                }}
              />

              {joinError && <Alert severity="error" variant="outlined">{joinError}</Alert>}

              <Button
                type="submit"
                variant="outlined"
                size="large"
                disabled={!codeInput.trim()}
                endIcon={<JoinArrow size={20} />}
                sx={{ fontWeight: 800 }}
              >
                {messages.lobby.enter}
              </Button>
            </Paper>
          </Grid>
        </Grid>

        <Box component="section" aria-label={messages.lobby.activeRooms} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Gamepad2 size={22} color={theme.palette.primary.main} />
              <Typography variant="h5" sx={{ fontWeight: 900 }}>{messages.lobby.activeRooms}</Typography>
            </Box>
            <Button size="small" onClick={() => void loadRooms()} startIcon={<RefreshCw size={17} />} sx={{ color: 'text.secondary', fontWeight: 800 }}>
              {messages.lobby.refreshList}
            </Button>
          </Box>

          {loadError && (
            <Alert severity="error" variant="outlined" action={<Button color="inherit" size="small" onClick={() => void loadRooms()}>{messages.common.retry}</Button>}>
              {loadError}
            </Alert>
          )}

          {loading ? (
            <LoadingSkeleton count={3} height={96} columns={{ xs: 1, sm: 1, md: 1 }} />
          ) : activeRooms.length === 0 ? (
            <EmptyState compact icon={<Gamepad2 size={24} />} title={messages.lobby.noActiveRooms} />
          ) : (
            <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activeRooms.map((room) => {
                const roomGameId = isWebGameId(room.gameType) ? room.gameType : 'tic-tac-toe';
                const roomGame = getGameCatalogEntry(roomGameId);
                const waiting = room.status === 'waiting';

                return (
                  <Paper
                    key={room.id}
                    component="li"
                    elevation={0}
                    sx={{
                      minWidth: 0,
                      p: { xs: 2.5, sm: 3 },
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: alpha(theme.palette.background.paper, 0.45),
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      gap: 2.5,
                      transition: 'border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.4) },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.1em', color: 'primary.main', direction: 'ltr' }}>
                          {room.code}
                        </Typography>
                        <Tooltip title={copiedCode === room.code ? messages.lobby.copied : messages.lobby.copyCode}>
                          <IconButton size="small" onClick={() => void handleCopy(room.code)} aria-label={messages.lobby.copyCode}>
                            {copiedCode === room.code ? <Check size={16} color={theme.palette.success.main} /> : <Copy size={16} />}
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip icon={<GameIcon game={roomGameId} size={16} />} label={getGameTitle(roomGameId, locale)} size="small" variant="outlined" />
                        <Chip label={statusLabel(room.status)} size="small" color={waiting ? 'success' : 'warning'} variant="outlined" />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                          <Users size={15} />
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {messages.lobby.playersShort(room.players.length, roomGame.maxPlayers)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Button
                      variant={waiting ? 'contained' : 'outlined'}
                      onClick={() => router.push(localizedPlayRoute(locale, room.code))}
                      disabled={!waiting}
                      sx={{ flexShrink: 0, minWidth: 112, fontWeight: 800 }}
                    >
                      {waiting ? messages.lobby.enter : messages.lobby.inProgress}
                    </Button>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
