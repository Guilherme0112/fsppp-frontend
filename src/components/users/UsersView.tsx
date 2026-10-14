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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { PageContainer } from '../common/PageContainer';

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
};

export const UsersView: React.FC = () => {
  const {
    users,
    usersTotal,
    usersPage,
    usersPerPage,
    setUsersPage,
    setUsersPerPage,
    roles,
    addUser,
    editUser,
    deleteUser,
    isLoading,
    isMutating,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', roles: [] as string[] });
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', confirmPassword: '', roles: [] });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '', confirmPassword: '', roles: user.roles || [] });
    setFormError(null);
    setModalOpen(true);
  };

  const toggleRole = (papel: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(papel) ? prev.roles.filter((r) => r !== papel) : [...prev.roles, papel],
    }));
  };

  const handleSave = async () => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password.trim();
    if (!name || !email) return;
    if (!editingUser && !password) {
      setFormError('Defina uma senha para o novo usuário.');
      return;
    }
    if (password && password !== formData.confirmPassword.trim()) {
      setFormError('As senhas não coincidem.');
      return;
    }

    try {
      if (editingUser) {
        await editUser(editingUser.id, {
          name,
          email,
          roles: formData.roles,
          ...(password ? { password } : {}),
        });
      } else {
        await addUser({ name, email, password, roles: formData.roles });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível salvar o usuário.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    const user = deletingUser;
    setDeletingUser(null);
    await deleteUser(user.id);
    // If this was the last row on the current page, step back a page.
    if (users.length === 1 && usersPage > 1) {
      setUsersPage(usersPage - 1);
    }
  };

  return (
    <PageContainer disableMaxWidth>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Usuários
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie os usuários com acesso ao sistema
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
        >
          Novo Usuário
        </Button>
      </Box>

      {/* Users Table */}
      <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>E-mail</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Papéis</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Criado em</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} sx={{ color: 'primary.main' }} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Nenhum usuário cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{user.email}</TableCell>
                    <TableCell>
                      {user.roles && user.roles.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {user.roles.map((papel) => (
                            <Chip key={papel} label={papel} size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{formatDate(user.createdAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(user)}
                        disabled={isMutating}
                        sx={{ color: 'text.secondary' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeletingUser(user)}
                        disabled={isMutating || usersTotal <= 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={usersTotal}
          page={usersPage - 1}
          onPageChange={(_e, newPage) => setUsersPage(newPage + 1)}
          rowsPerPage={usersPerPage}
          onRowsPerPageChange={(e) => setUsersPerPage(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Linhas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Nome Completo"
              fullWidth
              required
              autoFocus
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="E-mail"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label={editingUser ? 'Nova Senha (opcional)' : 'Senha'}
              type="password"
              fullWidth
              required={!editingUser}
              helperText={editingUser ? 'Deixe em branco para manter a senha atual.' : 'Mínimo de 6 caracteres.'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <TextField
              label="Confirmar Senha"
              type="password"
              fullWidth
              required={!editingUser || Boolean(formData.password.trim())}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
            <Box>
              <FormLabel component="legend" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                Papéis
              </FormLabel>
              <FormGroup>
                {roles.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Nenhum papel cadastrado.
                  </Typography>
                ) : (
                  roles.map((papel) => (
                    <FormControlLabel
                      key={papel}
                      control={
                        <Checkbox
                          checked={formData.roles.includes(papel)}
                          onChange={() => toggleRole(papel)}
                        />
                      }
                      label={papel}
                    />
                  ))
                )}
              </FormGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalOpen(false)} disabled={isMutating}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.email.trim() || isMutating}
            startIcon={isMutating ? <CircularProgress size={16} thickness={5} sx={{ color: 'inherit' }} /> : undefined}
          >
            {isMutating ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deletingUser)} onClose={() => setDeletingUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Apagar Usuário</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Tem certeza que deseja apagar <strong>{deletingUser?.name}</strong>? Essa ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeletingUser(null)} disabled={isMutating}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isMutating}
            startIcon={isMutating ? <CircularProgress size={16} thickness={5} sx={{ color: 'inherit' }} /> : undefined}
          >
            {isMutating ? 'Apagando...' : 'Apagar'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};
