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
  Divider,
} from '@mui/material';
import { ExitToApp as LogoutIcon, Lock as LockIcon, VpnKey as KeyIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UnbanModal = ({ open, onClose }) => {
  const [code, setCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { unbanWithCode, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleCodeChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers

    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
        if (nextInput) {
          setTimeout(() => nextInput.focus(), 10);
        }
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      const prevInput = document.querySelector(`input[data-index="${index - 1}"]`);
      if (prevInput) {
        setTimeout(() => prevInput.focus(), 10);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      setError('Iltimos, to\'liq 4 ta raqamli kodni kiriting');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await unbanWithCode(fullCode);
      onClose();
    } catch (error) {
      setError('Noto\'g\'ri unban kodi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose(); // Close modal before redirecting
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
        background: 'linear-gradient(135deg, #fef2f2 0%, #fef2f2 100%)',
        color: '#dc2626',
        textAlign: 'center',
        py: 3,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%)',
          borderRadius: '12px 12px 0 0',
        }
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          position: 'relative',
          zIndex: 1
        }}>
          <Box sx={{
            backgroundColor: '#ffffff',
            borderRadius: '100%',
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 5,
            pb: 5,
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
            border: '2px solid #fecaca'
          }}>
            <LockIcon sx={{
              fontSize: '2.5rem',
              color: '#dc2626',
            }} />
          </Box>
          <Typography variant="h5" sx={{
            fontWeight: 700,
            color: '#dc2626',
            fontSize: '1.5rem',
            letterSpacing: '0.5px'
          }}>
            Profil bloklangan
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 4, pb: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 2
          }}>
            <KeyIcon sx={{ color: '#6b7280', fontSize: '1.2rem' }} />
            <Typography sx={{
              color: '#374151',
              fontSize: '1.1rem',
              fontWeight: 600,
              letterSpacing: '0.3px'
            }}>
              Unban kodi
            </Typography>
          </Box>
          <Typography sx={{
            color: '#6b7280',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            maxWidth: '280px',
            mx: 'auto'
          }}>
            Profilingizni ochish uchun 4 ta raqamli maxsus kodni kiriting
          </Typography>
        </Box>

        <Divider sx={{ mb: 4, borderColor: '#e5e7eb' }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Box sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {[0, 1, 2, 3].map((index) => (
                <TextField
                  key={index}
                  autoFocus={index === 0}
                  value={code[index] || ''}
                  onChange={(e) => handleCodeChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  inputProps={{
                    maxLength: 1,
                    'data-index': index,
                    style: {
                      textAlign: 'center',
                      fontSize: '2.2rem',
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      padding: '16px 0'
                    }
                  }}
                  sx={{
                    width: '60px',
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#059669',
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)',
                      },
                      '&.Mui-focused': {
                        borderColor: '#059669',
                        boxShadow: '0 6px 16px rgba(5, 150, 105, 0.25)',
                        backgroundColor: '#ffffff',
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }}
                  disabled={isLoading}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || code.some(digit => !digit)}
              sx={{
                minWidth: '200px',
                py: 1.75,
                px: 5,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                  boxShadow: '0 6px 20px rgba(5, 150, 105, 0.4)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  backgroundColor: '#d1d5db',
                  color: '#9ca3af',
                  boxShadow: 'none',
                  transform: 'none'
                }
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Tekshirilmoqda...</span>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <KeyIcon sx={{ fontSize: '1.2rem' }} />
                  <span>Profilni ochish</span>
                </Box>
              )}
            </Button>

            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              width: '100%',
              maxWidth: '250px'
            }}>
              <Divider sx={{ flex: 1, borderColor: '#e5e7eb' }} />
              <Typography sx={{
                color: '#9ca3af',
                fontSize: '0.85rem',
                fontWeight: 500,
                px: 1
              }}>
                yoki
              </Typography>
              <Divider sx={{ flex: 1, borderColor: '#e5e7eb' }} />
            </Box>

            <Button
              onClick={handleLogout}
              variant="outlined"
              startIcon={<LogoutIcon />}
              sx={{
                color: '#dc2626',
                borderColor: '#fecaca',
                backgroundColor: '#fef2f2',
                fontSize: '0.95rem',
                fontWeight: 500,
                borderRadius: '8px',
                px: 3,
                py: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#fecaca',
                  borderColor: '#f87171',
                  color: '#b91c1c',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              Tizimdan chiqish
            </Button>
          </Box>
        </Box>

      </DialogContent>
    </Dialog>
  );
};

export default UnbanModal;