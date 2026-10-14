import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  solicitacaoPagamentoService,
  BackendSolicitacaoPagamento,
  StatusSolicitacao,
} from '../services/solicitacaoPagamentoService';

export function useMinhasSolicitacoes(page: number, perPage: number, enabled: boolean) {
  return useQuery({
    queryKey: ['solicitacoes-pagamento', 'minhas', page, perPage],
    queryFn: () => solicitacaoPagamentoService.minhas(page, perPage),
    enabled,
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
  });
}

export function useTodasSolicitacoes(
  page: number,
  perPage: number,
  status: StatusSolicitacao | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['solicitacoes-pagamento', 'todas', page, perPage, status],
    queryFn: () => solicitacaoPagamentoService.todas(page, perPage, status),
    enabled,
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
  });
}

export function useSolicitacaoPagamentoMutations() {
  const queryClient = useQueryClient();
  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: ['solicitacoes-pagamento'] });

  const criarMutation = useMutation({
    mutationFn: (data: { titulo: string; valor: number; descricao?: string | null }) =>
      solicitacaoPagamentoService.criar(data),
    onSuccess: invalidateAll,
  });

  const atualizarMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { titulo: string; valor: number; descricao?: string | null };
    }) => solicitacaoPagamentoService.atualizar(id, data),
    onSuccess: invalidateAll,
  });

  const atualizarStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'aprovado' | 'cancelado' }) =>
      solicitacaoPagamentoService.atualizarStatus(id, status),
    onSuccess: invalidateAll,
  });

  const concluirMutation = useMutation({
    mutationFn: (id: number) => solicitacaoPagamentoService.concluir(id),
    onSuccess: invalidateAll,
  });

  return {
    criarMutation,
    atualizarMutation,
    atualizarStatusMutation,
    concluirMutation,
    isMutating:
      criarMutation.isPending ||
      atualizarMutation.isPending ||
      atualizarStatusMutation.isPending ||
      concluirMutation.isPending,
  };
}

export type { BackendSolicitacaoPagamento, StatusSolicitacao };
