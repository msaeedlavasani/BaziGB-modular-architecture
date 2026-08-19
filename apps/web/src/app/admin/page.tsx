'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Chip,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import {
  getAdminStats,
  getAdminUsers,
  setUserRole,
  resetUserStats,
  deactivateUser,
  deleteUser,
  updateAdminUser,
  AdminStats,
  AdminUser,
} from '@/lib/admin';
import {
  fetchSiteSettings,
  saveFooterSettings,
  FooterContent,
  FOOTER_DEFAULTS,
} from '@/lib/site-settings';
import {
  Users,
  PlayCircle,
  Trophy,
  ArrowLeft,
  Copyright,
  Shield,
  ShieldCheck,
  Pencil,
  RotateCcw,
  Ban,
  Trash2,
} from 'lucide-react';

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const take = 50;

  // Footer editor state
  const [footer, setFooter] = useState<FooterContent>(FOOTER_DEFAULTS);
  const [footerLinksJson, setFooterLinksJson] = useState('[]');
  const [savingFooter, setSavingFooter] = useState(false);
  const [footerError, setFooterError] = useState<string | null>(null);
  const [footerSaved, setFooterSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const timer = setTimeout(() => {
        loadData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [user, search, roleFilter, page]);

  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);

  // New states for user management
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', phone: '' });
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteConfirmUsername, setDeleteConfirmUsername] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editTarget) {
      setEditForm({
        username: editTarget.username,
        email: editTarget.email || '',
        phone: editTarget.phone || '',
      });
      setErrorMsg(null);
    }
  }, [editTarget]);

  async function handleConfirmRoleChange() {
    if (!roleTarget) return;
    setRoleSaving(true);
    try {
      await setUserRole(roleTarget.id, roleTarget.role === 'ADMIN' ? 'USER' : 'ADMIN');
      setRoleTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setRoleSaving(false);
    }
  }

  async function handleEditUser() {
    if (!editTarget) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await updateAdminUser(editTarget.id, editForm);
      setEditTarget(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در ویرایش کاربر');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetStats() {
    if (!resetTarget) return;
    setActionLoading(true);
    try {
      await resetUserStats(resetTarget.id);
      setResetTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleDeactivate() {
    if (!deactivateTarget) return;
    setActionLoading(true);
    try {
      await deactivateUser(deactivateTarget.id, !deactivateTarget.deactivated);
      setDeactivateTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteTarget || deleteConfirmUsername !== deleteTarget.username) return;
    setActionLoading(true);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteConfirmUsername('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  // Load current footer content once for the editor.
  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    let cancelled = false;
    fetchSiteSettings().then(({ footer }) => {
      if (cancelled) return;
      setFooter(footer);
      setFooterLinksJson(JSON.stringify(footer.links, null, 2));
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSaveFooter() {
    setFooterError(null);
    setFooterSaved(false);
    let links: { label: string; href: string }[];
    try {
      const parsed = JSON.parse(footerLinksJson || '[]') as unknown;
      if (!Array.isArray(parsed)) throw new Error('JSON باید آرایه باشد');
      links = parsed
        .filter((l: unknown) => l && typeof l === 'object')
        .map((l: Record<string, unknown>) => ({
          label: String(l.label ?? '').trim(),
          href: String(l.href ?? '').trim(),
        }))
        .filter((l) => l.label && l.href);
    } catch {
      setFooterError('فرمت JSON لینکها نامعتبر است');
      return;
    }
    setSavingFooter(true);
    try {
      await saveFooterSettings({ ...footer, links });
      setFooterLinksJson(JSON.stringify(links, null, 2));
      setFooterSaved(true);
      setTimeout(() => setFooterSaved(false), 3000);
    } catch (err: any) {
      setFooterError(err?.message || 'خطا در ذخیره فوتر');
    } finally {
      setSavingFooter(false);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        getAdminStats(),
        getAdminUsers({
          q: search,
          role: roleFilter === 'ALL' ? undefined : roleFilter,
          take,
          skip: page * take,
        }),
      ]);
      setStats(s);
      setUsers(u.items);
      setTotalUsers(u.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || (user && user.role !== 'ADMIN' && !authLoading)) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#030A15' }}>
        {authLoading ? <CircularProgress /> : <Typography color="white">دسترسی محدود</Typography>}
      </Box>
    );
  }

  if (!user) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        p: 3,
        bgcolor: '#030A15',
        color: 'white',
        direction: 'rtl',
      }}
    >
        <Box sx={{ width: '100%', maxWidth: 'lg', display: 'flex', flexDirection: 'column', gap: 4, py: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#F5A306' }}>
              پنل مدیریت
            </Typography>
            <Button
              component={Link}
              href="/lobby"
              startIcon={<ArrowLeft size={20} />}
              sx={{ color: 'text.secondary', '&:hover': { color: 'white' } }}
            >
              بازگشت به لابی
            </Button>
          </Box>

          {/* Stats */}
          <Grid container spacing={3}>
            <Grid xs={12} sm={6} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: alpha('#0B1622', 0.6), border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Users color="#F5A306" size={24} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>کل کاربران</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats?.users.total || 0}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{stats?.users.admins || 0} مدیر</Typography>
              </Paper>
            </Grid>
            <Grid xs={12} sm={6} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: alpha('#0B1622', 0.6), border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <PlayCircle color="#10b981" size={24} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>اتاق‌های فعال</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats?.rooms.playing || 0}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{stats?.rooms.waiting || 0} در انتظار</Typography>
              </Paper>
            </Grid>
            <Grid xs={12} sm={6} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: alpha('#0B1622', 0.6), border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Trophy color="#f59e0b" size={24} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>بازی‌های انجام شده</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats?.games.total || 0}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>در تمامی سبک‌ها</Typography>
              </Paper>
            </Grid>
            <Grid xs={12} sm={6} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: alpha('#0B1622', 0.6), border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Users color="#114B5E" size={24} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>کاربران جدید (هفته)</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats?.users.newThisWeek || 0}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>۷ روز اخیر</Typography>
              </Paper>
            </Grid>
            <Grid xs={12} sm={6} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: alpha('#0B1622', 0.6), border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Trophy color="#34d399" size={24} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>بازی‌های امروز</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats?.games.today || 0}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>امروز</Typography>
              </Paper>
            </Grid>
            <Grid xs={12} sm={6} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: alpha('#0B1622', 0.6), border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <PlayCircle color="#f59e0b" size={24} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>بازی‌های این هفته</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats?.games.thisWeek || 0}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>۷ روز اخیر</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Footer Content Editor */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: alpha('#0B1622', 0.6), border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Copyright color="#F5A306" size={22} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>محتوای فوتر</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="زیرنویس (tagline)"
                variant="outlined"
                size="small"
                value={footer.tagline}
                onChange={(e) => setFooter({ ...footer, tagline: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: '#030A15',
                    color: 'white',
                  },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                }}
              />
              <TextField
                label="متن کپی‌رایت"
                variant="outlined"
                size="small"
                value={footer.copyright}
                onChange={(e) => setFooter({ ...footer, copyright: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: '#030A15',
                    color: 'white',
                  },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                }}
              />
              <TextField
                label="لینک‌ها (JSON)"
                variant="outlined"
                size="small"
                multiline
                minRows={3}
                value={footerLinksJson}
                onChange={(e) => setFooterLinksJson(e.target.value)}
                helperText='فرمت: [{"label":"درباره ما","href":"/about"}]'
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: '#030A15',
                    color: 'white',
                    direction: 'ltr',
                    fontFamily: 'monospace',
                  },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                  '& .MuiFormHelperText-root': { color: 'text.disabled' },
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSaveFooter}
                  disabled={savingFooter}
                  startIcon={savingFooter ? <CircularProgress size={16} color="inherit" /> : null}
                  sx={{ bgcolor: '#B25D16', '&:hover': { bgcolor: '#8F470F' } }}
                >
                  ذخیره فوتر
                </Button>
                {footerSaved && (
                  <Typography sx={{ color: '#34d399', fontWeight: 600, fontSize: '0.875rem' }}>
                    ذخیره شد ✓
                  </Typography>
                )}
              </Box>
              {footerError && (
                <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                  {footerError}
                </Alert>
              )}
            </Box>
          </Paper>

          {/* Users Table */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: alpha('#0B1622', 0.6), border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3, alignItems: 'center' }}>
              <TextField
                placeholder="جستجو (نام کاربری، ایمیل، موبایل)..."
                variant="outlined"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: '#030A15',
                    color: 'white',
                  },
                }}
              />
              <ToggleButtonGroup
                value={roleFilter}
                exclusive
                onChange={(_, val) => val && setRoleFilter(val)}
                size="small"
                sx={{ bgcolor: '#030A15', borderRadius: 3 }}
              >
                <ToggleButton value="ALL" sx={{ color: 'white', px: 2 }}>همه</ToggleButton>
                <ToggleButton value="USER" sx={{ color: 'white', px: 2 }}>کاربر</ToggleButton>
                <ToggleButton value="ADMIN" sx={{ color: 'white', px: 2 }}>مدیر</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>نام کاربری</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>ایمیل / موبایل</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>نقش</TableCell>
                     <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>برد / باخت</TableCell>
                     <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>رتبه</TableCell>
                     <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>تاریخ عضویت</TableCell>
                     <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'center' }}>عملیات</TableCell>
                   </TableRow>

                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography sx={{ color: 'text.disabled' }}>کاربری یافت نشد</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow
                        key={u.id}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          opacity: u.deactivated ? 0.6 : 1,
                        }}
                      >
                        <TableCell sx={{ color: 'white', fontWeight: 600, textAlign: 'right' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {u.username}
                            {u.deactivated && (
                              <Chip
                                label="غیرفعال"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  bgcolor: alpha('#f43f5e', 0.2),
                                  color: '#fb7185',
                                  fontWeight: 700,
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', textAlign: 'right' }}>
                          {u.email || u.phone || '-'}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              component="span"
                              sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                bgcolor: u.role === 'ADMIN' ? alpha('#f43f5e', 0.1) : alpha('#B25D16', 0.1),
                                color: u.role === 'ADMIN' ? '#fb7185' : '#F5A306',
                              }}
                            >
                              {u.role === 'ADMIN' ? 'مدیر' : 'کاربر'}
                            </Box>
                            {u.id !== user?.id && (
                              <IconButton
                                size="small"
                                title={u.role === 'ADMIN' ? 'تبدیل به کاربر' : 'تبدیل به مدیر'}
                                onClick={() => setRoleTarget(u)}
                                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}
                              >
                                {u.role === 'ADMIN' ? <Shield size={16} /> : <ShieldCheck size={16} />}
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'white', textAlign: 'right' }}>
                          {u.wins} / {u.losses}
                        </TableCell>
                        <TableCell sx={{ color: '#fbbf24', fontWeight: 700, textAlign: 'right' }}>
                          {u.rating}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem', textAlign: 'right' }}>
                          {new Date(u.createdAt).toLocaleDateString('fa-IR')}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              title="ویرایش"
                              onClick={() => setEditTarget(u)}
                              sx={{ color: 'text.secondary', '&:hover': { color: '#F5A306' } }}
                            >
                              <Pencil size={16} />
                            </IconButton>
                            <IconButton
                              size="small"
                              title="ریست آمار"
                              onClick={() => setResetTarget(u)}
                              sx={{ color: 'text.secondary', '&:hover': { color: '#fbbf24' } }}
                            >
                              <RotateCcw size={16} />
                            </IconButton>
                            <IconButton
                              size="small"
                              title={u.deactivated ? 'فعالسازی' : 'غیرفعالسازی'}
                              onClick={() => setDeactivateTarget(u)}
                              sx={{
                                color: 'text.secondary',
                                '&:hover': { color: u.deactivated ? '#34d399' : '#f43f5e' },
                              }}
                            >
                              {u.deactivated ? <ShieldCheck size={16} /> : <Ban size={16} />}
                            </IconButton>
                            {u.id !== user?.id && (
                              <IconButton
                                size="small"
                                title="حذف"
                                onClick={() => setDeleteTarget(u)}
                                sx={{ color: 'text.secondary', '&:hover': { color: '#f43f5e' } }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, direction: 'ltr' }}>
              <Button
                disabled={page === 0 || loading}
                onClick={() => setPage(p => p - 1)}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Previous
              </Button>
              <Typography sx={{ alignSelf: 'center', color: 'text.secondary' }}>
                Page {page + 1}
              </Typography>
              <Button
                disabled={users.length < take || loading}
                onClick={() => setPage(p => p + 1)}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Next
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Role change confirmation */}
        <Dialog
          open={!!roleTarget}
          onClose={() => {
            if (!roleSaving) setRoleTarget(null);
          }}
          PaperProps={{
            sx: {
              bgcolor: '#0B1622',
              border: '1px solid',
              borderColor: alpha('#2C3A45', 0.8),
              borderRadius: 4,
              color: 'white',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            {roleTarget?.role === 'ADMIN' ? 'تبدیل به کاربر؟' : 'تبدیل به مدیر؟'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'text.secondary' }}>
              نقش کاربر «{roleTarget?.username}» از «{roleTarget?.role === 'ADMIN' ? 'مدیر' : 'کاربر'}» به «
              {roleTarget?.role === 'ADMIN' ? 'کاربر' : 'مدیر'}» تغییر کند؟
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() => setRoleTarget(null)}
              disabled={roleSaving}
              variant="outlined"
              sx={{ borderColor: alpha('#2C3A45', 0.8), color: 'text.secondary' }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleConfirmRoleChange}
              disabled={roleSaving}
              variant="contained"
              startIcon={roleSaving ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ bgcolor: '#B25D16', '&:hover': { bgcolor: '#8F470F' } }}
            >
              تأیید تغییر
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog
          open={!!editTarget}
          onClose={() => !actionLoading && setEditTarget(null)}
          PaperProps={{
            sx: {
              bgcolor: '#0B1622',
              border: '1px solid',
              borderColor: alpha('#2C3A45', 0.8),
              borderRadius: 4,
              color: 'white',
              minWidth: 400,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>ویرایش کاربر</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="نام کاربری"
                fullWidth
                size="small"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#030A15', color: 'white' },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                }}
              />
              <TextField
                label="ایمیل"
                fullWidth
                size="small"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#030A15', color: 'white' },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                }}
              />
              <TextField
                label="موبایل"
                fullWidth
                size="small"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#030A15', color: 'white' },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                }}
              />
              {errorMsg && (
                <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                  {errorMsg}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() => setEditTarget(null)}
              disabled={actionLoading}
              variant="outlined"
              sx={{ borderColor: alpha('#2C3A45', 0.8), color: 'text.secondary' }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={actionLoading}
              variant="contained"
              sx={{ bgcolor: '#B25D16', '&:hover': { bgcolor: '#8F470F' } }}
            >
              ذخیره تغییرات
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Stats Confirmation */}
        <Dialog
          open={!!resetTarget}
          onClose={() => !actionLoading && setResetTarget(null)}
          PaperProps={{
            sx: {
              bgcolor: '#0B1622',
              border: '1px solid',
              borderColor: alpha('#2C3A45', 0.8),
              borderRadius: 4,
              color: 'white',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>ریست آمار؟</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'text.secondary' }}>
              آیا مطمئن هستید که آمار برد/باخت/رتبه کاربر «{resetTarget?.username}» صفر شود؟ این عمل غیرقابل بازگشت است.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() => setResetTarget(null)}
              disabled={actionLoading}
              variant="outlined"
              sx={{ borderColor: alpha('#2C3A45', 0.8), color: 'text.secondary' }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleResetStats}
              disabled={actionLoading}
              variant="contained"
              sx={{ bgcolor: '#fbbf24', color: '#030A15', '&:hover': { bgcolor: '#d97706' } }}
            >
              تأیید ریست
            </Button>
          </DialogActions>
        </Dialog>

        {/* Deactivate/Activate Confirmation */}
        <Dialog
          open={!!deactivateTarget}
          onClose={() => !actionLoading && setDeactivateTarget(null)}
          PaperProps={{
            sx: {
              bgcolor: '#0B1622',
              border: '1px solid',
              borderColor: alpha('#2C3A45', 0.8),
              borderRadius: 4,
              color: 'white',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            {deactivateTarget?.deactivated ? 'فعالسازی کاربر؟' : 'غیرفعالسازی کاربر؟'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'text.secondary' }}>
              {deactivateTarget?.deactivated
                ? `آیا مایل به فعالسازی مجدد کاربر «${deactivateTarget?.username}» هستید؟`
                : `آیا مطمئن هستید که می‌خواهید کاربر «${deactivateTarget?.username}» را غیرفعال کنید؟ او دیگر قادر به ورود نخواهد بود.`}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() => setDeactivateTarget(null)}
              disabled={actionLoading}
              variant="outlined"
              sx={{ borderColor: alpha('#2C3A45', 0.8), color: 'text.secondary' }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleToggleDeactivate}
              disabled={actionLoading}
              variant="contained"
              sx={{
                bgcolor: deactivateTarget?.deactivated ? '#34d399' : '#f43f5e',
                '&:hover': { bgcolor: deactivateTarget?.deactivated ? '#059669' : '#e11d48' },
              }}
            >
              تأیید
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete User Confirmation */}
        <Dialog
          open={!!deleteTarget}
          onClose={() => {
            if (!actionLoading) {
              setDeleteTarget(null);
              setDeleteConfirmUsername('');
            }
          }}
          PaperProps={{
            sx: {
              bgcolor: '#0B1622',
              border: '1px solid',
              borderColor: alpha('#2C3A45', 0.8),
              borderRadius: 4,
              color: 'white',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>حذف قطعی کاربر؟</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DialogContentText sx={{ color: '#fb7185', fontWeight: 600 }}>
                این عمل غیرقابل بازگشت است و تمام داده‌های کاربر برای همیشه پاک خواهد شد.
              </DialogContentText>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                برای تأیید، نام کاربری «<strong>{deleteTarget?.username}</strong>» را وارد کنید:
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={deleteConfirmUsername}
                onChange={(e) => setDeleteConfirmUsername(e.target.value)}
                placeholder={deleteTarget?.username}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#030A15', color: 'white' },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() => setDeleteTarget(null)}
              disabled={actionLoading}
              variant="outlined"
              sx={{ borderColor: alpha('#2C3A45', 0.8), color: 'text.secondary' }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={actionLoading || deleteConfirmUsername !== deleteTarget?.username}
              variant="contained"
              sx={{ bgcolor: '#f43f5e', '&:hover': { bgcolor: '#e11d48' } }}
            >
              حذف نهایی کاربر
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
}
