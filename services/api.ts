import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.245:8000'; 

const TOKEN_KEY   = 'bananaguard_access_token';
const REFRESH_KEY = 'bananaguard_refresh_token';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

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

async function request<T>(method: string, path: string, body?: object): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? `Request failed: ${res.status}`);
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
  email:        string | null;
  phone_number: string | null;
  farm_name:    string | null;
  location:     string | null;
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

export interface DashboardSummary {
  scans_today:       number;
  active_detections: number;
  farmers_notified:  number;
  total_farmers:     number;
  latest_detection: {
    detection_id:     number;
    detected_class:   string | null;
    tier2_confidence: number | null;
    recommendation:   string | null;
  } | null;
}

// ─────────────────────────────────────────────────────────────
// USERS (Farmers)
// ─────────────────────────────────────────────────────────────

export const usersAPI = {
  /** Login — stores tokens, returns full user */
  login: async (username: string, password: string): Promise<UserOut> => {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail ?? 'Login failed');
    }
    const data: UserLoginResponse = await res.json();
    await storeTokens(data.access_token, data.refresh_token);
    return data.user;
  },

  /** Refresh access token using stored refresh token */
  refresh: async (): Promise<void> => {
    const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
    if (!refreshToken) throw new Error('No refresh token stored');
    const res = await fetch(`${BASE_URL}/users/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) throw new Error('Session expired. Please log in again.');
    const data = await res.json();
    await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
  },

  /** Get current user from token (no user_id needed) */
  getMe: (): Promise<UserOut> =>
    request('GET', '/users/me'),

  getAll: (): Promise<UserOut[]> =>
    request('GET', '/users'),

  getById: (user_id: number): Promise<UserOut> =>
    request('GET', `/users/${user_id}`),

  create: (payload: {
    full_name:     string;
    username:      string;
    password:      string;
    email?:        string;
    phone_number?: string;
    farm_name?:    string;
    location?:     string;
  }): Promise<UserOut> =>
    request('POST', '/users', payload),

  update: (
    user_id: number,
    payload: {
      full_name?:    string;
      username?:     string;
      email?:        string;
      phone_number?: string;
      farm_name?:    string;
      location?:     string;
    },
  ): Promise<UserOut> =>
    request('PUT', `/users/${user_id}`, payload),

  changePassword: (
    user_id: number,
    payload: { current_password: string; new_password: string; confirm_password: string },
  ): Promise<{ message: string }> =>
    request('PUT', `/users/${user_id}/change-password`, payload),

  delete: (user_id: number): Promise<void> =>
    request('DELETE', `/users/${user_id}`),
};

// ─────────────────────────────────────────────────────────────
// ALERTS
// ─────────────────────────────────────────────────────────────

export const alertsAPI = {
  getAll: (acknowledged?: boolean): Promise<AlertOut[]> => {
    const query = acknowledged !== undefined ? `?acknowledged=${acknowledged}` : '';
    return request('GET', `/alerts${query}`);
  },

  getById: (alert_id: number): Promise<AlertOut> =>
    request('GET', `/alerts/${alert_id}`),

  create: (payload: {
    detection_id?:  number;
    user_id?:       number;
    alert_message?: string;
  }): Promise<AlertOut> =>
    request('POST', '/alerts', payload),

  acknowledge: (alert_id: number): Promise<AlertOut> =>
    request('PATCH', `/alerts/${alert_id}/acknowledge`),
};

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────

export const dashboardAPI = {
  getSummary: (): Promise<DashboardSummary> =>
    request('GET', '/dashboard/summary'),
};