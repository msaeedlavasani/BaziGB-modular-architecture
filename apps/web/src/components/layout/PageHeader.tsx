import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface PageHeaderProps {
  title: string;
  description?: string;
  identity?: ReactNode;
  eyebrow?: string;
}

/** Canonical page-title hierarchy; pages do not choose arbitrary heading sizes. */
export default function PageHeader({ title, description, identity, eyebrow }: PageHeaderProps) {
  return (
    <Box component="header" sx={{ maxWidth: '46rem', mx: 'auto', textAlign: 'center', minWidth: 0 }}>
      {identity && <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'center' }}>{identity}</Box>}
      {eyebrow && (
        <Typography variant="overline" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
          {eyebrow}
        </Typography>
      )}
      <Typography
        component="h1"
        sx={{
          m: 0,
          color: 'primary.main',
          fontWeight: 900,
          lineHeight: 1.2,
          fontSize: 'clamp(1.65rem, 2.4vw, 2.25rem)',
          letterSpacing: '-0.015em',
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.75 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}
