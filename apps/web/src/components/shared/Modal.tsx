'use client';

import type { ReactNode } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
}

/**
 * Locale-neutral BaziGB confirmation/focus dialog.
 *
 * All user-facing copy is provided by the consumer so this primitive can be
 * reused in both Persian and English without owning product language.
 */
export default function Modal({
  open,
  title,
  children,
  onClose,
  closeLabel,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle sx={{ color: 'text.primary', fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent sx={{ color: 'text.secondary', lineHeight: 1.75 }}>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} color="inherit" variant="outlined">
          {closeLabel}
        </Button>
        {confirmLabel && onConfirm && (
          <Button
            variant="contained"
            color="primary"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
