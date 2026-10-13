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

export interface PaginatedTasks {
  data: BackendTask[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface BackendStatusWithTasks {
  id: number;
  nome: string;
  descricao: string | null;
  quadro_id: number;
}

export interface StatusPagination {
  statusId: number;
  currentPage: number;
  lastPage: number;
  total: number;
}

export interface GroupedTasks {
  statuses: BackendStatusWithTasks[];
  tasks: BackendTask[];
  pagination: StatusPagination[];
}

export const taskService = {
  // The API groups tasks by status in one call: [{ status, tarefas: <Laravel paginator> }, ...]
  // `tarefas` is a native LengthAwarePaginator::toArray() (data/current_page/last_page/total/...).
  // Statuses and each column's pagination state come from this same response, so callers don't
  // need a separate status-quadro request or a length-based guess to know if a column has more pages.
  list: async (quadroId: number): Promise<GroupedTasks> => {
    const res = await apiRequest<any>(`/tarefas?quadro_id=${quadroId}`);
    const groups = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return {
      statuses: groups.map((group: any) => group.status).filter(Boolean),
      tasks: groups.flatMap((group: any) =>
        Array.isArray(group?.tarefas?.data) ? group.tarefas.data : []
      ),
      pagination: groups
        .filter((group: any) => group?.status)
        .map((group: any) => ({
          statusId: group.status.id,
          currentPage: group.tarefas?.current_page,
          lastPage: group.tarefas?.last_page,
          total: group.tarefas?.total,
        })),
    };
  },
  // Fetches one more page (10 per page) of tasks belonging to a single status/column.
  listByStatus: (statusId: number, page: number): Promise<PaginatedTasks> =>
    apiRequest<PaginatedTasks>(`/tarefas/status/${statusId}?page=${page}`),
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
