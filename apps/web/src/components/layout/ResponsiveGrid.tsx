import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { layoutContract, type RepeatedItemSize } from '@/design-system/layout-contract';

interface ResponsiveGridProps {
  children: ReactNode;
  /** Semantic item role; the Design System owns its minimum geometry. */
  itemSize?: RepeatedItemSize;
  sx?: SxProps<Theme>;
}

/** Content-driven grid: no device labels or fixed column counts. */
export default function ResponsiveGrid({
  children,
  itemSize = 'standard',
  sx,
}: ResponsiveGridProps) {
  return (
    <Box
      sx={[
        {
          containerType: 'inline-size',
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${layoutContract.grid[itemSize]}), 1fr))`,
          gap: layoutContract.grid.gap,
          alignItems: 'stretch',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
