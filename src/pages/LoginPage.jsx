import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// LoginPage Component - Handles user authentication
const LoginPage = () => {
  // State management for form data, error handling, and loading states
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Authentication context and navigation hook
  const { login, logout, currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (currentUser.role === 'teacher') {
        navigate('/teacher', { replace: true });
      } else if (currentUser.role === 'student') {
        navigate('/student', { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login sahifasi: Login urinish -', formData.email);
      console.log('Current URL:', window.location.href);
      console.log('Current host:', window.location.host);

      await login(formData.email, formData.password);
      console.log('Login muvaffaqiyatli, qayta yo\'naltirish...');

      // Navigation will be handled by useEffect after state updates
    } catch (err) {
      console.error('Login xatosi:', err);
      console.error('Xato tafsilotlari:', err.message);
      console.error('Xato stack:', err.stack);

      // Display user-friendly error messages
      setError(err.message || 'Login xatosi yuz berdi. Qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 6,
      px: 3
    }}>
      <Container maxWidth="xl">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          minHeight: '80vh',
          justifyContent: 'center'
        }}>
          <Grid container spacing={8} alignItems="stretch" justifyContent="center" sx={{ maxWidth: '1200px' }}>
            {/* Left side - Platform info */}
            <Grid item xs={12} lg={5}>
              <Box sx={{ 
                textAlign: { xs: 'center', lg: 'left' }, 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                pl: { lg: 4 }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: { xs: 'center', lg: 'flex-start' }, flexDirection: 'column', gap: 2 }}>
                  <img 
                    src="/src/assets/image.png" 
                    alt="STIM Test App Logo" 
                    style={{ 
                      height: '80px', 
                      width: 'auto',
                      maxWidth: '120px'
                    }} 
                  />
                  <Typography variant="h2" component="h1" sx={{ 
                    fontWeight: 700, 
                    color: '#1e293b',
                    fontSize: { xs: '2.2rem', lg: '2.8rem' }
                  }}>
                    STIM Test App
                  </Typography>
                </Box>
                
                <Typography variant="h5" sx={{ 
                  color: '#64748b', 
                  mb: 6,
                  fontWeight: 400,
                  fontSize: { xs: '1.2rem', lg: '1.4rem' }
                }}>
                  Zamonaviy test platformasi
                </Typography>
              </Box>
            </Grid>

            {/* Right side - Login form */}
            <Grid item xs={12} lg={5}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                pr: { lg: 4 }
              }}>
                <Card sx={{ 
                  maxWidth: 480,
                  width: '100%',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  height: 'fit-content'
                }}>
                  <Box sx={{ 
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: 'white',
                    p: 5,
                    textAlign: 'center'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                      <LoginIcon sx={{ fontSize: '3.5rem' }} />
                    </Box>
                    <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                      Tizimga kirish
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Hisobingizga kirish uchun ma'lumotlarni kiriting
                    </Typography>
                  </Box>

                  <CardContent sx={{ p: 5 }}>
                    {/* Alert for already authenticated users */}
                    {isAuthenticated && (
                      <Alert severity="info" sx={{ mb: 4 }}>
                        Siz allaqachon {currentUser?.name} sifatida kirgansiz.{' '}
                        <Button 
                          variant="text" 
                          onClick={logout}
                          sx={{ ml: 1, p: 0, minWidth: 'auto' }}
                        >
                          Chiqish
                        </Button>
                      </Alert>
                    )}

                    {/* Error alert */}
                    {error && (
                      <Alert severity="error" sx={{ mb: 4 }}>
                        {error}
                      </Alert>
                    )}

                    {/* Login form */}
                    <Box component="form" onSubmit={handleSubmit}>
                      <TextField
                        fullWidth
                        label="Email manzil yoki ID"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                        autoFocus
                        sx={{ 
                          mb: 4,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px'
                          }
                        }}
                        placeholder="Admin uchun email, o'quvchi/o'qituvchi uchun ID"
                      />

                      <TextField
                        fullWidth
                        label="Parol"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        sx={{ 
                          mb: 5,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px'
                          }
                        }}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ 
                          backgroundColor: '#2563eb',
                          color: 'white',
                          py: 1.8,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          borderRadius: '12px',
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: '#1d4ed8',
                          },
                          '&:disabled': {
                            backgroundColor: '#94a3b8',
                          }
                        }}
                      >
                        {loading ? 'Kirish...' : 'Kirish'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;