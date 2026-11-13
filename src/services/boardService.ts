import { apiRequest } from './apiClient';

export interface BackendBoard {
  id: number;
  nome: string;
  descricao: string | null;
  usuario_id: number;
}

export interface BackendStatus {
  id: number;
  nome: string;
  descricao: string | null;
  quadro_id: number;
}

export interface SharedUserWithRole {
  id: number;
  nome: string;
  email: string;
  tipo: string;
}

export const boardService = {
  list: async (): Promise<BackendBoard[]> => {
    const res = await apiRequest<any>('/quadros');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },
  create: (data: { nome: string; descricao?: string | null }) =>
    apiRequest<BackendBoard>('/quadros', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: { nome: string; descricao?: string | null }) =>
    apiRequest<BackendBoard>(`/quadros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/quadros/${id}`, {
      method: 'DELETE',
    }),
  share: (id: number, userId: number) =>
    apiRequest<{ mensagem: string }>(`/quadros/${id}/compartilhar`, {
      method: 'POST',
      body: JSON.stringify({ usuario_id: userId }),
    }),
  listShareUsers: (page: number = 1, perPage: number = 10, search?: string) => {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (search) params.append('search', search);
    return apiRequest<{ data: { id: number; nome: string; email?: string }[]; current_page: number; last_page: number }>(`/quadros/usuarios-compartilhamento?${params.toString()}`);
  },
  listSharedUsers: (id: number) =>
    apiRequest<SharedUserWithRole[]>(`/quadros/${id}/usuarios-compartilhados`),
};

export const statusService = {
  create: (quadroId: number, data: { nome: string; descricao?: string | null }) =>
    apiRequest<BackendStatus>(`/status-quadro/${quadroId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (quadroId: number, id: number, data: { nome: string; descricao?: string | null }) =>
    apiRequest<BackendStatus>(`/status-quadro/${quadroId}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (quadroId: number, id: number) =>
    apiRequest<void>(`/status-quadro/${quadroId}/${id}`, {
      method: 'DELETE',
    }),
};
