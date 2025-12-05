import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
} from '@mui/material';
import {
  Star as StarIcon,
} from '@mui/icons-material';
import apiService from '../data/apiService';

const PremiumModal = ({ open, onClose, student, onConfirm }) => {
  const [pricing, setPricing] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadPricing();
    }
  }, [open]);

  const loadPricing = async () => {
    try {
      const pricingData = await apiService.get('/pricing/');
      const activePricing = pricingData.results ? pricingData.results.filter(p => p.is_active) : pricingData.filter(p => p.is_active);
      setPricing(activePricing);
      if (activePricing.length > 0) {
        setSelectedPlan(activePricing[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load pricing:', error);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const selectedPricing = pricing.find(p => p.id.toString() === selectedPlan);
      await onConfirm(student.id, selectedPricing);
      onClose();
    } catch (error) {
      console.error('Failed to grant premium:', error);
      alert('Premium berishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPlan = () => {
    return pricing.find(p => p.id.toString() === selectedPlan);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{
        fontWeight: 600,
        color: '#1e293b',
        borderBottom: '1px solid #e2e8f0',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StarIcon sx={{ color: '#d97706' }} />
          Premium berish: {student?.name}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body1" sx={{ mb: 3, color: '#64748b' }}>
          O'quvchiga premium berish uchun obuna muddatini tanlang:
        </Typography>

        <RadioGroup
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
          sx={{ gap: 2 }}
        >
          {pricing.map((plan) => (
            <Card
              key={plan.id}
              sx={{
                border: selectedPlan === plan.id.toString() ? '2px solid #d97706' : '1px solid #e2e8f0',
                backgroundColor: selectedPlan === plan.id.toString() ? '#fef3c7' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#d97706',
                  backgroundColor: '#fef3c7'
                }
              }}
              onClick={() => setSelectedPlan(plan.id.toString())}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                      value={plan.id.toString()}
                      control={<Radio sx={{ color: '#d97706' }} />}
                      label=""
                      sx={{ m: 0 }}
                    />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                        {plan.plan_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#d97706' }}>
                          ${plan.discounted_price}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', textDecoration: 'line-through' }}>
                          ${plan.original_price}
                        </Typography>
                        <Chip
                          label={`${plan.discount_percentage}% chegirma`}
                          size="small"
                          sx={{
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>

        {getSelectedPlan() && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              <strong>Tanlangan:</strong> {getSelectedPlan().plan_name} - ${getSelectedPlan().discounted_price}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
        <Button
          onClick={onClose}
          sx={{ color: '#64748b' }}
        >
          Bekor qilish
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedPlan || loading}
          sx={{
            backgroundColor: '#d97706',
            '&:hover': {
              backgroundColor: '#b45309'
            }
          }}
        >
          {loading ? 'Berilmoqda...' : 'Premium berish'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PremiumModal;