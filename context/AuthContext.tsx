import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usersAPI, alertsAPI, clearTokens, ApiError, UserOut, AlertOut } from '@/services/api';

type AuthContextType = {
  currentUser: UserOut | null;
  userAlerts: AlertOut[];
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  acknowledgeAlert: (alert_id: number) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userAlerts: [],
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
  refreshAlerts: async () => {},
  acknowledgeAlert: async () => {},
});

const USER_ID_KEY = 'bananaguard_user_id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserOut | null>(null);
  const [userAlerts, setUserAlerts]   = useState<AlertOut[]>([]);
  const [loading, setLoading]         = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      setUserAlerts(await alertsAPI.getMine());
    } catch {
      /* keep what we already have; the next refresh will try again */
    }
  }, []);

  // Restore the session on app start
  useEffect(() => {
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem(USER_ID_KEY);
        if (storedId) {
          const user = await usersAPI.getMe();
          setCurrentUser(user);
          await fetchAlerts();
        }
      } catch (e) {
        // Only sign out when the session is really invalid, not when the phone is just offline
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          await clearTokens();
          await AsyncStorage.removeItem(USER_ID_KEY);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchAlerts]);

  // New alerts from the UAV show up on their own every minute
  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(id);
  }, [currentUser, fetchAlerts]);

  const login = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = await usersAPI.login(username, password);
      await AsyncStorage.setItem(USER_ID_KEY, String(user.user_id));
      setCurrentUser(user);
      await fetchAlerts();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message ?? 'Could not connect to server.' };
    }
  };

  const logout = async () => {
    await clearTokens();
    await AsyncStorage.removeItem(USER_ID_KEY);
    setCurrentUser(null);
    setUserAlerts([]);
  };

  const refreshUser = async () => {
    if (!currentUser) return;
    try {
      const updated = await usersAPI.getMe();
      setCurrentUser(updated);
    } catch {}
  };

  const refreshAlerts = async () => {
    if (currentUser) await fetchAlerts();
  };

  const acknowledgeAlert = async (alert_id: number) => {
    await alertsAPI.acknowledge(alert_id);
    setUserAlerts((prev) =>
      prev.map((a) => (a.alert_id === alert_id ? { ...a, acknowledged: true } : a))
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userAlerts,
        loading,
        login,
        logout,
        refreshUser,
        refreshAlerts,
        acknowledgeAlert,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}