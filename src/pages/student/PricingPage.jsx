import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import apiService from '../../data/apiService';

const PricingPage = () => {
  const navigate = useNavigate();
  const [pricingPlans, setPricingPlans] = useState([]);
  const [starPackages, setStarPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPricingData = async () => {
      try {
        setLoading(true);
        const [pricingResponse, starResponse] = await Promise.all([
          apiService.get('/pricing/'),
          apiService.get('/star-packages/')
        ]);

        // Transform pricing data
        const transformedPricing = pricingResponse.map(plan => ({
          id: plan.plan_type,
          title: plan.plan_name,
          originalPrice: `$${plan.original_price}`,
          discountedPrice: `$${plan.discounted_price}`,
          discount: `${plan.discount_percentage}% Chegirma`,
          popular: plan.plan_type === 'month', // Make month popular
          color: plan.plan_type === 'week' ? '#2563eb' :
                 plan.plan_type === 'month' ? '#d97706' : '#16a34a'
        }));

        // Transform star packages data
        const transformedStars = starResponse.map(pkg => ({
          id: `stars_${pkg.stars}`,
          stars: pkg.stars,
          originalPrice: `$${pkg.original_price}`,
          price: `$${pkg.discounted_price}`,
          discount: pkg.discount_text,
          popular: pkg.is_popular,
          color: pkg.stars >= 500 ? '#d97706' : '#f59e0b'
        }));

        setPricingPlans(transformedPricing);
        setStarPackages(transformedStars);
      } catch (err) {
        console.error('Failed to load pricing data:', err);
        setError('Narxlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadPricingData();
  }, []);


  const handlePurchase = (planId) => {
    window.open('https://t.me/jonizz_devvvv', '_blank');
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, maxWidth: '1800px' }}>
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

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography>Yuklanmoqda...</Typography>
        </Box>
      ) : (
        <>
          {/* Premium Plans Section */}
          <Box sx={{ mb: 6 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#374151',
            mb: 3,
            textAlign: 'left'
          }}
        >
          💎 Premium Obunalar
        </Typography>

        <TableContainer component={Paper} sx={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          width: '100%'
        }}>
          <Table sx={{ width: '100%' }}>
            <TableHead>
              <TableRow sx={{
                backgroundColor: '#f8fafc',
                '& th': {
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: '#1e293b',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '16px'
                }
              }}>
                <TableCell>Obuna turi</TableCell>
                <TableCell>Narx</TableCell>
                <TableCell>Chegirma</TableCell>
                <TableCell>Harakat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pricingPlans.map((plan) => (
                <TableRow key={plan.id} sx={{
                  '&:hover': {
                    backgroundColor: '#f8fafc',
                  },
                  '& td': {
                    borderBottom: '1px solid #f1f5f9',
                    padding: '16px',
                    fontSize: '0.875rem',
                    color: '#334155'
                  }
                }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                      }}>
                        {plan.title}
                      </Typography>
                      {plan.popular && (
                        <Chip
                          label="Eng mashhur"
                          sx={{
                            backgroundColor: '#d97706',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            ml: 1,
                            height: '20px'
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: plan.color,
                          mb: 0.5
                        }}
                      >
                        {plan.discountedPrice}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#64748b',
                          textDecoration: 'line-through',
                          fontSize: '0.75rem'
                        }}
                      >
                        {plan.originalPrice}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={plan.discount}
                      size="small"
                      sx={{
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handlePurchase(plan.id)}
                      sx={{
                        backgroundColor: plan.color,
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        px: 2,
                        py: 0.5,
                        borderRadius: '6px',
                        '&:hover': {
                          backgroundColor: plan.color,
                          opacity: 0.9
                        }
                      }}
                    >
                      Sotib olish
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Stars Section */}
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#374151',
            mb: 3,
            textAlign: 'left'
          }}
        >
          ⭐ Yulduzlar
        </Typography>

        <TableContainer component={Paper} sx={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          width: '100%'
        }}>
          <Table sx={{ width: '100%' }}>
            <TableHead>
              <TableRow sx={{
                backgroundColor: '#f8fafc',
                '& th': {
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: '#1e293b',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '16px'
                }
              }}>
                <TableCell>Yulduzlar soni</TableCell>
                <TableCell>Narx</TableCell>
                <TableCell>Chegirma</TableCell>
                <TableCell>Harakat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {starPackages.map((starPackage) => (
                <TableRow key={starPackage.id} sx={{
                  '&:hover': {
                    backgroundColor: '#f8fafc',
                  },
                  '& td': {
                    borderBottom: '1px solid #f1f5f9',
                    padding: '16px',
                    fontSize: '0.875rem',
                    color: '#334155'
                  }
                }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StarIcon sx={{ color: starPackage.color, mr: 1 }} />
                      <Typography sx={{
                        fontWeight: 700,
                        color: starPackage.color,
                        fontSize: '1.125rem'
                      }}>
                        {starPackage.stars}
                      </Typography>
                      {starPackage.popular && (
                        <Chip
                          label="Mashhur"
                          sx={{
                            backgroundColor: '#d97706',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            ml: 1,
                            height: '20px'
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#1e293b',
                          mb: 0.5
                        }}
                      >
                        {starPackage.price}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#64748b',
                          textDecoration: 'line-through',
                          fontSize: '0.75rem'
                        }}
                      >
                        {starPackage.originalPrice}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={starPackage.discount}
                      size="small"
                      sx={{
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handlePurchase(starPackage.id)}
                      sx={{
                        backgroundColor: starPackage.color,
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        px: 2,
                        py: 0.5,
                        borderRadius: '6px',
                        '&:hover': {
                          backgroundColor: starPackage.color,
                          opacity: 0.9
                        }
                      }}
                    >
                      Sotib olish
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
          </Box>

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
        </>
      )}
    </Container>
  );
};

export default PricingPage;