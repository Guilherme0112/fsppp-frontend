export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Ativo' | 'Inativo';
}

export interface BoardColumn {
  id: string;
  title: string;
}

export interface Board {
  id: string;
  title: string;
  description: string;
  columns: BoardColumn[];
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
}

export interface AppModule {
  id: string;
  name: string;
  icon: string;
}
