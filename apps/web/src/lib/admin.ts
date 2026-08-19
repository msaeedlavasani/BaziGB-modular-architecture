import { api } from './api';

export interface AdminStats {
  users: { total: number; admins: number; newThisWeek: number };
  rooms: { total: number; waiting: number; playing: number; finished: number };
  games: { total: number; today: number; thisWeek: number; byType: Record<string, number> };
}

export interface AdminUser {
  id: string;
  email: string | null;
  username: string;
  phone: string | null;
  role: string;
  wins: number;
  losses: number;
  rating: number;
  deactivated: boolean;
  createdAt: string;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  total: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  return api.get<AdminStats>('/admin/stats');
}

export async function getAdminUsers(params?: {
  q?: string;
  role?: string;
  take?: number;
  skip?: number;
}): Promise<AdminUsersResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.role) query.set('role', params.role);
  if (params?.take) query.set('take', params.take.toString());
  if (params?.skip) query.set('skip', params.skip.toString());

  const queryString = query.toString();
  return api.get<AdminUsersResponse>(`/admin/users${queryString ? `?${queryString}` : ''}`);
}

/** Change a user's role (ADMIN only). */
export async function setUserRole(id: string, role: 'USER' | 'ADMIN'): Promise<void> {
  await api.patch(`/admin/users/${id}/role`, { role });
}

/** Reset user stats (ADMIN only). */
export async function resetUserStats(id: string): Promise<void> {
  await api.patch(`/admin/users/${id}/reset-stats`);
}

/** Deactivate or activate a user (ADMIN only). */
export async function deactivateUser(id: string, deactivated: boolean): Promise<void> {
  await api.patch(`/admin/users/${id}/deactivate`, { deactivated });
}

/** Delete a user (ADMIN only). */
export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/admin/users/${id}`);
}

/** Update user basic info (ADMIN only). */
export async function updateAdminUser(
  id: string,
  data: { username?: string; email?: string; phone?: string }
): Promise<{ ok: boolean; user: AdminUser }> {
  return api.patch(`/admin/users/${id}`, data);
}
