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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import apiService from '../../data/apiService';

const ManageTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const allTests = await apiService.getTests();
      setTests(allTests.results || allTests);
    } catch (error) {
      console.error('Failed to load tests:', error);
      setError('Testlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (testId) => {
    try {
      const test = tests.find(t => t.id === testId);
      if (test) {
        await apiService.updateTest(testId, { is_active: !test.is_active });
        await loadTests();
        setSuccess(`Test ${!test.is_active ? 'faollashtirildi' : 'nofaollashtirildi'}`);
      }
    } catch (error) {
      console.error('Failed to toggle test status:', error);
      setError('Test holatini o\'zgartirishda xatolik yuz berdi');
    }
  };

  const handleDeleteClick = (test) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!testToDelete) return;

    try {
      await apiService.deleteTest(testToDelete.id);
      await loadTests();
      setSuccess('Test muvaffaqiyatli o\'chirildi!');
      setDeleteDialogOpen(false);
      setTestToDelete(null);
    } catch (error) {
      console.error('Failed to delete test:', error);
      setError('Testni o\'chirishda xatolik yuz berdi');
    }
  };

  const getStatusChip = (isActive) => (
    <Chip
      label={isActive ? 'Faol' : 'Nofaol'}
      color={isActive ? 'success' : 'default'}
      size="small"
      variant="outlined"
    />
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ 
        pl: { xs: 0, md: 35 }, 
        pr: 4,
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
      }}
      >
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Testlarni boshqarish
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            // Handle add test logic here
            console.log('Add new test');
          }}
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
          Test qo'shish
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
              <TableCell>Fan</TableCell>
              <TableCell>O'qituvchi</TableCell>
              <TableCell align="center">Savollar</TableCell>
              <TableCell align="center">Vaqt (daq)</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Yaratilgan</TableCell>
              <TableCell align="center">Harakatlar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tests.map((test) => (
              <TableRow key={test.id} sx={{
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
                    {test.title}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={test.subject}
                    size="small"
                    sx={{
                      backgroundColor: test.subject === 'Ingliz tili' ? '#3b82f6' : '#eff6ff',
                      color: test.subject === 'Ingliz tili' ? '#ffffff' : '#2563eb',
                      fontWeight: 500,
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      borderColor: test.subject === 'Ingliz tili' ? '#3b82f6' : undefined
                    }}
                  />
                </TableCell>
                
                <TableCell>
                  <Typography sx={{ 
                    color: '#64748b',
                    fontSize: '0.875rem'
                  }}>
                    {test.teacher_name || 'Noma\'lum'}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Typography sx={{ 
                    fontWeight: 700,
                    color: '#059669',
                    fontSize: '1.125rem'
                  }}>
                    {test.total_questions}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Typography sx={{ 
                    fontWeight: 600,
                    color: '#1e293b',
                    fontSize: '0.875rem'
                  }}>
                    {test.time_limit}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Chip
                    label={test.is_active !== false ? 'Faol' : 'Nofaol'}
                    size="small"
                    sx={{
                      backgroundColor: test.is_active !== false ? '#ecfdf5' : '#f1f5f9',
                      color: test.is_active !== false ? '#059669' : '#64748b',
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
                    {formatDate(test.created_at)}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Box display="flex" justifyContent="center" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        console.log('Edit test:', test.id);
                      }}
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
                      onClick={() => handleDeleteClick(test)}
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

      {tests.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Hech qanday test topilmadi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Yangi test yaratish uchun "Test qo'shish" tugmasini bosing
          </Typography>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          Testni o'chirishni tasdiqlang
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Haqiqatan ham ushbu testni o'chirishni xohlaysizmi?
          </Typography>
          {testToDelete && (
            <Paper sx={{ p: 2, backgroundColor: 'grey.50', mb: 2 }}>
              <Typography variant="h6">{testToDelete.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                Fan: {testToDelete.subject}
              </Typography>
            </Paper>
          )}
          <Alert severity="warning">
            <strong>E'tibor:</strong> Bu amal qaytarib bo'lmaydi. Test va uning barcha ma'lumotlari o'chiriladi.
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

export default ManageTests;