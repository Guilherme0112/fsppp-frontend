import { apiRequest } from './apiClient';

export interface BackendUser {
  id: number;
  nome: string;
  email: string;
}

export interface AuthResponse {
  usuario: BackendUser;
  token: string;
  tipo_token: string;
}

export const authService = {
  login: async (email: string, senha: string, nome_dispositivo = 'web-client') => {
    return apiRequest<AuthResponse>('/autenticacao/entrar', {
      method: 'POST',
      body: JSON.stringify({ email, senha, nome_dispositivo }),
      token: null,
    });
  },
  logout: async () => {
    return apiRequest<void>('/autenticacao/sair', {
      method: 'POST',
    });
  },
};
