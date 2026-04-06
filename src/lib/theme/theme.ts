'use client';

import { createTheme } from '@mui/material/styles';
import { colors } from './colors';

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
    },
    secondary: {
      main: colors.secondary,
      light: colors.secondaryLight,
    },
    success: {
      main: colors.success,
    },
    error: {
      main: colors.error,
    },
    warning: {
      main: colors.warning,
    },
    background: {
      default: colors.background,
      paper: colors.cardBg,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          padding: '12px 28px',
          fontSize: '1.1rem',
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 72,
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 60,
          '&.Mui-selected': {
            color: colors.primary,
          },
        },
        label: {
          fontFamily: '"Nunito", sans-serif',
          fontWeight: 700,
          fontSize: '0.75rem',
          '&.Mui-selected': {
            fontSize: '0.75rem',
          },
        },
      },
    },
  },
});
