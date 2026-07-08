import React, { useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import type { User, LoginResponse } from '../types';
import { AuthContext } from './authContext';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await api.get<User>('/auth/me');
        if (!cancelled) setUser(res.data);
      } catch {
        if (!cancelled) {
          localStorage.removeItem('access_token');
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => { cancelled = true; };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    const token = res.data.access_token;
    if (!token) {
      throw new Error('Неверный email или пароль');
    }
    localStorage.setItem('access_token', token);
    const me = await api.get<User>('/auth/me');
    setUser(me.data);
  };

  const logout = (): void => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};