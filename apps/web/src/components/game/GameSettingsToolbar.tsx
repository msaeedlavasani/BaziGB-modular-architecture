import type { ReactNode } from 'react';
import Box from '@mui/material/Box';

interface GameSettingsToolbarProps {
  options: ReactNode;
  actions: ReactNode;
}

/** Shared internal anatomy for game settings; outer surface remains in GameShell. */
export default function GameSettingsToolbar({ options, actions }: GameSettingsToolbarProps) {
  return (
    <Box sx={{ containerType: 'inline-size', minWidth: 0 }}>
      <Box
        sx={{
          minWidth: 0,
          display: 'grid',
          gridTemplateAreas: '"options" "actions"',
          gap: 1.5,
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            gridArea: 'options',
            minWidth: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 6.5rem), 1fr))',
            gap: 1.25,
            alignItems: 'center',
            '& .MuiFormControl-root': { minWidth: 0, width: '100%' },
            '& .MuiFormControlLabel-root': {
              m: 0,
              minHeight: 40,
              px: 1,
              borderRadius: 2.5,
              justifyContent: 'space-between',
              border: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {options}
        </Box>
        <Box
          sx={{
            gridArea: 'actions',
            minWidth: 0,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            gap: 1,
            '& .MuiButton-root': { minHeight: 40, minWidth: '6.5rem', flex: '1 1 6.5rem', px: 1.5 },
          }}
        >
          {actions}
        </Box>
      </Box>
    </Box>
  );
}
