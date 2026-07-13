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
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get<User>('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    localStorage.setItem('access_token', res.data.access_token);
    try {
      const me = await api.get<User>('/auth/me');
      setUser(me.data);
    } catch {
      localStorage.removeItem('access_token');
      throw new Error('Не удалось загрузить профиль');
    }
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