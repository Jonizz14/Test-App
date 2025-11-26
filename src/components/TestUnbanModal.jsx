import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const TestUnbanModal = ({
  open,
  onUnbanSuccess,
  onUnbanFail,
  unbanCode,
  setUnbanCode,
  unbanError,
  handleUnbanSubmit
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unbanCode.trim()) {
      return;
    }

    setIsLoading(true);

    const success = await handleUnbanSubmit(unbanCode.trim());

    setIsLoading(false);

    if (success) {
      onUnbanSuccess();
    } else {
      onUnbanFail();
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      disableBackdropClick
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '8px',
        }
      }}
    >
      <DialogTitle sx={{
        backgroundColor: '#fef3c7',
        color: '#d97706',
        textAlign: 'center',
        py: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <WarningIcon sx={{ fontSize: '1.5rem' }} />
          <Typography variant="h5" sx={{
            fontWeight: 600,
            color: '#d97706',
          }}>
            Ogohlantirishlar tugadi!
          </Typography>
        </Box>
        <Typography sx={{
          fontSize: '0.9rem',
          color: '#b45309'
        }}>
          Testni davom ettirish uchun kodni kiriting
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography sx={{
            color: '#374151',
            mb: 2,
            lineHeight: 1.6
          }}>
            Siz 3 ta ogohlantirish oldingiz. Testni davom ettirish uchun quyidagi kodni kiriting.
          </Typography>

          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            mb: 3,
            flexWrap: 'wrap'
          }}>
            {[...Array(3)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  display: 'inline-block'
                }}
              />
            ))}
          </Box>
        </Box>

        {unbanError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {unbanError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            autoFocus
            fullWidth
            label="Blokdan ochish kodi"
            value={unbanCode}
            onChange={(e) => setUnbanCode(e.target.value)}
            placeholder="4 ta raqam"
            inputProps={{
              maxLength: 4,
              style: {
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }
            }}
            sx={{
              mb: 3,
            }}
            disabled={isLoading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading || !unbanCode.trim()}
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: '#059669',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#047857',
              },
              '&:disabled': {
                backgroundColor: '#d1d5db',
                color: '#9ca3af'
              }
            }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>Tekshirilmoqda...</span>
              </Box>
            ) : (
              'Testni davom ettirish'
            )}
          </Button>
        </Box>

        <Typography sx={{
          textAlign: 'center',
          color: '#6b7280',
          mt: 3,
          fontSize: '0.85rem'
        }}>
          Kodni admin paneldan olishingiz mumkin
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default TestUnbanModal;