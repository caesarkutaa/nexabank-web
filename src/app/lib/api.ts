import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor ───────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('Securesphere_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ──────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Auto refresh token on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get('Securesphere_refresh');
      const userId       = Cookies.get('Securesphere_user_id');

      if (refreshToken && userId) {
        try {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            { userId, refreshToken },
          );

          const newToken = data.data.accessToken;
          Cookies.set('Securesphere_token', newToken, { expires: 1, secure: true, sameSite: 'Strict' });

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          return api(originalRequest);
        } catch {
          // Refresh failed — clear cookies and redirect
          clearAuthCookies();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      } else {
        clearAuthCookies();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

export function setAuthCookies(
  token:        string,
  refreshToken: string,
  userId:       string,
  role:         string,
) {
  const opts = { expires: 7, secure: true, sameSite: 'Strict' as const };
  Cookies.set('Securesphere_token',   token,        opts);
  Cookies.set('Securesphere_refresh', refreshToken, opts);
  Cookies.set('Securesphere_user_id', userId,       opts);
  Cookies.set('Securesphere_role',    role,         opts);
}

export function clearAuthCookies() {
  ['Securesphere_token', 'Securesphere_refresh', 'Securesphere_user_id', 'Securesphere_role'].forEach(
    (key) => Cookies.remove(key),
  );
}

export function getAuthToken(): string | undefined {
  return Cookies.get('Securesphere_token');
}

export function getUserRole(): string | undefined {
  return Cookies.get('Securesphere_role');
}

export function isAuthenticated(): boolean {
  return !!Cookies.get('Securesphere_token');
}

export function isAdmin(): boolean {
  const role = Cookies.get('Securesphere_role');
  return role === 'admin' || role === 'super_admin';
}

export default api;