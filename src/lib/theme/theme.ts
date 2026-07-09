'use client';

import { createTheme, type Theme } from '@mui/material/styles';
import type { ThemeName, ThemePalette } from './colors';

/**
 * Build a MUI theme from a resolved palette + active theme name.
 * Platinum gets serif display headlines (Fraunces); Candy keeps Fredoka.
 */
export function buildMuiTheme(palette: ThemePalette, themeName: ThemeName): Theme {
  const isPlatinum = themeName === 'platinum';

  const displayFont = isPlatinum
    ? '"Fraunces", "Fredoka", "Nunito", serif'
    : '"Fredoka", "Nunito", sans-serif';

  return createTheme({
    palette: {
      mode: palette.background.startsWith('#0') || palette.background.startsWith('#1a16')
        ? 'dark'
        : 'light',
      primary: {
        main: palette.primary,
        light: palette.primaryLight,
        dark: palette.primaryDark,
        contrastText: isPlatinum ? '#0A0A0A' : '#FFFFFF',
      },
      secondary: {
        main: palette.secondary,
        light: palette.secondaryLight,
      },
      success: { main: palette.success },
      error: { main: palette.error },
      warning: { main: palette.warning },
      background: {
        default: palette.background,
        paper: palette.cardBg,
      },
      text: {
        primary: palette.textPrimary,
        secondary: palette.textSecondary,
      },
      divider: palette.cardBorder,
    },
    typography: {
      fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontFamily: displayFont,
        fontWeight: isPlatinum ? 700 : 700,
        letterSpacing: isPlatinum ? '-0.025em' : 'normal',
      },
      h2: {
        fontFamily: displayFont,
        fontWeight: isPlatinum ? 700 : 700,
        letterSpacing: isPlatinum ? '-0.02em' : 'normal',
      },
      h3: {
        fontFamily: displayFont,
        fontWeight: isPlatinum ? 600 : 600,
        letterSpacing: isPlatinum ? '-0.015em' : 'normal',
      },
      h4: {
        fontFamily: displayFont,
        fontWeight: 600,
        letterSpacing: isPlatinum ? '-0.01em' : 'normal',
      },
      h5: {
        fontFamily: displayFont,
        fontWeight: 600,
      },
      h6: {
        fontFamily: displayFont,
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 700,
        fontSize: '1rem',
      },
    },
    shape: {
      borderRadius: isPlatinum ? 8 : 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: isPlatinum ? 999 : 12,
            padding: isPlatinum ? '10px 24px' : '12px 28px',
            fontSize: '1.05rem',
          },
          contained: {
            boxShadow: isPlatinum ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: isPlatinum ? 'none' : '0 6px 16px rgba(0,0,0,0.2)',
            },
          },
          outlined: {
            borderWidth: isPlatinum ? 1 : 2,
            '&:hover': { borderWidth: isPlatinum ? 1 : 2 },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: isPlatinum ? 12 : 14,
            boxShadow: isPlatinum
              ? 'none'
              : '0 4px 20px rgba(0,0,0,0.08)',
            border: isPlatinum ? `1px solid ${palette.cardBorder}` : 'none',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            height: 72,
            borderRadius: isPlatinum ? 0 : '14px 14px 0 0',
            boxShadow: isPlatinum ? 'none' : '0 -4px 20px rgba(0,0,0,0.08)',
            borderTop: isPlatinum ? `1px solid ${palette.cardBorder}` : 'none',
            backgroundColor: palette.cardBg,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            minWidth: 60,
            color: palette.textMuted,
            '&.Mui-selected': {
              color: palette.primary,
            },
          },
          label: {
            fontFamily: '"Nunito", sans-serif',
            fontWeight: 700,
            fontSize: '0.75rem',
            '&.Mui-selected': { fontSize: '0.75rem' },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
          },
        },
      },
    },
  });
}
