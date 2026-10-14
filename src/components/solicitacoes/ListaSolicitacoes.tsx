import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Chip,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as AprovarIcon,
  Cancel as CancelarIcon,
  DoneAll as ConcluirIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { PageContainer } from '../common/PageContainer';
import { FormularioSolicitacao } from './FormularioSolicitacao';
import { DetalhesSolicitacao } from './DetalhesSolicitacao';
import {
  useMinhasSolicitacoes,
  useTodasSolicitacoes,
  useSolicitacaoPagamentoMutations,
} from '../../hooks/useSolicitacoesPagamento';
import { BackendSolicitacaoPagamento, StatusSolicitacao } from '../../services/solicitacaoPagamentoService';
import { formatCentavosParaBRL } from '../../utils/currency';

const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<StatusSolicitacao, { label: string; color: 'warning' | 'info' | 'success' | 'error' }> = {
  pendente: { label: 'Pendente', color: 'warning' },
  aprovado: { label: 'Aprovado', color: 'info' },
  concluido: { label: 'Concluído', color: 'success' },
  cancelado: { label: 'Cancelado', color: 'error' },
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
};

export const ListaSolicitacoes: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const podeVerTodas = hasPermission('solicitacoes.ver-todas');
  const podeCriar = hasPermission('solicitacoes.criar');
  const podeAprovar = hasPermission('solicitacoes.aprovar');
  const podeConcluir = hasPermission('solicitacoes.concluir');

  const [aba, setAba] = useState<'minhas' | 'todas'>('minhas');
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState<StatusSolicitacao | ''>('');

  const minhasQuery = useMinhasSolicitacoes(page, PAGE_SIZE, aba === 'minhas');
  const todasQuery = useTodasSolicitacoes(page, PAGE_SIZE, statusFiltro || undefined, aba === 'todas' && podeVerTodas);

  const {
    criarMutation,
    atualizarMutation,
    atualizarStatusMutation,
    concluirMutation,
    isMutating,
  } = useSolicitacaoPagamentoMutations();

  const query = aba === 'todas' ? todasQuery : minhasQuery;
  const solicitacoes = query.data?.data || [];
  const total = query.data?.total || 0;

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<BackendSolicitacaoPagamento | null>(null);

  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [detalhando, setDetalhando] = useState<BackendSolicitacaoPagamento | null>(null);

  const handleTrocarAba = (_e: React.SyntheticEvent, novaAba: 'minhas' | 'todas') => {
    setAba(novaAba);
    setPage(1);
  };

  const handleAbrirNova = () => {
    setEditando(null);
    setFormAberto(true);
  };

  const handleAbrirEdicao = (solicitacao: BackendSolicitacaoPagamento) => {
    setEditando(solicitacao);
    setFormAberto(true);
  };

  const handleAbrirDetalhes = (solicitacao: BackendSolicitacaoPagamento) => {
    setDetalhando(solicitacao);
    setDetalhesAberto(true);
  };

  const handleSalvar = async (dados: { titulo: string; valor: number; descricao?: string | null }) => {
    if (editando) {
      await atualizarMutation.mutateAsync({ id: editando.id, data: dados });
    } else {
      await criarMutation.mutateAsync(dados);
    }
  };

  const podeEditar = (s: BackendSolicitacaoPagamento) =>
    podeCriar && s.status === 'pendente' && s.usuario_id === Number(currentUser?.id);

  return (
    <PageContainer disableMaxWidth>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Solicitações de Pagamento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Acompanhe e gerencie as solicitações de pagamento
          </Typography>
        </Box>
        {podeCriar && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAbrirNova}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            Nova Solicitação
          </Button>
        )}
      </Box>

      {podeVerTodas && (
        <Tabs value={aba} onChange={handleTrocarAba} sx={{ mb: 2 }}>
          <Tab value="minhas" label="Minhas Solicitações" />
          <Tab value="todas" label="Todas" />
        </Tabs>
      )}

      {aba === 'todas' && (
        <Box sx={{ mb: 2, maxWidth: 220 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Filtrar por status</InputLabel>
            <Select
              label="Filtrar por status"
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value as StatusSolicitacao | '');
                setPage(1);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(STATUS_CONFIG).map(([valor, cfg]) => (
                <MenuItem key={valor} value={valor}>
                  {cfg.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700 }}>Título</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Valor</TableCell>
                {aba === 'todas' && <TableCell sx={{ fontWeight: 700 }}>Solicitante</TableCell>}
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Criado em</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {query.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} sx={{ color: 'primary.main' }} />
                  </TableCell>
                </TableRow>
              ) : solicitacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Nenhuma solicitação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                solicitacoes.map((s) => (
                  <TableRow key={s.id} hover onClick={() => handleAbrirDetalhes(s)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{s.titulo}</TableCell>
                    <TableCell>{formatCentavosParaBRL(s.valor)}</TableCell>
                    {aba === 'todas' && <TableCell sx={{ color: 'text.secondary' }}>{s.usuario?.nome || '—'}</TableCell>}
                    <TableCell>
                      <Chip
                        label={STATUS_CONFIG[s.status].label}
                        color={STATUS_CONFIG[s.status].color}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{formatDate(s.created_at)}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      {podeEditar(s) && (
                        <Tooltip title="Editar">
                          <IconButton size="small" disabled={isMutating} onClick={() => handleAbrirEdicao(s)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {aba === 'todas' && podeAprovar && s.status === 'pendente' && (
                        <>
                          <Tooltip title="Aprovar">
                            <IconButton
                              size="small"
                              color="success"
                              disabled={isMutating}
                              onClick={() => atualizarStatusMutation.mutate({ id: s.id, status: 'aprovado' })}
                            >
                              <AprovarIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancelar">
                            <IconButton
                              size="small"
                              color="error"
                              disabled={isMutating}
                              onClick={() => atualizarStatusMutation.mutate({ id: s.id, status: 'cancelado' })}
                            >
                              <CancelarIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {aba === 'todas' && podeConcluir && s.status === 'aprovado' && (
                        <Tooltip title="Concluir">
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={isMutating}
                            onClick={() => concluirMutation.mutate(s.id)}
                          >
                            <ConcluirIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(_e, newPage) => setPage(newPage + 1)}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Card>

      <FormularioSolicitacao
        open={formAberto}
        onClose={() => setFormAberto(false)}
        solicitacaoExistente={editando}
        onSalvar={handleSalvar}
        isSaving={criarMutation.isPending || atualizarMutation.isPending}
      />

      <DetalhesSolicitacao
        open={detalhesAberto}
        onClose={() => setDetalhesAberto(false)}
        solicitacao={detalhando}
      />
    </PageContainer>
  );
};
