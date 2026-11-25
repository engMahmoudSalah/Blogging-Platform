import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { User } from '../types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, handle: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}
const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { setUser((await api<{ user: User }>('/auth/me')).user); } catch { setUser(null); }
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const login = async (email: string, password: string) => { await api('/auth/login', { method: 'POST', body: { email, password } }); await refresh(); };
  const register = async (name: string, handle: string, email: string, password: string) => { await api('/auth/register', { method: 'POST', body: { name, handle, email, password } }); await refresh(); };
  const logout = async () => { await api('/auth/logout', { method: 'POST' }); setUser(null); };
  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}
export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
};
