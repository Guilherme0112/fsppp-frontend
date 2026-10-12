import { apiRequest } from './apiClient';

export interface BackendTask {
  id: number;
  nome: string;
  descricao: string | null;
  status_id: number;
  quadro_id: number;
  data_inicio: string | null;
  data_fim: string | null;
}

export const taskService = {
  list: async (): Promise<BackendTask[]> => {
    const res = await apiRequest<any>('/tarefas');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },
  create: (data: {
    nome: string;
    descricao?: string | null;
    status_id: number;
    quadro_id: number;
    data_inicio?: string | null;
    data_fim?: string | null;
  }) =>
    apiRequest<BackendTask>('/tarefas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    id: number,
    data: {
      nome: string;
      descricao?: string | null;
      status_id: number;
      quadro_id: number;
      data_inicio?: string | null;
      data_fim?: string | null;
    }
  ) =>
    apiRequest<BackendTask>(`/tarefas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/tarefas/${id}`, {
      method: 'DELETE',
    }),
};
