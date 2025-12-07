import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
} from '@mui/material';
import {
  Star as StarIcon,
  ShoppingCart as ShoppingCartIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const StudentGifts = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [gifts, setGifts] = useState([]);
  const [myGifts, setMyGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [userStars, setUserStars] = useState(currentUser?.stars || 0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [giftsResponse, myGiftsResponse] = await Promise.all([
        apiService.get('/gifts/'),
        apiService.get('/student-gifts/my_gifts/')
      ]);

      setGifts(giftsResponse.results || giftsResponse);
      setMyGifts(myGiftsResponse.results || myGiftsResponse);
      setUserStars(currentUser?.stars || 0);
    } catch (error) {
      console.error('Failed to load gifts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPurchasedGift = (giftId) => {
    return myGifts.some(gift => gift.gift === giftId);
  };

  const handlePurchaseClick = (gift) => {
    if (userStars < gift.star_cost) {
      alert('Sizda yetarli yulduz yo\'q!');
      return;
    }
    setSelectedGift(gift);
    setPurchaseDialogOpen(true);
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedGift) return;

    try {
      const response = await apiService.post('/student-gifts/purchase_gift/', {
        gift_id: selectedGift.id
      });

      setSuccessMessage(`${selectedGift.name} sovg'asi muvaffaqiyatli sotib olindi!`);
      setUserStars(response.remaining_stars);
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

  if (loading) {
    return (
      <Box sx={{
        py: 4,
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Paper sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%'
        }}>
          <Typography sx={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 3
          }}>
            Yuklanmoqda...
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Sovg'alar yuklanmoqda...
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/student')}
              sx={{
                color: '#64748b',
                '&:hover': {
                  backgroundColor: '#f8fafc'
                }
              }}
            >
              Orqaga
            </Button>
            <Typography
              sx={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#1e293b'
              }}
            >
              🎁 Sovg'alar do'koni
            </Typography>
          </Box>
          <Box sx={{
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            padding: '12px 20px',
            border: '1px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <StarIcon sx={{ color: '#f59e0b' }} />
            <Typography sx={{
              fontWeight: 700,
              color: '#92400e',
              fontSize: '1.1rem'
            }}>
              {userStars} yulduz
            </Typography>
          </Box>
        </Box>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Yulduzlaringiz bilan ajoyib sovg'alarni sotib oling va profilingizni bezang!
        </Typography>
      </Box>

      {/* Success Message */}
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

      {/* Gifts Grid */}
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
                    onClick={() => handlePurchaseClick(gift)}
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

      {/* Purchase Confirmation Dialog */}
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
            onClick={handlePurchaseConfirm}
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
    </Box>
  );
};

export default StudentGifts;