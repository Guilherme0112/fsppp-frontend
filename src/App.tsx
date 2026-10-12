import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { goldTheme } from './theme/theme';
import { AppLayout } from './components/layout/AppLayout';
import { LoginView } from './components/auth/LoginView';
import { UsersView } from './components/users/UsersView';
import { TasksView } from './components/tasks/TasksView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
});

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
    </AppLayout>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={goldTheme}>
        <CssBaseline />
        <AuthProvider>
          <AppProvider>
            <MainAppContent />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
