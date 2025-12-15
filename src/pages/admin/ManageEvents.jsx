import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Event as EventIcon } from '@mui/icons-material';
import apiService from '../../data/apiService';

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
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

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEvents();
      setEvents(response.results || response);
    } catch (error) {
      console.error('Failed to load events:', error);
      setError('Tadbirlar yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (eventId) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (event) {
        await apiService.updateEvent(eventId, { is_active: !event.is_active });
        await loadEvents();
        setSuccess(`Tadbir ${!event.is_active ? 'faollashtirildi' : 'nofaollashtirildi'}`);
      }
    } catch (error) {
      console.error('Failed to toggle event status:', error);
      setError('Tadbir holatini o\'zgartirishda xatolik yuz berdi');
    }
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;

    try {
      await apiService.deleteEvent(eventToDelete.id);
      await loadEvents();
      setSuccess('Tadbir muvaffaqiyatli o\'chirildi!');
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
      setError('Tadbirni o\'chirishda xatolik yuz berdi');
    }
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      event_type: event.event_type || 'school_rating',
      first_place_stars: event.first_place_stars || 10,
      second_place_stars: event.second_place_stars || 7,
      third_place_stars: event.third_place_stars || 5,
      distribution_date: event.distribution_date ? new Date(event.distribution_date).toISOString().slice(0, 16) : '',
      target_class_groups: event.target_class_groups ? event.target_class_groups.join(', ') : '',
      banner_image: null
    });
    setEditDialogOpen(true);
  };

  const handleAddClick = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      event_type: 'class_rating',
      reward_stars: 10,
      reward_description: '',
      distribution_date: '',
      target_class_groups: '',
      top_positions: 3,
      banner_image: null
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = new FormData();

      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      if (editingEvent) {
        await apiService.updateEvent(editingEvent.id, data);
        setSuccess('Tadbir muvaffaqiyatli yangilandi!');
      } else {
        await apiService.createEvent(data);
        setSuccess('Tadbir muvaffaqiyatli yaratildi!');
      }

      await loadEvents();
      setEditDialogOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Failed to save event:', error);
      setError('Tadbirni saqlashda xatolik yuz berdi');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusChip = (isActive) => (
    <Chip
      label={isActive ? 'Faol' : 'Nofaol'}
      color={isActive ? 'success' : 'default'}
      size="small"
      variant="outlined"
    />
  );

  const getEventTypeChip = (eventType) => {
    let label = 'Maxsus';
    let color = 'secondary';

    if (eventType === 'school_rating') {
      label = "O'quvchilar reytingi";
      color = 'primary';
    } else if (eventType === 'class_rating') {
      label = 'Sinflar reytingi';
      color = 'success';
    }

    return (
      <Chip
        label={label}
        color={color}
        size="small"
        variant="outlined"
      />
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{
        py: 4,
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Typography>Yuklanmoqda...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      py: 4,
      backgroundColor: '#ffffff'
    }}>
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
          Tadbirlar boshqarish
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
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
          Tadbir qo'shish
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}>
        <Table>
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
              <TableCell>Sarlavha</TableCell>
              <TableCell>Turi</TableCell>
              <TableCell>Mukofotlar</TableCell>
              <TableCell>Taqsimlash sanasi</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Yaratilgan</TableCell>
              <TableCell align="center">Harakatlar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} sx={{
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
                  <Typography sx={{
                    fontWeight: 600,
                    color: '#1e293b',
                    fontSize: '0.875rem'
                  }}>
                    {event.title}
                  </Typography>
                  {event.description && (
                    <Typography sx={{
                      color: '#64748b',
                      fontSize: '0.75rem',
                      mt: 0.5
                    }}>
                      {event.description.length > 50 ? `${event.description.substring(0, 50)}...` : event.description}
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  {getEventTypeChip(event.event_type)}
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography sx={{
                      fontWeight: 700,
                      color: '#f59e0b',
                      fontSize: '0.9rem'
                    }}>
                      🥇 {event.first_place_stars} ⭐
                    </Typography>
                    <Typography sx={{
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: '0.8rem'
                    }}>
                      🥈 {event.second_place_stars} ⭐
                    </Typography>
                    <Typography sx={{
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: '0.8rem'
                    }}>
                      🥉 {event.third_place_stars} ⭐
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography sx={{
                    color: '#64748b',
                    fontSize: '0.875rem'
                  }}>
                    {formatDate(event.distribution_date)}
                  </Typography>
                </TableCell>

                <TableCell align="center">
                  <Chip
                    label={event.is_active ? 'Faol' : 'Nofaol'}
                    size="small"
                    sx={{
                      backgroundColor: event.is_active ? '#ecfdf5' : '#f1f5f9',
                      color: event.is_active ? '#059669' : '#64748b',
                      fontWeight: 600,
                      borderRadius: '6px',
                      fontSize: '0.75rem'
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Typography sx={{
                    color: '#64748b',
                    fontSize: '0.75rem'
                  }}>
                    {new Date(event.created_at).toLocaleDateString('uz-UZ')}
                  </Typography>
                </TableCell>

                <TableCell align="center">
                  <Box display="flex" justifyContent="center" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(event)}
                      sx={{
                        color: '#2563eb',
                        '&:hover': {
                          backgroundColor: '#eff6ff',
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(event)}
                      sx={{
                        color: '#dc2626',
                        '&:hover': {
                          backgroundColor: '#fef2f2',
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {events.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Hech qanday tadbir topilmadi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Yangi tadbir yaratish uchun "Tadbir qo'shish" tugmasini bosing
          </Typography>
        </Box>
      )}

      {/* Edit/Add Event Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1e293b' }}>
          {editingEvent ? 'Tadbirni tahrirlash' : 'Yangi tadbir yaratish'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sarlavha"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tavsif"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tadbir turi</InputLabel>
                <Select
                  value={formData.event_type}
                  onChange={(e) => handleInputChange('event_type', e.target.value)}
                  label="Tadbir turi"
                >
                  <MenuItem value="school_rating">O'quvchilar reytingi</MenuItem>
                  <MenuItem value="class_rating">Sinflar reytingi</MenuItem>
                  <MenuItem value="custom">Maxsus</MenuItem>
                </Select>
              </FormControl>
            </Grid>

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
              />
            </Grid>

            {formData.event_type === 'class_rating' && (
              <Grid size={{ xs: 12 }}>
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Taqsimlash sanasi"
                type="datetime-local"
                value={formData.distribution_date}
                onChange={(e) => handleInputChange('distribution_date', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>


            <Grid item xs={12}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="banner-image"
                type="file"
                onChange={(e) => handleInputChange('banner_image', e.target.files[0])}
              />
              <label htmlFor="banner-image">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{
                    borderColor: '#e2e8f0',
                    color: '#64748b',
                    '&:hover': {
                      borderColor: '#2563eb',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                >
                  Banner rasmini tanlang
                </Button>
              </label>
              {formData.banner_image && (
                <Typography sx={{ mt: 1, fontSize: '0.875rem', color: '#059669' }}>
                  {formData.banner_image.name} tanlandi
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              backgroundColor: '#2563eb',
              '&:hover': {
                backgroundColor: '#1d4ed8'
              }
            }}
          >
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          Tadbirni o'chirishni tasdiqlang
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Haqiqatan ham ushbu tadbirni o'chirishni xohlaysizmi?
          </Typography>
          {eventToDelete && (
            <Paper sx={{ p: 2, backgroundColor: 'grey.50', mb: 2 }}>
              <Typography variant="h6">{eventToDelete.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                Mukofot: {eventToDelete.reward_stars} yulduz
              </Typography>
            </Paper>
          )}
          <Alert severity="warning">
            <strong>E'tibor:</strong> Bu amal qaytarib bo'lmaydi. Tadbir va uning barcha ma'lumotlari o'chiriladi.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            O'chirish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageEvents;