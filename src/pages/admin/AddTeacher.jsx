import React, { useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../data/apiService';

const AddTeacher = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get teacher ID from URL for editing
  const isEditMode = !!id; // Check if we're in edit mode

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    subjects: '',
    isCurator: false,
    curatorClass: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(isEditMode); // Loading state for edit mode

  // Load teacher data for editing
  React.useEffect(() => {
    if (isEditMode) {
      const loadTeacherData = async () => {
        try {
          const teacher = await apiService.getUser(id);
          if (teacher) {
            // Split name into first and last name
            const nameParts = teacher.name ? teacher.name.split(' ') : ['', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setFormData({
              firstName,
              lastName,
              subjects: teacher.subjects ? teacher.subjects.join(', ') : '',
              isCurator: teacher.is_curator || false,
              curatorClass: teacher.curator_class || '',
            });
          }
        } catch (error) {
          console.error('Failed to load teacher data:', error);
          setError('O\'qituvchi ma\'lumotlarini yuklashda xatolik yuz berdi');
        } finally {
          setLoading(false);
        }
      };

      loadTeacherData();
    }
  }, [id, isEditMode]);

  const generateTeacherId = (firstName, lastName, randomDigits) => {
    // Create ID like: SAIDOVAMAFTUNAUSTOZ903@test (LASTNAMEFIRSTNAMECUSTOZRANDOM@test)
    const lastNameUpper = lastName.toUpperCase().replace("'", '');
    const firstNameUpper = firstName.toUpperCase().replace("'", '');
    return `${lastNameUpper}${firstNameUpper}USTOZ${randomDigits}@test`;
  };

  const generateTeacherUsername = (firstName, lastName) => {
    // Create valid username: karimova (lowercase, no special chars)
    const lastNameLower = lastName.toLowerCase();
    const firstNameInitial = firstName.charAt(0).toLowerCase();
    return `${lastNameLower}${firstNameInitial}oqituvchi`;
  };

  const generateTeacherEmail = (firstName, lastName) => {
    // Create valid email: karimova@teacher.testplatform.com
    const username = generateTeacherUsername(firstName, lastName);
    return `${username}@teacher.testplatform.com`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.firstName || !formData.lastName || !formData.subjects) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }

    try {
      const teacherData = {
        name: `${formData.firstName} ${formData.lastName}`,
        subjects: formData.subjects.split(',').map(s => s.trim()),
        is_curator: formData.isCurator,
        curator_class: formData.isCurator ? formData.curatorClass : null,
      };

      if (isEditMode) {
        // Update existing teacher
        await apiService.updateUser(id, teacherData);
        setSuccess('O\'qituvchi ma\'lumotlari muvaffaqiyatli yangilandi!');
      } else {
        // Generate display ID and valid credentials for new teacher
        const randomDigits = Math.floor(Math.random() * 900) + 100; // Random 3 digits
        const displayId = generateTeacherId(formData.firstName, formData.lastName, randomDigits);
        const username = generateTeacherUsername(formData.firstName, formData.lastName);
        const email = generateTeacherEmail(formData.firstName, formData.lastName);

        // Check if username already exists
        const allUsers = await apiService.getUsers();
        const existingTeacher = allUsers.find(t => t.username === username);
        if (existingTeacher) {
          setError('Bu ma\'lumotlar bilan o\'qituvchi allaqachon mavjud');
          return;
        }

        // Create new teacher via API
        const newTeacherData = {
          ...teacherData,
          username: displayId, // Use display ID as username (will be stored as-is)
          email: email, // Valid email format
          password: displayId, // Use display ID as password
          role: 'teacher',
        };

        await apiService.post('/users/', newTeacherData);

        setSuccess(`O'qituvchi muvaffaqiyatli qo'shildi! ID: ${displayId}`);
        setFormData({
          firstName: '',
          lastName: '',
          subjects: '',
          isCurator: false,
          curatorClass: ''
        });
      }

    } catch (err) {
      console.error('Failed to save teacher:', err);
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
          onClick={() => navigate('/admin/teachers')}
          sx={{ mr: 3, mb: 2 }}
        >
          O'qituvchilarni boshqarishga qaytish
        </Button>
        <Typography
          sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 2
          }}
        >
          {isEditMode ? 'O\'qituvchi ma\'lumotlarini tahrirlash' : 'Yangi o\'qituvchi qo\'shish'}
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          {isEditMode ? 'O\'qituvchi ma\'lumotlarini yangilang' : 'Yangi o\'qituvchi ma\'lumotlarini kiriting'}
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
            label="Fanlar (vergul bilan ajratilgan)"
            name="subjects"
            fullWidth
            variant="outlined"
            value={formData.subjects}
            onChange={handleChange}
            placeholder="Masalan: Matematika, Fizika, Kimyo"
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isCurator}
                onChange={handleChange}
                name="isCurator"
              />
            }
            label="Kurator"
            sx={{ mb: 2 }}
          />

          {formData.isCurator && (
            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
              <InputLabel>Kurator sinfi</InputLabel>
              <Select
                name="curatorClass"
                value={formData.curatorClass}
                label="Kurator sinfi"
                onChange={handleChange}
              >
                {[5,6,7,8,9,10,11].flatMap(grade =>
                  [1,2,3,4].map(num => {
                    const classGroup = `${grade}-${String(num).padStart(2,'0')}`;
                    return <MenuItem key={classGroup} value={classGroup}>{classGroup}</MenuItem>;
                  })
                )}
              </Select>
            </FormControl>
          )}

          {formData.firstName && formData.lastName && formData.subjects && (
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <strong>Generatsiya qilingan ID:</strong> {generateTeacherId(formData.firstName, formData.lastName, 123)}
              <br />
              <strong>Parol:</strong> Yuqoridagi ID (ID parol sifatida ishlatiladi)
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: '#2563eb',
                '&:hover': {
                  backgroundColor: '#1d4ed8'
                },
                py: 1.5,
                fontWeight: 600
              }}
            >
              {isEditMode ? 'O\'qituvchi ma\'lumotlarini saqlash' : 'O\'qituvchi qo\'shish'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/admin/teachers')}
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

export default AddTeacher;