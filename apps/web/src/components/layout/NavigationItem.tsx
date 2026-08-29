'use client';

import type { ReactNode } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';
import Link from 'next/link';

interface NavigationItemProps {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
}

/** Header navigation item with one owner for icon/label proximity and direction. */
export default function NavigationItem({ href, label, icon, active = false }: NavigationItemProps) {
  const theme = useTheme();

  return (
    <Button
      component={Link}
      href={href}
      variant={active ? 'contained' : 'text'}
      color={active ? 'primary' : 'inherit'}
      aria-current={active ? 'page' : undefined}
      sx={{
        minWidth: { xs: 36, md: 'auto' },
        width: { xs: 36, md: 'auto' },
        height: { xs: 36, md: 40 },
        px: { xs: 0, md: 1.5 },
        py: 0,
        borderRadius: { xs: '50%', md: 2.5 },
        color: active ? 'secondary.main' : 'text.secondary',
        whiteSpace: 'nowrap',
        '&:hover': {
          color: active ? 'secondary.main' : 'primary.main',
          bgcolor: active ? 'primary.light' : alpha(theme.palette.primary.main, 0.08),
        },
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 0, md: 0.75 },
          minWidth: 0,
          '& > svg': { flexShrink: 0 },
        }}
      >
        {icon}
        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, fontWeight: 800 }}>
          {label}
        </Box>
      </Box>
    </Button>
  );
}
