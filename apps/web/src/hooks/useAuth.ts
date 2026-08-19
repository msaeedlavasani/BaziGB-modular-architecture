'use client';

import { useContext } from 'react';
import { AuthContext, AuthContextValue } from '../context/AuthContext';

/**
 * Access the current auth session: `user`, `token`, `isLoading` plus the
 * `login` / `register` / `logout` helpers.
 *
 * Must be used inside an <AuthProvider> (wrapped at the app root layout).
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
