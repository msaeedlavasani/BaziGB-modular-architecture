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
  Check,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

/* ------------------------------- types ---------------------------------- */

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
  /** JSON-encoded array of participating user ids. */
  players: string;
  /** JSON-encoded final game state. */
  data: string;
  createdAt: string;
}

interface HistoryResponse {
  userId: string;
  stats: HistoryStats;
  history: HistoryMatch[];
}

type MatchResult = 'win' | 'loss' | 'draw';

/* ------------------------------ helpers --------------------------------- */

function formatGameName(name: string): string {
  if (!name) return 'Unknown Game';
  return name
    .split(/[-_ ]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateId(id: string, max = 12): string {
  return id.length > max ? `${id.slice(0, max)}…` : id;
}

function parsePlayers(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function getResult(match: HistoryMatch, currentUserId: string): MatchResult {
  if (match.winnerId === null) return 'draw';
  return match.winnerId === currentUserId ? 'win' : 'loss';
}

const RESULT_BADGE: Record<
  MatchResult,
  { label: string; color: 'success' | 'error' | 'warning' }
> = {
  win: { label: 'Win', color: 'success' },
  loss: { label: 'Loss', color: 'error' },
  draw: { label: 'Draw', color: 'warning' },
};

// Solid brand color used by the primary CTAs on this page.
const GRADIENT_BTN = {
  background: '#F5A306',
  '&:hover': { background: '#B25D16' },
  fontWeight: 700,
  borderRadius: 3,
  textTransform: 'none',
} as const;

// Shared dark-theme TextField style for the password form.
const passwordFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    color: 'white',
    bgcolor: alpha('#030A15', 0.6),
    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
    '&.Mui-focused fieldset': { borderColor: '#B25D16' },
  },
  '& .MuiInputLabel-root': { color: 'text.secondary' },
} as const;

/* ------------------------------- UI bits -------------------------------- */

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
        gap: 2,
        borderRadius: 4,
        bgcolor: alpha('#0B1622', 0.6),
        border: '1px solid',
        borderColor: alpha('#2C3A45', 0.7),
        p: 2.5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: 44,
          height: 44,
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
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.25 }}>
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'text.secondary',
          }}
        >
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
        <TableRow key={i} sx={{ borderTop: '1px solid', borderColor: alpha('#2C3A45', 0.8) }}>
          {Array.from({ length: 4 }).map((__, j) => (
            <TableCell key={j} sx={{ px: 2, py: 2, borderBottom: 'none' }}>
              <Skeleton variant="text" width="60%" sx={{ maxWidth: 96, bgcolor: alpha('#0B1622', 0.9) }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/* ------------------------------ profile page ---------------------------- */

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, updateUser, logout } = useAuth();

  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [matches, setMatches] = useState<HistoryMatch[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Change password state
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    setError(null);
    try {
      const data = await api.get<HistoryResponse>(`/history/${user.id}`);
      setStats(data.stats);
      setMatches(data.history);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load match history.',
      );
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

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
      setSaveError('نام کاربری باید ۳ تا ۲۰ کاراکتر لاتین (حروف، عدد، _) باشد');
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
      if (err.status === 409) {
        setSaveError('این یوزرنیم قبلاً استفاده شده است');
      } else {
        setSaveError(err.message || 'خطا در بروزرسانی پروفایل');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError(null);
    setPwSuccess(false);

    if (user?.hasPassword && !pwCurrent) {
      setPwError('رمز فعلی الزامی است');
      return;
    }
    if (pwNew.length < 8) {
      setPwError('رمز جدید باید حداقل ۸ کاراکتر باشد');
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError('تکرار رمز جدید مطابقت ندارد');
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
      setPwError(err?.message || 'خطا در تغییر رمز');
    } finally {
      setSavingPw(false);
    }
  };

  // Not signed in -> send to the login page after the session check settles.
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
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
          p: 6,
          bgcolor: 'background.default',
          color: 'text.primary',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={48} thickness={4} sx={{ color: '#F5A306' }} />
          <Typography sx={{ color: 'text.secondary' }}>Loading your profile...</Typography>
        </Box>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 6,
          bgcolor: 'background.default',
          color: 'text.primary',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 448,
            borderRadius: 4,
            bgcolor: alpha('#0B1622', 0.6),
            border: '1px solid',
            borderColor: '#2C3A45',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Please sign in
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Sign in to view your stats and match history.
          </Typography>
          <Button component={Link} href="/login" variant="contained" size="large" fullWidth sx={{ mt: 3, ...GRADIENT_BTN }}>
            Go to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  const winRate =
    stats && stats.gamesPlayed > 0
      ? `${((stats.wins / stats.gamesPlayed) * 100).toFixed(1)}%`
      : '—';

  const hasMatches = matches.length > 0;

  return (
    <Box sx={{ flex: 1, bgcolor: 'background.default', color: 'text.primary' }}>
      <Box sx={{ mx: 'auto', width: '100%', maxWidth: 896, px: { xs: 2, sm: 6 }, py: 10 }}>
        {/* Header */}
        <Box component="header" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Button
            component={Link}
            href="/"
            startIcon={<ChevronLeft size={16} />}
            sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 500, '&:hover': { color: 'text.primary' } }}
          >
            Back to game
          </Button>
          <Button
            variant="outlined"
            onClick={logout}
            startIcon={<LogOut size={16} />}
            sx={{
              borderColor: '#2C3A45',
              color: 'text.secondary',
              textTransform: 'none',
              '&:hover': { bgcolor: alpha('#0B1622', 0.8), color: 'text.primary' },
            }}
          >
            Sign out
          </Button>
        </Box>

        {/* Identity card */}
        <Paper
          elevation={0}
          sx={{
            mt: 8,
            borderRadius: 4,
            bgcolor: alpha('#0B1622', 0.6),
            border: '1px solid',
            borderColor: alpha('#2C3A45', 0.7),
            p: 6,
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2.5 }}>
            <Box
              sx={{
                display: 'flex',
                width: 64,
                height: 64,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                background: '#F5A306',
                fontSize: '1.5rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: 'white',
              }}
            >
              {user.username.charAt(0) || '?'}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              {isEditing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 300 }}>
                  <TextField
                    size="small"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Username"
                    disabled={isSaving}
                    error={!!saveError}
                    helperText={saveError}
                    autoFocus
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: '#B25D16' },
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSaveUsername}
                      disabled={isSaving || newUsername === user.username}
                      startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
                      sx={{ bgcolor: '#B25D16', '&:hover': { bgcolor: '#8F470F' } }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                     <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.025em' }}>
                       {user.username}
                     </Typography>
                     <IconButton
                       size="small"
                       onClick={handleStartEdit}
                       title="Edit username"
                       aria-label="ویرایش نام کاربری"
                       sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                     >
                       <Edit2 size={16} />
                     </IconButton>
                    {saveSuccess && (
                      <Chip
                        size="small"
                        icon={<Check size={12} />}
                        label="Saved!"
                        sx={{
                          color: '#10b981',
                          fontWeight: 700,
                          bgcolor: alpha('#10b981', 0.12),
                          border: 'none',
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </Typography>
                </>
              )}
            </Box>
            <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, ml: 'auto', fontFamily: 'monospace', color: 'text.disabled' }}>
              ID: {truncateId(user.id, 16)}
            </Typography>
          </Box>
        </Paper>

        {/* Stats */}
        <Box sx={{ mt: 8, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          <StatCard label="Games Played" value={stats ? stats.gamesPlayed : '—'} icon={<Gamepad2 size={20} />} color="#F5A306" />
          <StatCard label="Wins" value={stats ? stats.wins : '—'} icon={<Trophy size={20} />} color="#34d399" />
          <StatCard label="Losses" value={stats ? stats.losses : '—'} icon={<Swords size={20} />} color="#fb7185" />
          <StatCard label="Win Rate" value={winRate} icon={<TrendingUp size={20} />} color="#B25D16" />
        </Box>

        {/* Change password */}
        <Paper
          elevation={0}
          sx={{
            mt: 8,
            borderRadius: 4,
            bgcolor: alpha('#0B1622', 0.6),
            border: '1px solid',
            borderColor: alpha('#2C3A45', 0.8),
            p: 6,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
            <Lock size={20} color="#F5A306" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              تغییر رمز
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 360 }}>
            {user?.hasPassword && (
              <TextField
                type="password"
                size="small"
                label="رمز فعلی"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
                autoComplete="current-password"
                error={!!pwError && !pwCurrent}
                sx={passwordFieldSx}
              />
            )}
            <TextField
              type="password"
              size="small"
              label="رمز جدید (حداقل ۸ کاراکتر)"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              autoComplete="new-password"
              sx={passwordFieldSx}
            />
            <TextField
              type="password"
              size="small"
              label="تکرار رمز جدید"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              autoComplete="new-password"
              sx={passwordFieldSx}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={savingPw}
                startIcon={savingPw ? <CircularProgress size={16} color="inherit" /> : null}
                sx={{ bgcolor: '#B25D16', '&:hover': { bgcolor: '#8F470F' } }}
              >
                تغییر رمز
              </Button>
              {pwSuccess && (
                <Typography sx={{ color: '#34d399', fontWeight: 600, fontSize: '0.875rem' }}>
                  رمز تغییر کرد ✓
                </Typography>
              )}
            </Box>
            {pwError && (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                {pwError}
              </Alert>
            )}
          </Box>
        </Paper>

        {/* Match history */}
        <Box component="section" sx={{ mt: 10 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.025em' }}>
              Match History
              {stats && (
                <Typography component="span" variant="body2" sx={{ ml: 1, fontWeight: 500, color: 'text.secondary' }}>
                  ({stats.gamesPlayed} {stats.gamesPlayed === 1 ? 'game' : 'games'})
                </Typography>
              )}
            </Typography>
            <Button
              size="small"
              onClick={() => void loadHistory()}
              disabled={loadingHistory}
              startIcon={<RefreshCw size={16} className={loadingHistory ? 'animate-spin' : ''} />}
              sx={{
                border: '1px solid',
                borderColor: '#2C3A45',
                color: 'text.secondary',
                textTransform: 'none',
                '&:hover': { bgcolor: alpha('#0B1622', 0.8), color: 'text.primary' },
              }}
            >
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {loadingHistory && !error ? (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ mt: 2, borderRadius: 4, border: '1px solid', borderColor: alpha('#2C3A45', 0.7), bgcolor: alpha('#030A15', 0.5), overflowX: 'auto' }}
            >
              <Table>
                <TableBody>
                  <SkeletonRows />
                </TableBody>
              </Table>
            </TableContainer>
          ) : hasMatches ? (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ mt: 2, borderRadius: 4, border: '1px solid', borderColor: alpha('#2C3A45', 0.7), bgcolor: alpha('#030A15', 0.5), overflowX: 'auto' }}
            >
              <Table sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow sx={{ borderBottom: '1px solid', borderColor: alpha('#2C3A45', 0.7) }}>
                    <TableCell sx={{ px: 2, py: 1.5, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: 'none' }}>
                      Game Type
                    </TableCell>
                    <TableCell sx={{ px: 2, py: 1.5, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: 'none' }}>
                      Opponent
                    </TableCell>
                    <TableCell sx={{ px: 2, py: 1.5, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: 'none' }}>
                      Date
                    </TableCell>
                    <TableCell align="right" sx={{ px: 2, py: 1.5, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: 'none' }}>
                      Result
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matches.map((match, index) => {
                    const players = parsePlayers(match.players);
                    const opponent = players.find((id) => id !== user.id) ?? 'unknown';
                    const result = getResult(match, user.id);
                    const badge = RESULT_BADGE[result];
                    return (
                      <TableRow
                        key={match.id}
                        sx={{
                          bgcolor: index % 2 === 0 ? alpha('#0B1622', 0.3) : 'transparent',
                          '&:hover': { bgcolor: alpha('#0B1622', 0.6) },
                        }}
                      >
                        <TableCell sx={{ px: 2, py: 1.5, fontWeight: 500, color: 'text.primary', borderBottom: 'none' }}>
                          {formatGameName(match.gameName)}
                        </TableCell>
                        <TableCell
                          sx={{ px: 2, py: 1.5, fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary', borderBottom: 'none' }}
                          title={opponent}
                        >
                          {opponent === 'unknown' ? 'Unknown' : truncateId(opponent)}
                        </TableCell>
                        <TableCell sx={{ px: 2, py: 1.5, color: 'text.secondary', borderBottom: 'none' }}>
                          {formatDate(match.createdAt)}
                        </TableCell>
                        <TableCell align="right" sx={{ px: 2, py: 1.5, borderBottom: 'none' }}>
                          <Chip
                            label={badge.label}
                            size="small"
                            sx={{
                              minWidth: 56,
                              fontWeight: 700,
                              bgcolor: alpha(
                                badge.color === 'success' ? '#10b981' : badge.color === 'error' ? '#f43f5e' : '#f59e0b',
                                0.1,
                              ),
                              color:
                                badge.color === 'success'
                                  ? '#34d399'
                                  : badge.color === 'error'
                                    ? '#fb7185'
                                    : '#fbbf24',
                              border: '1px solid',
                              borderColor: alpha(
                                badge.color === 'success' ? '#10b981' : badge.color === 'error' ? '#f43f5e' : '#f59e0b',
                                0.4,
                              ),
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            !error && (
              <Box
                sx={{
                  mt: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  border: '1px dashed',
                  borderColor: '#2C3A45',
                  bgcolor: alpha('#030A15', 0.4),
                  px: 6,
                  py: 14,
                  textAlign: 'center',
                }}
              >
                <Gamepad2 size={40} strokeWidth={1.5} color="#5B6570" />
                <Typography sx={{ mt: 3, fontWeight: 500 }}>No matches yet</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  Play a game and your results will show up here.
                </Typography>
                <Button component={Link} href="/" variant="contained" sx={{ mt: 5, ...GRADIENT_BTN }}>
                  Play a Game
                </Button>
              </Box>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
}
