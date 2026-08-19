'use client';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  confirmLabel?: string;
  onConfirm?: () => void;
}

/** مودال مشترک BaziGB */
export default function Modal({ open, title, children, onClose, confirmLabel, onConfirm }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ color: 'text.primary' }}>{title}</DialogTitle>
      <DialogContent sx={{ color: 'text.secondary' }}>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          بستن
        </Button>
        {confirmLabel && onConfirm && (
          <Button variant="contained" color="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
