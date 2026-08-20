'use client';
import { createTheme, alpha } from '@mui/material/styles';

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
  spacing: 4, // 4px base unit for more granular control
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
    h1: { fontWeight: 900, fontSize: '2.5rem', letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.01em' },
    h3: { fontWeight: 800, fontSize: '1.75rem' },
    h4: { fontWeight: 700, fontSize: '1.5rem' },
    h5: { fontWeight: 700, fontSize: '1.25rem' },
    h6: { fontWeight: 700, fontSize: '1.1rem' },
    subtitle1: { fontWeight: 600, fontSize: '1rem' },
    subtitle2: { fontWeight: 600, fontSize: '0.875rem' },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    button: { fontWeight: 700, textTransform: 'none' },
    caption: { fontSize: '0.75rem', fontWeight: 500 },
    overline: { fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          transition: 'all .2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 16px rgba(238, 172, 47, 0.25)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        sizeLarge: {
          padding: '12px 28px',
          fontSize: '1rem',
        },
        sizeSmall: {
          padding: '4px 12px',
          fontSize: '0.75rem',
        },
        containedPrimary: {
          color: honeyBronze.secondary,
          '&:hover': {
            backgroundColor: honeyBronze.goldLight,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all .2s ease',
          '&:hover': {
            backgroundColor: 'rgba(238, 172, 47, 0.08)',
            color: honeyBronze.primary,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${honeyBronze.border}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
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
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            transition: 'all .2s ease',
            '& fieldset': { borderColor: honeyBronze.border },
            '&:hover fieldset': { borderColor: alpha(honeyBronze.primary, 0.4) },
            '&.Mui-focused fieldset': { borderColor: honeyBronze.primary },
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: honeyBronze.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(honeyBronze.primary, 0.4) },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: honeyBronze.primary },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            color: honeyBronze.textMuted,
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            borderBottom: `2px solid ${honeyBronze.border}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: alpha(honeyBronze.border, 0.5),
          padding: '16px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 8,
        },
        sizeSmall: {
          fontSize: '0.7rem',
        },
      },
    },
  },
});

