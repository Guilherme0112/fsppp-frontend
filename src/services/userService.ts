import { apiRequest } from './apiClient';

export interface BackendUserDetail {
  id: number;
  nome: string;
  email: string;
  funcao?: string;
  status?: string;
}

export const userService = {
  list: async (): Promise<BackendUserDetail[]> => {
    const res = await apiRequest<any>('/usuarios');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },
  create: (data: { nome: string; email: string; funcao?: string; status?: string; senha?: string }) =>
    apiRequest<BackendUserDetail>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: { nome?: string; email?: string; funcao?: string; status?: string }) =>
    apiRequest<BackendUserDetail>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/usuarios/${id}`, {
      method: 'DELETE',
    }),
};
