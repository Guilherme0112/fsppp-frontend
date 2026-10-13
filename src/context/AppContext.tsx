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
  addUser: (user: Omit<User, 'id'>) => void;
  editUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

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
  editTask: (id: string, updates: Partial<Task>) => Promise<void>;
  moveTaskStatus: (taskId: string, newColumnId: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // React client-side hash routing sync (#/tarefas and #/usuarios)
  const [activeModule, setActiveModuleState] = useState<string>(() => {
    const hash = window.location.hash.replace('#/', '');
    if (hash === 'tarefas' || hash === 'tasks') return 'tasks';
    if (hash === 'usuarios' || hash === 'users') return 'users';
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
    }
  };

  const [activeBoardId, setActiveBoardId] = useState<string>('');

  // List of available modules
  const [modules] = useState<AppModule[]>([
    { id: 'tasks', name: 'Tarefas & Quadros', icon: 'ViewKanban' },
    { id: 'users', name: 'Usuários', icon: 'People' },
  ]);

  // Hook per module, passing activeModule to control query enablement
  const { boardsQuery, addBoardMutation, editBoardMutation, deleteBoardMutation } = useBoardsModule(isAuthenticated, activeModule);
  const { addStatusMutation, editStatusMutation, deleteStatusMutation } = useStatusesModule(activeBoardId, isAuthenticated, activeModule);
  const { tasksQuery, addTaskMutation, editTaskMutation, deleteTaskMutation } = useTasksModule(activeBoardId, isAuthenticated, activeModule);
  const { usersQuery, addUserMutation, editUserMutation, deleteUserMutation } = useUsersModule(isAuthenticated, activeModule);

  const boards = boardsQuery.data || [];
  const statuses = tasksQuery.data?.statuses || [];
  const tasks = tasksQuery.data?.tasks || [];
  const columnHasMore = tasksQuery.data?.columnHasMore || {};
  const users = usersQuery.data || [];

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
  const addUser = (userData: Omit<User, 'id'>) => {
    addUserMutation.mutate(userData);
  };

  const editUser = (id: string, updates: Partial<User>) => {
    editUserMutation.mutate({ id, updates });
  };

  const deleteUser = (id: string) => {
    deleteUserMutation.mutate(id);
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

  const editTask = async (id: string, updates: Partial<Task>) => {
    await editTaskMutation.mutateAsync({ id, updates, currentTasks: tasks });
  };

  const moveTaskStatus = async (taskId: string, newColumnId: string) => {
    await editTask(taskId, { columnId: newColumnId });
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
