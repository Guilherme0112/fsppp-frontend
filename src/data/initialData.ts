import { User, Board, Task } from '../types';

export const INITIAL_USERS: User[] = [
  { id: '1', name: 'Administrador', email: 'admin@empresa.com', role: 'Administrador', status: 'Ativo' },
  { id: '2', name: 'João Silva', email: 'joao@empresa.com', role: 'Gestor', status: 'Ativo' },
  { id: '3', name: 'Maria Souza', email: 'maria@empresa.com', role: 'Membro', status: 'Ativo' },
];

export const INITIAL_BOARDS: Board[] = [
  {
    id: 'b1',
    title: 'Quadro Principal',
    description: 'Gestão de tarefas do time',
    columns: [
      { id: 'c1', title: 'A Fazer', color: '#64748B' },
      { id: 'c2', title: 'Em Andamento', color: '#DC2626' },
      { id: 'c3', title: 'Concluído', color: '#16A34A' },
    ],
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    boardId: 'b1',
    columnId: 'c1',
    title: 'Configurar novos usuários',
    description:
      '<p>Esta atividade engloba a recepção dos novos colaboradores no time de operações.</p><ul><li>Enviar e-mail com credenciais de acesso</li><li>Convidar para reuniões de onboarding e boas-vindas</li><li>Disponibilizar permissões no sistema</li></ul>',
  },
  {
    id: 't2',
    boardId: 'b1',
    columnId: 'c2',
    title: 'Ajustar regras do quadro',
    description:
      '<p>Definir o fluxo de trabalho e limites de tarefas em andamento.</p><ol><li>Revisar status das listas</li><li>Padronizar cartões</li></ol>',
  },
  {
    id: 't3',
    boardId: 'b1',
    columnId: 'c3',
    title: 'Definir layout do sistema',
    description: '<p>Layout aprovado e aplicado com tema vermelho e estrutura ágil.</p>',
  },
];
