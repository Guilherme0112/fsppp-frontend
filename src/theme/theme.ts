import { createTheme } from '@mui/material/styles';

export const goldTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#B8860B',
      light: '#D4AF37',
      dark: '#8A6A1D',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#5C3A15',
      light: '#B8860B',
      dark: '#3E2A0B',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F9F5EC',
      paper: '#FFFDF8',
    },
    text: {
      primary: '#1F1A17',
      secondary: '#6D5A43',
    },
    error: {
      main: '#B42318',
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
          border: '1px solid #E9DDB5',
          boxShadow: '0 1px 3px rgba(92, 58, 21, 0.08)',
        },
      },
    },
  },
});
