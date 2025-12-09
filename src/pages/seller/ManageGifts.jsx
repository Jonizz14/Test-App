import React, { useState, useEffect } from 'react';
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
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const ManageGifts = () => {
  const { currentUser } = useAuth();
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGift, setEditingGift] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    star_cost: '',
    rarity: 'common',
    gift_count: 0,
    image: null,
    is_active: true
  });

  useEffect(() => {
    loadGifts();
  }, []);

  const loadGifts = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/gifts/');
      setGifts(response.results || response);
    } catch (error) {
      console.error('Failed to load gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (gift = null) => {
    if (gift) {
      setEditingGift(gift);
      setFormData({
        name: gift.name || '',
        description: gift.description || '',
        star_cost: gift.star_cost || '',
        rarity: gift.rarity || 'common',
        gift_count: gift.gift_count != null ? gift.gift_count : 0, // Handle null/undefined properly
        image: null, // Don't pre-fill image
        is_active: gift.is_active !== undefined ? gift.is_active : true
      });
    } else {
      setEditingGift(null);
      setFormData({
        name: '',
        description: '',
        star_cost: '',
        rarity: 'common',
        gift_count: 0,
        image: null,
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGift(null);
    setFormData({
      name: '',
      description: '',
      star_cost: '',
      rarity: 'common',
      gift_count: 0,
      image: null,
      is_active: true
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;
    
    // Convert to appropriate type
    if (type === 'number') {
      newValue = value === '' ? '' : parseInt(value, 10);
    } else if (type === 'checkbox') {
      newValue = checked;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('star_cost', formData.star_cost);
      submitData.append('rarity', formData.rarity);
      submitData.append('is_active', formData.is_active);

      if (formData.image) {
        submitData.append('image', formData.image);
      }

      // Always ensure gift_count is included, even if 0
      const giftCountValue = formData.gift_count === '' || formData.gift_count === undefined ? '0' : String(formData.gift_count);
      submitData.append('gift_count', giftCountValue);

      console.log('Submitting gift with gift_count:', giftCountValue);

      if (editingGift) {
        await apiService.patch(`/gifts/${editingGift.id}/`, submitData);
        setSuccessMessage('Sovg\'a muvaffaqiyatli yangilandi!');
      } else {
        await apiService.post('/gifts/', submitData);
        setSuccessMessage('Sovg\'a muvaffaqiyatli qo\'shildi!');
      }

      await loadGifts();
      handleCloseDialog();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save gift:', error);
      alert('Sovg\'ani saqlashda xatolik yuz berdi: ' + error.message);
    }
  };

  const handleDelete = async (giftId) => {
    if (!confirm('Haqiqatan ham bu sovg\'ani o\'chirmoqchimisiz?')) return;

    try {
      await apiService.delete(`/gifts/${giftId}/`);
      setSuccessMessage('Sovg\'a muvaffaqiyatli o\'chirildi!');
      await loadGifts();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to delete gift:', error);
      alert('Sovg\'ani o\'chirishda xatolik yuz berdi');
    }
  };

  return (
    <Box sx={{ py: 4 }}>
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
          <Typography
            sx={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#1e293b',
              mb: 2
            }}
          >
            Sovg'alarni boshqarish
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#1d4ed8',
              }
            }}
          >
            Yangi sovg'a
          </Button>
        </Box>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          O'quvchilar yulduzlari bilan sotib olishlari mumkin bo'lgan sovg'alarni boshqaring
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

      {/* Gifts Table */}
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
                <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 3 }}>Rasm</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Nomi</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Tavsif</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Yulduz narxi</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Nadirlik</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Soni</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Status</TableCell>
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
              ) : gifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                    Hali sovg'alar yo'q
                  </TableCell>
                </TableRow>
              ) : (
                gifts.map((gift) => (
                  <TableRow key={gift.id} sx={{
                    '&:hover': {
                      backgroundColor: '#f8fafc'
                    }
                  }}>
                    <TableCell sx={{ py: 3 }}>
                      {gift.image_url ? (
                        <img
                          src={gift.image_url}
                          alt={gift.name}
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid #e2e8f0'
                          }}
                        />
                      ) : (
                        <Box sx={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          backgroundColor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e2e8f0'
                        }}>
                          <PhotoCameraIcon sx={{ color: '#64748b' }} />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Typography sx={{ fontWeight: 500, color: '#1e293b' }}>
                        {gift.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', maxWidth: '200px' }}>
                      <Typography sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {gift.description || 'Tavsif yo\'q'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StarIcon sx={{ mr: 1, color: '#f59e0b' }} />
                        <Typography sx={{
                          fontWeight: 700,
                          color: '#d97706'
                        }}>
                          {gift.star_cost}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={gift.rarity_display || gift.rarity}
                        sx={{
                          backgroundColor: gift.rarity === 'common' ? '#f3f4f6' :
                                          gift.rarity === 'rare' ? '#dbeafe' :
                                          gift.rarity === 'epic' ? '#f3e8ff' :
                                          gift.rarity === 'legendary' ? '#fef3c7' : '#f3f4f6',
                          color: gift.rarity === 'common' ? '#374151' :
                                gift.rarity === 'rare' ? '#1e40af' :
                                gift.rarity === 'epic' ? '#7c3aed' :
                                gift.rarity === 'legendary' ? '#d97706' : '#374151',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{
                        fontWeight: 600,
                        color: '#1e293b'
                      }}>
                        {gift.gift_count || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={gift.is_active ? 'Faol' : 'Faol emas'}
                        sx={{
                          backgroundColor: gift.is_active ? '#ecfdf5' : '#f3f4f6',
                          color: gift.is_active ? '#059669' : '#6b7280',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(gift)}
                          sx={{
                            color: '#2563eb',
                            '&:hover': {
                              backgroundColor: '#eff6ff'
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(gift.id)}
                          sx={{
                            color: '#dc2626',
                            '&:hover': {
                              backgroundColor: '#fef2f2'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Gift Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          color: '#1e293b',
          fontSize: '1.25rem'
        }}>
          {editingGift ? 'Sovg\'ani tahrirlash' : 'Yangi sovg\'a qo\'shish'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sovg'a nomi"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Yulduz narxi"
                name="star_cost"
                type="number"
                value={formData.star_cost}
                onChange={handleInputChange}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Nadirlik darajasi</InputLabel>
                <Select
                  name="rarity"
                  value={formData.rarity}
                  onChange={handleInputChange}
                  label="Nadirlik darajasi"
                >
                  <MenuItem value="common">Oddiy</MenuItem>
                  <MenuItem value="rare">Nodirkor</MenuItem>
                  <MenuItem value="epic">Epik</MenuItem>
                  <MenuItem value="legendary">Afsonaviy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mavjud soni (0 = cheksiz)"
                name="gift_count"
                type="number"
                value={formData.gift_count || 0}
                onChange={handleInputChange}
                inputProps={{ min: 0 }}
                helperText="0 kiriting agar cheksiz bo'lsa"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tavsif"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraIcon />}
                sx={{
                  borderColor: '#e2e8f0',
                  color: '#374151',
                  '&:hover': {
                    borderColor: '#2563eb',
                    backgroundColor: '#f8fafc'
                  }
                }}
              >
                Rasm tanlash (300x300px)
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </Button>
              {formData.image && (
                <Typography sx={{ mt: 1, color: '#059669', fontSize: '0.875rem' }}>
                  {formData.image.name} tanlandi
                </Typography>
              )}
              {editingGift && editingGift.image_url && !formData.image && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ mb: 1, fontSize: '0.875rem', color: '#64748b' }}>
                    Joriy rasm:
                  </Typography>
                  <img
                    src={editingGift.image_url}
                    alt={editingGift.name}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: '#374151',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#1d4ed8'
              }
            }}
          >
            {editingGift ? 'Yangilash' : 'Qo\'shish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageGifts;