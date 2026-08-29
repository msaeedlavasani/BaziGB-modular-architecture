'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

type StatusTone = 'neutral' | 'success' | 'warning';

interface StatusPillProps {
  label: ReactNode;
  icon?: ReactNode;
  tone?: StatusTone;
  title?: string;
}

/** Direction-safe status anatomy; icon and label have one logical layout owner. */
export default function StatusPill({ label, icon, tone = 'neutral', title }: StatusPillProps) {
  const theme = useTheme();
  const color = tone === 'success'
    ? theme.palette.success.light
    : tone === 'warning'
      ? theme.palette.warning.light
      : theme.palette.text.secondary;
  const base = tone === 'success'
    ? theme.palette.success.main
    : tone === 'warning'
      ? theme.palette.warning.main
      : theme.palette.text.primary;

  return (
    <Box
      component="span"
      title={title}
      sx={{
        minWidth: 0,
        minHeight: 30,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.375,
        borderRadius: 999,
        border: '1px solid',
        borderColor: alpha(base, 0.3),
        bgcolor: alpha(base, 0.1),
        color,
        direction: 'inherit',
        '& > svg': { flex: '0 0 auto', inlineSize: 15, blockSize: 15 },
      }}
    >
      {icon}
      <Typography component="span" variant="caption" sx={{ color: 'inherit', fontWeight: 800, lineHeight: 1.2 }}>
        {label}
      </Typography>
    </Box>
  );
}
