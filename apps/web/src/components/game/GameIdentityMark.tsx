import Box from '@mui/material/Box';
import { CircleDollarSign, Crown, Dices, Grid3X3 } from 'lucide-react';
import type { GameId } from '@bazigb/engine';

interface GameIdentityMarkProps {
  gameId: GameId;
  size?: 'small' | 'medium' | 'large';
}

const sizes = {
  small: { frame: 36, glyph: 20 },
  medium: { frame: 44, glyph: 24 },
  large: { frame: 52, glyph: 28 },
} as const;

const icons = {
  'tic-tac-toe': Grid3X3,
  backgammon: Dices,
  chess: Crown,
  vegas: CircleDollarSign,
} satisfies Record<GameId, typeof Grid3X3>;

/** One branded icon family for game discovery and identity surfaces. */
export default function GameIdentityMark({ gameId, size = 'medium' }: GameIdentityMarkProps) {
  const Icon = icons[gameId];
  const metrics = sizes[size];

  return (
    <Box
      aria-hidden
      sx={{
        inlineSize: metrics.frame,
        blockSize: metrics.frame,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 3,
        color: 'primary.main',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <Icon size={metrics.glyph} strokeWidth={2} />
    </Box>
  );
}
