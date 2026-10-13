import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService, statusService } from '../services/boardService';
import { taskService } from '../services/taskService';
import { userService, BackendUserDetail } from '../services/userService';
import { Board, BoardColumn, Task, User } from '../types';

export const mapBackendUser = (u: BackendUserDetail): User => ({
  id: String(u.id),
  name: u.nome,
  email: u.email,
  role: u.funcao || 'Membro',
  status: (u.status as 'Ativo' | 'Inativo') || 'Ativo',
});

// 1. Boards Module Hook (Enabled ONLY when activeModule === 'tasks' and authenticated)
export function useBoardsModule(isAuthenticated: boolean, activeModule: string) {
  const queryClient = useQueryClient();

  const boardsQuery = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const res = await boardService.list();
      return res.map((b) => ({
        id: String(b.id),
        title: b.nome,
        description: b.descricao || '',
        columns: [] as BoardColumn[],
      }));
    },
    enabled: isAuthenticated && activeModule === 'tasks',
    staleTime: Infinity,
  });

  const addBoardMutation = useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      const created = await boardService.create({ nome: title, descricao: description || null });
      await statusService.create(created.id, { nome: 'A Fazer', descricao: 'Pendentes' });
      await statusService.create(created.id, { nome: 'Em Andamento', descricao: 'Em execução' });
      await statusService.create(created.id, { nome: 'Concluído', descricao: 'Finalizado' });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  const editBoardMutation = useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description?: string }) => {
      const numericId = Number(id);
      if (!isNaN(numericId)) {
        await boardService.update(numericId, {
          nome: title,
          descricao: description !== undefined ? (description || null) : null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async (id: string) => {
      const numericId = Number(id);
      if (!isNaN(numericId)) {
        await boardService.delete(numericId);
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
  });

  return {
    boardsQuery,
    addBoardMutation,
    editBoardMutation,
    deleteBoardMutation,
  };
}

// 2. Statuses (Columns) Module Hook — mutations only. Status data itself is derived from
// useTasksModule's query, since GET /tarefas already returns each status alongside its tasks.
export function useStatusesModule(boardId: string | undefined, isAuthenticated: boolean, activeModule: string) {
  const queryClient = useQueryClient();

  const addStatusMutation = useMutation({
    mutationFn: async ({ boardId: bId, title }: { boardId: string; title: string }) => {
      const numericBoardId = Number(bId);
      if (!isNaN(numericBoardId)) {
        await statusService.create(numericBoardId, { nome: title });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  const editStatusMutation = useMutation({
    mutationFn: async ({ boardId: bId, statusId, title }: { boardId: string; statusId: string; title: string }) => {
      const numericBoardId = Number(bId);
      const numericStatusId = Number(statusId);
      if (!isNaN(numericBoardId) && !isNaN(numericStatusId)) {
        await statusService.update(numericBoardId, numericStatusId, { nome: title });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: async ({ boardId: bId, statusId }: { boardId: string; statusId: string }) => {
      const numericBoardId = Number(bId);
      const numericStatusId = Number(statusId);
      if (!isNaN(numericBoardId) && !isNaN(numericStatusId)) {
        await statusService.delete(numericBoardId, numericStatusId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  return {
    addStatusMutation,
    editStatusMutation,
    deleteStatusMutation,
  };
}

// 3. Tasks Module Hook (Enabled ONLY when activeModule === 'tasks', authenticated, and boardId is present)
export function useTasksModule(boardId: string | undefined, isAuthenticated: boolean, activeModule: string) {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['tasks', boardId],
    queryFn: async () => {
      if (!boardId) return { tasks: [], statuses: [], columnHasMore: {} as Record<string, boolean> };
      const res = await taskService.list(Number(boardId));
      return {
        tasks: res.tasks.map((t) => ({
          id: String(t.id),
          boardId: String(t.quadro_id),
          columnId: String(t.status_id),
          title: t.nome,
          description: t.descricao || '',
        })),
        statuses: res.statuses.map((s) => ({
          id: String(s.id),
          title: s.nome,
        })),
        columnHasMore: Object.fromEntries(
          res.pagination.map((p) => [String(p.statusId), p.currentPage < p.lastPage])
        ) as Record<string, boolean>,
      };
    },
    enabled: isAuthenticated && activeModule === 'tasks' && Boolean(boardId),
    staleTime: Infinity,
  });

  const addTaskMutation = useMutation({
    mutationFn: async (taskData: Omit<Task, 'id'>) => {
      const numericBoardId = Number(taskData.boardId);
      const numericStatusId = Number(taskData.columnId);
      if (!isNaN(numericBoardId) && !isNaN(numericStatusId)) {
        await taskService.create({
          nome: taskData.title,
          descricao: taskData.description || null,
          status_id: numericStatusId,
          quadro_id: numericBoardId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  const editTaskMutation = useMutation({
    mutationFn: async ({ id, updates, currentTasks }: { id: string; updates: Partial<Task>; currentTasks: Task[] }) => {
      const numericId = Number(id);
      const existingTask = currentTasks.find((t) => t.id === id);
      if (!isNaN(numericId) && existingTask) {
        const bId = Number(updates.boardId || existingTask.boardId);
        const columnId = Number(updates.columnId || existingTask.columnId);
        const title = updates.title !== undefined ? updates.title : existingTask.title;
        const description = updates.description !== undefined ? updates.description : existingTask.description;

        await taskService.update(numericId, {
          nome: title,
          descricao: description || null,
          status_id: columnId,
          quadro_id: bId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const numericId = Number(id);
      if (!isNaN(numericId)) {
        await taskService.delete(numericId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  return {
    tasksQuery,
    addTaskMutation,
    editTaskMutation,
    deleteTaskMutation,
  };
}

// 4. Users Module Hook (Enabled ONLY when activeModule === 'users' and authenticated)
export function useUsersModule(isAuthenticated: boolean, activeModule: string) {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await userService.list();
      return res.map(mapBackendUser);
    },
    enabled: isAuthenticated && activeModule === 'users',
    staleTime: Infinity,
  });

  const addUserMutation = useMutation({
    mutationFn: async (userData: Omit<User, 'id'>) => {
      return await userService.create({
        nome: userData.name,
        email: userData.email,
        funcao: userData.role,
        status: userData.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      const numericId = Number(id);
      if (!isNaN(numericId)) {
        return await userService.update(numericId, {
          nome: updates.name,
          email: updates.email,
          funcao: updates.role,
          status: updates.status,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const numericId = Number(id);
      if (!isNaN(numericId)) {
        await userService.delete(numericId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    usersQuery,
    addUserMutation,
    editUserMutation,
    deleteUserMutation,
  };
}
