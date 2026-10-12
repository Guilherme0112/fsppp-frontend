import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';
import { authService, setAuthToken, getAuthToken } from '../services/apiClient';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const token = getAuthToken();
    if (token) {
      try {
        const saved = localStorage.getItem('app_current_user');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
      return {
        id: '1',
        name: 'Usuário',
        email: 'usuario@empresa.com',
        role: 'Membro',
        status: 'Ativo',
      };
    }
    return null;
  });

  const login = async (email: string, password?: string): Promise<boolean> => {
    const res = await authService.login(email, password || '');
    setAuthToken(res.token);
    const userObj: User = {
      id: String(res.usuario.id),
      name: res.usuario.nome,
      email: res.usuario.email,
      role: 'Administrador',
      status: 'Ativo',
    };
    setCurrentUser(userObj);
    localStorage.setItem('app_current_user', JSON.stringify(userObj));
    return true;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout
    }
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem('app_current_user');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
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
