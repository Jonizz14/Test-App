import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const ManagePrices = () => {
  const { currentUser } = useAuth();
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      setLoading(true);
      const pricingData = await apiService.get('/pricing/');
      setPricing(pricingData.results || pricingData);
    } catch (error) {
      console.error('Failed to load pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      original_price: item.original_price,
      discounted_price: item.discounted_price,
      discount_percentage: item.discount_percentage,
      is_active: item.is_active,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async () => {
    try {
      await apiService.patch(`/pricing/${editingId}/`, editData);
      await loadPricing();
      setEditingId(null);
      setEditData({});
      setSuccessMessage('Narx muvaffaqiyatli saqlandi');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save pricing:', error);
      alert('Narx saqlashda xatolik yuz berdi');
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Box sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Typography
          sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 2
          }}
        >
          Narxlarni boshqarish
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Premium obuna narxlarini tahrirlang
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

      {/* Pricing Table */}
      <Paper sx={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 3 }}>Obuna turi</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Asl narx ($)</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Chegirma narx ($)</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Chegirma (%)</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Faol</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : pricing.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                    Narxlar mavjud emas
                  </TableCell>
                </TableRow>
              ) : (
                pricing.map((item) => (
                  <TableRow key={item.id} sx={{
                    '&:hover': {
                      backgroundColor: '#f8fafc'
                    }
                  }}>
                    <TableCell sx={{ py: 3 }}>
                      <Typography sx={{ fontWeight: 500, color: '#1e293b' }}>
                        {item.plan_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <TextField
                          type="number"
                          size="small"
                          value={editData.original_price}
                          onChange={(e) => handleInputChange('original_price', parseFloat(e.target.value))}
                          sx={{ width: '100px' }}
                        />
                      ) : (
                        <Typography sx={{ color: '#64748b' }}>
                          ${item.original_price}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <TextField
                          type="number"
                          size="small"
                          value={editData.discounted_price}
                          onChange={(e) => handleInputChange('discounted_price', parseFloat(e.target.value))}
                          sx={{ width: '100px' }}
                        />
                      ) : (
                        <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                          ${item.discounted_price}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <TextField
                          type="number"
                          size="small"
                          value={editData.discount_percentage}
                          onChange={(e) => handleInputChange('discount_percentage', parseInt(e.target.value))}
                          sx={{ width: '80px' }}
                        />
                      ) : (
                        <Typography sx={{ color: '#64748b' }}>
                          {item.discount_percentage}%
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editData.is_active}
                              onChange={(e) => handleInputChange('is_active', e.target.checked)}
                              size="small"
                            />
                          }
                          label=""
                        />
                      ) : (
                        <Typography sx={{
                          color: item.is_active ? '#059669' : '#dc2626',
                          fontWeight: 600
                        }}>
                          {item.is_active ? 'Faol' : 'Faol emas'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={handleSave}
                            startIcon={<SaveIcon />}
                            sx={{
                              backgroundColor: '#059669',
                              '&:hover': { backgroundColor: '#047857' }
                            }}
                          >
                            Saqlash
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={handleCancel}
                            startIcon={<CancelIcon />}
                          >
                            Bekor
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleEdit(item)}
                          startIcon={<EditIcon />}
                          sx={{
                            borderColor: '#2563eb',
                            color: '#2563eb',
                            '&:hover': {
                              backgroundColor: '#eff6ff',
                              borderColor: '#2563eb'
                            }
                          }}
                        >
                          Tahrirlash
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ManagePrices;