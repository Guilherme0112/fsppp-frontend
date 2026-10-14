import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';
import { authService, setAuthToken, getAuthToken } from '../services/apiClient';

interface AuthContextType {
  currentUser: User | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

interface StoredSession {
  user: User;
  permissions: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<StoredSession | null>(() => {
    const token = getAuthToken();
    if (token) {
      try {
        const saved = localStorage.getItem('app_session');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
      return {
        user: { id: '1', name: 'Usuário', email: 'usuario@empresa.com' },
        permissions: [],
      };
    }
    return null;
  });

  const login = async (email: string, password?: string): Promise<boolean> => {
    const res = await authService.login(email, password || '');
    setAuthToken(res.token);
    const newSession: StoredSession = {
      user: {
        id: String(res.usuario.id),
        name: res.usuario.nome,
        email: res.usuario.email,
      },
      permissions: res.permissoes || [],
    };
    setSession(newSession);
    localStorage.setItem('app_session', JSON.stringify(newSession));
    return true;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout
    }
    setAuthToken(null);
    setSession(null);
    localStorage.removeItem('app_session');
  };

  const permissions = session?.permissions || [];

  return (
    <AuthContext.Provider
      value={{
        currentUser: session?.user || null,
        permissions,
        hasPermission: (permission: string) => permissions.includes(permission),
        isAuthenticated: !!session,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
