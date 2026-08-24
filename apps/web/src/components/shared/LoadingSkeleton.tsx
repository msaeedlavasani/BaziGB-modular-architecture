'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

interface LoadingSkeletonProps {
  count?: number;
  height?: number;
  columns?: { xs?: number; sm?: number; md?: number };
}

/**
 * Structural loading skeleton for repeated section content.
 * Use page-specific skeletons when the final layout has materially different geometry.
 */
export default function LoadingSkeleton({
  count = 4,
  height = 140,
  columns = { xs: 1, sm: 2, md: 4 },
}: LoadingSkeletonProps) {
  const gridTemplateColumns = {
    xs: `repeat(${columns.xs ?? 1}, minmax(0, 1fr))`,
    sm: `repeat(${columns.sm ?? columns.xs ?? 1}, minmax(0, 1fr))`,
    md: `repeat(${columns.md ?? columns.sm ?? columns.xs ?? 1}, minmax(0, 1fr))`,
  };

  return (
    <Box
      aria-hidden
      sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns,
        gap: 3,
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangular"
          height={height}
          sx={{ borderRadius: 4, transform: 'none' }}
        />
      ))}
    </Box>
  );
}
