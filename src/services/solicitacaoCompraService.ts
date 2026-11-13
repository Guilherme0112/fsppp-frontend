import { apiRequest } from './apiClient';

export type StatusSolicitacao =
  | 'pendente'
  | 'enviado_diretoria'
  | 'aprovado_diretoria'
  | 'rejeitado_diretoria'
  | 'analise_projetos'
  | 'recursos_disponiveis_compras'
  | 'recursos_fundacao'
  | 'aprovado'
  | 'concluido'
  | 'cancelado';

export type PrioridadeSolicitacao = 'baixa' | 'media' | 'alta' | 'urgente';

export interface BackendSolicitacaoUsuario {
  id: number;
  nome: string;
  email: string;
}

export interface BackendSolicitacaoCompra {
  id: number;
  titulo: string;
  valor: number;
  prazo: string | null;
  descricao: string | null;
  usuario_id: number;
  status: StatusSolicitacao;
  prioridade: PrioridadeSolicitacao;
  motivo_rejeicao: string | null;
  recursos_existem: boolean | null;
  status_compra: string | null;
  aprovado_cancelado_por: number | null;
  concluido_por: number | null;
  diretoria_por: number | null;
  projetos_por: number | null;
  compras_por: number | null;
  created_at: string | null;
  updated_at: string | null;
  usuario?: BackendSolicitacaoUsuario;
  aprovado_cancelado_por_usuario?: BackendSolicitacaoUsuario | null;
  concluido_por_usuario?: BackendSolicitacaoUsuario | null;
  diretoria_por_usuario?: BackendSolicitacaoUsuario | null;
  projetos_por_usuario?: BackendSolicitacaoUsuario | null;
  compras_por_usuario?: BackendSolicitacaoUsuario | null;
}

export interface PaginatedSolicitacoes {
  data: BackendSolicitacaoCompra[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface ResumoSolicitacoes {
  total: number;
  por_status: Record<string, number>;
}

export interface FiltrosSolicitacoes {
  status?: StatusSolicitacao | '';
  busca?: string;
}

export interface DadosSolicitacaoCompra {
  titulo: string;
  valor: number;
  descricao?: string | null;
  prioridade?: PrioridadeSolicitacao;
  prazo?: string | null;
}

const montarQuery = (page: number, perPage: number, filtros?: FiltrosSolicitacoes) => {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  if (filtros?.status) {
    params.set('status', filtros.status);
  }

  if (filtros?.busca?.trim()) {
    params.set('busca', filtros.busca.trim());
  }

  return params.toString();
};

export const solicitacaoCompraService = {
  minhas: (page: number, perPage: number, filtros?: FiltrosSolicitacoes): Promise<PaginatedSolicitacoes> =>
    apiRequest<PaginatedSolicitacoes>(`/solicitacoes-compra/minhas?${montarQuery(page, perPage, filtros)}`),
  todas: (page: number, perPage: number, filtros?: FiltrosSolicitacoes): Promise<PaginatedSolicitacoes> =>
    apiRequest<PaginatedSolicitacoes>(`/solicitacoes-compra/todas?${montarQuery(page, perPage, filtros)}`),
  resumo: (): Promise<ResumoSolicitacoes> =>
    apiRequest<ResumoSolicitacoes>('/solicitacoes-compra/resumo'),
  criar: (data: DadosSolicitacaoCompra) =>
    apiRequest<BackendSolicitacaoCompra>('/solicitacoes-compra', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  atualizar: (id: number, data: DadosSolicitacaoCompra) =>
    apiRequest<BackendSolicitacaoCompra>(`/solicitacoes-compra/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  avaliarDiretoria: (id: number, data: { aprovado: boolean; prioridade: PrioridadeSolicitacao; motivo_rejeicao?: string }) =>
    apiRequest<BackendSolicitacaoCompra>(`/solicitacoes-compra/${id}/diretoria`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  avaliarProjetos: (id: number, recursos_existem: boolean) =>
    apiRequest<BackendSolicitacaoCompra>(`/solicitacoes-compra/${id}/projetos`, {
      method: 'PATCH',
      body: JSON.stringify({ recursos_existem }),
    }),
  atualizarStatusCompra: (id: number, status_compra: string) =>
    apiRequest<BackendSolicitacaoCompra>(`/solicitacoes-compra/${id}/status-compra`, {
      method: 'PATCH',
      body: JSON.stringify({ status_compra }),
    }),
  atualizarStatus: (id: number, status: 'aprovado' | 'cancelado') =>
    apiRequest<BackendSolicitacaoCompra>(`/solicitacoes-compra/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  concluir: (id: number) =>
    apiRequest<BackendSolicitacaoCompra>(`/solicitacoes-compra/${id}/concluir`, {
      method: 'PATCH',
    }),
};
