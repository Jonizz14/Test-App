import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Container,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const PricingPage = () => {
  const navigate = useNavigate();

  const pricingPlans = [
    {
      id: 'week',
      title: '1 Hafta',
      originalPrice: '$2.99',
      discountedPrice: '$0.99',
      discount: '67% Chegirma',
      popular: false,
      color: '#2563eb'
    },
    {
      id: 'month',
      title: '1 Oy',
      originalPrice: '$9.99',
      discountedPrice: '$2.99',
      discount: '70% Chegirma',
      popular: true,
      color: '#d97706'
    },
    {
      id: 'year',
      title: '1 Yil',
      originalPrice: '$99.99',
      discountedPrice: '$9.99',
      discount: '90% Chegirma',
      popular: false,
      color: '#16a34a'
    }
  ];

  const handlePurchase = (planId) => {
    // For now, just show an alert. In a real app, this would integrate with payment system
    alert(`${planId} uchun to'lov jarayoni tez orada qo'shiladi!`);
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, maxWidth: '1800px' }}>
      {/* Header - Similar to profile page */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Premium Obuna
        </Typography>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            color: '#2563eb',
            '&:hover': {
              backgroundColor: '#eff6ff'
            }
          }}
        >
          Orqaga
        </Button>
      </Box>

      {/* Subtitles */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#374151',
            mb: 1
          }}
        >
          Premium obunalar
        </Typography>
      </Box>

      {/* Pricing Cards */}
      <Grid container spacing={3} justifyContent="center">
        {pricingPlans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card
              sx={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: plan.popular ? '2px solid #d97706' : '1px solid #e2e8f0',
                overflow: 'visible'
              }}
            >
              {plan.popular && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 2
                  }}
                >
                  <Chip
                    label="Eng mashhur"
                    sx={{
                      backgroundColor: '#d97706',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
              )}

              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: '#1e293b',
                    mb: 2
                  }}
                >
                  {plan.title}
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: plan.color,
                      mb: 1
                    }}
                  >
                    {plan.discountedPrice}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: '#64748b',
                      textDecoration: 'line-through',
                      mb: 1
                    }}
                  >
                    {plan.originalPrice}
                  </Typography>

                  <Chip
                    label={plan.discount}
                    size="small"
                    sx={{
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      fontWeight: 600
                    }}
                  />
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handlePurchase(plan.id)}
                  sx={{
                    backgroundColor: plan.color,
                    color: 'white',
                    py: 1.5,
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: plan.color,
                      opacity: 0.9
                    }
                  }}
                >
                  Sotib olish
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* NFT va Giftlar section */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography
          variant="h6"
          sx={{
            color: '#6b7280',
            fontWeight: 500,
            mb: 4
          }}
        >
          NFT va Giftlar
        </Typography>

        {/* Coming Soon Animation */}
        <Typography
          variant="h4"
          sx={{
            color: '#9ca3af',
            fontWeight: 500,
            animation: 'fadeInOut 2s infinite',
            '@keyframes fadeInOut': {
              '0%, 100%': { opacity: 0.3 },
              '50%': { opacity: 1 }
            }
          }}
        >
          Tez orada...
        </Typography>
      </Box>
    </Container>
  );
};

export default PricingPage;