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
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import apiService from '../data/apiService';

const PricingSelection = () => {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser, logout, setCurrentUserData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not an admin or already has a plan
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }

    if (currentUser.is_premium) {
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
      await apiService.selectPlan(planType);

      // Update local user state
      const updatedUser = { ...currentUser };
      if (planType === 'free') {
        updatedUser.is_premium = false;
        updatedUser.admin_premium_plan = 'free';
        // Update AuthContext and navigate to admin dashboard
        setCurrentUserData(updatedUser);
        navigate('/admin');
      } else {
        // For paid plans, update user data and open Telegram in new tab
        updatedUser.is_premium = true;
        updatedUser.admin_premium_plan = planType;
        setCurrentUserData(updatedUser);
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
          <Box sx={{ textAlign: 'center', mb: 4 }}>
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
            <Alert severity={error.includes('muvaffaqiyatli') ? 'success' : 'error'} sx={{ width: '100%', maxWidth: 600 }}>
              {error}
            </Alert>
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