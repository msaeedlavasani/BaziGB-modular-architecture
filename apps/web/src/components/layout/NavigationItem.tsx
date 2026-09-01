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
  current?: 'page' | 'location';
}

/** Header navigation item with one owner for icon/label proximity and direction. */
export default function NavigationItem({ href, label, icon, current }: NavigationItemProps) {
  const theme = useTheme();
  const active = current !== undefined;

  return (
    <Button
      component={Link}
      href={href}
      variant="text"
      color="inherit"
      aria-current={current}
      sx={{
        minWidth: 0,
        width: '100%',
        height: '100%',
        px: { xs: 1.25, md: 1.75 },
        py: 0,
        position: 'relative',
        borderRadius: 0,
        color: active ? 'primary.main' : 'text.secondary',
        whiteSpace: 'nowrap',
        '&::after': {
          content: '""',
          position: 'absolute',
          insetInline: 0,
          insetBlockEnd: 0,
          blockSize: 2,
          borderRadius: 2,
          bgcolor: active ? 'primary.main' : 'transparent',
        },
        '&:hover': {
          color: 'primary.main',
          bgcolor: alpha(theme.palette.primary.main, 0.08),
        },
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          minWidth: 0,
          '& > svg': { flexShrink: 0 },
        }}
      >
        {icon}
        <Box component="span" sx={{ display: 'inline', fontWeight: 800 }}>
          {label}
        </Box>
      </Box>
    </Button>
  );
}
