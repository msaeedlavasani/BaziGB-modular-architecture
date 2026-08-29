import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { layoutContract } from '@/design-system/layout-contract';

interface ActionDeckProps {
  primary: ReactNode;
  secondary: ReactNode;
  tertiary: ReactNode;
}

/** Product-action layout that preserves hierarchy instead of equalizing cards. */
export default function ActionDeck({ primary, secondary, tertiary }: ActionDeckProps) {
  return (
    <Box sx={{ containerType: 'inline-size', minWidth: 0 }}>
      <Box
        sx={{
          minWidth: 0,
          display: 'grid',
          gridTemplateAreas: '"primary" "secondary" "tertiary"',
          gap: layoutContract.grid.gap,
          '& [data-emphasis]': { height: { xs: 'auto', sm: '100%' } },
          '& > [data-action-slot="primary"]': { gridArea: 'primary' },
          '& > [data-action-slot="secondary"]': { gridArea: 'secondary' },
          '& > [data-action-slot="tertiary"]': { gridArea: 'tertiary' },
          '@container (min-width: 38rem)': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gridTemplateAreas: '"primary primary" "secondary tertiary"',
          },
          '@container (min-width: 64rem)': {
            gridTemplateColumns: 'minmax(24rem, 1.4fr) minmax(14rem, 0.75fr) minmax(17rem, 0.95fr)',
            gridTemplateAreas: '"primary secondary tertiary"',
            alignItems: 'stretch',
          },
        }}
      >
        <Box data-action-slot="primary" sx={{ minWidth: 0 }}>{primary}</Box>
        <Box data-action-slot="secondary" sx={{ minWidth: 0 }}>{secondary}</Box>
        <Box data-action-slot="tertiary" sx={{ minWidth: 0 }}>{tertiary}</Box>
      </Box>
    </Box>
  );
}
