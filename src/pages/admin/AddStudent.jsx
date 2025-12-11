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
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../data/apiService';

const AddStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get student ID from URL for editing
  const isEditMode = !!id; // Check if we're in edit mode

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    classGroup: '',
    direction: 'natural', // Will be auto-set based on class suffix
    registrationDate: new Date().toISOString().split('T')[0], // Default to today
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(isEditMode); // Loading state for edit mode

  // Load student data for editing
  React.useEffect(() => {
    if (isEditMode) {
      const loadStudentData = async () => {
        try {
          const student = await apiService.getUser(id);
          if (student) {
            // Split name into first and last name
            const nameParts = student.name ? student.name.split(' ') : ['', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setFormData({
              firstName,
              lastName,
              classGroup: student.class_group || '',
              direction: student.direction || 'natural',
              registrationDate: student.registration_date ? student.registration_date.split('T')[0] : new Date().toISOString().split('T')[0],
            });
          }
        } catch (error) {
          console.error('Failed to load student data:', error);
          setError('O\'quvchi ma\'lumotlarini yuklashda xatolik yuz berdi');
        } finally {
          setLoading(false);
        }
      };

      loadStudentData();
    }
  }, [id, isEditMode]);

  const generateStudentId = (firstName, lastName, classGroup, direction, randomDigits) => {
    // Create ID like: TO'XTAYEVJT9-03N478@test (LASTNAMEFIRSTINITIALTGRADE_DIRECTION_RANDOM@test)
    const lastNameUpper = lastName.toUpperCase().replace("'", '');
    const firstNameInitial = firstName.charAt(0).toUpperCase();
    const grade = classGroup.split('-')[0]; // Get grade from class like "9-01-A"
    const directionCode = direction === 'natural' ? 'N' : 'E';
    return `${lastNameUpper}${firstNameInitial}T${grade}${directionCode}${randomDigits}@test`;
  };

  const generateStudentUsername = (firstName, lastName, classGroup, direction) => {
    // Create valid username: ahmedova501n (lowercase, replace - with empty)
    const lastNameLower = lastName.toLowerCase();
    const firstNameInitial = firstName.charAt(0).toLowerCase();
    const classCode = classGroup.replace(/-/g, ''); // Remove all dashes
    const directionCode = direction === 'natural' ? 'n' : 'e';
    return `${lastNameLower}${firstNameInitial}${classCode}${directionCode}`;
  };

  const generateStudentEmail = (firstName, lastName, classGroup, direction) => {
    // Create valid email: ahmedova501n@student.testplatform.com
    const username = generateStudentUsername(firstName, lastName, classGroup, direction);
    return `${username}@student.testplatform.com`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'classGroup') {
      // Auto-set direction based on class suffix (after the last dash)
      const direction = value.endsWith('-A') ? 'exact' : value.endsWith('-T') ? 'natural' : 'natural';
      setFormData({
        ...formData,
        classGroup: value,
        direction: direction
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.firstName || !formData.lastName || !formData.classGroup) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }

    try {
      const studentData = {
        name: `${formData.firstName} ${formData.lastName}`,
        class_group: formData.classGroup,
        direction: formData.direction,
        registration_date: formData.registrationDate,
      };

      if (isEditMode) {
        // Update existing student
        await apiService.updateUser(id, studentData);
        setSuccess('O\'quvchi ma\'lumotlari muvaffaqiyatli yangilandi!');
      } else {
        // Generate display ID and valid credentials for new student
        const randomDigits = Math.floor(Math.random() * 900) + 100; // Random 3 digits
        const displayId = generateStudentId(
          formData.firstName,
          formData.lastName,
          formData.classGroup,
          formData.direction,
          randomDigits
        );
        const username = generateStudentUsername(
          formData.firstName,
          formData.lastName,
          formData.classGroup,
          formData.direction
        );
        const email = generateStudentEmail(
          formData.firstName,
          formData.lastName,
          formData.classGroup,
          formData.direction
        );

        // Check if username already exists
        const allUsers = await apiService.getUsers();
        const existingStudent = allUsers.find(s => s.username === username);
        if (existingStudent) {
          setError('Bu ma\'lumotlar bilan o\'quvchi allaqachon mavjud');
          return;
        }

        // Create new student via API
        const newStudentData = {
          ...studentData,
          username: displayId, // Use display ID as username (will be stored as-is)
          email: email, // Valid email format
          password: displayId, // Use display ID as password
          role: 'student',
        };

        await apiService.post('/users/', newStudentData);

        setSuccess(`O'quvchi muvaffaqiyatli qo'shildi! ID: ${displayId}`);
        setFormData({
          firstName: '',
          lastName: '',
          classGroup: '',
          direction: 'natural', // Will be auto-set based on class suffix
          registrationDate: new Date().toISOString().split('T')[0],
        });
      }

    } catch (err) {
      console.error('Failed to save student:', err);
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
          onClick={() => navigate('/admin/students')}
          sx={{ mr: 3, mb: 2 }}
        >
          O'quvchilarni boshqarishga qaytish
        </Button>
        <Typography
          sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 2
          }}
        >
          {isEditMode ? 'O\'quvchi ma\'lumotlarini tahrirlash' : 'Yangi o\'quvchi qo\'shish'}
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          {isEditMode ? 'O\'quvchi ma\'lumotlarini yangilang' : 'Yangi o\'quvchi ma\'lumotlarini kiriting'}
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

          <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
            <InputLabel>Sinf</InputLabel>
            <Select
              name="classGroup"
              value={formData.classGroup}
              label="Sinf"
              onChange={handleChange}
            >
              {[5,6,7,8,9,10,11].flatMap(grade =>
                [1,2,3,4].flatMap(num => {
                  const baseClass = `${grade}-${String(num).padStart(2,'0')}`;
                  return ['A', 'T'].map(suffix => {
                    const classGroup = `${baseClass}-${suffix}`;
                    return <MenuItem key={classGroup} value={classGroup}>{classGroup}</MenuItem>;
                  });
                })
              )}
            </Select>
          </FormControl>

          <TextField
            margin="normal"
            label="Ro'yxatdan o'tgan sana"
            name="registrationDate"
            type="date"
            fullWidth
            variant="outlined"
            value={formData.registrationDate}
            onChange={handleChange}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          {formData.firstName && formData.lastName && formData.classGroup && (
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <strong>Yo'nalish:</strong> {formData.direction === 'exact' ? 'Aniq fanlar' : 'Tabiiy fanlar'}
              <br />
              <strong>Generatsiya qilingan ID:</strong> {generateStudentId(formData.firstName, formData.lastName, formData.classGroup, formData.direction, 123)}
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
              {isEditMode ? 'O\'quvchi ma\'lumotlarini saqlash' : 'O\'quvchi qo\'shish'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/admin/students')}
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

export default AddStudent;