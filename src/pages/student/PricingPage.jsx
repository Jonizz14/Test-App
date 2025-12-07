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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const PricingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [pricingPlans, setPricingPlans] = useState([]);
  const [starPackages, setStarPackages] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [myGifts, setMyGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [userStars, setUserStars] = useState(currentUser?.stars || 0);

  useEffect(() => {
    const loadPricingData = async () => {
      try {
        setLoading(true);
        const [pricingResponse, starResponse, giftsResponse, myGiftsResponse] = await Promise.all([
          apiService.get('/pricing/'),
          apiService.get('/star-packages/'),
          apiService.get('/gifts/'),
          apiService.get('/student-gifts/my_gifts/')
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
        setGifts(giftsResponse.results || giftsResponse);
        setMyGifts(myGiftsResponse.results || myGiftsResponse);
        setUserStars(currentUser?.stars || 0);
      } catch (err) {
        console.error('Failed to load pricing data:', err);
        setError('Narxlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadPricingData();
  }, [currentUser]);


  const handlePurchase = (planId) => {
    window.open('https://t.me/jonizz_devvvv', '_blank');
  };

  const hasPurchasedGift = (giftId) => {
    return myGifts.some(gift => gift.gift === giftId);
  };

  const handleGiftPurchaseClick = (gift) => {
    if (userStars < gift.star_cost) {
      alert('Sizda yetarli yulduz yo\'q!');
      return;
    }
    setSelectedGift(gift);
    setPurchaseDialogOpen(true);
  };

  const handleGiftPurchaseConfirm = async () => {
    if (!selectedGift) return;

    try {
      console.log('Purchasing gift:', selectedGift.id);
      const response = await apiService.post('/student-gifts/purchase_gift/', {
        gift_id: selectedGift.id
      });

      console.log('Purchase response:', response);

      // Update local state
      setSuccessMessage(`${selectedGift.name} sovg'asi muvaffaqiyatli sotib olindi!`);
      setUserStars(response.remaining_stars);

      // Update currentUser in AuthContext
      const updatedUser = { ...currentUser, stars: response.remaining_stars };
      setCurrentUserData(updatedUser);

      await loadData(); // Reload to update purchased gifts
      setPurchaseDialogOpen(false);
      setSelectedGift(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to purchase gift:', error);
      alert('Sovg\'ani sotib olishda xatolik yuz berdi');
    }
  };

  const handleClosePurchaseDialog = () => {
    setPurchaseDialogOpen(false);
    setSelectedGift(null);
  };

  const loadData = async () => {
    try {
      const [giftsResponse, myGiftsResponse] = await Promise.all([
        apiService.get('/gifts/'),
        apiService.get('/student-gifts/my_gifts/')
      ]);
      setGifts(giftsResponse.results || giftsResponse);
      setMyGifts(myGiftsResponse.results || myGiftsResponse);
    } catch (error) {
      console.error('Failed to reload gifts data:', error);
    }
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

          {/* Gifts Section */}
          <Box sx={{ mt: 6 }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                🎁 Sovg'alar do'koni
              </Typography>
              <Box sx={{
                backgroundColor: '#fef3c7',
                borderRadius: '12px',
                padding: '8px 16px',
                border: '1px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <StarIcon sx={{ color: '#f59e0b' }} />
                <Typography sx={{
                  fontWeight: 700,
                  color: '#92400e'
                }}>
                  {userStars} yulduz
                </Typography>
              </Box>
            </Box>

            {successMessage && (
              <Alert
                severity="success"
                sx={{
                  mb: 4,
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #10b981',
                  color: '#059669',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
                }}
              >
                ✅ {successMessage}
              </Alert>
            )}

            <Grid container spacing={3}>
              {gifts.map((gift) => {
                const alreadyPurchased = hasPurchasedGift(gift.id);
                const canAfford = userStars >= gift.star_cost;

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={gift.id}>
                    <Card sx={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      <Box sx={{
                        height: '200px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px 12px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {gift.image_url ? (
                          <img
                            src={gift.image_url}
                            alt={gift.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <Typography sx={{ color: '#64748b', fontSize: '3rem' }}>
                            🎁
                          </Typography>
                        )}
                      </Box>

                      <CardContent sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        p: 3
                      }}>
                        <Typography sx={{
                          fontWeight: 600,
                          color: '#1e293b',
                          fontSize: '1.1rem',
                          mb: 1
                        }}>
                          {gift.name}
                        </Typography>

                        {gift.description && (
                          <Typography sx={{
                            color: '#64748b',
                            fontSize: '0.9rem',
                            mb: 2,
                            flexGrow: 1
                          }}>
                            {gift.description}
                          </Typography>
                        )}

                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <StarIcon sx={{ mr: 0.5, color: '#f59e0b' }} />
                            <Typography sx={{
                              fontWeight: 700,
                              color: '#d97706',
                              fontSize: '1.1rem'
                            }}>
                              {gift.star_cost}
                            </Typography>
                          </Box>

                          {alreadyPurchased && (
                            <Chip
                              label="Sotib olingan"
                              size="small"
                              sx={{
                                backgroundColor: '#ecfdf5',
                                color: '#059669',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                          )}
                        </Box>

                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<ShoppingCartIcon />}
                          onClick={() => handleGiftPurchaseClick(gift)}
                          disabled={alreadyPurchased || !canAfford}
                          sx={{
                            backgroundColor: alreadyPurchased ? '#10b981' : '#f59e0b',
                            color: '#ffffff',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: '8px',
                            '&:hover': {
                              backgroundColor: alreadyPurchased ? '#059669' : '#d97706'
                            },
                            '&:disabled': {
                              backgroundColor: '#d1d5db',
                              color: '#9ca3af'
                            }
                          }}
                        >
                          {alreadyPurchased ? 'Sotib olingan' : canAfford ? 'Sotib olish' : 'Yulduz yetmaydi'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {gifts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography sx={{
                  fontSize: '3rem',
                  mb: 2
                }}>
                  🎁
                </Typography>
                <Typography sx={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  mb: 2
                }}>
                  Hozircha sovg'alar yo'q
                </Typography>
                <Typography sx={{ color: '#64748b' }}>
                  Admin tez orada yangi sovg'alar qo'shadi!
                </Typography>
              </Box>
            )}
          </Box>
        </>
      )}

      {/* Gift Purchase Confirmation Dialog */}
      <Dialog
        open={purchaseDialogOpen}
        onClose={handleClosePurchaseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          color: '#1e293b',
          fontSize: '1.25rem',
          textAlign: 'center'
        }}>
          🎁 Sovg'ani sotib olish
        </DialogTitle>
        <DialogContent>
          {selectedGift && (
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{
                width: '120px',
                height: '120px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                mx: 'auto',
                mb: 3,
                border: '1px solid #e2e8f0'
              }}>
                {selectedGift.image_url ? (
                  <img
                    src={selectedGift.image_url}
                    alt={selectedGift.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Typography sx={{ fontSize: '3rem' }}>🎁</Typography>
                )}
              </Box>

              <Typography sx={{
                fontWeight: 600,
                color: '#1e293b',
                fontSize: '1.2rem',
                mb: 1
              }}>
                {selectedGift.name}
              </Typography>

              {selectedGift.description && (
                <Typography sx={{
                  color: '#64748b',
                  mb: 3,
                  fontSize: '0.95rem'
                }}>
                  {selectedGift.description}
                </Typography>
              )}

              <Box sx={{
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                p: 2,
                mb: 3,
                border: '1px solid #f59e0b'
              }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1
                }}>
                  <StarIcon />
                  {selectedGift.star_cost} yulduz
                </Typography>
              </Box>

              <Typography sx={{
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Haqiqatan ham bu sovg'ani sotib olmoqchimisiz? Yulduzlaringizdan {selectedGift.star_cost} ta ayriladi.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <Button
            onClick={handleClosePurchaseDialog}
            variant="outlined"
            sx={{
              borderColor: '#d1d5db',
              color: '#374151',
              px: 4,
              py: 1.5,
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#f9fafb' }
            }}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleGiftPurchaseConfirm}
            variant="contained"
            sx={{
              backgroundColor: '#f59e0b',
              px: 4,
              py: 1.5,
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#d97706' }
            }}
          >
            Sotib olish
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PricingPage;