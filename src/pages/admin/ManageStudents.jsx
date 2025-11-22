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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import apiService from '../../data/apiService';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    classGroup: '',
    direction: 'natural', // 'natural' or 'exact'
    registrationDate: new Date().toISOString().split('T')[0], // Default to today
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const [tests, setTests] = useState([]);

  const loadStudents = async () => {
    try {
      const [allUsers, allAttempts, allTests] = await Promise.all([
        apiService.getUsers(),
        apiService.getAttempts(),
        apiService.getTests()
      ]);
      const allStudents = allUsers.filter(user => user.role === 'student');
      setStudents(allStudents);
      setAttempts(allAttempts.results || allAttempts);
      setTests(allTests.results || allTests);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const generateStudentId = (firstName, lastName, classGroup, direction) => {
    // Create ID like: TO'XTAYEVJT9-03N478@test (LASTNAMEFIRSTINITIALTGRADE_DIRECTION_RANDOM@test)
    const lastNameUpper = lastName.toUpperCase().replace("'", '');
    const firstNameInitial = firstName.charAt(0).toUpperCase();
    const grade = classGroup.replace('-', '');
    const directionCode = direction === 'natural' ? 'N' : 'E';
    const randomDigits = Math.floor(Math.random() * 900) + 100; // Random 3 digits
    return `${lastNameUpper}${firstNameInitial}T${grade}${directionCode}${randomDigits}@test`;
  };

  const generateStudentUsername = (firstName, lastName, classGroup, direction) => {
    // Create valid username: ahmedova501n (lowercase, replace - with empty)
    const lastNameLower = lastName.toLowerCase();
    const firstNameInitial = firstName.charAt(0).toLowerCase();
    const classCode = classGroup.replace('-', '');
    const directionCode = direction === 'natural' ? 'n' : 'e';
    return `${lastNameLower}${firstNameInitial}${classCode}${directionCode}`;
  };

  const generateStudentEmail = (firstName, lastName, classGroup, direction) => {
    // Create valid email: ahmedova501n@student.testplatform.com
    const username = generateStudentUsername(firstName, lastName, classGroup, direction);
    return `${username}@student.testplatform.com`;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.firstName || !formData.lastName || !formData.classGroup || !formData.direction) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }

    try {
      // Generate display ID and valid credentials
      const displayId = generateStudentId(
        formData.firstName,
        formData.lastName,
        formData.classGroup,
        formData.direction
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
      const existingStudent = students.find(s => s.username === username);
      if (existingStudent) {
        setError('Bu ma\'lumotlar bilan o\'quvchi allaqachon mavjud');
        return;
      }

      // Create new student via API
      const studentData = {
        username: displayId, // Use display ID as username (will be stored as-is)
        email: email, // Valid email format
        password: displayId, // Use display ID as password
        name: `${formData.firstName} ${formData.lastName}`,
        role: 'student',
        class_group: formData.classGroup,
        direction: formData.direction, // Add direction field
        registration_date: formData.registrationDate,
      };

      const savedStudent = await apiService.post('/users/', studentData);

      // Update local state
      setStudents([...students, savedStudent]);

      setSuccess(`O'quvchi muvaffaqiyatli qo'shildi! ID: ${displayId}`);
      setFormData({
        firstName: '',
        lastName: '',
        classGroup: '',
        direction: 'natural',
        registrationDate: new Date().toISOString().split('T')[0],
      });
      setDialogOpen(false);

    } catch (err) {
      console.error('Failed to create student:', err);
      setError('Xatolik yuz berdi: ' + (err.message || 'Noma\'lum xatolik'));
    }
  };

  const handleDelete = async (studentId) => {
    try {
      await apiService.deleteUser(studentId);
      // Remove from local state
      setStudents(students.filter(student => student.id !== studentId));
      setSuccess('O\'quvchi muvaffaqiyatli o\'chirildi!');
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Failed to delete student:', error);
      setError('O\'quvchini o\'chirishda xatolik yuz berdi');
    }
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const getDirectionLabel = (direction) => {
    return direction === 'natural' ? 'Tabiiy fanlar' : 'Aniq fanlar';
  };

  const getDirectionColor = (direction) => {
    return direction === 'natural' ? 'success' : 'primary';
  };

  const getStudentAttemptCount = (studentId) => {
    return attempts.filter(attempt => attempt.student === studentId).length;
  };

  const getStudentAverageScore = (studentId) => {
    const studentAttempts = attempts.filter(attempt => attempt.student === studentId);
    if (studentAttempts.length === 0) return 0;

    const averageScore = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
    return Math.round(averageScore);
  };

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
          O'quvchilarni boshqarish
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
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
          O'quvchi qo'shish
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
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
              <TableCell>ID</TableCell>
              <TableCell>To'liq ism</TableCell>
              <TableCell>Sinf</TableCell>
              <TableCell>Yo'nalish</TableCell>
              <TableCell>Test urinishlari</TableCell>
              <TableCell>O'rtacha ball</TableCell>
              <TableCell>Harakatlar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} sx={{
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
                    fontFamily: 'monospace', 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    backgroundColor: '#f1f5f9',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    color: '#475569',
                    display: 'inline-block'
                  }}>
                    {student.display_id || student.username}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ 
                    fontWeight: 600, 
                    color: '#1e293b',
                    fontSize: '0.875rem'
                  }}>
                    {student.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ 
                    fontWeight: 600,
                    color: '#1e293b',
                    fontSize: '0.875rem'
                  }}>
                    {student.class_group}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getDirectionLabel(student.direction)}
                    size="small"
                    sx={{
                      backgroundColor: student.direction === 'natural' ? '#ecfdf5' : '#eff6ff',
                      color: student.direction === 'natural' ? '#059669' : '#2563eb',
                      fontWeight: 600,
                      borderRadius: '6px',
                      fontSize: '0.75rem'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography sx={{ 
                    fontWeight: 700,
                    color: '#2563eb',
                    fontSize: '1.125rem'
                  }}>
                    {getStudentAttemptCount(student.id)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ 
                    fontWeight: 700,
                    color: '#059669',
                    fontSize: '1.125rem'
                  }}>
                    {getStudentAverageScore(student.id)}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(student)}
                    sx={{
                      color: '#dc2626',
                      '&:hover': {
                        backgroundColor: '#fef2f2',
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {students.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" color="textSecondary">
            Hali o'quvchilar qo'shilmagan
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Yuqoridagi "O'quvchi qo'shish" tugmasini bosing
          </Typography>
        </Paper>
      )}

      {/* Add Student Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Yangi o'quvchi qo'shish
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Ism"
            name="firstName"
            fullWidth
            variant="outlined"
            value={formData.firstName}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Familiya"
            name="lastName"
            fullWidth
            variant="outlined"
            value={formData.lastName}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Sinf</InputLabel>
            <Select
              name="classGroup"
              value={formData.classGroup}
              label="Sinf"
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

          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Yo'nalish</InputLabel>
            <Select
              name="direction"
              value={formData.direction}
              label="Yo'nalish"
              onChange={handleChange}
            >
              <MenuItem value="natural">Tabiiy fanlar</MenuItem>
              <MenuItem value="exact">Aniq fanlar</MenuItem>
            </Select>
          </FormControl>
  
          <TextField
            margin="dense"
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

          {formData.firstName && formData.lastName && formData.classGroup && formData.direction && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Generatsiya qilingan ID:</strong> {generateStudentId(formData.firstName, formData.lastName, formData.classGroup, formData.direction)}
              <br />
              <strong>Parol:</strong> Yuqoridagi ID (ID parol sifatida ishlatiladi)
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleSubmit} variant="contained">
            O'quvchi qo'shish
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
          O'quvchini o'chirishni tasdiqlang
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Haqiqatan ham ushbu o'quvchini o'chirishni xohlaysizmi?
          </Typography>
          {studentToDelete && (
            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', mb: 2 }}>
              <Typography variant="h6">{studentToDelete.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                ID: {studentToDelete.display_id || studentToDelete.username}
              </Typography>
            </Paper>
          )}
          <Alert severity="warning">
            <strong>E'tibor:</strong> Bu amal qaytarib bo'lmaydi. O'quvchi va uning barcha test natijalari o'chiriladi.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={() => handleDelete(studentToDelete.id)}
            color="error"
            variant="contained"
            sx={{ cursor: 'pointer' }}
          >
            O'chirish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageStudents;