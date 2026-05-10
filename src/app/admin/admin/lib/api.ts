import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// ─── Admin cookie names — never clash with user cookies ──────────────────────
export const ADMIN_COOKIES = {
  TOKEN:    'nx_admin_token',
  REFRESH:  'nx_admin_refresh',
  ID:       'nx_admin_id',
  ROLE:     'nx_admin_role',
} as const;

// ─── Cookie helpers (vanilla — no js-cookie dependency needed) ───────────────
function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${expires};samesite=strict`;
}

function removeCookie(name: string) {
  document.cookie = `${name}=;path=/;max-age=0;samesite=strict`;
}

// ─── Public helpers ───────────────────────────────────────────────────────────
export function setAdminCookies(
  token: string, refresh: string, id: string, role: string,
) {
  setCookie(ADMIN_COOKIES.TOKEN,   token,   1);   // 1 day for access token
  setCookie(ADMIN_COOKIES.REFRESH, refresh, 7);   // 7 days for refresh
  setCookie(ADMIN_COOKIES.ID,      id,      7);
  setCookie(ADMIN_COOKIES.ROLE,    role,    7);
}

export function clearAdminCookies() {
  Object.values(ADMIN_COOKIES).forEach(removeCookie);
}

export function getAdminToken()   { return getCookie(ADMIN_COOKIES.TOKEN);   }
export function getAdminRole()    { return getCookie(ADMIN_COOKIES.ROLE);    }
export function getAdminId()      { return getCookie(ADMIN_COOKIES.ID);      }
export function isAdminAuthed()   { return !!getCookie(ADMIN_COOKIES.TOKEN); }
export function isSuperAdmin()    { return getCookie(ADMIN_COOKIES.ROLE) === 'super_admin'; }

// ─── Axios instance ───────────────────────────────────────────────────────────
const adminApi = axios.create({
  baseURL: BASE,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach admin Bearer token on every request
adminApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAdminToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  err => Promise.reject(err),
);

// Auto-refresh + redirect to admin login on 401
let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token?: string) {
  queue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  queue = [];
}

adminApi.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Queue concurrent requests while refreshing
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`;
            resolve(adminApi(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing    = true;

    const refresh = getAdminToken()
      ? getCookie(ADMIN_COOKIES.REFRESH)
      : null;
    const adminId = getAdminId();

    if (!refresh || !adminId) {
      clearAdminCookies();
      if (typeof window !== 'undefined') window.location.href = '/admin/login';
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${BASE}/auth/refresh`, {
        userId: adminId, refreshToken: refresh,
      });
      const newToken = data.data?.accessToken ?? data.accessToken;
      setCookie(ADMIN_COOKIES.TOKEN, newToken, 1);
      processQueue(null, newToken);
      if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
      return adminApi(original);
    } catch (err) {
      processQueue(err);
      clearAdminCookies();
      if (typeof window !== 'undefined') window.location.href = '/admin/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default adminApi;