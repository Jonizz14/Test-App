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
import { ExitToApp as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UnbanModal = ({ open, onClose }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { unbanWithCode, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Iltimos, unban kodini kiriting');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await unbanWithCode(code.trim());
      onClose();
    } catch (error) {
      setError('Noto\'g\'ri unban kodi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }
      }}
    >
      <DialogTitle sx={{
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        textAlign: 'center',
        py: 3,
        borderBottom: '1px solid #fecaca'
      }}>
        <Typography variant="h5" sx={{
          fontWeight: 700,
          color: '#dc2626',
          mb: 1
        }}>
          🔒 Profil bloklangan
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography sx={{
            color: '#374151',
            mb: 3,
            lineHeight: 1.6,
            fontSize: '1.1rem'
          }}>
            Profilingizni ochish uchun 4 ta raqamli kodni kiriting
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            autoFocus
            fullWidth
            label="4 ta raqamli kod"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="1234"
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
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#f9fafb',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                },
                '&.Mui-focused': {
                  backgroundColor: '#ffffff',
                }
              }
            }}
            disabled={isLoading}
          />

          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !code.trim()}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
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
                'Kirish'
              )}
            </Button>

            <Button
              onClick={handleLogout}
              variant="outlined"
              startIcon={<LogoutIcon />}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderColor: '#dc2626',
                color: '#dc2626',
                '&:hover': {
                  backgroundColor: '#fef2f2',
                  borderColor: '#b91c1c',
                }
              }}
            >
              Chiqish
            </Button>
          </Box>
        </Box>

      </DialogContent>
    </Dialog>
  );
};

export default UnbanModal;