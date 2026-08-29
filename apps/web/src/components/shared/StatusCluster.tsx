import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

interface StatusClusterProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/** Shared spacing and logical icon alignment for composite status groups. */
export default function StatusCluster({ children, sx }: StatusClusterProps) {
  return (
    <Box
      role="status"
      sx={[
        {
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 1,
          '& .MuiChip-root': { maxWidth: '100%' },
          '& .MuiChip-icon': {
            marginInlineStart: '6px',
            marginInlineEnd: '-2px',
          },
          '& .MuiChip-label': {
            paddingInline: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
