import React from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Avatar,
} from '@mui/material';
import {
  ViewKanban as TaskIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const DRAWER_WIDTH = 250;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { activeModule, setActiveModule, modules } = useApp();

  const getIcon = (id: string) => {
    switch (id) {
      case 'tasks':
        return <TaskIcon />;
      case 'users':
        return <UsersIcon />;
      case 'settings':
        return <SettingsIcon />;
      default:
        return <TaskIcon />;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
              }}
            >
              T
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.1rem' }}>
              Gestão<span style={{ color: '#DC2626' }}>Red</span>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {currentUser?.name} ({currentUser?.role})
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={logout}
              sx={{ borderRadius: 2 }}
            >
              Sair
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Left Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            pt: 8.5,
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ p: 2 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                mb: 1,
                display: 'block',
                fontWeight: 700,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Módulos do Sistema
            </Typography>
            <List disablePadding>
              {modules.map((mod) => {
                const isSelected = activeModule === mod.id;
                return (
                  <ListItem key={mod.id} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => setActiveModule(mod.id)}
                      sx={{
                        borderRadius: 2,
                        py: 1.2,
                        px: 1.5,
                        bgcolor: isSelected ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
                        color: isSelected ? 'primary.main' : 'text.primary',
                        '&:hover': {
                          bgcolor: isSelected ? 'rgba(220, 38, 38, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                        {getIcon(mod.id)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: isSelected ? 700 : 500 }}>
                            {mod.name}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>

          {/* Bottom user summary */}
          <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontWeight: 700, fontSize: '0.9rem' }}>
                {currentUser?.name?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                  {currentUser?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                  {currentUser?.email}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 11,
          pb: 5,
          px: { xs: 2, sm: 4 },
          minHeight: '100vh',
          bgcolor: '#F8FAFC',
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
