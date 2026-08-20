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
  return date.toLocaleString('fa-IR', {
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

const RESULT_BADGE: Record<
  MatchResult,
  { label: string; color: 'success' | 'error' | 'warning' }
> = {
  win: { label: 'برد', color: 'success' },
  loss: { label: 'باخت', color: 'error' },
  draw: { label: 'تساوی', color: 'warning' },
};

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
        <Typography
          variant="overline"
          sx={{
            display: 'block',
            color: 'text.secondary',
            mt: 0.5
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

/* ------------------------------ profile page ---------------------------- */

export default function ProfilePage() {
  const theme = useTheme();
  const router = useRouter();
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

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    setError(null);
    try {
      const data = await api.get<HistoryResponse>(`/history/${user.id}`);
      setStats(data.stats);
      setMatches(data.history);
    } catch (err: any) {
      setError(err?.message || 'دریافت تاریخچه بازی‌ها با خطا مواجه شد.');
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
      setSaveError('نام کاربری باید ۳ تا ۲۰ کاراکتر لاتین باشد');
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
      setSaveError(err.message || 'خطا در بروزرسانی پروفایل');
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 12, bgcolor: 'background.default' }}>
        <CircularProgress size={48} sx={{ color: 'primary.main' }} />
        <Typography sx={{ mt: 4, color: 'text.secondary', fontWeight: 600 }}>در حال بارگذاری...</Typography>
      </Box>
    );
  }

  if (!user) return null;

  const winRate = stats && stats.gamesPlayed > 0 ? `${((stats.wins / stats.gamesPlayed) * 100).toFixed(1)}%` : '—';

  return (
    <Box sx={{ flex: 1, bgcolor: 'background.default', color: 'text.primary', direction: 'rtl' }}>
      <Box sx={{ mx: 'auto', width: '100%', maxWidth: 1024, px: { xs: 4, sm: 8 }, py: 12 }}>
        {/* Header */}
        <Box component="header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 10 }}>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Button component={Link} href="/lobby" startIcon={<ChevronLeft size={18} />} sx={{ color: 'text.secondary' }}>
              بازگشت به لابی
            </Button>
            {user.role === 'ADMIN' && (
              <Button component={Link} href="/admin" variant="contained">
                پنل مدیریت
              </Button>
            )}
          </Box>
          <Button variant="outlined" onClick={logout} startIcon={<LogOut size={18} />} color="error">
            خروج
          </Button>
        </Box>

        {/* Identity card */}
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
                  <TextField value={newUsername} onChange={(e) => setNewUsername(e.target.value)} disabled={isSaving} error={!!saveError} helperText={saveError} autoFocus />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" size="small" onClick={handleSaveUsername} disabled={isSaving}>ذخیره</Button>
                    <Button variant="outlined" size="small" onClick={handleCancelEdit}>انصراف</Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900 }}>{user.username}</Typography>
                    <IconButton size="small" onClick={handleStartEdit}><Edit2 size={18} /></IconButton>
                    {saveSuccess && <Chip size="small" label="تغییر کرد" color="success" />}
                  </Box>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>{user.email || 'بدون ایمیل'}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 4, mb: 12 }}>
          <StatCard label="بازی‌ها" value={stats?.gamesPlayed ?? 0} icon={<Gamepad2 size={24} />} color={theme.palette.primary.main} />
          <StatCard label="برد" value={stats?.wins ?? 0} icon={<Trophy size={24} />} color={theme.palette.success.main} />
          <StatCard label="باخت" value={stats?.losses ?? 0} icon={<Swords size={24} />} color={theme.palette.error.main} />
          <StatCard label="نرخ برد" value={winRate} icon={<TrendingUp size={24} />} color={theme.palette.warning.main} />
        </Box>

        <Grid container spacing={8}>
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 6, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Lock size={20} color={theme.palette.primary.main} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>تغییر رمز عبور</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {user?.hasPassword && <TextField type="password" label="رمز فعلی" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} />}
                <TextField type="password" label="رمز جدید" value={pwNew} onChange={(e) => setPwNew(e.target.value)} />
                <TextField type="password" label="تکرار رمز جدید" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} />
                <Button variant="contained" onClick={handleChangePassword} disabled={savingPw} fullWidth>تغییر رمز</Button>
                {pwSuccess && <Alert severity="success">رمز عبور با موفقیت تغییر کرد.</Alert>}
                {pwError && <Alert severity="error">{pwError}</Alert>}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>تاریخچه بازی‌ها</Typography>
              <IconButton onClick={loadHistory} disabled={loadingHistory} size="small">
                <RefreshCw size={18} className={loadingHistory ? 'animate-spin' : ''} />
              </IconButton>
            </Box>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.2) }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>نوع بازی</TableCell>
                    <TableCell>حریف</TableCell>
                    <TableCell>زمان</TableCell>
                    <TableCell align="center">نتیجه</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingHistory ? <SkeletonRows /> : matches.length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 10, color: 'text.disabled' }}>هنوز بازی ثبت نشده است.</TableCell></TableRow>
                  ) : (
                    matches.map((match) => {
                      const result = getResult(match, user.id);
                      const badge = RESULT_BADGE[result];
                      const players = parsePlayers(match.players);
                      const opponent = players.find(p => p !== user.id) || 'Unknown';
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
