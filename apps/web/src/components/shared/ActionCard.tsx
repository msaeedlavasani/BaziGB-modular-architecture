'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { layoutContract } from '@/design-system/layout-contract';

export type ActionCardEmphasis = 'primary' | 'secondary';

interface ActionCardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  emphasis?: ActionCardEmphasis;
  children: ReactNode;
}

/**
 * Reusable product-action composition. Hierarchy belongs to this component;
 * pages supply content and controls rather than reconstructing card geometry.
 */
export default function ActionCard({
  title,
  description,
  icon,
  emphasis = 'secondary',
  children,
}: ActionCardProps) {
  const theme = useTheme();
  const primary = emphasis === 'primary';

  return (
    <Paper
      elevation={0}
      data-emphasis={emphasis}
      sx={{
        minWidth: 0,
        height: '100%',
        p: { xs: 1, sm: layoutContract.card.padding },
        borderRadius: 4,
        border: '1px solid',
        borderColor: primary ? 'primary.main' : 'divider',
        bgcolor: primary ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 0.75, sm: 2 },
      }}
    >
      {(icon || title || description) && (
        <Box sx={{ display: { xs: 'grid', sm: 'block' }, gridTemplateColumns: icon ? 'auto minmax(0, 1fr)' : '1fr', columnGap: 1.25, alignItems: 'center' }}>
          {icon && <Box sx={{ display: { xs: 'none', sm: 'block' }, gridRow: { xs: '1 / span 2', sm: 'auto' }, mb: { xs: 0, sm: title || description ? 1.5 : 0 } }}>{icon}</Box>}
          {title && (
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="body2" sx={{ mt: title ? 0.5 : 0, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
              {description}
            </Typography>
          )}
        </Box>
      )}
      {children}
    </Paper>
  );
}
