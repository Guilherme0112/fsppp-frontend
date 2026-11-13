import { PrioridadeSolicitacao, StatusSolicitacao } from '../../services/solicitacaoCompraService';

export type StatusChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

export interface StatusMeta {
  label: string;
  shortLabel: string;
  color: StatusChipColor;
  description: string;
  step: number;
}

export const STATUS_META: Record<StatusSolicitacao, StatusMeta> = {
  pendente: {
    label: 'Pendente',
    shortLabel: 'Pendente',
    color: 'warning',
    description: 'Aguardando análise e autorização da diretoria.',
    step: 1,
  },
  enviado_diretoria: {
    label: 'Aguardando Diretoria',
    shortLabel: 'Diretoria',
    color: 'info',
    description: 'Enviada para autorização da diretoria.',
    step: 2,
  },
  aprovado_diretoria: {
    label: 'Aprovada pela Diretoria',
    shortLabel: 'Aprovada',
    color: 'success',
    description: 'Autorizada pela diretoria.',
    step: 2,
  },
  rejeitado_diretoria: {
    label: 'Rejeitada pela Diretoria',
    shortLabel: 'Rejeitada',
    color: 'error',
    description: 'Não autorizada pela diretoria.',
    step: 2,
  },
  analise_projetos: {
    label: 'Em análise de projetos',
    shortLabel: 'Projetos',
    color: 'info',
    description: 'Em verificação orçamentária e de projetos.',
    step: 3,
  },
  recursos_disponiveis_compras: {
    label: 'Em compras / cotações',
    shortLabel: 'Compras',
    color: 'warning',
    description: 'Encaminhada para compras e pesquisa de preços.',
    step: 4,
  },
  recursos_fundacao: {
    label: 'Recursos da Fundação',
    shortLabel: 'Fundação',
    color: 'secondary',
    description: 'Encaminhada para aquisição com recursos da Fundação.',
    step: 4,
  },
  aprovado: {
    label: 'Aprovada',
    shortLabel: 'Aprovada',
    color: 'success',
    description: 'Solicitação aprovada e liberada.',
    step: 4,
  },
  concluido: {
    label: 'Concluída',
    shortLabel: 'Concluída',
    color: 'success',
    description: 'Processo concluído e arquivado.',
    step: 5,
  },
  cancelado: {
    label: 'Cancelada',
    shortLabel: 'Cancelada',
    color: 'error',
    description: 'Processo cancelado.',
    step: 5,
  },
};

export const STATUS_OPTIONS = (Object.keys(STATUS_META) as StatusSolicitacao[]).map((value) => ({
  value,
  ...STATUS_META[value],
}));

export const getStatusMeta = (status: StatusSolicitacao): StatusMeta =>
  STATUS_META[status] || {
    label: status,
    shortLabel: status,
    color: 'default',
    description: '',
    step: 1,
  };

export interface PrioridadeMeta {
  label: string;
  color: StatusChipColor;
}

export const PRIORIDADE_META: Record<PrioridadeSolicitacao, PrioridadeMeta> = {
  baixa: { label: 'Baixa', color: 'default' },
  media: { label: 'Média', color: 'info' },
  alta: { label: 'Alta', color: 'warning' },
  urgente: { label: 'Urgente', color: 'error' },
};

export const getPrioridadeMeta = (prioridade: PrioridadeSolicitacao): PrioridadeMeta =>
  PRIORIDADE_META[prioridade] || { label: prioridade, color: 'default' };

const STATUS_AGUARDANDO: StatusSolicitacao[] = ['pendente', 'enviado_diretoria'];
const STATUS_EM_ANDAMENTO: StatusSolicitacao[] = [
  'aprovado_diretoria',
  'analise_projetos',
  'recursos_disponiveis_compras',
  'recursos_fundacao',
  'aprovado',
];
const STATUS_CONCLUIDOS: StatusSolicitacao[] = ['concluido'];
const STATUS_REJEITADOS: StatusSolicitacao[] = ['rejeitado_diretoria', 'cancelado'];

const somarStatus = (porStatus: Record<string, number>, statuses: StatusSolicitacao[]) =>
  statuses.reduce((total, status) => total + (porStatus[status] || 0), 0);

export const montarResumo = (porStatus: Record<string, number> = {}) => ({
  total: Object.values(porStatus).reduce((total, quantidade) => total + quantidade, 0),
  aguardando: somarStatus(porStatus, STATUS_AGUARDANDO),
  emAndamento: somarStatus(porStatus, STATUS_EM_ANDAMENTO),
  concluidas: somarStatus(porStatus, STATUS_CONCLUIDOS),
  rejeitadas: somarStatus(porStatus, STATUS_REJEITADOS),
});

export const podeConcluirStatus = (status: StatusSolicitacao) =>
  ['aprovado', 'aprovado_diretoria', 'recursos_disponiveis_compras', 'recursos_fundacao'].includes(status);
