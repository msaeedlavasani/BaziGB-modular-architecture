'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  useTheme,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Chip,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
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
  fetchRooms,
  Room,
} from '@/lib/rooms';
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
  RefreshCw,
} from 'lucide-react';

export default function AdminPage() {
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [roomStatusFilter, setRoomStatusFilter] = useState('ALL');
  const [selectedRoomCodes, setSelectedRoomCodes] = useState<string[]>([]);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, r] = await Promise.all([
        getAdminStats(),
        getAdminUsers({
          q: search,
          role: roleFilter === 'ALL' ? undefined : roleFilter,
          take,
          skip: page * take,
        }),
        fetchRooms(),
      ]);
      setStats(s);
      setUsers(u.items);
      setTotalUsers(u.total);
      setRooms(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const timer = setTimeout(() => {
        loadData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [user, search, roleFilter, page, loadData]);

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

  const filteredRooms = rooms.filter(r =>
    roomStatusFilter === 'ALL' ? true : r.status === roomStatusFilter.toLowerCase()
  );

  async function handleBulkDeleteRooms() {
    if (selectedRoomCodes.length === 0) return;
    if (!confirm(`آیا از حذف ${selectedRoomCodes.length} اتاق انتخابی مطمئن هستید؟`)) return;

    setActionLoading(true);
    try {
      await api.delete('/admin/rooms/bulk', { codes: selectedRoomCodes });
      setSelectedRoomCodes([]);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'خطا در حذف گروهی اتاق‌ها');
    } finally {
      setActionLoading(false);
    }
  }

  function handleSelectRoom(code: string, checked: boolean) {
    if (checked) {
      setSelectedRoomCodes((prev) => [...prev, code]);
    } else {
      setSelectedRoomCodes((prev) => prev.filter((c) => c !== code));
    }
  }

  function handleSelectAllFilteredRooms(checked: boolean) {
    if (checked) {
      const allCodes = filteredRooms.map((r) => r.code);
      setSelectedRoomCodes(allCodes);
    } else {
      setSelectedRoomCodes([]);
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
        p: { xs: 4, sm: 8 },
        bgcolor: 'background.default',
        color: 'text.primary',
        direction: 'rtl',
      }}
    >
        <Box sx={{ width: '100%', maxWidth: 'lg', display: 'flex', flexDirection: 'column', gap: 10, py: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.main' }}>
              پنل مدیریت
            </Typography>
            <Button
              component={Link}
              href="/lobby"
              startIcon={<ArrowLeft size={20} />}
              sx={{ color: 'text.secondary', fontWeight: 600 }}
            >
              بازگشت به لابی
            </Button>
          </Box>

          {/* Stats */}
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={0} sx={{ p: 6, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 2 }}>
                  <Users color={theme.palette.primary.main} size={28} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>کل کاربران</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 900 }}>{stats?.users.total || 0}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>{stats?.users.admins || 0} مدیر سیستم</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={0} sx={{ p: 6, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 2 }}>
                  <PlayCircle color={theme.palette.success.main} size={28} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>اتاق‌های فعال</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 900 }}>{stats?.rooms.playing || 0}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>{stats?.rooms.waiting || 0} در انتظار بازیکن</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={0} sx={{ p: 6, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 2 }}>
                  <Trophy color={theme.palette.warning.main} size={28} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>کل بازی‌ها</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 900 }}>{stats?.games.total || 0}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>آمار تمامی سبک‌ها</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Users Management */}
          <Paper elevation={0} sx={{ p: 8, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.2) }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>مدیریت کاربران</Typography>
              <IconButton onClick={loadData} size="small" sx={{ color: 'text.secondary' }}>
                <RefreshCw size={20} />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 4, mb: 6, alignItems: 'center' }}>
              <TextField
                placeholder="جستجو بر اساس نام یا ایمیل..."
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flexGrow: 1 }}
              />
              <ToggleButtonGroup
                value={roleFilter}
                exclusive
                onChange={(_, val) => val && setRoleFilter(val)}
                size="small"
                sx={{ borderRadius: 2.5 }}
              >
                <ToggleButton value="ALL" sx={{ px: 4, fontWeight: 700 }}>همه</ToggleButton>
                <ToggleButton value="USER" sx={{ px: 4, fontWeight: 700 }}>کاربران</ToggleButton>
                <ToggleButton value="ADMIN" sx={{ px: 4, fontWeight: 700 }}>مدیران</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ textAlign: 'right' }}>نام کاربری</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>اطلاعات تماس</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>نقش</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>برد / باخت</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 12 }}><CircularProgress size={32} /></TableCell></TableRow>
                  ) : users.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 12 }}><Typography sx={{ color: 'text.disabled', fontWeight: 600 }}>کاربری یافت نشد</Typography></TableCell></TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id} sx={{ opacity: u.deactivated ? 0.5 : 1 }}>
                        <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>{u.username}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', textAlign: 'right' }}>{u.email || u.phone || '-'}</TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip label={u.role === 'ADMIN' ? 'مدیر' : 'کاربر'} size="small" color={u.role === 'ADMIN' ? 'error' : 'primary'} variant="outlined" />
                            {u.id !== user?.id && (
                              <IconButton size="small" onClick={() => setRoleTarget(u)} sx={{ color: 'text.disabled' }}>
                                {u.role === 'ADMIN' ? <Shield size={16} /> : <ShieldCheck size={16} />}
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>{u.wins} / {u.losses}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <IconButton size="small" onClick={() => setEditTarget(u)} sx={{ '&:hover': { color: 'primary.main' } }}><Pencil size={16} /></IconButton>
                            <IconButton size="small" onClick={() => setResetTarget(u)} sx={{ '&:hover': { color: 'warning.main' } }}><RotateCcw size={16} /></IconButton>
                            <IconButton size="small" onClick={() => setDeactivateTarget(u)} sx={{ '&:hover': { color: u.deactivated ? 'success.main' : 'error.main' } }}>{u.deactivated ? <ShieldCheck size={16} /> : <Ban size={16} />}</IconButton>
                            {u.id !== user?.id && <IconButton size="small" onClick={() => setDeleteTarget(u)} sx={{ '&:hover': { color: 'error.main' } }}><Trash2 size={16} /></IconButton>}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Rooms Management */}
          <Paper elevation={0} sx={{ p: 8, borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.2) }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>مدیریت اتاق‌ها</Typography>
              <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {selectedRoomCodes.length > 0 && (
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<Trash2 size={16} />}
                    onClick={handleBulkDeleteRooms}
                    disabled={actionLoading}
                  >
                    حذف {selectedRoomCodes.length} مورد
                  </Button>
                )}
                <ToggleButtonGroup
                  value={roomStatusFilter}
                  exclusive
                  onChange={(_, val) => val && setRoomStatusFilter(val)}
                  size="small"
                  sx={{ borderRadius: 2.5 }}
                >
                  <ToggleButton value="ALL" sx={{ px: 3, fontWeight: 700 }}>همه</ToggleButton>
                  <ToggleButton value="WAITING" sx={{ px: 3, fontWeight: 700 }}>در انتظار</ToggleButton>
                  <ToggleButton value="PLAYING" sx={{ px: 3, fontWeight: 700 }}>درحال‌بازی</ToggleButton>
                  <ToggleButton value="FINISHED" sx={{ px: 3, fontWeight: 700 }}>پایان‌یافته</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedRoomCodes.length > 0 && selectedRoomCodes.length < filteredRooms.length}
                        checked={filteredRooms.length > 0 && selectedRoomCodes.length === filteredRooms.length}
                        onChange={(e) => handleSelectAllFilteredRooms(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>کد اتاق</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>نوع بازی</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>وضعیت</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRooms.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 12 }}><Typography sx={{ color: 'text.disabled', fontWeight: 600 }}>اتاقی یافت نشد</Typography></TableCell></TableRow>
                  ) : (
                    filteredRooms.map((r) => (
                      <TableRow key={r.code} selected={selectedRoomCodes.includes(r.code)}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedRoomCodes.includes(r.code)}
                            onChange={(e) => handleSelectRoom(r.code, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1.1rem', textAlign: 'right', color: 'primary.main' }}>{r.code}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontWeight: 600 }}>{r.gameType}</TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Chip
                            label={
                              r.status === 'waiting' ? 'در انتظار' :
                              r.status === 'playing' ? 'در حال بازی' : 'پایان یافته'
                            }
                            size="small"
                            color={r.status === 'playing' ? 'success' : r.status === 'waiting' ? 'warning' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                             <IconButton size="small" color="error" onClick={async () => {
                               if (confirm(`آیا از حذف اتاق ${r.code} مطمئن هستید؟`)) {
                                 try { await api.delete(`/admin/rooms/${encodeURIComponent(r.code)}`); loadData(); } catch (err: any) { alert(err.message || 'خطا در حذف اتاق'); }
                               }
                             }}><Trash2 size={16} /></IconButton>
                            <Button size="small" component={Link} href={`/play/${r.code}`} variant="outlined">ورود</Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Dialogs */}
        <Dialog open={!!roleTarget} onClose={() => !roleSaving && setRoleTarget(null)} PaperProps={{ sx: { bgcolor: '#0B1622', border: '1px solid', borderColor: alpha('#2C3A45', 0.8), borderRadius: 4, color: 'white' } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>تغییر نقش؟</DialogTitle>
          <DialogContent><DialogContentText sx={{ color: 'text.secondary' }}>نقش کاربر «{roleTarget?.username}» تغییر کند؟</DialogContentText></DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRoleTarget(null)} disabled={roleSaving} variant="outlined" sx={{ color: 'text.secondary' }}>انصراف</Button>
            <Button onClick={handleConfirmRoleChange} disabled={roleSaving} variant="contained" sx={{ bgcolor: '#B25D16' }}>تأیید</Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={!!editTarget} onClose={() => !actionLoading && setEditTarget(null)} PaperProps={{ sx: { bgcolor: '#0B1622', border: '1px solid', borderColor: alpha('#2C3A45', 0.8), borderRadius: 4, color: 'white', minWidth: 400 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>ویرایش کاربر</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField label="نام کاربری" fullWidth size="small" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#030A15', color: 'white' }, '& .MuiInputLabel-root': { color: 'text.secondary' } }} />
              <TextField label="ایمیل" fullWidth size="small" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#030A15', color: 'white' }, '& .MuiInputLabel-root': { color: 'text.secondary' } }} />
              <TextField label="موبایل" fullWidth size="small" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#030A15', color: 'white' }, '& .MuiInputLabel-root': { color: 'text.secondary' } }} />
              {errorMsg && <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>{errorMsg}</Alert>}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditTarget(null)} disabled={actionLoading} variant="outlined" sx={{ color: 'text.secondary' }}>انصراف</Button>
            <Button onClick={handleEditUser} disabled={actionLoading} variant="contained" sx={{ bgcolor: '#B25D16' }}>ذخیره</Button>
          </DialogActions>
        </Dialog>

        {/* Reset Stats confirmation */}
        <Dialog open={!!resetTarget} onClose={() => !actionLoading && setResetTarget(null)} PaperProps={{ sx: { bgcolor: '#0B1622', border: '1px solid', borderColor: alpha('#2C3A45', 0.8), borderRadius: 4, color: 'white' } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>ریست آمار؟</DialogTitle>
          <DialogContent><DialogContentText sx={{ color: 'text.secondary' }}>آیا آمار کاربر «{resetTarget?.username}» صفر شود؟</DialogContentText></DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setResetTarget(null)} disabled={actionLoading} variant="outlined" sx={{ color: 'text.secondary' }}>انصراف</Button>
            <Button onClick={handleResetStats} disabled={actionLoading} variant="contained" sx={{ bgcolor: '#fbbf24', color: '#030A15' }}>تأیید</Button>
          </DialogActions>
        </Dialog>

        {/* Deactivate confirmation */}
        <Dialog open={!!deactivateTarget} onClose={() => !actionLoading && setDeactivateTarget(null)} PaperProps={{ sx: { bgcolor: '#0B1622', border: '1px solid', borderColor: alpha('#2C3A45', 0.8), borderRadius: 4, color: 'white' } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>{deactivateTarget?.deactivated ? 'فعالسازی؟' : 'غیرفعالسازی؟'}</DialogTitle>
          <DialogContent><DialogContentText sx={{ color: 'text.secondary' }}>آیا از تغییر وضعیت کاربر «{deactivateTarget?.username}» مطمئن هستید؟</DialogContentText></DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeactivateTarget(null)} disabled={actionLoading} variant="outlined" sx={{ color: 'text.secondary' }}>انصراف</Button>
            <Button onClick={handleToggleDeactivate} disabled={actionLoading} variant="contained" sx={{ bgcolor: deactivateTarget?.deactivated ? '#34d399' : '#f43f5e' }}>تأیید</Button>
          </DialogActions>
        </Dialog>

        {/* Delete User Confirmation */}
        <Dialog open={!!deleteTarget} onClose={() => !actionLoading && setDeleteTarget(null)} PaperProps={{ sx: { bgcolor: '#0B1622', border: '1px solid', borderColor: alpha('#2C3A45', 0.8), borderRadius: 4, color: 'white' } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>حذف قطعی؟</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DialogContentText sx={{ color: '#fb7185' }}>نام کاربری «{deleteTarget?.username}» را برای حذف وارد کنید:</DialogContentText>
              <TextField fullWidth size="small" value={deleteConfirmUsername} onChange={(e) => setDeleteConfirmUsername(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#030A15', color: 'white' } }} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteTarget(null)} variant="outlined" sx={{ color: 'text.secondary' }}>انصراف</Button>
            <Button onClick={handleDeleteUser} disabled={actionLoading || deleteConfirmUsername !== deleteTarget?.username} variant="contained" sx={{ bgcolor: '#f43f5e' }}>حذف نهایی</Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
}
