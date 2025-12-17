import React, { useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../data/apiService';

const AddAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get admin ID from URL for editing
  const isEditMode = !!id; // Check if we're in edit mode

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organization: 'Default Organization',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(isEditMode); // Loading state for edit mode

  // Load admin data for editing
  React.useEffect(() => {
    if (isEditMode) {
      const loadAdminData = async () => {
        try {
          const admin = await apiService.getUser(id);
          if (admin) {
            // Split name into first and last name
            const nameParts = admin.name ? admin.name.split(' ') : ['', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setFormData({
              firstName,
              lastName,
              email: admin.email || '',
              password: '', // Don't show existing password
              organization: admin.organization || 'Default Organization',
            });
          }
        } catch (error) {
          console.error('Failed to load admin data:', error);
          setError('Admin ma\'lumotlarini yuklashda xatolik yuz berdi');
        } finally {
          setLoading(false);
        }
      };

      loadAdminData();
    }
  }, [id, isEditMode]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.organization) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }

    // In create mode, password is required
    if (!isEditMode && !formData.password) {
      setError('Parol kiritish majburiy');
      return;
    }

    try {
      const adminData = {
        name: `${formData.firstName} ${formData.lastName}`,
      };

      if (isEditMode) {
        // Update existing admin
        const updateData = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          name: adminData.name,
          organization: formData.organization,
        };

        // Only include password if it's provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        console.log('Updating admin with data:', updateData);
        await apiService.updateUser(id, updateData);
        setSuccess('Admin ma\'lumotlari muvaffaqiyatli yangilandi!');
      } else {
        // Check if email already exists
        const allUsers = await apiService.getUsers();
        const existingAdmin = allUsers.find(a => a.email === formData.email);
        if (existingAdmin) {
          setError('Bu email bilan admin allaqachon mavjud');
          return;
        }

        // Create new admin via API
        console.log('Creating admin with data:', {
          username: formData.email,
          email: formData.email,
          password: formData.password,
          role: 'admin',
          first_name: formData.firstName,
          last_name: formData.lastName,
          name: adminData.name,
          organization: formData.organization,
        });

        const response = await apiService.post('/users/', {
          username: formData.email,
          email: formData.email,
          password: formData.password,
          role: 'admin',
          first_name: formData.firstName,
          last_name: formData.lastName,
          name: adminData.name,
          organization: formData.organization,
        });

        console.log('Admin creation response:', response);

        setSuccess(
          <div>
            <strong>✅ Admin muvaffaqiyatli qo'shildi!</strong><br/>
            <strong>Login ma'lumotlari:</strong><br/>
            Email: {formData.email}<br/>
            Parol: {formData.password}<br/>
            Tashkilot: {formData.organization}
          </div>
        );
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          organization: 'Default Organization',
        });
      }

    } catch (err) {
      console.error('Failed to save admin:', err);
      setError('Xatolik yuz berdi: ' + (err.message || 'Noma\'lum xatolik'));
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
          {isEditMode ? 'Admin ma\'lumotlarini tahrirlash' : 'Yangi admin qo\'shish'}
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          {isEditMode ? 'Admin ma\'lumotlarini yangilang' : 'Yangi admin ma\'lumotlarini kiriting'}
        </Typography>
      </Box>

      {/* Success Message */}
      {success && (
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
          ✅ {success}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Paper sx={{
        p: 4,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        maxWidth: '600px',
        mx: 'auto'
      }}>
        <form onSubmit={handleSubmit}>
          <TextField
            autoFocus
            margin="normal"
            label="Ism"
            name="firstName"
            fullWidth
            variant="outlined"
            value={formData.firstName}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="normal"
            label="Familiya"
            name="lastName"
            fullWidth
            variant="outlined"
            value={formData.lastName}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="normal"
            label="Email manzil"
            name="email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
            placeholder="admin@example.com"
          />

          <TextField
            margin="normal"
            label={isEditMode ? "Yangi parol (ixtiyoriy)" : "Parol"}
            name="password"
            type="password"
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
            sx={{ mb: 2 }}
            placeholder={isEditMode ? "O'zgartirish uchun yangi parol kiriting" : "Xavfsiz parol kiriting"}
          />

          <TextField
            margin="normal"
            label="Tashkilot"
            name="organization"
            fullWidth
            variant="outlined"
            value={formData.organization}
            onChange={handleChange}
            sx={{ mb: 2 }}
            placeholder="Qaysi tashkilotda ishlaydi"
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: '#dc2626',
                '&:hover': {
                  backgroundColor: '#b91c1c'
                },
                py: 1.5,
                fontWeight: 600
              }}
            >
              {isEditMode ? 'Admin ma\'lumotlarini saqlash' : 'Admin qo\'shish'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/headadmin/admins')}
              sx={{
                borderColor: '#64748b',
                color: '#64748b',
                '&:hover': {
                  backgroundColor: '#f8fafc',
                  borderColor: '#64748b'
                },
                py: 1.5
              }}
            >
              Bekor qilish
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddAdmin;