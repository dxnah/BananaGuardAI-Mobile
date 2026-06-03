import { createContext, useContext, useState, ReactNode } from 'react';
import { FARMERS } from '@/constants/MockData';

type Farmer = typeof FARMERS[0];

type AuthContextType = {
  currentUser: Farmer | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Farmer | null>(null);

  const login = (email: string, password: string): boolean => {
    const found = FARMERS.find(
      (f) =>
        f.email.toLowerCase() === email.toLowerCase().trim() &&
        f.password === password
    );
    if (found) {
      setCurrentUser(found);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}