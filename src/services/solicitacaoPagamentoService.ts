import { apiRequest } from './apiClient';

export type StatusSolicitacao = 'pendente' | 'aprovado' | 'concluido' | 'cancelado';

export interface BackendSolicitacaoUsuario {
  id: number;
  nome: string;
  email: string;
}

export interface BackendSolicitacaoPagamento {
  id: number;
  titulo: string;
  valor: number;
  descricao: string | null;
  usuario_id: number;
  status: StatusSolicitacao;
  aprovado_cancelado_por: number | null;
  concluido_por: number | null;
  created_at: string | null;
  updated_at: string | null;
  usuario?: BackendSolicitacaoUsuario;
  aprovado_cancelado_por_usuario?: BackendSolicitacaoUsuario | null;
  concluido_por_usuario?: BackendSolicitacaoUsuario | null;
}

export interface PaginatedSolicitacoes {
  data: BackendSolicitacaoPagamento[];
  current_page: number;
  last_page: number;
  total: number;
}

export const solicitacaoPagamentoService = {
  minhas: (page: number, perPage: number): Promise<PaginatedSolicitacoes> =>
    apiRequest<PaginatedSolicitacoes>(`/solicitacoes-pagamento/minhas?page=${page}&per_page=${perPage}`),
  todas: (page: number, perPage: number, status?: StatusSolicitacao): Promise<PaginatedSolicitacoes> =>
    apiRequest<PaginatedSolicitacoes>(
      `/solicitacoes-pagamento/todas?page=${page}&per_page=${perPage}${status ? `&status=${status}` : ''}`
    ),
  criar: (data: { titulo: string; valor: number; descricao?: string | null }) =>
    apiRequest<BackendSolicitacaoPagamento>('/solicitacoes-pagamento', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  atualizar: (id: number, data: { titulo: string; valor: number; descricao?: string | null }) =>
    apiRequest<BackendSolicitacaoPagamento>(`/solicitacoes-pagamento/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  atualizarStatus: (id: number, status: 'aprovado' | 'cancelado') =>
    apiRequest<BackendSolicitacaoPagamento>(`/solicitacoes-pagamento/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  concluir: (id: number) =>
    apiRequest<BackendSolicitacaoPagamento>(`/solicitacoes-pagamento/${id}/concluir`, {
      method: 'PATCH',
    }),
};
