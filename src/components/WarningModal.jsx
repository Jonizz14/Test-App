import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import {
  Warning as WarningIcon,
} from '@mui/icons-material';

const WarningModal = ({ open, message, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      disableBackdropClick
    >
      <DialogTitle sx={{
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: '16px 24px',
      }}>
        <WarningIcon sx={{ fontSize: '1.5rem' }} />
        <Typography variant="h6">
          Ogohlantirish!
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 2, px: 3 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {message}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          Test qoidalariga rioya qiling. Aks holda test bekor qilinishi mumkin.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: '#dc2626',
            color: 'white',
            '&:hover': {
              backgroundColor: '#b91c1c',
            },
          }}
        >
          Tushundim
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WarningModal;