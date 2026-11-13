import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { QuillEditor } from '../common/QuillEditor';
import {
  BackendSolicitacaoCompra,
  DadosSolicitacaoCompra,
  PrioridadeSolicitacao,
} from '../../services/solicitacaoCompraService';
import { formatCentavosParaBRL, paraCentavos } from '../../utils/currency';
import { getStatusMeta } from './solicitacaoStatus';

interface FormularioSolicitacaoProps {
  open: boolean;
  onClose: () => void;
  solicitacaoExistente?: BackendSolicitacaoCompra | null;
  onSalvar: (dados: DadosSolicitacaoCompra) => Promise<void>;
  isSaving: boolean;
}

const SectionTitle: React.FC<{ children: React.ReactNode; description?: string }> = ({
  children,
  description,
}) => (
  <Box>
    <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.02em' }}>
      {children}
    </Typography>
    {description && (
      <Typography variant="caption" color="text.secondary">
        {description}
      </Typography>
    )}
  </Box>
);

export const FormularioSolicitacao: React.FC<FormularioSolicitacaoProps> = ({
  open,
  onClose,
  solicitacaoExistente,
  onSalvar,
  isSaving,
}) => {
  const [titulo, setTitulo] = useState('');
  const [valorCentavos, setValorCentavos] = useState(0);
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<PrioridadeSolicitacao>('media');
  const [prazo, setPrazo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const bloqueado = Boolean(solicitacaoExistente) && solicitacaoExistente?.status !== 'pendente';
  const statusAtual = solicitacaoExistente ? getStatusMeta(solicitacaoExistente.status) : null;

  useEffect(() => {
    if (open) {
      setTitulo(solicitacaoExistente?.titulo || '');
      setValorCentavos(solicitacaoExistente?.valor || 0);
      setDescricao(solicitacaoExistente?.descricao || '');
      setPrioridade(solicitacaoExistente?.prioridade || 'media');
      setPrazo(solicitacaoExistente?.prazo ? solicitacaoExistente.prazo.slice(0, 10) : '');
      setErro(null);
    }
  }, [open, solicitacaoExistente]);

  const handleSalvar = async () => {
    if (!titulo.trim() || valorCentavos <= 0) return;

    try {
      await onSalvar({
        titulo: titulo.trim(),
        valor: valorCentavos,
        descricao,
        prioridade,
        prazo: prazo || null,
      });
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar a solicitação de compra.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {solicitacaoExistente ? 'Editar solicitação de compra' : 'Nova solicitação de compra'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {solicitacaoExistente
            ? 'Atualize os dados enquanto a solicitação ainda está pendente.'
            : 'Descreva o objeto, o valor estimado e a justificativa da contratação.'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#FCFAF5' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
          {erro && <Alert severity="error">{erro}</Alert>}

          {bloqueado && statusAtual && (
            <Alert severity="warning">
              Esta solicitação está com o status <strong>{statusAtual.label}</strong> e não pode mais ser
              editada pelo solicitante.
            </Alert>
          )}

          <SectionTitle description="Informe um nome objetivo para facilitar a identificação na listagem.">
            Identificação
          </SectionTitle>

          <TextField
            label="Título / objeto"
            fullWidth
            required
            autoFocus
            disabled={bloqueado}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Aquisição de 10 cadeiras ergonômicas"
          />

          <Divider />

          <SectionTitle description="Os valores são armazenados em centavos para manter a precisão.">
            Valores e prazo
          </SectionTitle>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label="Valor estimado"
              required
              disabled={bloqueado}
              value={formatCentavosParaBRL(valorCentavos)}
              onChange={(e) => setValorCentavos(paraCentavos(e.target.value))}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              helperText="Digite apenas os números. Os dois últimos dígitos são os centavos."
              sx={{ flex: 2 }}
            />

            <FormControl fullWidth disabled={bloqueado} sx={{ flex: 1 }}>
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={prioridade}
                label="Prioridade"
                onChange={(e) => setPrioridade(e.target.value as PrioridadeSolicitacao)}
              >
                <MenuItem value="baixa">Baixa</MenuItem>
                <MenuItem value="media">Média</MenuItem>
                <MenuItem value="alta">Alta</MenuItem>
                <MenuItem value="urgente">Urgente</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Prazo desejado"
              type="date"
              disabled={bloqueado}
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Box>

          <Divider />

          <SectionTitle description="Detalhe a necessidade, quantidade, especificações e justificativa.">
            Descrição e justificativa
          </SectionTitle>

          {bloqueado ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                minHeight: 90,
                '& p': { mb: 1, lineHeight: 1.6 },
                '& p:last-child': { mb: 0 },
              }}
              dangerouslySetInnerHTML={{ __html: descricao || '<p style="color:#94A3B8">Sem descrição.</p>' }}
            />
          ) : (
            <QuillEditor value={descricao} onChange={setDescricao} minHeight={190} />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#FFFFFF' }}>
        <Button onClick={onClose} color="inherit">
          {bloqueado ? 'Fechar' : 'Cancelar'}
        </Button>
        {!bloqueado && (
          <Button
            variant="contained"
            onClick={handleSalvar}
            disabled={!titulo.trim() || valorCentavos <= 0 || isSaving}
            startIcon={isSaving ? <CircularProgress size={16} thickness={5} sx={{ color: 'inherit' }} /> : undefined}
          >
            {isSaving ? 'Salvando...' : 'Salvar solicitação'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
