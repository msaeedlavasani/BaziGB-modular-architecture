'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
  useTheme,
  Grid,
} from '@mui/material';
import {
  Gamepad2,
  Trophy,
  Swords,
  TrendingUp,
  RefreshCw,
  LogOut,
  ChevronLeft,
  Edit2,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getProfileMessages } from '@/i18n/profile';
import { APP_ROUTES } from '@/i18n/routing';
import { getGameTitle, isWebGameId } from '@/lib/game-catalog';
import { api } from '@/lib/api';

interface HistoryStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
}

interface HistoryMatch {
  id: string;
  winnerId: string | null;
  roomId: string;
  gameName: string;
  players: string;
  data: string;
  createdAt: string;
}

interface HistoryResponse {
  userId: string;
  stats: HistoryStats;
  history: HistoryMatch[];
}

type MatchResult = 'win' | 'loss' | 'draw';

function normalizeGameName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function truncateId(id: string, max = 12): string {
  return id.length > max ? `${id.slice(0, max)}…` : id;
}

function parsePlayers(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function getResult(match: HistoryMatch, currentUserId: string): MatchResult {
  if (match.winnerId === null) return 'draw';
  return match.winnerId === currentUserId ? 'win' : 'loss';
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 4,
        bgcolor: alpha('#0B1622', 0.6),
        p: 5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: 48,
          height: 48,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 3,
          border: `1px solid ${alpha(color, 0.3)}`,
          bgcolor: alpha(color, 0.1),
          color,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
          {value}
        </Typography>
        <Typography variant="overline" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 4 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton variant="text" width="60%" sx={{ bgcolor: alpha('#0B1622', 0.9) }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function ProfilePage() {
  const theme = useTheme();
  const router = useRouter();
  const locale = useAppLocale();
  const messages = getProfileMessages(locale);
  const dateLocale = locale === 'fa' ? 'fa-IR' : 'en-US';
  const { user, isLoading, updateUser, logout } = useAuth();

  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [matches, setMatches] = useState<HistoryMatch[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const formatGameName = (name: string): string => {
    if (!name) return messages.unknownGame;
    const normalized = normalizeGameName(name);
    if (isWebGameId(normalized)) return getGameTitle(normalized, locale);
    return name
      .split(/[-_ ]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const formatDate = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(dateLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const resultBadge = (result: MatchResult): { label: string; color: 'success' | 'error' | 'warning' } => {
    if (result === 'win') return { label: messages.win, color: 'success' };
    if (result === 'loss') return { label: messages.loss, color: 'error' };
    return { label: messages.draw, color: 'warning' };
  };

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    setError(null);
    try {
      const data = await api.get<HistoryResponse>(`/history/${user.id}`);
      setStats(data.stats);
      setMatches(data.history);
    } catch (err: any) {
      setError(err?.message || messages.historyLoadError);
    } finally {
      setLoadingHistory(false);
    }
  }, [messages.historyLoadError, user]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleStartEdit = () => {
    setNewUsername(user?.username || '');
    setIsEditing(true);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSaveUsername = async () => {
    if (!newUsername) return;
    const USERNAME_REGEX = /^[A-Za-z0-9_]{3,20}$/;
    if (!USERNAME_REGEX.test(newUsername)) {
      setSaveError(messages.usernameRule);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await updateUser({ username: newUsername });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || messages.profileUpdateError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError(null);
    setPwSuccess(false);

    if (user?.hasPassword && !pwCurrent) {
      setPwError(messages.currentPasswordRequired);
      return;
    }
    if (pwNew.length < 8) {
      setPwError(messages.newPasswordMin);
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError(messages.passwordMismatch);
      return;
    }

    setSavingPw(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: pwCurrent || undefined,
        newPassword: pwNew,
      });
      setPwSuccess(true);
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      setPwError(err?.message || messages.passwordChangeError);
    } finally {
      setSavingPw(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 12,
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={48} sx={{ color: 'primary.main' }} />
        <Typography sx={{ mt: 4, color: 'text.secondary', fontWeight: 600 }}>{messages.loading}</Typography>
      </Box>
    );
  }

  if (!user) return null;

  const winRate = stats && stats.gamesPlayed > 0 ? `${((stats.wins / stats.gamesPlayed) * 100).toFixed(1)}%` : '—';

  return (
    <Box sx={{ flex: 1, bgcolor: 'background.default', color: 'text.primary' }}>
      <Box sx={{ mx: 'auto', width: '100%', maxWidth: 1024, px: { xs: 4, sm: 8 }, py: 12 }}>
        <Box component="header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 10 }}>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Button component={Link} href={APP_ROUTES.lobby} startIcon={<ChevronLeft size={18} />} sx={{ color: 'text.secondary' }}>
              {messages.backToLobby}
            </Button>
            {user.role === 'ADMIN' && (
              <Button component={Link} href={APP_ROUTES.admin} variant="contained">
                {messages.adminPanel}
              </Button>
            )}
          </Box>
          <Button variant="outlined" onClick={logout} startIcon={<LogOut size={18} />} color="error">
            {messages.logout}
          </Button>
        </Box>

        <Paper elevation={0} sx={{ p: 8, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.4), mb: 8 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                bgcolor: 'primary.main',
                color: 'secondary.main',
                fontSize: '2.5rem',
                fontWeight: 900,
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </Box>
            <Box sx={{ flex: 1 }}>
              {isEditing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 320 }}>
                  <TextField
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={isSaving}
                    error={!!saveError}
                    helperText={saveError}
                    autoFocus
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" size="small" onClick={handleSaveUsername} disabled={isSaving}>
                      {messages.save}
                    </Button>
                    <Button variant="outlined" size="small" onClick={handleCancelEdit}>
                      {messages.cancel}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900 }}>
                      {user.username}
                    </Typography>
                    <IconButton size="small" onClick={handleStartEdit}>
                      <Edit2 size={18} />
                    </IconButton>
                    {saveSuccess && <Chip size="small" label={messages.changed} color="success" />}
                  </Box>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                    {user.email || messages.noEmail}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 4, mb: 12 }}>
          <StatCard label={messages.games} value={stats?.gamesPlayed ?? 0} icon={<Gamepad2 size={24} />} color={theme.palette.primary.main} />
          <StatCard label={messages.wins} value={stats?.wins ?? 0} icon={<Trophy size={24} />} color={theme.palette.success.main} />
          <StatCard label={messages.losses} value={stats?.losses ?? 0} icon={<Swords size={24} />} color={theme.palette.error.main} />
          <StatCard label={messages.winRate} value={winRate} icon={<TrendingUp size={24} />} color={theme.palette.warning.main} />
        </Box>

        <Grid container spacing={8}>
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 6, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Lock size={20} color={theme.palette.primary.main} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {messages.changePassword}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {user.hasPassword && (
                  <TextField
                    type="password"
                    label={messages.currentPassword}
                    value={pwCurrent}
                    onChange={(e) => setPwCurrent(e.target.value)}
                  />
                )}
                <TextField type="password" label={messages.newPassword} value={pwNew} onChange={(e) => setPwNew(e.target.value)} />
                <TextField
                  type="password"
                  label={messages.confirmPassword}
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                />
                <Button variant="contained" onClick={handleChangePassword} disabled={savingPw} fullWidth>
                  {messages.changePassword}
                </Button>
                {pwSuccess && <Alert severity="success">{messages.passwordChanged}</Alert>}
                {pwError && <Alert severity="error">{pwError}</Alert>}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {messages.history}
              </Typography>
              <IconButton onClick={() => void loadHistory()} disabled={loadingHistory} size="small">
                <RefreshCw size={18} className={loadingHistory ? 'animate-spin' : ''} />
              </IconButton>
            </Box>
            {error && (
              <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.2) }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{messages.gameType}</TableCell>
                    <TableCell>{messages.opponent}</TableCell>
                    <TableCell>{messages.time}</TableCell>
                    <TableCell align="center">{messages.result}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingHistory ? (
                    <SkeletonRows />
                  ) : matches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 10, color: 'text.disabled' }}>
                        {messages.noGames}
                      </TableCell>
                    </TableRow>
                  ) : (
                    matches.map((match) => {
                      const result = getResult(match, user.id);
                      const badge = resultBadge(result);
                      const players = parsePlayers(match.players);
                      const opponent = players.find((p) => p !== user.id) || messages.unknownOpponent;
                      return (
                        <TableRow key={match.id}>
                          <TableCell sx={{ fontWeight: 700 }}>{formatGameName(match.gameName)}</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{truncateId(opponent)}</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{formatDate(match.createdAt)}</TableCell>
                          <TableCell align="center">
                            <Chip label={badge.label} color={badge.color} size="small" sx={{ minWidth: 60 }} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
