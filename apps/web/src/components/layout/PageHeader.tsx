import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface ParentNavigation {
  href: string;
  label: string;
  direction: 'rtl' | 'ltr';
}

interface PageHeaderProps {
  title: string;
  description?: string;
  identity?: ReactNode;
  eyebrow?: string;
  parentNavigation?: ParentNavigation;
}

/** Canonical page-title hierarchy; pages do not choose arbitrary heading sizes. */
export default function PageHeader({ title, description, identity, eyebrow, parentNavigation }: PageHeaderProps) {
  const BackIcon = parentNavigation?.direction === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <Box component="header" sx={{ width: '100%', minWidth: 0 }}>
      {parentNavigation && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: { xs: 1.5, md: 2 } }}>
          <Button
            component={Link}
            href={parentNavigation.href}
            size="small"
            color="inherit"
            startIcon={<BackIcon size={17} />}
            sx={{
              color: 'text.secondary',
              fontWeight: 700,
              px: 0.5,
              '& .MuiButton-startIcon': { marginInlineStart: 0, marginInlineEnd: 0.75 },
              '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
            }}
          >
            {parentNavigation.label}
          </Button>
        </Box>
      )}
      <Box sx={{ maxWidth: '46rem', mx: 'auto', textAlign: 'center', minWidth: 0 }}>
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
    </Box>
  );
}
