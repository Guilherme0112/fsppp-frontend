import { apiRequest } from './apiClient';

export interface BackendUserDetail {
  id: number;
  nome: string;
  email: string;
  criado_em: string | null;
  atualizado_em: string | null;
  papeis: string[];
}

export interface PaginatedUsers {
  data: BackendUserDetail[];
  current_page: number;
  last_page: number;
  total: number;
}

export const userService = {
  list: (page: number, perPage: number): Promise<PaginatedUsers> =>
    apiRequest<PaginatedUsers>(`/usuarios?page=${page}&per_page=${perPage}`),
  listarPapeis: (): Promise<string[]> => apiRequest<string[]>('/papeis'),
  create: (data: { nome: string; email: string; senha: string; papeis?: string[] }) =>
    apiRequest<BackendUserDetail>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: { nome: string; email: string; senha?: string; papeis?: string[] }) =>
    apiRequest<BackendUserDetail>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/usuarios/${id}`, {
      method: 'DELETE',
    }),
};
