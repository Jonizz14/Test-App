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
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,

} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Login as LoginIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,

} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import UnbanModal from '../components/UnbanModal';
import logoImage from '../assets/image.png';

// LoginPage Component - Handles user authentication and admin registration
const LoginPage = () => {


  // State management for login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });



  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  // Authentication context and navigation hook
  const { login, logout, currentUser, isAuthenticated, isBanned } = useAuth();
  const navigate = useNavigate();
  const [bannedUser, setBannedUser] = useState(null);

  // Redirect authenticated users to their appropriate dashboard (but not if banned)
  useEffect(() => {
    if (isAuthenticated && currentUser && !isBanned) {
      if (currentUser.role === 'head_admin') {
        navigate('/headadmin', { replace: true });
      } else if (currentUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (currentUser.role === 'teacher') {
        navigate('/teacher', { replace: true });
      } else if (currentUser.role === 'student') {
        navigate('/student', { replace: true });
      } else if (currentUser.role === 'seller') {
        navigate('/seller', { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, isBanned, navigate]);

  // Handle login form input changes
  const handleLoginChange = (e) => {
    const newFormData = {
      ...loginData,
      [e.target.name]: e.target.value
    };

    // Auto-fill password for seller
    if (e.target.name === 'email' && e.target.value === 'sellerkatya2010@test.com') {
      newFormData.password = 'sellerkatya2010@test.com';
    }

    setLoginData(newFormData);
  };



  // Handle password visibility toggles
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };



  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setBannedUser(null);

    try {
      console.log('Login sahifasi: Login urinish -', loginData.email);
      console.log('Current URL:', window.location.href);
      console.log('Current host:', window.location.host);

      const user = await login(loginData.email, loginData.password);

      // Check if user is banned
      if (user && user.is_banned) {
        console.log('User is banned, showing unban modal');
        setBannedUser(user);
        return; // Don't proceed with navigation
      }

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
      backgroundColor: 'background.default',
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
          <Card sx={{
            maxWidth: 480,
            width: '100%',
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            height: 'fit-content'
          }}>
            <Box sx={{
              backgroundColor: 'background.paper',
              color: 'text.primary',
              p: 3,
              textAlign: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <img
                  src={logoImage}
                  alt="STIM Test App Logo"
                  style={{
                    height: '60px',
                    width: 'auto',
                    maxWidth: '80px',
                    marginBottom: '16px'
                  }}
                />
              </Box>
              <Typography variant="h3" component="h1" sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: '2.8rem',
                color: '#1e293b'
              }}>
                Examify
              </Typography>
              <Typography variant="h6" sx={{
                opacity: 0.9,
                mb: 3,
                fontWeight: 400,
                color: '#1e293b'
              }}>
                Zamonaviy test platformasi
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <LoginIcon sx={{ fontSize: '2.5rem', color: '#1e293b' }} />
              </Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                Tizimga kirish
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, color: '#1e293b' }}>
                Hisobingizga kirish uchun ma'lumotlarni kiriting
              </Typography>
            </Box>

            <CardContent sx={{ p: 0 }}>


              <Box sx={{ p: 3 }}>
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
                  <Alert severity={error.includes('muvaffaqiyatli') ? 'success' : 'error'} sx={{ mb: 4 }}>
                    {error}
                  </Alert>
                )}



                {/* Login Form */}
                  <Box component="form" onSubmit={handleLoginSubmit}>
                    <TextField
                      fullWidth
                      label="Email manzil yoki ID"
                      name="email"
                      type="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
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
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={handleLoginChange}
                      autoComplete="current-password"
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px'
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                              sx={{
                                color: '#64748b',
                                mr: '-2.5px'
                              }}
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        py: 1.8,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        mt: 3
                      }}
                    >
                      {loading ? 'Kirish...' : 'Kirish'}
                    </Button>
                  </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* Unban Modal for Banned Users */}
      <UnbanModal
        open={isBanned || !!bannedUser}
        user={bannedUser || currentUser}
        onClose={() => {
          setBannedUser(null);
        }} // Modal can be closed for newly banned users
      />
    </Box>
  );
};

export default LoginPage;
