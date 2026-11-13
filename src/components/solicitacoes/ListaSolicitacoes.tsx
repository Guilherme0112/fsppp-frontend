import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Architecture as ProjetosIcon,
  Autorenew as AndamentoIcon,
  Block as RejeitadaIcon,
  CheckCircle as AprovarIcon,
  DoneAll as ConcluirIcon,
  Edit as EditIcon,
  Inbox as VazioIcon,
  LocalShipping as ComprasIcon,
  PendingActions as AguardandoIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  TaskAlt as ConcluidaIcon,
  Visibility as VerIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { PageContainer } from '../common/PageContainer';
import { FormularioSolicitacao } from './FormularioSolicitacao';
import { DetalhesSolicitacao } from './DetalhesSolicitacao';
import {
  useMinhasSolicitacoesCompra,
  useResumoSolicitacoesCompra,
  useSolicitacaoCompraMutations,
  useTodasSolicitacoesCompra,
} from '../../hooks/useSolicitacoesCompra';
import {
  BackendSolicitacaoCompra,
  DadosSolicitacaoCompra,
  PrioridadeSolicitacao,
  StatusSolicitacao,
} from '../../services/solicitacaoCompraService';
import { formatCentavosParaBRL } from '../../utils/currency';
import {
  STATUS_OPTIONS,
  getPrioridadeMeta,
  getStatusMeta,
  montarResumo,
  podeConcluirStatus,
} from './solicitacaoStatus';

const PAGE_SIZE = 10;

type Aba = 'minhas' | 'todas';

type Feedback = {
  severity: 'success' | 'error';
  message: string;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
};

const mensagemErro = (erro: unknown) =>
  erro instanceof Error ? erro.message : 'Não foi possível concluir a operação. Tente novamente.';

const KpiCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}> = ({ label, value, icon, color, loading }) => (
  <Card
    elevation={0}
    sx={{
      p: 2,
      border: '1px solid #E2E8F0',
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      minWidth: 0,
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: 2,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        bgcolor: `${color}18`,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          display: 'block',
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={36} height={32} />
      ) : (
        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
          {value}
        </Typography>
      )}
    </Box>
  </Card>
);

const EstadoVazio: React.FC<{
  comFiltros: boolean;
  podeCriar: boolean;
  onLimpar: () => void;
  onCriar: () => void;
}> = ({ comFiltros, podeCriar, onLimpar, onCriar }) => (
  <Box sx={{ py: 7, px: 3, textAlign: 'center' }}>
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        bgcolor: 'rgba(184, 134, 11, 0.10)',
        color: 'primary.main',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 1.5,
      }}
    >
      <VazioIcon />
    </Box>
    <Typography sx={{ fontWeight: 800 }}>
      {comFiltros ? 'Nenhuma solicitação corresponde aos filtros' : 'Nenhuma solicitação de compra encontrada'}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
      {comFiltros
        ? 'Tente ajustar a busca ou selecionar outro status.'
        : podeCriar
          ? 'Crie a primeira solicitação para iniciar o fluxo de compras.'
          : 'As solicitações aparecerão aqui assim que forem cadastradas.'}
    </Typography>
    {comFiltros ? (
      <Button onClick={onLimpar} variant="outlined" startIcon={<RefreshIcon />}>
        Limpar filtros
      </Button>
    ) : (
      podeCriar && (
        <Button onClick={onCriar} variant="contained" startIcon={<AddIcon />}>
          Nova solicitação
        </Button>
      )
    )}
  </Box>
);

export const ListaSolicitacoes: React.FC = () => {
  const { currentUser, hasPermission, isAdmin } = useAuth();
  const podeCriar = hasPermission('solicitacoes.criar');
  const podeVerTodas = hasPermission('solicitacoes.ver-todas');
  const podeAprovar = hasPermission('solicitacoes.aprovar');
  const podeConcluir = hasPermission('solicitacoes.concluir');

  const [aba, setAba] = useState<Aba>(() => (!podeCriar && podeVerTodas ? 'todas' : 'minhas'));
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState<StatusSolicitacao | ''>('');
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [concluirAlvo, setConcluirAlvo] = useState<BackendSolicitacaoCompra | null>(null);

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<BackendSolicitacaoCompra | null>(null);

  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [detalhando, setDetalhando] = useState<BackendSolicitacaoCompra | null>(null);

  const [diretoriaModalOpen, setDiretoriaModalOpen] = useState(false);
  const [diretoriaAlvo, setDiretoriaAlvo] = useState<BackendSolicitacaoCompra | null>(null);
  const [diretoriaAprovado, setDiretoriaAprovado] = useState(true);
  const [diretoriaPrioridade, setDiretoriaPrioridade] = useState<PrioridadeSolicitacao>('media');
  const [diretoriaMotivo, setDiretoriaMotivo] = useState('');

  const [projetosModalOpen, setProjetosModalOpen] = useState(false);
  const [projetosAlvo, setProjetosAlvo] = useState<BackendSolicitacaoCompra | null>(null);
  const [recursosExistem, setRecursosExistem] = useState(true);

  const [compraModalOpen, setCompraModalOpen] = useState(false);
  const [compraAlvo, setCompraAlvo] = useState<BackendSolicitacaoCompra | null>(null);
  const [statusCompraText, setStatusCompraText] = useState('');

  const {
    criar,
    atualizar,
    avaliarDiretoria,
    avaliarProjetos,
    atualizarStatusCompra,
    concluir,
    isSubmitting,
  } = useSolicitacaoCompraMutations();

  useEffect(() => {
    const timer = window.setTimeout(() => setBuscaDebounced(busca.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    setPage(1);
  }, [buscaDebounced, statusFiltro, aba]);

  // Keep the visible tab aligned with what this user is actually allowed to see.
  useEffect(() => {
    if (!podeCriar && podeVerTodas) {
      setAba('todas');
    } else if (podeCriar && !podeVerTodas) {
      setAba('minhas');
    }
  }, [podeCriar, podeVerTodas]);

  const filtros = useMemo(
    () => ({
      status: statusFiltro,
      busca: buscaDebounced,
    }),
    [statusFiltro, buscaDebounced],
  );

  const minhasQuery = useMinhasSolicitacoesCompra(page, PAGE_SIZE, filtros, podeCriar);
  const todasQuery = useTodasSolicitacoesCompra(page, PAGE_SIZE, filtros, podeVerTodas);
  const resumoQuery = useResumoSolicitacoesCompra(isAdmin);

  const query = aba === 'todas' ? todasQuery : minhasQuery;
  const solicitacoes = query.data?.data || [];
  const total = query.data?.total || 0;
  const resumo = useMemo(() => montarResumo(resumoQuery.data?.por_status), [resumoQuery.data]);
  const comFiltros = Boolean(busca.trim() || statusFiltro);

  const notificar = (severity: Feedback['severity'], message: string) => {
    setFeedback({ severity, message });
  };

  const recarregar = () => {
    void query.refetch();
    if (isAdmin) void resumoQuery.refetch();
  };

  const limparFiltros = () => {
    setBusca('');
    setStatusFiltro('');
    setPage(1);
  };

  const handleTrocarAba = (_e: React.SyntheticEvent, novaAba: Aba) => {
    setAba(novaAba);
    setPage(1);
  };

  const handleAbrirNova = () => {
    setEditando(null);
    setFormAberto(true);
  };

  const handleAbrirEdicao = (solicitacao: BackendSolicitacaoCompra) => {
    setEditando(solicitacao);
    setFormAberto(true);
  };

  const handleAbrirDetalhes = (solicitacao: BackendSolicitacaoCompra) => {
    setDetalhando(solicitacao);
    setDetalhesAberto(true);
  };

  const handleSalvar = async (dados: DadosSolicitacaoCompra) => {
    if (editando) {
      await atualizar({ id: editando.id, data: dados });
      notificar('success', 'Solicitação atualizada com sucesso.');
    } else {
      await criar(dados);
      notificar('success', 'Solicitação criada com sucesso.');
    }
  };

  const podeEditar = (s: BackendSolicitacaoCompra) =>
    podeCriar && s.status === 'pendente' && s.usuario_id === Number(currentUser?.id);

  const executarConclusao = async () => {
    if (!concluirAlvo) return;

    try {
      await concluir(concluirAlvo.id);
      notificar('success', 'Solicitação concluída e arquivada.');
      setConcluirAlvo(null);
    } catch (erro) {
      notificar('error', mensagemErro(erro));
    }
  };

  const confirmarDiretoria = async () => {
    if (!diretoriaAlvo) return;

    if (!diretoriaAprovado && !diretoriaMotivo.trim()) {
      notificar('error', 'Informe o motivo da rejeição.');
      return;
    }

    try {
      await avaliarDiretoria({
        id: diretoriaAlvo.id,
        data: {
          aprovado: diretoriaAprovado,
          prioridade: diretoriaPrioridade,
          motivo_rejeicao: diretoriaAprovado ? undefined : diretoriaMotivo.trim(),
        },
      });
      notificar(
        'success',
        diretoriaAprovado
          ? 'Solicitação autorizada pela diretoria.'
          : 'Solicitação rejeitada pela diretoria.',
      );
      setDiretoriaModalOpen(false);
    } catch (erro) {
      notificar('error', mensagemErro(erro));
    }
  };

  const confirmarProjetos = async () => {
    if (!projetosAlvo) return;

    try {
      await avaliarProjetos({ id: projetosAlvo.id, recursosExistem });
      notificar('success', 'Verificação orçamentária registrada com sucesso.');
      setProjetosModalOpen(false);
    } catch (erro) {
      notificar('error', mensagemErro(erro));
    }
  };

  const confirmarCompra = async () => {
    if (!compraAlvo) return;

    if (!statusCompraText.trim()) {
      notificar('error', 'Informe o andamento atual da compra ou cotação.');
      return;
    }

    try {
      await atualizarStatusCompra({ id: compraAlvo.id, statusCompra: statusCompraText.trim() });
      notificar('success', 'Andamento das compras atualizado.');
      setCompraModalOpen(false);
    } catch (erro) {
      notificar('error', mensagemErro(erro));
    }
  };

  const colunasTabela = 7;

  return (
    <PageContainer disableMaxWidth>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Solicitações de Compra
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Acompanhe o fluxo de autorização, verificação orçamentária, cotações e conclusão.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Atualizar listagem">
            <span>
              <IconButton onClick={recarregar} disabled={query.isFetching} aria-label="Atualizar listagem">
                {query.isFetching ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
          {podeCriar && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAbrirNova}>
              Nova solicitação
            </Button>
          )}
        </Box>
      </Box>

      {isAdmin && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' },
            gap: 2,
            mb: 3,
          }}
        >
          <KpiCard
            label="Total"
            value={resumo.total}
            icon={<VazioIcon />}
            color="#B8860B"
            loading={resumoQuery.isLoading}
          />
          <KpiCard
            label="Aguardando"
            value={resumo.aguardando}
            icon={<AguardandoIcon />}
            color="#B26A00"
            loading={resumoQuery.isLoading}
          />
          <KpiCard
            label="Em andamento"
            value={resumo.emAndamento}
            icon={<AndamentoIcon />}
            color="#0277BD"
            loading={resumoQuery.isLoading}
          />
          <KpiCard
            label="Concluídas"
            value={resumo.concluidas}
            icon={<ConcluidaIcon />}
            color="#2E7D32"
            loading={resumoQuery.isLoading}
          />
          <KpiCard
            label="Rejeitadas / canceladas"
            value={resumo.rejeitadas}
            icon={<RejeitadaIcon />}
            color="#B42318"
            loading={resumoQuery.isLoading}
          />
        </Box>
      )}

      {(query.isError || (isAdmin && resumoQuery.isError)) && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={recarregar}>
              Tentar novamente
            </Button>
          }
        >
          Não foi possível carregar as solicitações de compra.{' '}
          {mensagemErro(query.error || (isAdmin ? resumoQuery.error : null))}
        </Alert>
      )}

      {podeVerTodas && (
        <Tabs value={aba} onChange={handleTrocarAba} sx={{ mb: 2 }}>
          <Tab value="minhas" label="Minhas solicitações" disabled={!podeCriar} />
          <Tab value="todas" label="Todas as solicitações" />
        </Tabs>
      )}

      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, mb: 2 }}>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar por título, descrição ou solicitante"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            sx={{ flex: '1 1 280px', minWidth: 220 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 220, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value as StatusSolicitacao | '')}
            >
              <MenuItem value="">Todos os status</MenuItem>
              {STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {comFiltros && (
            <Button color="inherit" startIcon={<RefreshIcon />} onClick={limparFiltros}>
              Limpar filtros
            </Button>
          )}

          <Box sx={{ flex: 1 }} />

          {!query.isLoading && (
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {total} {total === 1 ? 'solicitação encontrada' : 'solicitações encontradas'}
            </Typography>
          )}
        </Box>
      </Card>

      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                {['Solicitação', 'Valor estimado', 'Prazo', 'Prioridade', 'Status', 'Criado em'].map((titulo) => (
                  <TableCell
                    key={titulo}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: 'text.secondary',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {titulo}
                  </TableCell>
                ))}
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: 'text.secondary',
                  }}
                >
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {query.isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Skeleton width="70%" />
                      <Skeleton width="40%" height={18} />
                    </TableCell>
                    <TableCell><Skeleton width={90} /></TableCell>
                    <TableCell><Skeleton width={70} /></TableCell>
                    <TableCell><Skeleton width={70} /></TableCell>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={70} /></TableCell>
                    <TableCell align="right"><Skeleton width={120} sx={{ ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : solicitacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colunasTabela} sx={{ p: 0, border: 0 }}>
                    <EstadoVazio
                      comFiltros={comFiltros}
                      podeCriar={podeCriar}
                      onLimpar={limparFiltros}
                      onCriar={handleAbrirNova}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                solicitacoes.map((solicitacao) => {
                  const status = getStatusMeta(solicitacao.status);
                  const prioridade = getPrioridadeMeta(solicitacao.prioridade);

                  return (
                    <TableRow
                      key={solicitacao.id}
                      hover
                      onClick={() => handleAbrirDetalhes(solicitacao)}
                      sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                    >
                      <TableCell sx={{ maxWidth: 360 }}>
                        <Typography sx={{ fontWeight: 700 }} noWrap>
                          {solicitacao.titulo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          #{solicitacao.id}
                          {solicitacao.usuario?.nome ? ` • ${solicitacao.usuario.nome}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatCentavosParaBRL(solicitacao.valor)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {formatDate(solicitacao.prazo)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={prioridade.label}
                          color={prioridade.color}
                          size="small"
                          variant={prioridade.color === 'default' ? 'outlined' : 'filled'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {formatDate(solicitacao.created_at)}
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end' }}>
                          <Tooltip title="Ver detalhes">
                            <IconButton size="small" onClick={() => handleAbrirDetalhes(solicitacao)}>
                              <VerIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {podeEditar(solicitacao) && (
                            <Tooltip title="Editar solicitação">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={isSubmitting}
                                  onClick={() => handleAbrirEdicao(solicitacao)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          {podeAprovar &&
                            (solicitacao.status === 'pendente' || solicitacao.status === 'enviado_diretoria') && (
                            <Tooltip title="Autorizar pela diretoria">
                              <span>
                                <IconButton
                                  size="small"
                                  color="success"
                                  disabled={isSubmitting}
                                  onClick={() => {
                                    setDiretoriaAlvo(solicitacao);
                                    setDiretoriaAprovado(true);
                                    setDiretoriaPrioridade(solicitacao.prioridade || 'media');
                                    setDiretoriaMotivo('');
                                    setDiretoriaModalOpen(true);
                                  }}
                                >
                                  <AprovarIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          {podeAprovar && solicitacao.status === 'analise_projetos' && (
                            <Tooltip title="Registrar verificação orçamentária">
                              <span>
                                <IconButton
                                  size="small"
                                  color="info"
                                  disabled={isSubmitting}
                                  onClick={() => {
                                    setProjetosAlvo(solicitacao);
                                    setRecursosExistem(true);
                                    setProjetosModalOpen(true);
                                  }}
                                >
                                  <ProjetosIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          {podeAprovar &&
                            (solicitacao.status === 'recursos_disponiveis_compras' ||
                              solicitacao.status === 'recursos_fundacao') && (
                              <Tooltip title="Atualizar andamento das compras">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="secondary"
                                    disabled={isSubmitting}
                                    onClick={() => {
                                      setCompraAlvo(solicitacao);
                                      setStatusCompraText(solicitacao.status_compra || '');
                                      setCompraModalOpen(true);
                                    }}
                                  >
                                    <ComprasIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}

                          {podeConcluir && podeConcluirStatus(solicitacao.status) && (
                            <Tooltip title="Concluir e arquivar">
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  disabled={isSubmitting}
                                  onClick={() => setConcluirAlvo(solicitacao)}
                                >
                                  <ConcluirIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {solicitacoes.length > 0 && (
          <TablePagination
            component="div"
            count={total}
            page={page - 1}
            onPageChange={(_e, newPage) => setPage(newPage + 1)}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        )}
      </Card>

      <FormularioSolicitacao
        open={formAberto}
        onClose={() => setFormAberto(false)}
        solicitacaoExistente={editando}
        onSalvar={handleSalvar}
        isSaving={isSubmitting}
      />

      <DetalhesSolicitacao
        open={detalhesAberto}
        onClose={() => setDetalhesAberto(false)}
        solicitacao={detalhando}
        onEditar={
          detalhando && podeEditar(detalhando)
            ? (solicitacao) => {
                setDetalhesAberto(false);
                handleAbrirEdicao(solicitacao);
              }
            : undefined
        }
      />

      <Dialog open={Boolean(concluirAlvo)} onClose={() => setConcluirAlvo(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Concluir solicitação</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            A solicitação será marcada como concluída e arquivada. Essa ação não pode ser desfeita.
          </Typography>
          {concluirAlvo && (
            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {concluirAlvo.titulo}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatCentavosParaBRL(concluirAlvo.valor)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConcluirAlvo(null)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={executarConclusao}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} thickness={5} sx={{ color: 'inherit' }} /> : undefined}
          >
            Concluir
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={diretoriaModalOpen} onClose={() => setDiretoriaModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Autorização da diretoria</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={diretoriaAprovado}
                  onChange={(e) => setDiretoriaAprovado(e.target.checked)}
                  color="success"
                />
              }
              label={diretoriaAprovado ? 'Aprovar solicitação' : 'Rejeitar solicitação'}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={diretoriaPrioridade}
                label="Prioridade"
                onChange={(e) => setDiretoriaPrioridade(e.target.value as PrioridadeSolicitacao)}
              >
                <MenuItem value="baixa">Baixa</MenuItem>
                <MenuItem value="media">Média</MenuItem>
                <MenuItem value="alta">Alta</MenuItem>
                <MenuItem value="urgente">Urgente</MenuItem>
              </Select>
            </FormControl>

            {!diretoriaAprovado && (
              <TextField
                label="Motivo da rejeição"
                multiline
                rows={3}
                required
                value={diretoriaMotivo}
                onChange={(e) => setDiretoriaMotivo(e.target.value)}
                placeholder="Informe o motivo pelo qual a solicitação foi rejeitada..."
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiretoriaModalOpen(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={diretoriaAprovado ? 'success' : 'error'}
            onClick={confirmarDiretoria}
            disabled={isSubmitting || (!diretoriaAprovado && !diretoriaMotivo.trim())}
            startIcon={isSubmitting ? <CircularProgress size={16} thickness={5} sx={{ color: 'inherit' }} /> : undefined}
          >
            {diretoriaAprovado ? 'Aprovar' : 'Rejeitar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={projetosModalOpen} onClose={() => setProjetosModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Verificação orçamentária</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Verifique se a aquisição pode ser atendida por projetos/convênios ou se seguirá com recursos
              próprios da Fundação.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={recursosExistem}
                  onChange={(e) => setRecursosExistem(e.target.checked)}
                  color="primary"
                />
              }
              label={
                recursosExistem
                  ? 'Atendida por projetos/convênios (seguir para compras)'
                  : 'Sem recurso em projetos (recursos próprios / Fundação)'
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjetosModalOpen(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={confirmarProjetos}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} thickness={5} sx={{ color: 'inherit' }} /> : undefined}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={compraModalOpen} onClose={() => setCompraModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Andamento das compras</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              label="Andamento da compra / cotação"
              fullWidth
              size="small"
              required
              value={statusCompraText}
              onChange={(e) => setStatusCompraText(e.target.value)}
              placeholder="Ex: Pesquisa de 3 cotações, mapa comparativo, ordem de compra emitida..."
              helperText="Registre a etapa atual para acompanhamento na listagem e nos detalhes."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompraModalOpen(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={confirmarCompra}
            disabled={isSubmitting || !statusCompraText.trim()}
            startIcon={isSubmitting ? <CircularProgress size={16} thickness={5} sx={{ color: 'inherit' }} /> : undefined}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={4500}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={feedback?.severity || 'success'}
          variant="filled"
          onClose={() => setFeedback(null)}
          sx={{ width: '100%' }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};
