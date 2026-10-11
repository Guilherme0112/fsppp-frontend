import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Divider,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as OrgIcon,
  RestartAlt as ResetIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

export const SettingsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [orgName, setOrgName] = useState('Minha Empresa');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados do sistema (usuários, quadros e tarefas) para o padrão original?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Configurações
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie as preferências da sua conta e do sistema
        </Typography>
      </Box>

      {savedSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          Configurações salvas com sucesso!
        </Alert>
      )}

      <form onSubmit={handleSave}>
        <Grid container spacing={3}>
          {/* User Profile */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <PersonIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Perfil do Usuário
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Nome"
                      fullWidth
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="E-mail"
                      fullWidth
                      defaultValue={currentUser?.email}
                      disabled
                      helperText="O e-mail é gerenciado pelo administrador"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Cargo / Função"
                      fullWidth
                      defaultValue={currentUser?.role}
                      disabled
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Organization Settings */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <OrgIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Informações da Organização
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Nome da Empresa / Time"
                      fullWidth
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Tema do Sistema"
                      fullWidth
                      value="Tema Vermelho (Padrão)"
                      disabled
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' }, px: 3 }}
                  >
                    Salvar Alterações
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Maintenance Area */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ border: '1px solid #FCA5A5', bgcolor: '#FEF2F2', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <ResetIcon color="error" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'error.main' }}>
                    Restaurar Dados Originais
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Caso queira recarregar os quadros, tarefas e usuários de demonstração originais, clique no botão abaixo.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ResetIcon />}
                  onClick={handleResetData}
                  sx={{ borderRadius: 2 }}
                >
                  Restaurar Padrão de Fábrica
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};
