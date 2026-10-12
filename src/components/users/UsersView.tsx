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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';

export const UsersView: React.FC = () => {
  const { users, addUser, editUser, deleteUser, isLoading } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Membro',
    status: 'Ativo' as 'Ativo' | 'Inativo',
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'Membro', status: 'Ativo' });
    setModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, status: user.status });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingUser) {
      editUser(editingUser.id, formData);
    } else {
      addUser(formData);
    }
    setModalOpen(false);
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Usuários
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie os usuários e permissões do sistema
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
                <TableCell sx={{ fontWeight: 700 }}>Função / Cargo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
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
                    <TableCell color="text.secondary">{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        size="small"
                        color={user.status === 'Ativo' ? 'success' : 'default'}
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenEdit(user)} sx={{ color: 'text.secondary' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteUser(user.id)}
                        disabled={users.length <= 1}
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
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nome Completo"
              fullWidth
              required
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
              label="Cargo / Função"
              fullWidth
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Ativo' | 'Inativo' })}
              >
                <MenuItem value="Ativo">Ativo</MenuItem>
                <MenuItem value="Inativo">Inativo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.name.trim() || !formData.email.trim()}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
