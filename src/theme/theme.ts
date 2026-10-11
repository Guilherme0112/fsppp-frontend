import { createTheme } from '@mui/material/styles';

export const redTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#DC2626', // Red 600
      light: '#EF4444', // Red 500
      dark: '#B91C1C', // Red 700
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#991B1B', // Red 800
      light: '#DC2626',
      dark: '#7F1D1D',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
    error: {
      main: '#DC2626',
    },
  },
  typography: {
    fontFamily: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});
