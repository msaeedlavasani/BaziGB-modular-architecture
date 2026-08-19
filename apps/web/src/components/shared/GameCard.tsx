'use client';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

interface GameCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  accent?: string;
  onClick?: () => void;
}

/** کارت انتخاب بازی در لابی (Honey Bronze) */
export default function GameCard({ title, description, icon, accent = '#EEAC2F', onClick }: GameCardProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, flex: 1 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'secondary.light',
            color: accent,
            fontSize: 30,
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4), 0 2px 10px rgba(238,172,47,0.15)',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" sx={{ color: 'text.primary' }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}
