'use client';
import { createTheme, alpha } from '@mui/material/styles';
import type { TextDirection } from './i18n/config';

/** Honey Bronze — canonical BaziGB design tokens. */
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

/**
 * Canonical shape scale.
 *
 * MUI numeric `sx={{ borderRadius: n }}` multiplies `n` by
 * `theme.shape.borderRadius`. Keep the base small and predictable so common
 * values map to intentional product radii instead of oversized pill-like
 * surfaces.
 *
 * 2   -> 8px   compact controls/chips
 * 2.5 -> 10px  buttons/inputs
 * 3   -> 12px  icon containers/small surfaces
 * 4   -> 16px  cards/panels/major surfaces
 */
export const shapeScale = {
  base: 4,
  control: 10,
  compact: 8,
  surface: 12,
  panel: 16,
} as const;

export interface BaziGBThemeOptions {
  direction?: TextDirection;
  fontFamily?: string;
}

const motion = '200ms cubic-bezier(0.4, 0, 0.2, 1)';

export function createBaziGBTheme({
  direction = 'rtl',
  fontFamily = '"Vazirmatn Variable", Vazirmatn, "Segoe UI", Tahoma, sans-serif',
}: BaziGBThemeOptions = {}) {
  return createTheme({
    direction,
    // Canonical 8px layout scale. Numeric `sx` spacing values across the app
    // are authored against this base (for example px: 2 = 16px).
    spacing: 8,
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
      warning: {
        main: honeyBronze.primary,
        light: honeyBronze.goldLight,
        dark: honeyBronze.goldDark,
        contrastText: honeyBronze.secondary,
      },
    },
    typography: {
      fontFamily,
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
    shape: { borderRadius: shapeScale.base },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*, *::before, *::after': { boxSizing: 'border-box' },
          body: { overflowX: 'hidden' },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              scrollBehavior: 'auto !important',
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            border: 0,
            borderBottom: `1px solid ${honeyBronze.border}`,
            borderRadius: 0,
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: shapeScale.control,
            padding: '8px 20px',
            transition: `background-color ${motion}, border-color ${motion}, color ${motion}, transform ${motion}`,
            '&:hover': { transform: 'translateY(-1px)' },
            '&:active': { transform: 'translateY(0)' },
            '&:focus-visible': {
              outline: `3px solid ${alpha(honeyBronze.primary, 0.32)}`,
              outlineOffset: 2,
            },
            '&.Mui-disabled': { transform: 'none', boxShadow: 'none' },
            '& .MuiButton-startIcon': {
              marginInlineStart: 0,
              marginInlineEnd: 8,
            },
            '& .MuiButton-endIcon': {
              marginInlineStart: 8,
              marginInlineEnd: 0,
            },
          },
          sizeLarge: { padding: '12px 28px', fontSize: '1rem' },
          sizeSmall: { padding: '4px 12px', fontSize: '0.75rem' },
          containedPrimary: {
            color: honeyBronze.secondary,
            '&:hover': { backgroundColor: honeyBronze.goldLight },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: `background-color ${motion}, color ${motion}, border-color ${motion}`,
            '&:hover': {
              backgroundColor: alpha(honeyBronze.primary, 0.08),
              color: honeyBronze.primary,
            },
            '&:focus-visible': {
              outline: `3px solid ${alpha(honeyBronze.primary, 0.32)}`,
              outlineOffset: 2,
            },
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
            transition: `transform ${motion}, box-shadow ${motion}, border-color ${motion}`,
            '&[data-interactive="true"]:hover': {
              transform: 'translateY(-2px)',
              borderColor: alpha(honeyBronze.primary, 0.35),
              boxShadow: `0 10px 28px ${alpha(honeyBronze.primary, 0.14)}`,
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: shapeScale.control,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              transition: `border-color ${motion}, background-color ${motion}`,
              '& fieldset': { borderColor: honeyBronze.border },
              '&:hover fieldset': { borderColor: alpha(honeyBronze.primary, 0.4) },
              '&.Mui-focused fieldset': { borderColor: honeyBronze.primary },
            },
          },
        },
      },
      MuiSelect: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            borderRadius: shapeScale.control,
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
          root: { fontWeight: 700, borderRadius: shapeScale.compact },
          sizeSmall: { fontSize: '0.7rem' },
        },
      },
    },
  });
}

/** Backward-compatible Persian default theme for non-request-aware consumers. */
export const theme = createBaziGBTheme();
