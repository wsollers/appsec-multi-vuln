import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAccessToken } from './apiClient';
import type { AuthenticatedUser, Role } from '../types/api';

interface AuthState {
  user: AuthenticatedUser | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
  canWrite: (resource: string) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = 'northwind.auth';

const WRITE_RULES: Record<Role, (resource: string) => boolean> = {
  admin: () => true,
  sales: (r) => r === 'orders' || r === 'customers',
  viewer: () => false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  // Restore a prior session token (sessionStorage; cleared on tab close).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { token: string; user: AuthenticatedUser };
        setAccessToken(saved.token);
        setUser(saved.user);
      }
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      async login(username) {
        const res = await api.devLogin(username);
        setAccessToken(res.accessToken);
        setUser(res.user);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: res.accessToken, user: res.user }));
        } catch {
          /* ignore */
        }
      },
      logout() {
        setAccessToken(null);
        setUser(null);
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      },
      hasRole: (role) => Boolean(user?.roles.includes(role)),
      // UI convenience only — the server is always the source of truth (threat E1).
      canWrite: (resource) =>
        Boolean(user?.roles.some((role) => WRITE_RULES[role](resource))),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
