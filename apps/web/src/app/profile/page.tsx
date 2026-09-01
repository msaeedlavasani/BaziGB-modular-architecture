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
} from '@mui/material';
import {
  ArrowLeft,
  ArrowRight,
  Edit2,
  Gamepad2,
  LogOut,
  Phone,
  RefreshCw,
  ShieldCheck,
  Swords,
  Trash2,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getProfileMessages } from '@/i18n/profile';
import { APP_ROUTES, localizedAppRoute } from '@/i18n/routing';
import { getGameTitle, isWebGameId } from '@/lib/game-catalog';
import { api } from '@/lib/api';
import { PRIVATE_ALPHA } from '@/lib/private-alpha';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';

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

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  return `${phone.slice(0, 4)}•••${phone.slice(-4)}`;
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
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 2.5, sm: 3 },
        borderRadius: 4,
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        p: { xs: 3, sm: 4 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: { xs: 42, sm: 48 },
          height: { xs: 42, sm: 48 },
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
        <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5, fontWeight: 700 }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, row) => (
        <TableRow key={row}>
          {Array.from({ length: 4 }).map((__, cell) => (
            <TableCell key={cell}>
              <Skeleton variant="text" width="65%" />
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
  const BackIcon = locale === 'fa' ? ArrowRight : ArrowLeft;
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

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleSaveUsername = async () => {
    if (!newUsername) return;
    const usernameRegex = /^[A-Za-z0-9_]{3,20}$/;
    if (!usernameRegex.test(newUsername)) {
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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete('/auth/me');
      logout();
      router.replace(localizedAppRoute(locale, 'lobby'));
    } catch (err: any) {
      setDeleteError(err?.message || messages.deleteAccountError);
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) router.replace(localizedAppRoute(locale, 'login'));
  }, [isLoading, locale, router, user]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, bgcolor: 'background.default' }}>
        <CircularProgress size={42} />
        <Typography color="text.secondary" sx={{ fontWeight: 700 }}>{messages.loading}</Typography>
      </Box>
    );
  }

  if (!user) return null;

  const winRate = stats && stats.gamesPlayed > 0 ? `${((stats.wins / stats.gamesPlayed) * 100).toFixed(1)}%` : '—';

  return (
    <Box sx={{ flex: 1, bgcolor: 'background.default', color: 'text.primary' }}>
      <Box sx={{ mx: 'auto', width: '100%', maxWidth: 1024, px: { xs: 2, sm: 5, md: 8 }, py: { xs: 5, sm: 8 } }}>
        <Box
          component="header"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mb: { xs: 5, sm: 8 },
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Button
              component={Link}
              href={localizedAppRoute(locale, 'lobby')}
              startIcon={<BackIcon size={18} />}
              sx={{ color: 'text.secondary' }}
            >
              {messages.backToLobby}
            </Button>
            {!PRIVATE_ALPHA && user.role === 'ADMIN' && (
              <Button component={Link} href={APP_ROUTES.admin} variant="outlined">
                {messages.adminPanel}
              </Button>
            )}
          </Box>
          <Button variant="outlined" onClick={logout} startIcon={<LogOut size={18} />} color="error" sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
            {messages.logout}
          </Button>
        </Box>

        <Paper elevation={0} sx={{ p: { xs: 4, sm: 6 }, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.5), mb: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 4 }}>
            <Box
              sx={{
                width: { xs: 64, sm: 76 },
                height: { xs: 64, sm: 76 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                bgcolor: 'primary.main',
                color: 'secondary.main',
                fontSize: { xs: '2rem', sm: '2.35rem' },
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
              {isEditing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 360 }}>
                  <TextField
                    value={newUsername}
                    onChange={(event) => setNewUsername(event.target.value)}
                    disabled={isSaving}
                    error={Boolean(saveError)}
                    helperText={saveError}
                    autoFocus
                  />
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button variant="contained" size="small" onClick={() => void handleSaveUsername()} disabled={isSaving}>
                      {messages.save}
                    </Button>
                    <Button variant="outlined" size="small" onClick={() => { setIsEditing(false); setSaveError(null); }}>
                      {messages.cancel}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: '1.6rem', sm: '1.9rem' }, wordBreak: 'break-word' }}>
                      {user.username}
                    </Typography>
                    <IconButton size="small" onClick={handleStartEdit} aria-label={messages.save}>
                      <Edit2 size={17} />
                    </IconButton>
                    {saveSuccess && <Chip size="small" label={messages.changed} color="success" />}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, color: 'text.secondary' }}>
                    <Phone size={15} />
                    <Typography variant="body2" dir="ltr">{maskPhone(user.phone)}</Typography>
                    <Typography variant="caption">· {messages.otpOnly}</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2.5, mb: { xs: 6, sm: 8 } }}>
          <StatCard label={messages.games} value={stats?.gamesPlayed ?? 0} icon={<Gamepad2 size={22} />} color={theme.palette.primary.main} />
          <StatCard label={messages.wins} value={stats?.wins ?? 0} icon={<Trophy size={22} />} color={theme.palette.success.main} />
          <StatCard label={messages.losses} value={stats?.losses ?? 0} icon={<Swords size={22} />} color={theme.palette.error.main} />
          <StatCard label={messages.winRate} value={winRate} icon={<TrendingUp size={22} />} color={theme.palette.warning.main} />
        </Box>

        <Paper elevation={0} sx={{ mb: { xs: 5, sm: 7 }, p: { xs: 2.5, sm: 3 }, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.38), display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <ShieldCheck size={20} color={theme.palette.primary.main} />
            <Box>
              <Typography sx={{ fontWeight: 800 }}>{messages.accountAccess}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{messages.accountAccessDescription}</Typography>
            </Box>
          </Box>
          <Button color="error" variant="text" startIcon={<Trash2 size={17} />} onClick={() => setDeleteOpen(true)} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
            {messages.deleteAccount}
          </Button>
        </Paper>

        <Box component="section">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>{messages.history}</Typography>
            <IconButton onClick={() => void loadHistory()} disabled={loadingHistory} size="small" aria-label={messages.history}>
              {loadingHistory ? <CircularProgress size={17} /> : <RefreshCw size={17} />}
            </IconButton>
          </Box>

          {error && (
            <Alert severity="error" variant="outlined" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => void loadHistory()}>{messages.loading}</Button>}>
              {error}
            </Alert>
          )}

          {!loadingHistory && matches.length === 0 && !error ? (
            <EmptyState compact icon={<Gamepad2 size={24} />} title={messages.noGames} />
          ) : (
            <>
              <TableContainer component={Paper} elevation={0} sx={{ display: { xs: 'none', sm: 'block' }, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.25), overflowX: 'auto' }}>
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
                    ) : (
                      matches.map((match) => {
                        const result = getResult(match, user.id);
                        const badge = resultBadge(result);
                        const players = parsePlayers(match.players);
                        const opponent = players.find((player) => player !== user.id) || messages.unknownOpponent;

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
              <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1.5 }}>
                {loadingHistory
                  ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} variant="rounded" height={112} />)
                  : matches.map((match) => {
                      const result = getResult(match, user.id);
                      const badge = resultBadge(result);
                      const players = parsePlayers(match.players);
                      const opponent = players.find((player) => player !== user.id) || messages.unknownOpponent;
                      return (
                        <Paper key={match.id} elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.35), border: '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                            <Typography sx={{ fontWeight: 800 }}>{formatGameName(match.gameName)}</Typography>
                            <Chip label={badge.label} color={badge.color} size="small" />
                          </Box>
                          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>{messages.opponent}: {truncateId(opponent)}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.disabled' }}>{formatDate(match.createdAt)}</Typography>
                        </Paper>
                      );
                    })}
              </Box>
            </>
          )}
        </Box>

        <Modal
          open={deleteOpen}
          title={messages.deleteAccountTitle}
          onClose={() => { setDeleteOpen(false); setDeleteError(null); }}
          closeLabel={messages.cancel}
          confirmLabel={messages.confirmDeleteAccount}
          onConfirm={() => void handleDeleteAccount()}
          confirmDisabled={deleting}
        >
          <Typography variant="body2">{messages.deleteAccountDescription}</Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </Modal>
      </Box>
    </Box>
  );
}
