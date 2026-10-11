import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { redTheme } from './theme/theme';
import { AppLayout } from './components/layout/AppLayout';
import { LoginView } from './components/auth/LoginView';
import { UsersView } from './components/users/UsersView';
import { TasksView } from './components/tasks/TasksView';
import { SettingsView } from './components/settings/SettingsView';

const MainAppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { activeModule } = useApp();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <AppLayout>
      {activeModule === 'tasks' && <TasksView />}
      {activeModule === 'users' && <UsersView />}
      {activeModule === 'settings' && <SettingsView />}
    </AppLayout>
  );
};

export default function App() {
  return (
    <ThemeProvider theme={redTheme}>
      <CssBaseline />
      <AuthProvider>
        <AppProvider>
          <MainAppContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
