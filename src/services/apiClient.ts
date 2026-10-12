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

export interface BackendBoard {
  id: number;
  nome: string;
  descricao?: string | null;
}

export interface BackendStatus {
  id: number;
  nome: string;
  descricao?: string | null;
}

export interface BackendTask {
  id: number;
  nome: string;
  descricao?: string | null;
  quadro_id: number;
  status_id: number;
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

export const boardsService = createCrudService<BackendBoard>('/quadros');

export const statusService = {
  list: async (boardId: number): Promise<BackendStatus[]> => {
    const res = await apiRequest<BackendStatus[] | { data: BackendStatus[] }>(`/quadros/${boardId}/status`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as { data?: BackendStatus[] }).data)) {
      return (res as { data: BackendStatus[] }).data;
    }
    return [];
  },
  create: async (boardId: number, data: { nome: string; descricao?: string | null }) =>
    apiRequest<BackendStatus>(`/quadros/${boardId}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: async (boardId: number, statusId: number, data: { nome?: string; descricao?: string | null }) =>
    apiRequest<BackendStatus>(`/quadros/${boardId}/status/${statusId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: async (boardId: number, statusId: number) =>
    apiRequest<void>(`/quadros/${boardId}/status/${statusId}`, {
      method: 'DELETE',
    }),
};

export const tasksService = {
  list: async (): Promise<BackendTask[]> => {
    const res = await apiRequest<BackendTask[] | { data: BackendTask[] }>('/tarefas');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as { data?: BackendTask[] }).data)) {
      return (res as { data: BackendTask[] }).data;
    }
    return [];
  },
  create: async (data: { nome: string; descricao?: string | null; status_id: number; quadro_id: number }) =>
    apiRequest<BackendTask>('/tarefas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: async (id: number, data: { nome?: string; descricao?: string | null; status_id?: number; quadro_id?: number }) =>
    apiRequest<BackendTask>(`/tarefas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: async (id: number) =>
    apiRequest<void>(`/tarefas/${id}`, {
      method: 'DELETE',
    }),
};

export const usersService = createCrudService<BackendUserDetail>('/usuarios');
