import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PhotoCamera as PhotoIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import apiService from '../../data/apiService';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing events
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [bannerPreview, setBannerPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'school_rating',
    first_place_stars: 10,
    second_place_stars: 7,
    third_place_stars: 5,
    distribution_date: '',
    target_class_groups: '',
    banner_image: null
  });

  // Load event data if editing
  useEffect(() => {
    if (id) {
      setIsEditing(true);
      loadEventForEditing(id);
    } else {
      setIsEditing(false);
    }
  }, [id]);

  const loadEventForEditing = async (eventId) => {
    try {
      setLoading(true);
      const event = await apiService.getEvent(eventId);
      setEditingEvent(event);

      // Populate form with event data
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || 'school_rating',
        first_place_stars: event.first_place_stars || 10,
        second_place_stars: event.second_place_stars || 7,
        third_place_stars: event.third_place_stars || 5,
        distribution_date: event.distribution_date ? new Date(event.distribution_date).toISOString().slice(0, 16) : '',
        target_class_groups: event.target_class_groups ? event.target_class_groups.join(', ') : '',
        banner_image: null // Don't preload existing image
      });

      // Set banner preview if exists
      if (event.banner_image_url) {
        setBannerPreview(event.banner_image_url);
      }
    } catch (error) {
      console.error('Failed to load event for editing:', error);
      setError('Tadbirni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({
          ...prev,
          banner_image: file
        }));
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setBannerPreview(previewUrl);
      } else {
        alert('Faqat rasm fayllarini yuklash mumkin!');
      }
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      setError('Tadbir nomi majburiy');
      return;
    }
    if (!formData.distribution_date) {
      setError('Tarqatish sanasi majburiy');
      return;
    }
    if (formData.first_place_stars <= 0 || formData.second_place_stars <= 0 || formData.third_place_stars <= 0) {
      setError('Yulduzlar soni 0 dan katta bo\'lishi kerak');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const data = new FormData();

      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      if (isEditing && editingEvent) {
        await apiService.updateEvent(editingEvent.id, data);
        setSuccess('Tadbir muvaffaqiyatli yangilandi!');
      } else {
        await apiService.createEvent(data);
        setSuccess('Tadbir muvaffaqiyatli yaratildi!');
      }

      // Redirect after success
      setTimeout(() => {
        navigate('/admin/events');
      }, 2000);

    } catch (error) {
      console.error('Failed to create event:', error);
      setError('Tadbir yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 4, backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton
            onClick={() => navigate('/admin/events')}
            sx={{
              backgroundColor: '#f8fafc',
              '&:hover': { backgroundColor: '#e2e8f0' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            sx={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#1e293b'
            }}
          >
            {isEditing ? 'Tadbirni tahrirlash' : 'Yangi tadbir yaratish'}
          </Typography>
        </Box>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          {isEditing ? 'Tadbir ma\'lumotlarini o\'zgartirish' : 'O\'quvchilarga yulduz mukofotlari berish uchun yangi tadbir yarating'}
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert
          severity="success"
          sx={{
            mb: 4,
            backgroundColor: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#059669',
            borderRadius: '12px'
          }}
        >
          ✅ {success}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 4,
            backgroundColor: '#fef2f2',
            border: '1px solid #dc2626',
            color: '#dc2626',
            borderRadius: '12px'
          }}
        >
          ❌ {error}
        </Alert>
      )}

      {/* Form */}
      <Paper sx={{
        p: 4,
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <Grid container spacing={4}>
          {/* Basic Information */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
              📋 Asosiy ma'lumotlar
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  label="Tadbir nomi"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  placeholder="Masalan: O'quvchilar reytingi - Dekabr"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Tarqatish sanasi"
                  type="datetime-local"
                  value={formData.distribution_date}
                  onChange={(e) => handleInputChange('distribution_date', e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Tadbir tavsifi"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Tadbir haqida qisqacha ma'lumot..."
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Event Type */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
              🎯 Tadbir turi
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tadbir turi</InputLabel>
                  <Select
                    value={formData.event_type}
                    onChange={(e) => handleInputChange('event_type', e.target.value)}
                    label="Tadbir turi"
                  >
                    <MenuItem value="school_rating">O'quvchilar reytingi (maktab bo'yicha)</MenuItem>
                    <MenuItem value="class_rating">Sinflar reytingi (sinf bo'yicha)</MenuItem>
                    <MenuItem value="custom">Maxsus tadbir</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.event_type === 'class_rating' && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Mo'ljallangan sinflar (vergul bilan ajratib)"
                    value={formData.target_class_groups}
                    onChange={(e) => handleInputChange('target_class_groups', e.target.value)}
                    placeholder="Masalan: 9-01, 9-02, 10-01"
                    helperText="Bo'sh qoldirilsa barcha sinflar uchun"
                  />
                </Grid>
              )}
            </Grid>
          </Grid>

          {/* Rewards */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
              🏆 Mukofotlar
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="1-o'rin yulduzlari"
                  type="number"
                  value={formData.first_place_stars}
                  onChange={(e) => handleInputChange('first_place_stars', parseInt(e.target.value))}
                  required
                  InputProps={{
                    startAdornment: '🥇'
                  }}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="2-o'rin yulduzlari"
                  type="number"
                  value={formData.second_place_stars}
                  onChange={(e) => handleInputChange('second_place_stars', parseInt(e.target.value))}
                  required
                  InputProps={{
                    startAdornment: '🥈'
                  }}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="3-o'rin yulduzlari"
                  type="number"
                  value={formData.third_place_stars}
                  onChange={(e) => handleInputChange('third_place_stars', parseInt(e.target.value))}
                  required
                  InputProps={{
                    startAdornment: '🥉'
                  }}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Banner Image */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
              🖼️ Banner rasmi (ixtiyoriy)
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PhotoIcon />}
                    sx={{
                      borderColor: '#2563eb',
                      color: '#2563eb',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: '#eff6ff',
                        borderColor: '#1d4ed8',
                      }
                    }}
                  >
                    Rasm tanlash
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handlePhotoChange}
                    />
                  </Button>
                  {formData.banner_image && (
                    <Typography variant="body2" color="textSecondary">
                      {formData.banner_image.name}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {bannerPreview && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <CardContent sx={{ p: 0 }}>
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{
          mt: 6,
          pt: 4,
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end'
        }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/admin/events')}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: '8px',
              fontWeight: 600
            }}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: '8px',
              fontWeight: 600,
              backgroundColor: '#2563eb',
              '&:hover': {
                backgroundColor: '#1d4ed8'
              }
            }}
          >
            {loading ? 'Saqlanmoqda...' : (isEditing ? 'Tadbirni saqlash' : 'Tadbirni yaratish')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateEvent;