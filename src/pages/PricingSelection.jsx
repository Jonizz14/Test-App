import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiService from '../data/apiService';
import { createAdminNotification } from '../utils/notificationService';

const PricingSelection = () => {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser, logout, setCurrentUserData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not an admin
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }

    // If plan is already approved, redirect to admin
    if (currentUser.admin_premium_approved) {
      navigate('/admin');
      return;
    }

    fetchPricing();
  }, [currentUser, navigate]);

  const fetchPricing = async () => {
    try {
      const data = await apiService.getPricing();
      setPricing(data);
    } catch (err) {
      console.error('Error fetching pricing:', err);
      setError('Narxlarni yuklashda xatolik yuz berdi');
    }
  };

  const handlePlanSelection = async (planType) => {
    setLoading(true);
    setError('');

    try {
      // Show processing message
      setError('Sizning so\'rovingiz bajarilmoqda...');

      const response = await apiService.selectPlan(planType);

      // Update local user state
      const updatedUser = response.user;
      setCurrentUserData(updatedUser);
      
      // Create notification for head admin (for paid plans only)
      if (planType !== 'free') {
        createAdminNotification(updatedUser, planType);
        console.log('Notification created for head admin');
      }

      if (planType === 'free') {
        // Free plan - immediately navigate
        navigate('/admin');
      } else {
        // For paid plans, show pending message and open Telegram
        setError('Tarifingiz tasdiqlanishini kutmoqdasiz. Head admin tasdiqlagandan keyin sizga habar beriladi.');
        window.open('https://t.me/jonizz_devvvv', '_blank');
      }
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError('Tarifni tanlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      <Container maxWidth="md">
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4
        }}>
          <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
            <IconButton
              onClick={handleLogout}
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                color: '#64748b',
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                }
              }}
              title="Chiqish"
            >
              <LogoutIcon />
            </IconButton>
            <Typography variant="h3" component="h1" sx={{
              fontWeight: 700,
              mb: 2,
              color: '#1e293b'
            }}>
              Xush kelibsiz, {currentUser?.name || currentUser?.username}!
            </Typography>
            <Typography variant="h6" sx={{
              opacity: 0.9,
              mb: 3,
              color: '#1e293b'
            }}>
              O'z tizimingiz uchun tarifni tanlang
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              Tarifni tanlamaguncha tizimdan foydalana olmaysiz
            </Typography>
          </Box>

          {error && (
            <Alert severity={error.includes('muvaffaqiyatli') || error.includes('tasdiqlanishini') ? 'info' : 'error'} sx={{ width: '100%', maxWidth: 600 }}>
              {error}
            </Alert>
          )}

          {currentUser?.admin_premium_pending && (
            <Alert severity="warning" sx={{ width: '100%', maxWidth: 600 }}>
              Sizning {currentUser.admin_premium_plan} tarifingiz tasdiqlanishini kutmoqdasiz. Head admin tasdiqlagandan keyin sizga habar beriladi.
            </Alert>
          )}

          {currentUser?.admin_premium_pending && (
            <Box sx={{ width: '100%', maxWidth: 600, textAlign: 'center', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                sx={{
                  borderColor: '#64748b',
                  color: '#64748b',
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                    borderColor: '#64748b'
                  }
                }}
              >
                Bosh sahifaga o'tish
              </Button>
            </Box>
          )}

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 3,
            width: '100%',
            maxWidth: 900
          }}>
            {/* Free Plan */}
            <Card sx={{
              border: '2px solid #e2e8f0',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              '&:hover': {
                borderColor: '#3b82f6',
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
                    Bepul
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    $0
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    /oy
                  </Typography>
                </Box>
                <Box sx={{ mb: 4, textAlign: 'left', flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    ✅ Cheklangan o'quvchilar (10 tagacha)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    ✅ Cheklangan o'qituvchilar (5 tagacha)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    ✅ Asosiy test yaratish
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    ✅ Natijalarni ko'rish
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handlePlanSelection('free')}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    backgroundColor: '#10b981',
                    '&:hover': {
                      backgroundColor: '#059669'
                    }
                  }}
                >
                  {loading ? 'Yuklanmoqda...' : 'Bepul boshlash'}
                </Button>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card sx={{
              border: '2px solid #e2e8f0',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              '&:hover': {
                borderColor: '#3b82f6',
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
                    Asosiy
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    $9.99
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    /oy
                  </Typography>
                </Box>
                <Box sx={{ mb: 4, textAlign: 'left', flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    ✅ Cheksiz o'quvchilar
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    ✅ Cheksiz o'qituvchilar
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    ✅ Ilg'or test yaratish
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    ✅ Batafsil statistika
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handlePlanSelection('basic')}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    backgroundColor: '#3b82f6',
                    '&:hover': {
                      backgroundColor: '#2563eb'
                    }
                  }}
                >
                  {loading ? 'Yuklanmoqda...' : 'Tanlash'}
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card sx={{
              border: '2px solid #e2e8f0',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              '&:hover': {
                borderColor: '#7c3aed',
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
                    Premium
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    $19.99
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    /oy
                  </Typography>
                </Box>
                <Box sx={{ mb: 4, textAlign: 'left', flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    ✅ Hamma Asosiy xususiyatlar
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    ✅ Maxsus dizayn
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    ✅ API integratsiyasi
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    ✅ Priority qo'llab-quvvatlash
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handlePlanSelection('premium')}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    backgroundColor: '#7c3aed',
                    '&:hover': {
                      backgroundColor: '#6d28d9'
                    }
                  }}
                >
                  {loading ? 'Yuklanmoqda...' : 'Tanlash'}
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PricingSelection;