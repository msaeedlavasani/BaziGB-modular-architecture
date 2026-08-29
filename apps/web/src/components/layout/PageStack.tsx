import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { layoutContract } from '@/design-system/layout-contract';

interface PageStackProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/** Canonical section rhythm inside PageContainer. */
export default function PageStack({ children, sx }: PageStackProps) {
  return (
    <Box
      sx={[
        {
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: layoutContract.section.gap,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
