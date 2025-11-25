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
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(254, 242, 242, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px rgba(220, 38, 38, 0.25), 0 0 60px rgba(220, 38, 38, 0.1)',
          animation: 'modalBounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          position: 'relative',
          overflow: 'hidden',
        }
      }}
    >
      {/* Animated background particles */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        <Box sx={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '4px',
          height: '4px',
          background: 'rgba(220, 38, 38, 0.3)',
          borderRadius: '50%',
          animation: 'particleFloat 8s ease-in-out infinite',
        }} />
        <Box sx={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '3px',
          height: '3px',
          background: 'rgba(220, 38, 38, 0.4)',
          borderRadius: '50%',
          animation: 'particleFloat 12s ease-in-out infinite reverse',
        }} />
      </Box>

      <DialogTitle sx={{
        background: 'linear-gradient(135deg, rgba(254, 242, 242, 0.8) 0%, rgba(254, 226, 226, 0.6) 100%)',
        color: '#dc2626',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: '24px 32px',
        borderBottom: '1px solid rgba(220, 38, 38, 0.1)',
        position: 'relative',
        zIndex: 1,
        '& .MuiTypography-root': {
          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
          fontSize: '1.5rem',
        }
      }}>
        <Box sx={{
          animation: 'attentionPulse 2s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <WarningIcon sx={{
            fontSize: '2rem',
            filter: 'drop-shadow(0 0 8px rgba(220, 38, 38, 0.5))',
          }} />
        </Box>
        <Typography variant="h6">
          Ogohlantirish!
        </Typography>
      </DialogTitle>

      <DialogContent sx={{
        pt: 4,
        pb: 2,
        px: 4,
        position: 'relative',
        zIndex: 1,
        animation: 'contentFadeIn 0.6s ease-out 0.2s both',
      }}>
        <Box sx={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(254, 242, 242, 0.6) 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(220, 38, 38, 0.1)',
          boxShadow: 'inset 0 2px 8px rgba(220, 38, 38, 0.05)',
        }}>
          <Typography
            variant="body1"
            sx={{
              color: '#374151',
              mb: 3,
              fontSize: '1.1rem',
              fontWeight: 500,
              lineHeight: 1.6,
            }}
          >
            {message}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#6b7280',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
          >
            Test qoidalariga rioya qiling. Aks holda test bekor qilinishi mumkin.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{
        p: 4,
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(254, 242, 242, 0.4) 0%, rgba(254, 226, 226, 0.2) 100%)',
        borderTop: '1px solid rgba(220, 38, 38, 0.1)',
        position: 'relative',
        zIndex: 1,
      }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            minWidth: 140,
            fontWeight: 700,
            fontSize: '1rem',
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            color: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3), 0 4px 12px rgba(220, 38, 38, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: '2px solid transparent',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
              transition: 'left 0.6s',
            },
            '&:hover': {
              background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
              transform: 'translateY(-3px) scale(1.05)',
              boxShadow: '0 12px 35px rgba(220, 38, 38, 0.4), 0 6px 18px rgba(220, 38, 38, 0.2)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&::before': {
                left: '100%',
              },
            },
            '&:active': {
              transform: 'translateY(-1px) scale(1.02)',
              boxShadow: '0 6px 20px rgba(220, 38, 38, 0.3), 0 3px 10px rgba(220, 38, 38, 0.15)',
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