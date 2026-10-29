import AsyncStorage from '@react-native-async-storage/async-storage';

// Same server as the web admin. To test against a backend on your own computer, create a
// ".env" file with EXPO_PUBLIC_API_URL=http://<your-computer-ip>:8000 and restart Expo.
const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? 'https://bananaguardai-backend-production.up.railway.app'
).replace(/\/$/, '');

const TOKEN_KEY   = 'bananaguard_access_token';
const REFRESH_KEY = 'bananaguard_refresh_token';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function storeTokens(access: string, refresh: string) {
  await AsyncStorage.multiSet([[TOKEN_KEY, access], [REFRESH_KEY, refresh]]);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// FastAPI sends plain text for most errors but a list for validation errors
function readableError(body: any, fallback: string): string {
  const detail = body?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const msg = detail
      .map((d) => String(d?.msg ?? '').replace(/^Value error, /, ''))
      .filter(Boolean)
      .join('. ');
    return msg || fallback;
  }
  return fallback;
}

async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiError('Cannot reach the server. Check your internet connection.', 0);
  }
}

async function request<T>(method: string, path: string, body?: object, retried = false): Promise<T> {
  const headers = await authHeaders();
  const res = await send(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Access tokens expire after ~30 minutes: renew once with the refresh token, then retry
  if (res.status === 401 && !retried) {
    try {
      await usersAPI.refresh();
      return request<T>(method, path, body, true);
    } catch {
      /* refresh failed, fall through to the normal 401 error below */
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new ApiError(readableError(error, `Request failed (${res.status})`), res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface UserOut {
  user_id:      number;
  full_name:    string;
  username:     string;
  phone_number: string | null;
  created_at:   string | null;
}

export interface UserLoginResponse {
  access_token:  string;
  refresh_token: string;
  token_type:    string;
  user:          UserOut;
}

export interface AlertOut {
  alert_id:      number;
  detection_id:  number | null;
  user_id:       number | null;
  alert_message: string | null;
  alert_sent_at: string | null;
  acknowledged:  boolean;
}

// ─────────────────────────────────────────────────────────────
// FARMER ACCOUNT
// ─────────────────────────────────────────────────────────────

export const usersAPI = {
  /** Login: stores tokens, returns the farmer */
  login: async (username: string, password: string): Promise<UserOut> => {
    const res = await send(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new ApiError(readableError(error, 'Login failed'), res.status);
    }
    const data: UserLoginResponse = await res.json();
    await storeTokens(data.access_token, data.refresh_token);
    return data.user;
  },

  /** Renew the access token using the stored refresh token */
  refresh: async (): Promise<void> => {
    const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
    if (!refreshToken) throw new ApiError('No refresh token stored', 401);
    const res = await send(`${BASE_URL}/users/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) throw new ApiError('Session expired. Please log in again.', 401);
    const data = await res.json();
    await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
  },

  /** The logged-in farmer */
  getMe: (): Promise<UserOut> => request('GET', '/users/me'),

  /** Sign up: farmer name, username, mobile number and password */
  create: (payload: {
    full_name:    string;
    username:     string;
    phone_number: string;
    password:     string;
  }): Promise<UserOut> => request('POST', '/users', payload),

  /** Farmers can edit their own name and mobile number (the username is set by the admin) */
  updateMe: (payload: { full_name?: string; phone_number?: string }): Promise<UserOut> =>
    request('PUT', '/users/me', payload),

  changePassword: (
    user_id: number,
    payload: { current_password: string; new_password: string; confirm_password: string },
  ): Promise<{ message: string }> =>
    request('PUT', `/users/${user_id}/change-password`, payload),
};

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS (the logged-in farmer's own alerts)
// ─────────────────────────────────────────────────────────────

export const alertsAPI = {
  getMine: (acknowledged?: boolean): Promise<AlertOut[]> => {
    const query = acknowledged !== undefined ? `?acknowledged=${acknowledged}` : '';
    return request('GET', `/users/me/alerts${query}`);
  },

  acknowledge: (alert_id: number): Promise<AlertOut> =>
    request('PATCH', `/users/me/alerts/${alert_id}/acknowledge`),
};
