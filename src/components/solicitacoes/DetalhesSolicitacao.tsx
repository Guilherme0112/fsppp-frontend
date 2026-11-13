import React from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Typography,
} from '@mui/material';
import {
  AccountCircle as PessoaIcon,
  AttachMoney as ValorIcon,
  CalendarMonth as PrazoIcon,
  CheckCircle as ConcluidoIcon,
  Close as FecharIcon,
  Edit as EditarIcon,
  ErrorOutlined as ErroIcon,
  Flag as PrioridadeIcon,
  RadioButtonUnchecked as PendenteIcon,
  Schedule as AtualIcon,
} from '@mui/icons-material';
import { BackendSolicitacaoCompra } from '../../services/solicitacaoCompraService';
import { formatCentavosParaBRL } from '../../utils/currency';
import { getPrioridadeMeta, getStatusMeta } from './solicitacaoStatus';

interface DetalhesSolicitacaoProps {
  open: boolean;
  onClose: () => void;
  solicitacao: BackendSolicitacaoCompra | null;
  onEditar?: (solicitacao: BackendSolicitacaoCompra) => void;
}

type EtapaEstado = 'concluida' | 'atual' | 'pendente' | 'erro';

interface Etapa {
  titulo: string;
  descricao: string;
  estado: EtapaEstado;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const Campo: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
  label,
  icon,
  children,
}) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.4 }}>
      {icon && <Box sx={{ color: 'text.secondary', display: 'flex', '& svg': { fontSize: 15 } }}>{icon}</Box>}
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
    </Box>
    {children}
  </Box>
);

const construirEtapas = (solicitacao: BackendSolicitacaoCompra): Etapa[] => {
  const status = solicitacao.status;
  const rejeitado = status === 'rejeitado_diretoria' || status === 'cancelado';
  const aguardandoDiretoria = status === 'pendente' || status === 'enviado_diretoria';

  const diretoriaConcluida = [
    'aprovado_diretoria',
    'analise_projetos',
    'recursos_disponiveis_compras',
    'recursos_fundacao',
    'aprovado',
    'concluido',
  ].includes(status);

  const projetosConcluidos = [
    'recursos_disponiveis_compras',
    'recursos_fundacao',
    'aprovado',
    'concluido',
  ].includes(status);

  const comprasConcluidas = ['aprovado', 'concluido'].includes(status);

  return [
    {
      titulo: 'Solicitação criada',
      descricao: `${solicitacao.usuario?.nome || 'Solicitante'} • ${formatDateTime(solicitacao.created_at)}`,
      estado: 'concluida',
    },
    {
      titulo: 'Autorização da Diretoria',
      descricao: rejeitado
        ? solicitacao.motivo_rejeicao || 'Solicitação rejeitada ou cancelada.'
        : diretoriaConcluida
          ? `Autorizada por ${solicitacao.diretoria_por_usuario?.nome || 'diretoria'}.`
          : aguardandoDiretoria
            ? 'Aguardando análise e autorização da diretoria.'
            : 'Aguardando etapa anterior.',
      estado: rejeitado ? 'erro' : diretoriaConcluida ? 'concluida' : aguardandoDiretoria ? 'atual' : 'pendente',
    },
    {
      titulo: 'Verificação orçamentária / Projetos',
      descricao: projetosConcluidos
        ? `${solicitacao.recursos_existem ? 'Recursos próprios / compras' : 'Recursos da Fundação'} • ${
            solicitacao.projetos_por_usuario?.nome || 'setor de projetos'
          }`
        : status === 'analise_projetos'
          ? 'Aguardando verificação de disponibilidade orçamentária.'
          : 'Aguardando etapa anterior.',
      estado: rejeitado ? 'pendente' : projetosConcluidos ? 'concluida' : status === 'analise_projetos' ? 'atual' : 'pendente',
    },
    {
      titulo: 'Compras e cotações',
      descricao: comprasConcluidas
        ? solicitacao.status_compra || 'Compra realizada.'
        : status === 'recursos_disponiveis_compras' || status === 'recursos_fundacao'
          ? solicitacao.status_compra || 'Aguardando pesquisa de preços e cotações.'
          : 'Aguardando encaminhamento para compras.',
      estado: rejeitado
        ? 'pendente'
        : comprasConcluidas
          ? 'concluida'
          : status === 'recursos_disponiveis_compras' || status === 'recursos_fundacao'
            ? 'atual'
            : 'pendente',
    },
    {
      titulo: 'Conclusão e arquivamento',
      descricao:
        status === 'concluido'
          ? `Concluída por ${solicitacao.concluido_por_usuario?.nome || 'usuário'} • ${formatDateTime(
              solicitacao.updated_at,
            )}`
          : status === 'cancelado'
            ? 'Processo cancelado.'
            : 'Aguardando a conclusão do processo de compra.',
      estado:
        status === 'concluido'
          ? 'concluida'
          : status === 'cancelado'
            ? 'erro'
            : status === 'recursos_disponiveis_compras' || status === 'recursos_fundacao' || status === 'aprovado'
              ? 'atual'
              : 'pendente',
    },
  ];
};

const EtapaIcone: React.FC<{ estado: EtapaEstado }> = ({ estado }) => {
  const comum = { fontSize: 18 };

  if (estado === 'concluida') return <ConcluidoIcon sx={{ ...comum, color: 'success.main' }} />;
  if (estado === 'erro') return <ErroIcon sx={{ ...comum, color: 'error.main' }} />;
  if (estado === 'atual') return <AtualIcon sx={{ ...comum, color: 'primary.main' }} />;
  return <PendenteIcon sx={{ ...comum, color: '#CBD5E1' }} />;
};

export const DetalhesSolicitacao: React.FC<DetalhesSolicitacaoProps> = ({
  open,
  onClose,
  solicitacao,
  onEditar,
}) => {
  if (!solicitacao) return null;

  const status = getStatusMeta(solicitacao.status);
  const prioridade = getPrioridadeMeta(solicitacao.prioridade);
  const etapas = construirEtapas(solicitacao);
  const isDescEmpty = !solicitacao.descricao || solicitacao.descricao.replace(/<[^>]*>/g, '').trim().length === 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        // The fixed AppBar sits at zIndex.drawer + 1, so the details drawer
        // must use the modal layer to cover it instead of sliding underneath.
        zIndex: (t) => t.zIndex.modal,
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 520 },
          maxWidth: '100%',
          boxSizing: 'border-box',
          bgcolor: '#FCFAF5',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 3, bgcolor: '#FFFFFF', borderBottom: '1px solid #E9DDB5' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  bgcolor: 'rgba(184, 134, 11, 0.12)',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ValorIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                  SOLICITAÇÃO #{solicitacao.id}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
                  {solicitacao.titulo}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1 }}>
                  <Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 700 }} />
                  <Chip
                    label={`Prioridade ${prioridade.label}`}
                    color={prioridade.color}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              </Box>
            </Box>
            <IconButton onClick={onClose} aria-label="Fechar detalhes">
              <FecharIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid #E9DDB5',
              background: 'linear-gradient(135deg, rgba(184,134,11,0.10) 0%, rgba(212,175,55,0.03) 100%)',
              mb: 3,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 0.5 }}>
              VALOR ESTIMADO
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.3 }}>
              {formatCentavosParaBRL(solicitacao.valor)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {status.description}
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
            <Campo label="Solicitante" icon={<PessoaIcon />}>
              <Typography sx={{ fontWeight: 700 }}>{solicitacao.usuario?.nome || '—'}</Typography>
              {solicitacao.usuario?.email && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {solicitacao.usuario.email}
                </Typography>
              )}
            </Campo>

            <Campo label="Prazo desejado" icon={<PrazoIcon />}>
              <Typography sx={{ fontWeight: 700 }}>{formatDate(solicitacao.prazo)}</Typography>
            </Campo>

            <Campo label="Prioridade" icon={<PrioridadeIcon />}>
              <Chip label={prioridade.label} color={prioridade.color} size="small" sx={{ fontWeight: 700 }} />
            </Campo>

            <Campo label="Criado em" icon={<PrazoIcon />}>
              <Typography variant="body2">{formatDateTime(solicitacao.created_at)}</Typography>
            </Campo>

            {solicitacao.status_compra && (
              <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                <Campo label="Andamento das compras / cotações">
                  <Box sx={{ mt: 0.5, p: 1.5, borderRadius: 1.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                    <Typography sx={{ fontWeight: 700 }}>{solicitacao.status_compra}</Typography>
                    {solicitacao.compras_por_usuario && (
                      <Typography variant="caption" color="text.secondary">
                        Atualizado por {solicitacao.compras_por_usuario.nome}
                      </Typography>
                    )}
                  </Box>
                </Campo>
              </Box>
            )}

            {solicitacao.recursos_existem !== null && (
              <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                <Campo label="Verificação orçamentária">
                  <Chip
                    label={solicitacao.recursos_existem ? 'Recursos próprios / Compras' : 'Recursos da Fundação'}
                    color={solicitacao.recursos_existem ? 'info' : 'secondary'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Campo>
              </Box>
            )}
          </Box>

          {solicitacao.motivo_rejeicao && (
            <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(180, 35, 24, 0.06)', border: '1px solid rgba(180, 35, 24, 0.2)' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'error.main', letterSpacing: 0.5 }}>
                MOTIVO DA REJEIÇÃO / CANCELAMENTO
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, color: 'error.dark' }}>
                {solicitacao.motivo_rejeicao}
              </Typography>
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
            Histórico do fluxo
          </Typography>

          <Box sx={{ position: 'relative', mb: 3 }}>
            {etapas.map((etapa, index) => (
              <Box key={etapa.titulo} sx={{ display: 'flex', gap: 1.5, pb: index === etapas.length - 1 ? 0 : 2.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24 }}>
                    <EtapaIcone estado={etapa.estado} />
                  </Box>
                  {index < etapas.length - 1 && (
                    <Box
                      sx={{
                        width: 2,
                        flex: 1,
                        minHeight: 22,
                        bgcolor: etapa.estado === 'concluida' ? 'rgba(46, 125, 50, 0.35)' : '#E2E8F0',
                        mt: 0.5,
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ pt: 0.1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: etapa.estado === 'atual' ? 800 : 700,
                      color:
                        etapa.estado === 'erro'
                          ? 'error.main'
                          : etapa.estado === 'pendente'
                            ? 'text.disabled'
                            : 'text.primary',
                    }}
                  >
                    {etapa.titulo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {etapa.descricao}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Descrição detalhada
          </Typography>

          {isDescEmpty ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              Sem descrição informada.
            </Typography>
          ) : (
            <Box
              sx={{
                color: 'text.primary',
                fontSize: '0.92rem',
                '& p': { mb: 1, lineHeight: 1.7 },
                '& p:last-child': { mb: 0 },
                '& ul, & ol': { pl: 3, my: 1 },
              }}
              dangerouslySetInnerHTML={{ __html: solicitacao.descricao as string }}
            />
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
            Última atualização em {formatDateTime(solicitacao.updated_at)}
          </Typography>
        </Box>

        <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E9DDB5', display: 'flex', gap: 1 }}>
          <Button onClick={onClose} color="inherit" fullWidth>
            Fechar
          </Button>
          {onEditar && solicitacao.status === 'pendente' && (
            <Button variant="contained" startIcon={<EditarIcon />} onClick={() => onEditar(solicitacao)} fullWidth>
              Editar solicitação
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};
