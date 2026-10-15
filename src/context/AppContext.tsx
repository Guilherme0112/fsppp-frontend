import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Board, Task, BoardColumn, AppModule } from '../types';
import { useAuth } from './AuthContext';
import {
  useBoardsModule,
  useStatusesModule,
  useTasksModule,
  useUsersModule,
} from '../hooks/useApiHooks';

interface AppContextType {
  activeModule: string;
  setActiveModule: (module: string) => void;
  modules: AppModule[];

  // Loading & Mutating states
  isLoading: boolean;
  isMutating: boolean;

  // Users
  users: User[];
  usersTotal: number;
  usersPage: number;
  usersPerPage: number;
  setUsersPage: (page: number) => void;
  setUsersPerPage: (perPage: number) => void;
  roles: string[];
  addUser: (user: { name: string; email: string; password: string; roles?: string[] }) => Promise<void>;
  editUser: (
    id: string,
    updates: { name: string; email: string; password?: string; roles?: string[] }
  ) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Boards
  boards: Board[];
  activeBoardId: string;
  setActiveBoardId: (id: string) => void;
  activeBoard: Board | undefined;
  addBoard: (title: string, description: string) => Promise<void>;
  editBoard: (id: string, title: string, description?: string) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;

  // Statuses (Columns)
  addStatusToBoard: (boardId: string, title: string) => Promise<void>;
  editStatus: (boardId: string, statusId: string, title: string) => Promise<void>;
  deleteStatus: (boardId: string, statusId: string) => Promise<void>;

  // Tasks
  tasks: Task[];
  // Whether each column (keyed by status/column id) has more pages of tasks beyond the initial batch.
  columnHasMore: Record<string, boolean>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  editTask: (id: string, updates: Partial<Task>, knownTask?: Task) => Promise<void>;
  moveTaskStatus: (taskId: string, newColumnId: string, knownTask?: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, hasPermission } = useAuth();

  // React client-side hash routing sync (#/tarefas, #/usuarios and #/pagamentos)
  const [activeModule, setActiveModuleState] = useState<string>(() => {
    const hash = window.location.hash.replace('#/', '');
    if (hash === 'tarefas' || hash === 'tasks') return 'tasks';
    if (hash === 'usuarios' || hash === 'users') return 'users';
    if (hash === 'pagamentos') return 'pagamentos';
    return 'tasks';
  });

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '#/tarefas';
    }

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash === 'tarefas' || hash === 'tasks') {
        setActiveModuleState('tasks');
      } else if (hash === 'usuarios' || hash === 'users') {
        setActiveModuleState('users');
      } else if (hash === 'pagamentos') {
        setActiveModuleState('pagamentos');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const setActiveModule = (mod: string) => {
    setActiveModuleState(mod);
    if (mod === 'tasks') {
      window.location.hash = '#/tarefas';
    } else if (mod === 'users') {
      window.location.hash = '#/usuarios';
    } else if (mod === 'pagamentos') {
      window.location.hash = '#/pagamentos';
    }
  };

  const [activeBoardId, setActiveBoardId] = useState<string>('');

  // Users table pagination (1-indexed, matching the backend's `page` query param)
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPageState] = useState(10);
  const setUsersPerPage = (perPage: number) => {
    setUsersPerPageState(perPage);
    setUsersPage(1);
  };

  // List of available modules, gated by the permission that lets a user see each one.
  const modules: AppModule[] = [
    ...(hasPermission('quadros.listar')
      ? [{ id: 'tasks', name: 'Tarefas & Quadros', icon: 'ViewKanban' }]
      : []),
    ...(hasPermission('usuario.listar')
      ? [{ id: 'users', name: 'Usuários', icon: 'People' }]
      : []),
    ...(hasPermission('solicitacoes.criar')
      ? [{ id: 'pagamentos', name: 'Solicitações de Pagamento', icon: 'Payments' }]
      : []),
  ];

  // If the current module isn't among the ones this user is allowed to see
  // (e.g. right after login, or a stale #hash from a bookmark), fall back to
  // the first permitted module instead of leaving a forbidden view mounted.
  useEffect(() => {
    if (isAuthenticated && modules.length > 0 && !modules.some((m) => m.id === activeModule)) {
      setActiveModule(modules[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeModule, modules.map((m) => m.id).join(',')]);

  // Hook per module, passing activeModule to control query enablement
  const { boardsQuery, addBoardMutation, editBoardMutation, deleteBoardMutation } = useBoardsModule(isAuthenticated, activeModule);
  const { addStatusMutation, editStatusMutation, deleteStatusMutation } = useStatusesModule(activeBoardId, isAuthenticated, activeModule);
  const { tasksQuery, addTaskMutation, editTaskMutation, deleteTaskMutation } = useTasksModule(activeBoardId, isAuthenticated, activeModule);
  const { usersQuery, rolesQuery, addUserMutation, editUserMutation, deleteUserMutation } = useUsersModule(usersPage, usersPerPage, isAuthenticated, activeModule);

  const boards = boardsQuery.data || [];
  const statuses = tasksQuery.data?.statuses || [];
  const tasks = tasksQuery.data?.tasks || [];
  const columnHasMore = tasksQuery.data?.columnHasMore || {};
  const users = usersQuery.data?.users || [];
  const usersTotal = usersQuery.data?.total || 0;
  const roles = rolesQuery.data || [];

  // Attach active board columns to active board object
  const activeBoardBase = boards.find((b) => b.id === activeBoardId);
  const activeBoard: Board | undefined = activeBoardBase
    ? {
        ...activeBoardBase,
        columns: statuses,
      }
    : undefined;

  const isLoading =
    boardsQuery.isLoading ||
    usersQuery.isLoading ||
    (Boolean(activeBoardId) && tasksQuery.isLoading);

  const isMutating =
    addBoardMutation.isPending ||
    editBoardMutation.isPending ||
    deleteBoardMutation.isPending ||
    addStatusMutation.isPending ||
    editStatusMutation.isPending ||
    deleteStatusMutation.isPending ||
    addTaskMutation.isPending ||
    editTaskMutation.isPending ||
    deleteTaskMutation.isPending ||
    addUserMutation.isPending ||
    editUserMutation.isPending ||
    deleteUserMutation.isPending;

  // User Actions
  const addUser = async (userData: { name: string; email: string; password: string; roles?: string[] }) => {
    await addUserMutation.mutateAsync(userData);
  };

  const editUser = async (
    id: string,
    updates: { name: string; email: string; password?: string; roles?: string[] }
  ) => {
    await editUserMutation.mutateAsync({ id, updates });
  };

  const deleteUser = async (id: string) => {
    await deleteUserMutation.mutateAsync(id);
  };

  // Board Actions
  const addBoard = async (title: string, description: string) => {
    const created = await addBoardMutation.mutateAsync({ title, description });
    if (created && created.id) {
      setActiveBoardId(String(created.id));
    }
  };

  const editBoard = async (id: string, title: string, description?: string) => {
    await editBoardMutation.mutateAsync({ id, title, description });
  };

  const deleteBoard = async (id: string) => {
    if (boards.length <= 1) return;
    await deleteBoardMutation.mutateAsync(id);
    setActiveBoardId('');
  };

  // Statuses (Columns) Actions
  const addStatusToBoard = async (boardId: string, title: string) => {
    await addStatusMutation.mutateAsync({ boardId, title });
  };

  const editStatus = async (boardId: string, statusId: string, title: string) => {
    await editStatusMutation.mutateAsync({ boardId, statusId, title });
  };

  const deleteStatus = async (boardId: string, statusId: string) => {
    await deleteStatusMutation.mutateAsync({ boardId, statusId });
  };

  // Task Actions
  const addTask = async (taskData: Omit<Task, 'id'>) => {
    await addTaskMutation.mutateAsync(taskData);
  };

  const editTask = async (id: string, updates: Partial<Task>, knownTask?: Task) => {
    const existingTask = knownTask || tasks.find((t) => t.id === id);
    await editTaskMutation.mutateAsync({ id, updates, existingTask });
  };

  const moveTaskStatus = async (taskId: string, newColumnId: string, knownTask?: Task) => {
    await editTask(taskId, { columnId: newColumnId }, knownTask);
  };

  const deleteTask = async (id: string) => {
    await deleteTaskMutation.mutateAsync(id);
  };

  return (
    <AppContext.Provider
      value={{
        activeModule,
        setActiveModule,
        modules,
        isLoading,
        isMutating,
        users,
        usersTotal,
        usersPage,
        usersPerPage,
        setUsersPage,
        setUsersPerPage,
        roles,
        addUser,
        editUser,
        deleteUser,
        boards,
        activeBoardId,
        setActiveBoardId,
        activeBoard,
        addBoard,
        editBoard,
        deleteBoard,
        addStatusToBoard,
        editStatus,
        deleteStatus,
        tasks,
        columnHasMore,
        addTask,
        editTask,
        moveTaskStatus,
        deleteTask,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
