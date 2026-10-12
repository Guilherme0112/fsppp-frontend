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
};

export const statusService = {
  list: async (quadroId: number): Promise<BackendStatus[]> => {
    const res = await apiRequest<any>(`/status-quadro/${quadroId}`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },
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
