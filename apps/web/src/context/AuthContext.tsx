'use client';

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, getStoredToken, storeToken } from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  wins: number;
  losses: number;
  createdAt: string;
  role?: string;
  hasPassword?: boolean;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface OtpResponse {
  accessToken?: string;
  user?: AuthUser;
  isNewUser: boolean;
}

export interface AuthContextValue {
  /** The authenticated user, or null when signed out. */
  user: AuthUser | null;
  /** The JWT access token, or null when signed out. */
  token: string | null;
  /** True while the persisted session is being restored on first mount. */
  isLoading: boolean;
  loginWithOtp: (phone: string, code: string, username?: string) => Promise<OtpResponse>;
  updateUser: (patch: { username: string }) => Promise<AuthUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session on first mount: read the JWT from localStorage and
  // validate it against GET /auth/me.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = getStoredToken();
      if (!stored) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      setTokenState(stored);
      try {
        const me = await api.get<AuthUser>('/auth/me');
        if (!cancelled) setUser(me);
      } catch {
        // Token invalid or expired -> drop it.
        storeToken(null);
        if (!cancelled) {
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithOtp = useCallback(
    async (phone: string, code: string, username?: string) => {
      const res = await api.post<OtpResponse>('/auth/otp/verify', {
        phone,
        code,
        username,
      });
      // Persist the session ONLY when the account actually exists. When the
      // server returns isNewUser (first verify of a brand-new phone) the user
      // must finish the signup (enter a username) before any token is stored.
      if (res.accessToken && res.user) {
        storeToken(res.accessToken);
        setTokenState(res.accessToken);
        setUser(res.user);
      }
      return res;
    },
    [],
  );

  const updateUser = useCallback(async (patch: { username: string }) => {
    const updated = await api.patch<AuthUser>('/auth/me', patch);
    setUser(updated);
    return updated;
  }, []);

  const logout = useCallback(() => {
    storeToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      loginWithOtp,
      updateUser,
      logout,
    }),
    [user, token, isLoading, loginWithOtp, updateUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
