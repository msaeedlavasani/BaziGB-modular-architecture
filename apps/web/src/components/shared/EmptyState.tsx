'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

/** Canonical product-level empty state for BaziGB sections and panels. */
export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Box
      role="status"
      sx={{
        width: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 1.5 : 2,
        px: { xs: 4, sm: 6 },
        py: compact ? 5 : { xs: 6, sm: 8 },
        textAlign: 'center',
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 4,
        bgcolor: alpha(theme.palette.background.paper, 0.24),
      }}
    >
      {icon && (
        <Box
          sx={{
            width: compact ? 44 : 56,
            height: compact ? 44 : 56,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          {icon}
        </Box>
      )}

      <Box sx={{ maxWidth: 480, minWidth: 0 }}>
        <Typography variant={compact ? 'subtitle1' : 'h6'} sx={{ color: 'text.primary', fontWeight: 800 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.75, lineHeight: 1.75 }}>
            {description}
          </Typography>
        )}
      </Box>

      {actionLabel && onAction && (
        <Button variant="contained" color="primary" onClick={onAction} sx={{ mt: 1, fontWeight: 800 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
