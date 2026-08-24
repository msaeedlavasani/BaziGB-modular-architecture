'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

interface GameCardProps {
  title: string;
  description?: string;
  icon: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

/**
 * Canonical BaziGB game-selection tile.
 *
 * This component represents a selectable game identity, not a generic content
 * card. Keep game rules/capabilities outside this component and pass only
 * presentation/state required by the selection interaction.
 */
export default function GameCard({
  title,
  description,
  icon,
  selected = false,
  disabled = false,
  onClick,
}: GameCardProps) {
  const theme = useTheme();

  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      sx={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: { xs: 3, sm: 5 },
        borderRadius: 4,
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected
          ? alpha(theme.palette.primary.main, 0.12)
          : alpha(theme.palette.background.paper, 0.45),
        color: selected ? 'primary.main' : 'text.secondary',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          bgcolor: selected
            ? alpha(theme.palette.primary.main, 0.18)
            : alpha(theme.palette.background.paper, 0.75),
          borderColor: selected ? 'primary.main' : alpha(theme.palette.primary.main, 0.35),
          transform: 'translateY(-2px)',
        },
        '&:focus-visible': {
          outline: `3px solid ${alpha(theme.palette.primary.main, 0.35)}`,
          outlineOffset: 2,
        },
        '&.Mui-disabled': {
          opacity: 0.45,
        },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': { transform: 'none' },
        },
      }}
    >
      <Box
        sx={{
          width: { xs: 44, sm: 52 },
          height: { xs: 44, sm: 52 },
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: selected
            ? alpha(theme.palette.primary.main, 0.16)
            : alpha(theme.palette.text.primary, 0.05),
          color: 'inherit',
          transform: selected ? 'scale(1.06)' : 'none',
          transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        {icon}
      </Box>

      <Box sx={{ textAlign: 'center', minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'inherit' }}>
          {title}
        </Typography>
        {description && (
          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 0.5, color: 'text.secondary', lineHeight: 1.5 }}
          >
            {description}
          </Typography>
        )}
      </Box>
    </ButtonBase>
  );
}
