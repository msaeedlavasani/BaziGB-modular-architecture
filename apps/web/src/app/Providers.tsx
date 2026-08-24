'use client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMemo, type ReactNode } from 'react';
import { createBaziGBTheme } from '../theme';
import type { TextDirection } from '../i18n/config';
import { AuthProvider } from '../context/AuthContext';

interface ProvidersProps {
  children: ReactNode;
  direction?: TextDirection;
  fontFamily?: string;
}

export default function Providers({
  children,
  direction = 'rtl',
  fontFamily = 'Vazirmatn, "Segoe UI", Tahoma, sans-serif',
}: ProvidersProps) {
  const theme = useMemo(
    () => createBaziGBTheme({ direction, fontFamily }),
    [direction, fontFamily],
  );

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
