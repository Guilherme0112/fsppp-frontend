const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('fsppp_token');
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('fsppp_token', token);
  } else {
    localStorage.removeItem('fsppp_token');
  }
};

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = options.token !== undefined ? options.token : getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new Error(errorData.message || errorData.error || `Erro na API: ${response.status}`);
  }

  return response.json();
}

export interface BackendUserDetail {
  id: number;
  nome: string;
  email: string;
  funcao?: string;
  status?: string;
}

export interface AuthResponse {
  usuario: {
    id: number;
    nome: string;
    email: string;
  };
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

const createCrudService = <T>(basePath: string) => ({
  list: async (): Promise<T[]> => {
    const res = await apiRequest<T[] | { data: T[] }>(basePath);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as { data?: T[] }).data)) {
      return (res as { data: T[] }).data;
    }
    return [];
  },
  create: async (data: Record<string, unknown>) =>
    apiRequest<T>(basePath, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: async (id: number, data: Record<string, unknown>) =>
    apiRequest<T>(`${basePath}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: async (id: number) =>
    apiRequest<void>(`${basePath}/${id}`, {
      method: 'DELETE',
    }),
});

export const usersService = createCrudService<BackendUserDetail>('/usuarios');
