/**
 * app/admin/hooks/useAdminAuth.ts
 *
 * All admin auth logic in one place.
 * Login, logout, session validation — completely isolated.
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import adminApi, {
  setAdminCookies,
  clearAdminCookies,
  isAdminAuthed,
} from '../lib/api';
import { useAdminStore } from '../store/admin.store';
import type { AdminUser } from '../types';

interface LoginParams {
  identifier: string; // email OR username — matches AdminLoginDto
  password:   string;
}

interface UseAdminAuthReturn {
  loading:  boolean;
  error:    string;
  login:    (params: LoginParams) => Promise<void>;
  logout:   () => Promise<void>;
  isAuthed: () => boolean;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const router     = useRouter();
  const setAdmin   = useAdminStore(s => s.setAdmin);
  const clearAdmin = useAdminStore(s => s.clearAdmin);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const login = useCallback(async ({ identifier, password }: LoginParams) => {
    setLoading(true);
    setError('');

    try {
  
      const res = await adminApi.post('/auth/admin/login', { identifier, password });
      const payload = res.data.data ?? res.data;

      const { accessToken, refreshToken, user } = payload as {
        accessToken:  string;
        refreshToken: string;
        user:         AdminUser;
      };

      // Role guard — belt-and-braces check on the client too
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        setError('Access denied. This portal is for administrators only.');
        return;
      }

      // Persist admin session with admin-only cookies
      const adminId = String(user.id ?? user._id ?? '');
      setAdminCookies(accessToken, refreshToken, adminId, user.role);

      // Persist to admin-only Zustand store
      setAdmin({ ...user, id: adminId });

      router.push('/admin/admin/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (Array.isArray(msg)) setError(msg[0]);
      else setError(msg || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }, [router, setAdmin]);

  const logout = useCallback(async () => {
    try {
      await adminApi.post('/auth/logout');
    } catch {
      // Swallow — always clear local session
    } finally {
      clearAdminCookies();
      clearAdmin();
      router.push('/admin/login');
    }
  }, [router, clearAdmin]);

  const isAuthed = useCallback(() => isAdminAuthed(), []);

  return { loading, error, login, logout, isAuthed };
}