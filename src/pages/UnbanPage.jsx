import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const UnbanPage = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { unbanWithCode } = useAuth();
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
      setSuccess(true);
      setTimeout(() => {
        navigate('/student');
      }, 2000);
    } catch (error) {
      setError('Noto\'g\'ri unban kodi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        p: 2
      }}>
        <Paper sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <Typography variant="h5" sx={{
            color: '#10b981',
            fontWeight: 600,
            mb: 2
          }}>
            ✅ Muvaffaqiyat!
          </Typography>
          <Typography sx={{ color: '#374151', mb: 3 }}>
            Sizning profilingiz muvaffaqiyatli ochildi. Endi test topshirishingiz mumkin.
          </Typography>
          <Typography sx={{ color: '#6b7280' }}>
            Avtomatik ravishda bosh sahifaga yo'naltirilmoqdasiz...
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      p: 2
    }}>
      <Paper sx={{
        p: 4,
        maxWidth: 400,
        width: '100%',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <Typography variant="h4" sx={{
          textAlign: 'center',
          fontWeight: 700,
          color: '#1e293b',
          mb: 2
        }}>
          🚫 Bloklangan profil
        </Typography>

        <Typography sx={{
          textAlign: 'center',
          color: '#6b7280',
          mb: 4
        }}>
          Sizning profilingiz test qoidalarini buzganingiz uchun bloklangan.
          Unban kodi orqali profilingizni ochishingiz mumkin.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Unban kodi"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="4 xonali kod"
            inputProps={{
              maxLength: 4,
              style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
            }}
            sx={{ mb: 3 }}
            disabled={isLoading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading || !code.trim()}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' }
            }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Profilni ochish'}
          </Button>
        </Box>

        <Typography sx={{
          textAlign: 'center',
          color: '#6b7280',
          mt: 3,
          fontSize: '0.9rem'
        }}>
          Kodni admin paneldan olishingiz mumkin.
        </Typography>
      </Paper>
    </Box>
  );
};

export default UnbanPage;