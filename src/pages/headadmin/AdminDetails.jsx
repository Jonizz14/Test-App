import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../data/apiService';

const AdminDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [pricingPlans, setPricingPlans] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [adminData, pricingData] = await Promise.all([
          apiService.getUser(id),
          apiService.getPricing()
        ]);
        setAdmin(adminData);
        setPricingPlans(pricingData.results || pricingData);
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const handleAssignPricing = async () => {
    if (!selectedPlan) return;

    try {
      const plan = pricingPlans.find(p => p.plan_type === selectedPlan);
      if (!plan) return;

      const now = new Date();
      let expiryDate;

      if (selectedPlan === 'week') {
        expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (selectedPlan === 'month') {
        expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else if (selectedPlan === 'year') {
        expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      }

      await apiService.updateUser(id, {
        admin_premium_plan: selectedPlan,
        admin_premium_granted_date: now.toISOString(),
        admin_premium_expiry_date: expiryDate.toISOString(),
        admin_premium_cost: plan.discounted_price
      });

      // Reload admin data
      const updatedAdmin = await apiService.getUser(id);
      setAdmin(updatedAdmin);
      setPricingDialogOpen(false);
      setSelectedPlan('');
    } catch (error) {
      console.error('Failed to assign pricing:', error);
      setError('Tarif biriktirishda xatolik yuz berdi');
    }
  };

  const getPlanDisplayName = (planType) => {
    switch (planType) {
      case 'week': return '1 Hafta';
      case 'month': return '1 Oy';
      case 'year': return '1 Yil';
      default: return planType;
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Ma'lumotlar yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/headadmin/admins')}
        >
          Adminlarga qaytish
        </Button>
      </Box>
    );
  }

  if (!admin) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 4 }}>
          Admin topilmadi
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/headadmin/admins')}
        >
          Adminlarga qaytish
        </Button>
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
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/headadmin/admins')}
          sx={{ mr: 3, mb: 2 }}
        >
          Adminlarni boshqarishga qaytish
        </Button>
        <Typography
          sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 2
          }}
        >
          Admin ma'lumotlari
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          {admin.name} haqida batafsil ma'lumot
        </Typography>
      </Box>

      <Box sx={{ width: '100%' }}>
        {/* Profile Card - Full Width Top */}
        <Card sx={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          mb: 4
        }}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 160,
                height: 160,
                mx: 'auto',
                mb: 4,
                backgroundColor: '#dc2626',
                fontSize: '4rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <AdminIcon sx={{ fontSize: '4rem' }} />
            </Avatar>

            <Typography
              sx={{
                fontSize: '2rem',
                fontWeight: 700,
                color: '#1e293b',
                mb: 2
              }}
            >
              {admin.name}
            </Typography>

            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                backgroundColor: '#f1f5f9',
                padding: '12px 20px',
                borderRadius: '8px',
                color: '#475569',
                display: 'inline-block'
              }}
            >
              {admin.email}
            </Typography>
          </CardContent>
        </Card>

        {/* Details Card - Full Width Bottom */}
        <Card sx={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent sx={{ p: 6 }}>
            <Typography
              sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1e293b',
                mb: 4
              }}
            >
              Ma'lumotlar
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonIcon sx={{ color: '#64748b', mr: 2.5, fontSize: '1.5rem' }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, mb: 0.5 }}>
                      To'liq ism
                    </Typography>
                    <Typography sx={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>
                      {admin.name}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <EmailIcon sx={{ color: '#64748b', mr: 2.5, fontSize: '1.5rem' }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, mb: 0.5 }}>
                      Email
                    </Typography>
                    <Typography sx={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>
                      {admin.email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CalendarIcon sx={{ color: '#64748b', mr: 2.5, fontSize: '1.5rem' }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, mb: 0.5 }}>
                      Ro'yxatdan o'tgan
                    </Typography>
                    <Typography sx={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>
                      {admin.registration_date ? new Date(admin.registration_date).toLocaleDateString('uz-UZ') : 'Noma\'lum'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <AdminIcon sx={{ color: '#64748b', mr: 2.5, fontSize: '1.5rem' }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, mb: 0.5 }}>
                      Rol
                    </Typography>
                    <Typography sx={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>
                      Administrator
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonIcon sx={{ color: '#64748b', mr: 2.5, fontSize: '1.5rem' }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, mb: 0.5 }}>
                      Tashkilot
                    </Typography>
                    <Typography sx={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>
                      {admin.organization || 'Aniqlanmagan'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PaymentIcon sx={{ color: '#64748b', mr: 2.5, fontSize: '1.5rem' }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, mb: 0.5 }}>
                      Premium Tarif
                    </Typography>
                    <Typography sx={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>
                      {admin.admin_premium_plan ? getPlanDisplayName(admin.admin_premium_plan) : 'Yo\'q'}
                    </Typography>
                    {admin.admin_premium_expiry_date && (
                      <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Tugaydi: {new Date(admin.admin_premium_expiry_date).toLocaleDateString('uz-UZ')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>

          </CardContent>
        </Card>
      </Box>

      {/* Pricing Assignment Dialog */}
      <Dialog
        open={pricingDialogOpen}
        onClose={() => setPricingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#059669', fontWeight: 700 }}>
          Admin uchun tarif biriktirish
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {admin?.name} uchun premium tarif tanlang:
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Tarif turi</InputLabel>
            <Select
              value={selectedPlan}
              label="Tarif turi"
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              {pricingPlans.map((plan) => (
                <MenuItem key={plan.plan_type} value={plan.plan_type}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{getPlanDisplayName(plan.plan_type)}</span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      ${plan.discounted_price}
                    </span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedPlan && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Tanlangan tarif:</strong> {getPlanDisplayName(selectedPlan)}
              <br />
              <strong>Narx:</strong> ${pricingPlans.find(p => p.plan_type === selectedPlan)?.discounted_price}
            </Alert>
          )}

          <Alert severity="warning">
            Bu amal admin uchun premium imkoniyatlarini faollashtiradi.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPricingDialogOpen(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleAssignPricing}
            variant="contained"
            disabled={!selectedPlan}
            sx={{
              backgroundColor: '#059669',
              '&:hover': {
                backgroundColor: '#047857'
              }
            }}
          >
            Tarif biriktirish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDetails;
