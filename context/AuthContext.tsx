import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usersAPI, alertsAPI, clearTokens, UserOut, AlertOut } from '@/services/api';

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

  useEffect(() => {
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem(USER_ID_KEY);
        if (storedId) {
          const user = await usersAPI.getMe();
          setCurrentUser(user);
          await fetchAlertsForUser(user.user_id);
        }
      } catch {
        await clearTokens();
        await AsyncStorage.removeItem(USER_ID_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchAlertsForUser = async (user_id: number) => {
    try {
      const all = await alertsAPI.getAll();
      setUserAlerts(all.filter((a: AlertOut) => a.user_id === user_id));
    } catch {
      setUserAlerts([]);
    }
  };

  const login = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = await usersAPI.login(username, password);
      await AsyncStorage.setItem(USER_ID_KEY, String(user.user_id));
      setCurrentUser(user);
      await fetchAlertsForUser(user.user_id);
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
    if (currentUser) await fetchAlertsForUser(currentUser.user_id);
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