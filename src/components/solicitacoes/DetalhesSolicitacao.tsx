import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import { BackendSolicitacaoPagamento, StatusSolicitacao } from '../../services/solicitacaoPagamentoService';
import { formatCentavosParaBRL } from '../../utils/currency';

interface DetalhesSolicitacaoProps {
  open: boolean;
  onClose: () => void;
  solicitacao: BackendSolicitacaoPagamento | null;
}

const STATUS_CONFIG: Record<StatusSolicitacao, { label: string; color: 'warning' | 'info' | 'success' | 'error' }> = {
  pendente: { label: 'Pendente', color: 'warning' },
  aprovado: { label: 'Aprovado', color: 'info' },
  concluido: { label: 'Concluído', color: 'success' },
  cancelado: { label: 'Cancelado', color: 'error' },
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const Campo: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box>
    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {label}
    </Typography>
    <Box sx={{ mt: 0.3 }}>{children}</Box>
  </Box>
);

export const DetalhesSolicitacao: React.FC<DetalhesSolicitacaoProps> = ({ open, onClose, solicitacao }) => {
  if (!solicitacao) return null;

  const statusCfg = STATUS_CONFIG[solicitacao.status];
  const isDescEmpty = !solicitacao.descricao || solicitacao.descricao.replace(/<[^>]*>/g, '').trim().length === 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        {solicitacao.titulo}
        <Chip
          label={statusCfg.label}
          color={statusCfg.color}
          size="small"
          sx={{ fontWeight: 600, fontSize: '0.75rem', ml: 1.5, verticalAlign: 'middle' }}
        />
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Campo label="Valor">
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {formatCentavosParaBRL(solicitacao.valor)}
              </Typography>
            </Campo>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Campo label="Solicitante">
              <Typography sx={{ fontWeight: 600 }}>{solicitacao.usuario?.nome || '—'}</Typography>
              {solicitacao.usuario?.email && (
                <Typography variant="body2" color="text.secondary">
                  {solicitacao.usuario.email}
                </Typography>
              )}
            </Campo>
          </Grid>

          {solicitacao.aprovado_cancelado_por_usuario && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Campo label={solicitacao.status === 'cancelado' ? 'Cancelado por' : 'Aprovado por'}>
                <Typography sx={{ fontWeight: 600 }}>{solicitacao.aprovado_cancelado_por_usuario.nome}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {solicitacao.aprovado_cancelado_por_usuario.email}
                </Typography>
              </Campo>
            </Grid>
          )}

          {solicitacao.concluido_por_usuario && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Campo label="Concluído por">
                <Typography sx={{ fontWeight: 600 }}>{solicitacao.concluido_por_usuario.nome}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {solicitacao.concluido_por_usuario.email}
                </Typography>
              </Campo>
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6 }}>
            <Campo label="Criado em">
              <Typography variant="body2">{formatDateTime(solicitacao.created_at)}</Typography>
            </Campo>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Campo label="Última atualização">
              <Typography variant="body2">{formatDateTime(solicitacao.updated_at)}</Typography>
            </Campo>
          </Grid>

          <Grid size={12}>
            <Divider />
          </Grid>

          <Grid size={12}>
            <Campo label="Descrição">
              {isDescEmpty ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  Sem descrição.
                </Typography>
              ) : (
                <Box
                  sx={{
                    mt: 0.5,
                    '& p': { mb: 1, lineHeight: 1.6 },
                    '& p:last-child': { mb: 0 },
                    '& ul, & ol': { pl: 3, my: 1 },
                  }}
                  dangerouslySetInnerHTML={{ __html: solicitacao.descricao as string }}
                />
              )}
            </Campo>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};
