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
        gap: 1
      }}>
        <WarningIcon />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Ogohlantirish!
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: '#374151', mb: 2 }}>
            {message}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Test qoidalariga rioya qiling. Aks holda test bekor qilinishi mumkin.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="warning"
          sx={{
            minWidth: 120,
            fontWeight: 600
          }}
        >
          Tushundim
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WarningModal;