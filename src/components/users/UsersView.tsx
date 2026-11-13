import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Skeleton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Badge as RolesIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Inbox as EmptyIcon,
  ManageAccounts as ShowingIcon,
  People as UsersIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility,
  VisibilityOff,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { PageContainer } from '../common/PageContainer';
import { StatCard } from '../common/StatCard';
import { avatarColor, getInitials } from '../../utils/avatar';

type Feedback = {
  severity: 'success' | 'error';
  message: string;
};

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  roles: string[];
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
};

const roleColor = (role: string): ChipColor => {
  const normalized = role.toLowerCase();
  if (normalized.includes('admin')) return 'primary';
  if (normalized.includes('aprovador')) return 'info';
  if (normalized.includes('compras')) return 'warning';
  if (normalized.includes('quadro') || normalized.includes('tarefa')) return 'secondary';
  if (normalized.includes('usu')) return 'success';
  return 'default';
};

const EstadoVazio: React.FC<{
  comBusca: boolean;
  podeCriar: boolean;
  onLimpar: () => void;
  onCriar: () => void;
}> = ({ comBusca, podeCriar, onLimpar, onCriar }) => (
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
      <EmptyIcon />
    </Box>
    <Typography sx={{ fontWeight: 800 }}>
      {comBusca ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
      {comBusca
        ? 'Tente buscar por outro nome ou e-mail.'
        : podeCriar
          ? 'Cadastre o primeiro usuário para liberar o acesso ao sistema.'
          : 'Os usuários aparecerão aqui assim que forem cadastrados.'}
    </Typography>
    {comBusca ? (
      <Button onClick={onLimpar} variant="outlined" startIcon={<RefreshIcon />}>
        Limpar busca
      </Button>
    ) : (
      podeCriar && (
        <Button onClick={onCriar} variant="contained" startIcon={<AddIcon />}>
          Novo usuário
        </Button>
      )
    )}
  </Box>
);

export const UsersView: React.FC = () => {
  const { hasPermission } = useAuth();
  const podeCriar = hasPermission('usuario.criar');
  const podeEditar = hasPermission('usuario.editar');
  const podeApagar = hasPermission('usuario.deletar');

  const {
    users,
    usersTotal,
    usersPage,
    usersPerPage,
    usersSearch,
    setUsersPage,
    setUsersPerPage,
    setUsersSearch,
    refreshUsers,
    isFetchingUsers,
    roles,
    addUser,
    editUser,
    deleteUser,
    isLoading,
    isMutating,
  } = useApp();

  const [busca, setBusca] = useState(usersSearch);

  useEffect(() => {
    const timer = setTimeout(() => setUsersSearch(busca), 350);
    return () => clearTimeout(timer);
  }, [busca, setUsersSearch]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roles: [],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', confirmPassword: '', roles: [] });
    setFormError(null);
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      roles: user.roles || [],
    });
    setFormError(null);
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!isMutating) setModalOpen(false);
  };

  const handleSave = async () => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!name || !email) {
      setFormError('Preencha o nome e o e-mail do usuário.');
      return;
    }

    if (!editingUser && !password) {
      setFormError('Defina uma senha para o novo usuário.');
      return;
    }

    if (password && password.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres.');
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
        setFeedback({ severity: 'success', message: 'Usuário atualizado com sucesso.' });
      } else {
        await addUser({ name, email, password, roles: formData.roles });
        setFeedback({ severity: 'success', message: 'Usuário criado com sucesso.' });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível salvar o usuário.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    const user = deletingUser;

    try {
      await deleteUser(user.id);
      setFeedback({ severity: 'success', message: 'Usuário apagado com sucesso.' });
      setDeletingUser(null);
      if (users.length === 1 && usersPage > 1) {
        setUsersPage(usersPage - 1);
      }
    } catch (err) {
      setFeedback({
        severity: 'error',
        message: err instanceof Error ? err.message : 'Não foi possível apagar o usuário.',
      });
    }
  };

  const limparBusca = () => {
    setBusca('');
    setUsersSearch('');
  };

  const carregandoInicial = isLoading && users.length === 0;
  const comBusca = usersSearch.trim().length > 0;

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'rgba(184, 134, 11, 0.12)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UsersIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Usuários
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie acessos, papéis e credenciais da equipe
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Atualizar listagem">
            <span>
              <IconButton
                onClick={refreshUsers}
                disabled={isFetchingUsers}
                aria-label="Atualizar listagem de usuários"
              >
                {isFetchingUsers ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
          {podeCriar && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
              Novo usuário
            </Button>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          label={comBusca ? 'Resultados da busca' : 'Total de usuários'}
          value={usersTotal}
          icon={<UsersIcon />}
          color="#B8860B"
          loading={carregandoInicial}
        />
        <StatCard
          label="Papéis disponíveis"
          value={roles.length}
          icon={<RolesIcon />}
          color="#0277BD"
          loading={isFetchingUsers && roles.length === 0}
        />
        <StatCard
          label="Exibindo agora"
          value={users.length}
          icon={<ShowingIcon />}
          color="#2E7D32"
          loading={carregandoInicial}
        />
      </Box>

      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Usuários cadastrados</Typography>
            <Typography variant="caption" color="text.secondary">
              {usersTotal === 1 ? '1 usuário' : `${usersTotal} usuários`}
              {comBusca ? ` encontrados para “${usersSearch.trim()}”` : ''}
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Buscar por nome ou e-mail"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            sx={{ minWidth: { sm: 300 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: isFetchingUsers ? (
                  <InputAdornment position="end">
                    <CircularProgress size={16} />
                  </InputAdornment>
                ) : busca ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={limparBusca}
                      aria-label="Limpar busca"
                      edge="end"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700 }}>Usuário</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Papéis</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Criado em</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton width="45%" height={20} />
                          <Skeleton width="65%" height={16} />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Skeleton width={90} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={80} />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton width={70} sx={{ ml: 'auto' }} />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ p: 0, borderBottom: 'none' }}>
                    <EstadoVazio
                      comBusca={comBusca}
                      podeCriar={podeCriar}
                      onLimpar={limparBusca}
                      onCriar={handleOpenAdd}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: avatarColor(user.name),
                            fontWeight: 700,
                            fontSize: '0.9rem',
                          }}
                        >
                          {getInitials(user.name)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
                            {user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {user.roles && user.roles.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {user.roles.map((papel) => {
                            const color = roleColor(papel);
                            return (
                              <Chip
                                key={papel}
                                label={papel}
                                size="small"
                                color={color}
                                variant={color === 'default' ? 'outlined' : 'filled'}
                                sx={{ fontWeight: 700, fontSize: '0.72rem', height: 24 }}
                              />
                            );
                          })}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Sem papel
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {podeEditar && (
                        <Tooltip title="Editar usuário">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(user)}
                              disabled={isMutating}
                              aria-label={`Editar ${user.name}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {podeApagar && (
                        <Tooltip
                          title={
                            usersTotal <= 1
                              ? 'Não é possível apagar o único usuário'
                              : 'Apagar usuário'
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeletingUser(user)}
                              disabled={isMutating || usersTotal <= 1}
                              aria-label={`Apagar ${user.name}`}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {!podeEditar && !podeApagar && (
                        <Typography variant="caption" color="text.secondary">
                          —
                        </Typography>
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

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'rgba(184, 134, 11, 0.12)',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {editingUser ? <EditIcon /> : <AddIcon />}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {editingUser ? 'Editar usuário' : 'Novo usuário'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editingUser
                  ? 'Atualize os dados e as permissões do usuário.'
                  : 'Cadastre um novo acesso ao sistema.'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                color: 'text.secondary',
              }}
            >
              Dados de acesso
            </Typography>

            <TextField
              label="Nome completo"
              fullWidth
              required
              autoFocus
              autoComplete="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="E-mail"
              type="email"
              fullWidth
              required
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Divider />

            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                color: 'text.secondary',
              }}
            >
              Segurança
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                label={editingUser ? 'Nova senha (opcional)' : 'Senha'}
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required={!editingUser}
                autoComplete="new-password"
                helperText={
                  editingUser ? 'Deixe em branco para manter a senha atual.' : 'Mínimo de 6 caracteres.'
                }
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Alternar visibilidade da senha"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Confirmar senha"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required={!editingUser || Boolean(formData.password.trim())}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </Box>

            <Divider />

            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                color: 'text.secondary',
              }}
            >
              Papéis e permissões
            </Typography>

            <Autocomplete
              multiple
              options={roles}
              value={formData.roles}
              onChange={(_e, value) => setFormData({ ...formData, roles: value })}
              disableCloseOnSelect
              filterSelectedOptions
              noOptionsText="Nenhum papel cadastrado"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Papéis"
                  placeholder="Selecione os papéis"
                  helperText="Os papéis definem o que o usuário pode acessar."
                />
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} disabled={isMutating}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.email.trim() || isMutating}
            startIcon={
              isMutating ? <CircularProgress size={16} thickness={5} sx={{ color: 'inherit' }} /> : undefined
            }
          >
            {isMutating ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deletingUser)}
        onClose={() => !isMutating && setDeletingUser(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Apagar usuário</DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              p: 1.5,
              bgcolor: 'rgba(180, 35, 24, 0.06)',
              border: '1px solid rgba(180, 35, 24, 0.15)',
              borderRadius: 1.5,
              mb: 2,
            }}
          >
            <WarningIcon sx={{ color: 'error.main', flexShrink: 0 }} />
            <Typography variant="body2">Essa ação é permanente e não pode ser desfeita.</Typography>
          </Box>

          {deletingUser && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: avatarColor(deletingUser.name),
                  fontWeight: 700,
                }}
              >
                {getInitials(deletingUser.name)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                  {deletingUser.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {deletingUser.email}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeletingUser(null)} disabled={isMutating}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isMutating}
            startIcon={
              isMutating ? <CircularProgress size={16} thickness={5} sx={{ color: 'inherit' }} /> : undefined
            }
          >
            {isMutating ? 'Apagando...' : 'Apagar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={4000}
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
