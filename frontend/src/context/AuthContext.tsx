import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import type { User } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('crm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('crm_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!localStorage.getItem('crm_token')) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      localStorage.setItem('crm_user', JSON.stringify(response.data.user));
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;
      
      localStorage.setItem('crm_token', receivedToken);
      localStorage.setItem('crm_user', JSON.stringify(receivedUser));
      
      setToken(receivedToken);
      setUser(receivedUser);
      toast.success(`Welcome back, ${receivedUser.name}!`);
      return true;
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid credentials. Please verify your email and password.';
      toast.error(errorMsg);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      setUser(null);
      setToken(null);
      toast.info('You have logged out');
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    localStorage.setItem('crm_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
