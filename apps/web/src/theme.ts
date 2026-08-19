'use client';
import { createTheme } from '@mui/material/styles';

/**
 * استاندارد طراحی Elite — تم Honey Bronze
 * primary.main: #EEAC2F (برنز عسلی)
 * secondary.main: #061A2D (سرمهای تیره)
 * هیچ رنگ پیشفرض MUI (Indigo/Slate/Rose) استفاده نمیشود.
 */
export const honeyBronze = {
  primary: '#EEAC2F',
  secondary: '#061A2D',
  bgDeep: '#0B1622',
  bgPaper: '#132236',
  border: '#2A3F57',
  goldLight: '#FFD27A',
  goldDark: '#B97F12',
  textMain: '#F5EFE4',
  textMuted: '#A9B7C6',
  success: '#4CAF7D',
  danger: '#E26D5A',
};

export const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'dark',
    primary: {
      main: honeyBronze.primary,
      light: honeyBronze.goldLight,
      dark: honeyBronze.goldDark,
      contrastText: honeyBronze.secondary,
    },
    secondary: {
      main: honeyBronze.secondary,
      light: '#1B3550',
      dark: '#030D18',
      contrastText: honeyBronze.primary,
    },
    background: {
      default: honeyBronze.bgDeep,
      paper: honeyBronze.bgPaper,
    },
    text: {
      primary: honeyBronze.textMain,
      secondary: honeyBronze.textMuted,
    },
    divider: honeyBronze.border,
    success: { main: honeyBronze.success },
    error: { main: honeyBronze.danger },
  },
  typography: {
    fontFamily: 'Vazirmatn, "Segoe UI", Tahoma, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 16px rgba(238, 172, 47, 0.35)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${honeyBronze.border}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: `linear-gradient(160deg, ${honeyBronze.bgPaper} 0%, ${honeyBronze.secondary} 100%)`,
          border: `1px solid ${honeyBronze.border}`,
          transition: 'transform .2s ease, box-shadow .2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(238, 172, 47, 0.18)',
          },
        },
      },
    },
  },
});
