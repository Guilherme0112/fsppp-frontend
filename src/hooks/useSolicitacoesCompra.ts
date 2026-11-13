import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  solicitacaoCompraService,
  BackendSolicitacaoCompra,
  StatusSolicitacao,
  PrioridadeSolicitacao,
  FiltrosSolicitacoes,
  DadosSolicitacaoCompra,
} from '../services/solicitacaoCompraService';

export function useMinhasSolicitacoesCompra(
  page: number = 1,
  perPage: number = 10,
  filtros?: FiltrosSolicitacoes,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ['solicitacoes-compra', 'minhas', page, perPage, filtros?.status, filtros?.busca],
    queryFn: () => solicitacaoCompraService.minhas(page, perPage, filtros),
    enabled,
  });
}

export function useTodasSolicitacoesCompra(
  page: number = 1,
  perPage: number = 10,
  filtros?: FiltrosSolicitacoes,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ['solicitacoes-compra', 'todas', page, perPage, filtros?.status, filtros?.busca],
    queryFn: () => solicitacaoCompraService.todas(page, perPage, filtros),
    enabled,
  });
}

export function useResumoSolicitacoesCompra(enabled: boolean = true) {
  return useQuery({
    queryKey: ['solicitacoes-compra', 'resumo'],
    queryFn: () => solicitacaoCompraService.resumo(),
    enabled,
  });
}

export function useSolicitacaoCompraMutations() {
  const queryClient = useQueryClient();
  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: ['solicitacoes-compra'] });

  const criarMutation = useMutation({
    mutationFn: (data: DadosSolicitacaoCompra) => solicitacaoCompraService.criar(data),
    onSuccess: invalidateAll,
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DadosSolicitacaoCompra }) =>
      solicitacaoCompraService.atualizar(id, data),
    onSuccess: invalidateAll,
  });

  const avaliarDiretoriaMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { aprovado: boolean; prioridade: PrioridadeSolicitacao; motivo_rejeicao?: string };
    }) => solicitacaoCompraService.avaliarDiretoria(id, data),
    onSuccess: invalidateAll,
  });

  const avaliarProjetosMutation = useMutation({
    mutationFn: ({ id, recursosExistem }: { id: number; recursosExistem: boolean }) =>
      solicitacaoCompraService.avaliarProjetos(id, recursosExistem),
    onSuccess: invalidateAll,
  });

  const atualizarStatusCompraMutation = useMutation({
    mutationFn: ({ id, statusCompra }: { id: number; statusCompra: string }) =>
      solicitacaoCompraService.atualizarStatusCompra(id, statusCompra),
    onSuccess: invalidateAll,
  });

  const atualizarStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'aprovado' | 'cancelado' }) =>
      solicitacaoCompraService.atualizarStatus(id, status),
    onSuccess: invalidateAll,
  });

  const concluirMutation = useMutation({
    mutationFn: (id: number) => solicitacaoCompraService.concluir(id),
    onSuccess: invalidateAll,
  });

  return {
    criar: criarMutation.mutateAsync,
    atualizar: atualizarMutation.mutateAsync,
    avaliarDiretoria: avaliarDiretoriaMutation.mutateAsync,
    avaliarProjetos: avaliarProjetosMutation.mutateAsync,
    atualizarStatusCompra: atualizarStatusCompraMutation.mutateAsync,
    atualizarStatus: atualizarStatusMutation.mutateAsync,
    concluir: concluirMutation.mutateAsync,
    isCreating: criarMutation.isPending,
    isUpdating: atualizarMutation.isPending,
    isSubmitting:
      criarMutation.isPending ||
      atualizarMutation.isPending ||
      avaliarDiretoriaMutation.isPending ||
      avaliarProjetosMutation.isPending ||
      atualizarStatusCompraMutation.isPending ||
      atualizarStatusMutation.isPending ||
      concluirMutation.isPending,
  };
}

export type { BackendSolicitacaoCompra, StatusSolicitacao, PrioridadeSolicitacao };
