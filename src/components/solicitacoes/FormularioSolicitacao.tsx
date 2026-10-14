import React, { useEffect, useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Typography,
  CircularProgress,
} from '@mui/material';
import { QuillEditor } from '../common/QuillEditor';
import { BackendSolicitacaoPagamento } from '../../services/solicitacaoPagamentoService';
import { formatCentavosParaBRL, paraCentavos } from '../../utils/currency';

interface FormularioSolicitacaoProps {
  open: boolean;
  onClose: () => void;
  solicitacaoExistente?: BackendSolicitacaoPagamento | null;
  onSalvar: (dados: { titulo: string; valor: number; descricao?: string | null }) => Promise<void>;
  isSaving: boolean;
}

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
  const [erro, setErro] = useState<string | null>(null);

  // Already analyzed (approved/completed/cancelled) requests can never be edited again —
  // the form is shown read-only with the save action hidden instead of letting the user
  // type into fields that would be rejected by the backend anyway.
  const bloqueado = Boolean(solicitacaoExistente) && solicitacaoExistente?.status !== 'pendente';

  useEffect(() => {
    if (open) {
      setTitulo(solicitacaoExistente?.titulo || '');
      setValorCentavos(solicitacaoExistente?.valor || 0);
      setDescricao(solicitacaoExistente?.descricao || '');
      setErro(null);
    }
  }, [open, solicitacaoExistente]);

  const handleSalvar = async () => {
    if (!titulo.trim() || valorCentavos <= 0) return;
    try {
      await onSalvar({ titulo: titulo.trim(), valor: valorCentavos, descricao });
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar a solicitação.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {solicitacaoExistente ? 'Solicitação de Pagamento' : 'Nova Solicitação de Pagamento'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {erro && <Alert severity="error">{erro}</Alert>}
          {bloqueado && (
            <Alert severity="warning">
              Esta solicitação já foi analisada (status: <strong>{solicitacaoExistente?.status}</strong>) e não
              pode mais ser editada.
            </Alert>
          )}

          <TextField
            label="Título"
            fullWidth
            required
            autoFocus
            disabled={bloqueado}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <TextField
            label="Valor"
            fullWidth
            required
            disabled={bloqueado}
            value={formatCentavosParaBRL(valorCentavos)}
            onChange={(e) => setValorCentavos(paraCentavos(e.target.value))}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          />

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Descrição
            </Typography>
            {bloqueado ? (
              <Box
                sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', minHeight: 60 }}
                dangerouslySetInnerHTML={{ __html: descricao || '<p style="color:#94A3B8">Sem descrição.</p>' }}
              />
            ) : (
              <QuillEditor value={descricao} onChange={setDescricao} minHeight={160} />
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>{bloqueado ? 'Fechar' : 'Cancelar'}</Button>
        {!bloqueado && (
          <Button
            variant="contained"
            onClick={handleSalvar}
            disabled={!titulo.trim() || valorCentavos <= 0 || isSaving}
            startIcon={isSaving ? <CircularProgress size={16} thickness={5} sx={{ color: 'inherit' }} /> : undefined}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
