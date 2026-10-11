import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Board, Task, BoardColumn, AppModule } from '../types';
import { INITIAL_USERS, INITIAL_BOARDS, INITIAL_TASKS } from '../data/initialData';

interface AppContextType {
  activeModule: string;
  setActiveModule: (module: string) => void;
  modules: AppModule[];

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
  addBoard: (title: string, description: string) => void;
  deleteBoard: (id: string) => void;

  // Statuses (Columns)
  addStatusToBoard: (boardId: string, title: string, color: string) => void;
  editStatus: (boardId: string, statusId: string, title: string, color: string) => void;
  deleteStatus: (boardId: string, statusId: string) => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  editTask: (id: string, updates: Partial<Task>) => void;
  moveTaskStatus: (taskId: string, newColumnId: string) => void;
  deleteTask: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<string>('tasks');

  // List of available modules (modular architecture ready to receive new modules)
  const [modules] = useState<AppModule[]>([
    { id: 'tasks', name: 'Tarefas & Quadros', icon: 'ViewKanban' },
    { id: 'users', name: 'Administração de Usuários', icon: 'People' },
    { id: 'settings', name: 'Configurações', icon: 'Settings' },
  ]);

  // Users state
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('app_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Boards state
  const [boards, setBoards] = useState<Board[]>(() => {
    try {
      const saved = localStorage.getItem('app_boards');
      return saved ? JSON.parse(saved) : INITIAL_BOARDS;
    } catch {
      return INITIAL_BOARDS;
    }
  });

  const [activeBoardId, setActiveBoardId] = useState<string>(() => boards[0]?.id || 'b1');

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('app_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  useEffect(() => {
    localStorage.setItem('app_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('app_boards', JSON.stringify(boards));
  }, [boards]);

  useEffect(() => {
    localStorage.setItem('app_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];

  // User Actions
  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: String(Date.now()) };
    setUsers((prev) => [...prev, newUser]);
  };

  const editUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Board Actions
  const addBoard = (title: string, description: string) => {
    const newBoard: Board = {
      id: `b-${Date.now()}`,
      title,
      description,
      columns: [
        { id: `c-${Date.now()}-1`, title: 'A Fazer', color: '#64748B' },
        { id: `c-${Date.now()}-2`, title: 'Em Andamento', color: '#DC2626' },
        { id: `c-${Date.now()}-3`, title: 'Concluído', color: '#16A34A' },
      ],
    };
    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
  };

  const deleteBoard = (id: string) => {
    if (boards.length <= 1) return;
    const remaining = boards.filter((b) => b.id !== id);
    setBoards(remaining);
    setActiveBoardId(remaining[0].id);
    setTasks((prev) => prev.filter((t) => t.boardId !== id));
  };

  // Statuses (Columns) Actions
  const addStatusToBoard = (boardId: string, title: string, color: string) => {
    const newCol: BoardColumn = {
      id: `col-${Date.now()}`,
      title,
      color: color || '#DC2626',
    };
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, columns: [...b.columns, newCol] } : b))
    );
  };

  const editStatus = (boardId: string, statusId: string, title: string, color: string) => {
    setBoards((prev) =>
      prev.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          columns: b.columns.map((col) => (col.id === statusId ? { ...col, title, color } : col)),
        };
      })
    );
  };

  const deleteStatus = (boardId: string, statusId: string) => {
    setBoards((prev) =>
      prev.map((b) => {
        if (b.id !== boardId || b.columns.length <= 1) return b;
        const fallbackCol = b.columns.find((c) => c.id !== statusId);
        if (fallbackCol) {
          setTasks((tList) =>
            tList.map((t) => (t.boardId === boardId && t.columnId === statusId ? { ...t, columnId: fallbackCol.id } : t))
          );
        }
        return {
          ...b,
          columns: b.columns.filter((c) => c.id !== statusId),
        };
      })
    );
  };

  // Task Actions
  const addTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = { ...taskData, id: `t-${Date.now()}` };
    setTasks((prev) => [...prev, newTask]);
  };

  const editTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const moveTaskStatus = (taskId: string, newColumnId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, columnId: newColumnId } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        activeModule,
        setActiveModule,
        modules,
        users,
        addUser,
        editUser,
        deleteUser,
        boards,
        activeBoardId,
        setActiveBoardId,
        activeBoard,
        addBoard,
        deleteBoard,
        addStatusToBoard,
        editStatus,
        deleteStatus,
        tasks,
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
