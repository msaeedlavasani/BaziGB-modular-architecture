import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { layoutContract } from '@/design-system/layout-contract';

export type PageWidth = 'narrow' | 'content' | 'wide';

const WIDTHS: Record<PageWidth, 'sm' | 'md' | 'lg'> = {
  narrow: 'sm',
  content: 'md',
  wide: 'lg',
};

interface PageContainerProps {
  children: ReactNode;
  width?: PageWidth;
  sx?: SxProps<Theme>;
}

/** Canonical outer geometry for non-specialized application pages. */
export default function PageContainer({ children, width = 'content', sx }: PageContainerProps) {
  return (
    <Box
      sx={[
        {
          width: '100%',
          maxWidth: WIDTHS[width],
          minWidth: 0,
          mx: 'auto',
          px: layoutContract.page.inlineGutter,
          py: layoutContract.page.blockPadding,
          boxSizing: 'border-box',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
