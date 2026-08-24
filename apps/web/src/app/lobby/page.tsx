'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Copy,
  Gamepad2,
  Plus,
  RefreshCw,
  Users,
  Bot,
  Banknote,
  Check,
  History,
  Play,
} from 'lucide-react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  Grid,
  ButtonBase,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
} from '@mui/material';
import type { GameId } from '@bazigb/engine';
import { createRoom, fetchRooms, Room } from '../../lib/rooms';
import { honeyBronze } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useAppLocale } from '@/hooks/useAppLocale';
import { api } from '@/lib/api';
import { getMessages } from '@/i18n/messages';
import { gameRoute, playRoute } from '@/i18n/routing';
import {
  GAME_CATALOG,
  WEB_GAME_IDS,
  getGameCatalogEntry,
  getGameTitle,
  isWebGameId,
} from '@/lib/game-catalog';

const REFRESH_INTERVAL_MS = 5000;

/** History row returned by GET /history/:userId. */
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

function GameIcon({ game, sx }: { game: string; sx?: any }) {
  if (game === 'chess') {
    return (
      <Box component="span" sx={{ fontSize: '1.5rem', lineHeight: 1, userSelect: 'none', ...sx }} aria-hidden>
        ♞
      </Box>
    );
  }
  if (game === 'backgammon') {
    return (
      <Box component="span" sx={{ fontSize: '1.5rem', lineHeight: 1, userSelect: 'none', ...sx }} aria-hidden>
        🎲
      </Box>
    );
  }
  if (game === 'vegas') {
    return <Banknote size={sx?.fontSize === 'text-2xl' ? 24 : 20} />;
  }
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{
        width: 24,
        height: 24,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2.2,
        strokeLinecap: 'round',
        ...sx,
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

  const getRecentResult = useCallback(
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
    const seen = new Set<string>();
    const out: { match: HistoryMatch; game: GameId }[] = [];
    for (const match of recentMatches) {
      const game = normalizeGameName(match.gameName);
      if (!game || seen.has(game)) continue;
      seen.add(game);
      out.push({ match, game });
      if (out.length >= 4) break;
    }
    return out;
  }, [recentMatches]);

  const loadRooms = useCallback(async () => {
    try {
      const data = await fetchRooms();
      setRooms(data);
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message || messages.lobby.loadRoomsError);
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
      router.push(gameRoute(gameType));
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const room = await createRoom(gameType, maxRounds);
      router.push(playRoute(room.code));
    } catch (e: any) {
      setCreateError(e?.message || messages.lobby.createError);
      setCreating(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) {
      setJoinError(messages.lobby.enterRoomCode);
      return;
    }
    router.push(playRoute(code));
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      // Clipboard unavailable; no product state change is required.
    }
  };

  const activeRooms = rooms
    .filter((r) => r.status !== 'finished')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'waiting' ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        p: { xs: 2, sm: 10 },
        bgcolor: 'background.default',
        color: 'text.primary',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          maxWidth: 'lg',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 6, sm: 10 },
          py: { xs: 2, sm: 6 },
        }}
      >
        <Box component="header" sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2, px: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              color: 'primary.main',
              textShadow: '0 4px 20px rgba(238, 172, 47, 0.25)',
              fontSize: { xs: '1.75rem', sm: '3rem' },
            }}
          >
            {messages.lobby.title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600, opacity: 0.9 }}>
            {messages.lobby.subtitle}
          </Typography>
        </Box>

        {user && (
          <Box
            component="section"
            aria-label={messages.lobby.recentlyPlayed}
            sx={{ px: { xs: 2, sm: 0 }, display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <History size={24} color={honeyBronze.primary} />
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
                  {messages.lobby.recentlyPlayed}
                </Typography>
              </Box>
              <IconButton
                onClick={() => void loadRecent()}
                disabled={recentLoading}
                size="small"
                aria-label={messages.lobby.refreshRecent}
                sx={{ color: 'text.secondary' }}
              >
                {recentLoading ? <CircularProgress size={18} /> : <RefreshCw size={18} />}
              </IconButton>
            </Box>

            {recentError ? (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: 3, fontWeight: 600 }}>
                {recentError}
              </Alert>
            ) : recentLoading ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={140} sx={{ borderRadius: 4 }} />
                ))}
              </Box>
            ) : recentGames.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 6, sm: 8 },
                  borderRadius: 4,
                  textAlign: 'center',
                  bgcolor: alpha(honeyBronze.bgPaper, 0.25),
                  border: '2px dashed',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {messages.lobby.noRecentGames}
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
                {recentGames.map(({ match, game }) => {
                  const result = getRecentResult(match, user.id);
                  return (
                    <Paper
                      key={match.id}
                      elevation={0}
                      sx={{
                        p: 4,
                        borderRadius: 4,
                        bgcolor: alpha(honeyBronze.bgPaper, 0.4),
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: alpha(honeyBronze.primary, 0.45),
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            flexShrink: 0,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(honeyBronze.primary, 0.12),
                            color: 'primary.main',
                          }}
                        >
                          <GameIcon game={game} sx={{ fontSize: '1.5rem' }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.3 }} noWrap>
                            {getGameTitle(game, locale)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {new Date(match.createdAt).toLocaleDateString(dateLocale)}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={result.label}
                        color={result.color}
                        size="small"
                        variant="outlined"
                        sx={{ alignSelf: 'flex-start', fontWeight: 800 }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        startIcon={<Play size={16} />}
                        onClick={() => router.push(gameRoute(game))}
                        sx={{ mt: 'auto' }}
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

        <Grid container spacing={{ xs: 3, sm: 8 }} sx={{ px: { xs: 2, sm: 0 } }}>
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, sm: 8 },
                borderRadius: 4,
                bgcolor: alpha(honeyBronze.bgPaper, 0.4),
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 4, sm: 6 },
                height: '100%',
              }}
            >
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, fontSize: '0.8rem' }}>
                {messages.lobby.chooseGame}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: { xs: 2, sm: 4 } }}>
                {WEB_GAME_IDS.map((type) => {
                  const selected = gameType === type;
                  return (
                    <ButtonBase
                      key={type}
                      onClick={() => setGameType(type)}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        p: { xs: 3, sm: 6 },
                        borderRadius: 4,
                        border: '2px solid',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        bgcolor: selected ? alpha(theme.palette.primary.main, 0.12) : 'rgba(0,0,0,0.2)',
                        borderColor: selected ? 'primary.main' : 'transparent',
                        color: selected ? 'primary.main' : 'text.secondary',
                        '&:hover': {
                          bgcolor: selected ? alpha(theme.palette.primary.main, 0.18) : alpha(theme.palette.text.primary, 0.05),
                          borderColor: selected ? 'primary.main' : alpha(theme.palette.divider, 0.5),
                          transform: 'translateY(-4px)',
                        },
                      }}
                    >
                      <Box sx={{ color: 'inherit', display: 'flex', transform: selected ? 'scale(1.15)' : 'none', transition: 'transform 0.3s' }}>
                        <GameIcon game={type} sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }} />
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                          {getGameTitle(type, locale)}
                        </Typography>
                      </Box>
                    </ButtonBase>
                  );
                })}
              </Box>

              {(gameType === 'backgammon' || gameType === 'tic-tac-toe') && (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="match-points-label" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {messages.lobby.matchPoints}
                  </InputLabel>
                  <Select
                    labelId="match-points-label"
                    label={messages.lobby.matchPoints}
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(e.target.value as 1 | 3 | 5)}
                  >
                    {matchPointOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value} sx={{ fontWeight: 600 }}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <ButtonBase
                  onClick={() => setMode('online')}
                  sx={{
                    p: 5,
                    borderRadius: 3,
                    border: '1px solid',
                    transition: 'all 0.2s',
                    borderColor: mode === 'online' ? 'primary.main' : 'divider',
                    bgcolor: mode === 'online' ? alpha(theme.palette.primary.main, 0.15) : 'rgba(0,0,0,0.15)',
                    color: mode === 'online' ? 'primary.main' : 'text.secondary',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Users size={22} />
                    <Typography variant="button" sx={{ fontWeight: 800 }}>
                      {messages.lobby.onlineOpponent}
                    </Typography>
                  </Box>
                </ButtonBase>
                <ButtonBase
                  onClick={() => setMode('bot')}
                  sx={{
                    p: 5,
                    borderRadius: 3,
                    border: '1px solid',
                    transition: 'all 0.2s',
                    borderColor: mode === 'bot' ? 'primary.main' : 'divider',
                    bgcolor: mode === 'bot' ? alpha(theme.palette.primary.main, 0.15) : 'rgba(0,0,0,0.15)',
                    color: mode === 'bot' ? 'primary.main' : 'text.secondary',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Bot size={22} />
                    <Typography variant="button" sx={{ fontWeight: 800 }}>
                      {messages.lobby.practiceBot}
                    </Typography>
                  </Box>
                </ButtonBase>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCreate}
                disabled={creating}
                startIcon={creating ? <CircularProgress size={24} color="inherit" /> : mode === 'bot' ? <Bot size={24} /> : <Plus size={24} />}
                sx={{ py: 2.5, fontSize: '1.1rem', fontWeight: 900 }}
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
                p: 8,
                borderRadius: 4,
                bgcolor: alpha(honeyBronze.bgPaper, 0.4),
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                height: '100%',
              }}
            >
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, fontSize: '0.8rem' }}>
                {messages.lobby.joinWithCode}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: -4 }}>
                {messages.lobby.joinDescription}
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, mt: 'auto' }}>
                <TextField
                  fullWidth
                  value={codeInput}
                  placeholder="ABCDE"
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase());
                    setJoinError(null);
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'monospace',
                      fontWeight: 900,
                      fontSize: '1.5rem',
                      letterSpacing: '0.3em',
                      textAlign: 'center',
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!codeInput.trim()}
                  sx={{
                    minWidth: 80,
                    borderRadius: 3,
                    bgcolor: 'text.primary',
                    color: 'background.default',
                    '&:hover': { bgcolor: 'text.secondary' },
                  }}
                >
                  <ArrowRight size={32} />
                </Button>
              </Box>
              {joinError && (
                <Alert severity="error" variant="filled" sx={{ borderRadius: 2, fontWeight: 700 }}>
                  {joinError}
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>

        {(createError || loadError) && (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: 4, borderColor: alpha('#f43f5e', 0.5), p: 4, fontWeight: 700 }}>
            {createError || loadError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, px: { xs: 2, sm: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Gamepad2 size={28} style={{ color: honeyBronze.primary }} />
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
                {messages.lobby.activeRooms}
              </Typography>
            </Box>
            <Button
              size="large"
              onClick={() => void loadRooms()}
              startIcon={<RefreshCw size={20} />}
              sx={{ color: 'text.secondary', fontWeight: 800, '&:hover': { color: 'primary.main' } }}
            >
              {messages.lobby.refreshList}
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 12 }}>
              <CircularProgress size={40} sx={{ color: 'primary.main' }} />
            </Box>
          ) : activeRooms.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '2px dashed',
                borderColor: 'divider',
                p: 8,
                textAlign: 'center',
                bgcolor: alpha(honeyBronze.bgPaper, 0.25),
              }}
            >
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {messages.lobby.noActiveRooms}
              </Typography>
            </Paper>
          ) : (
            <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {activeRooms.map((room) => {
                const roomGameId = isWebGameId(room.gameType) ? room.gameType : 'tic-tac-toe';
                const roomGame = getGameCatalogEntry(roomGameId);
                return (
                  <Paper
                    key={room.id}
                    component="li"
                    elevation={0}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      p: 4,
                      borderRadius: 4,
                      bgcolor: alpha(honeyBronze.bgDeep, 0.6),
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: alpha(honeyBronze.primary, 0.5),
                        bgcolor: alpha(honeyBronze.bgDeep, 0.8),
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            letterSpacing: '0.1em',
                            color: 'primary.main',
                          }}
                        >
                          {room.code}
                        </Typography>
                        <Tooltip title={copiedCode === room.code ? messages.lobby.copied : messages.lobby.copyCode}>
                          <IconButton size="small" onClick={() => handleCopy(room.code)} sx={{ color: 'text.secondary' }}>
                            {copiedCode === room.code ? (
                              <Check size={18} style={{ color: honeyBronze.success }} />
                            ) : (
                              <Copy size={18} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<GameIcon game={roomGameId} sx={{ fontSize: '1rem', color: 'inherit' }} />}
                          label={getGameTitle(roomGameId, locale)}
                          size="small"
                          sx={{
                            bgcolor: alpha(honeyBronze.primary, 0.1),
                            color: 'primary.main',
                            border: '1px solid',
                            borderColor: alpha(honeyBronze.primary, 0.2),
                          }}
                        />
                        <Chip
                          label={statusLabel(room.status)}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: room.status === 'waiting' ? 'success.main' : 'warning.main',
                            color: room.status === 'waiting' ? 'success.main' : 'warning.main',
                            '&::before': {
                              content: '""',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'currentColor',
                              mr: 1,
                            },
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <Users size={16} />
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {messages.lobby.playersShort(room.players.length, roomGame.maxPlayers)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => router.push(playRoute(room.code))}
                      disabled={room.status !== 'waiting'}
                      sx={{ borderRadius: 2.5, px: 4, minWidth: 100 }}
                    >
                      {room.status === 'waiting' ? messages.lobby.enter : messages.lobby.inProgress}
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
