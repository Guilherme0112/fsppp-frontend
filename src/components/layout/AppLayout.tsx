import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Avatar,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ViewKanban as TaskIcon,
  People as UsersIcon,
  ShoppingCart as ShoppingCartIcon,
  Logout as LogoutIcon,
  ChevronRight as ExpandirIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const DRAWER_WIDTH = 250;
const COLLAPSED_DRAWER_WIDTH = 76;
const SIDEBAR_STORAGE_KEY = 'fsppp.sidebar.collapsed';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { activeModule, setActiveModule, modules, isLoading, isMutating } = useApp();
  const isBusy = isLoading || isMutating;

  const paperRef = useRef<HTMLDivElement | null>(null);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      // Start minimized so the menu only takes space when the user opens it.
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const setCollapsedState = (next: boolean) => {
    setCollapsed(next);
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch {
      // Storage may be unavailable (private mode); keep the in-memory state.
    }
  };

  // Clicking anywhere outside the sidebar minimizes it again.
  useEffect(() => {
    if (collapsed) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && paperRef.current?.contains(target)) return;
      setCollapsedState(true);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [collapsed]);

  const drawerWidth = collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  const getIcon = (id: string) => {
    switch (id) {
      case 'tasks':
        return <TaskIcon />;
      case 'users':
        return <UsersIcon />;
      case 'compras':
        return <ShoppingCartIcon />;
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
              <div>
                <img src="./public/icon-fsppp.png" width="120" />
              </div>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isBusy && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} thickness={5} sx={{ color: 'primary.main' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Sincronizando...
                </Typography>
              </Box>
            )}
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
        slotProps={{
          paper: {
            ref: paperRef,
            onClick: () => {
              // Any click on the minimized menu opens it.
              if (collapsed) setCollapsedState(false);
            },
          },
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            pt: 8.5,
            overflowX: 'hidden',
            transition: (t) =>
              t.transitions.create('width', {
                duration: t.transitions.duration.shorter,
                easing: t.transitions.easing.easeInOut,
              }),
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                gap: 1,
                px: collapsed ? 0 : 2,
                pt: 0.5,
                pb: 1,
              }}
            >
              {!collapsed && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 1.5,
                    display: 'block',
                    fontWeight: 700,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Módulos do Sistema
                </Typography>
              )}
              {collapsed && (
                <Tooltip title="Expandir menu" placement="right">
                  <IconButton
                    size="small"
                    onClick={() => setCollapsedState(false)}
                    aria-label="Expandir menu lateral"
                    sx={{ color: 'text.secondary' }}
                  >
                    <ExpandirIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <List disablePadding sx={{ px: collapsed ? 1 : 2 }}>
              {modules.map((mod) => {
                const isSelected = activeModule === mod.id;
                return (
                  <ListItem key={mod.id} disablePadding sx={{ mb: 0.5 }}>
                    <Tooltip title={collapsed ? mod.name : ''} placement="right">
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => setActiveModule(mod.id)}
                        sx={{
                          borderRadius: 2,
                          py: 1.2,
                          px: 1.5,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          bgcolor: isSelected ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
                          color: isSelected ? 'primary.main' : 'text.primary',
                          '&:hover': {
                            bgcolor: isSelected ? 'rgba(220, 38, 38, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: collapsed ? 0 : 36,
                            justifyContent: 'center',
                            color: isSelected ? 'primary.main' : 'text.secondary',
                          }}
                        >
                          {getIcon(mod.id)}
                        </ListItemIcon>
                        {!collapsed && (
                          <ListItemText
                            primary={
                              <Typography sx={{ fontSize: '0.9rem', fontWeight: isSelected ? 700 : 500 }}>
                                {mod.name}
                              </Typography>
                            }
                          />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          </Box>

          {/* Bottom user summary */}
          <Box sx={{ p: collapsed ? 1 : 2, borderTop: '1px solid #E2E8F0' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 1.5,
              }}
            >
              <Tooltip title={collapsed ? currentUser?.name || 'Usuário' : ''} placement="right">
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontWeight: 700, fontSize: '0.9rem' }}>
                  {currentUser?.name?.charAt(0) || 'U'}
                </Avatar>
              </Tooltip>
              {!collapsed && (
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                    {currentUser?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    {currentUser?.email}
                  </Typography>
                </Box>
              )}
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
