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
  Tooltip,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Block as BlockIcon, CheckCircle as CheckCircleIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';
import apiService from '../../data/apiService';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    classGroup: '',
    direction: 'natural', // 'natural' or 'exact'
    registrationDate: new Date().toISOString().split('T')[0], // Default to today
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadStudents = async () => {
    try {
      const [allUsers, allAttempts] = await Promise.all([
        apiService.getUsers(),
        apiService.getAttempts()
      ]);
      const allStudents = allUsers.filter(user => user.role === 'student');
      setStudents(allStudents);
      setAttempts(allAttempts.results || allAttempts);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const generateStudentId = (firstName, lastName, classGroup, direction, randomDigits) => {
    // Create ID like: TO'XTAYEVJT9-03N478@test (LASTNAMEFIRSTINITIALTGRADE_DIRECTION_RANDOM@test)
    const lastNameUpper = lastName.toUpperCase().replace("'", '');
    const firstNameInitial = firstName.charAt(0).toUpperCase();
    const grade = classGroup.replace('-', '');
    const directionCode = direction === 'natural' ? 'N' : 'E';
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

  const handleEditClick = (student) => {
    setStudentToEdit(student);
    setFormData({
      firstName: student.name ? student.name.split(' ')[0] : '',
      lastName: student.name ? student.name.split(' ').slice(1).join(' ') : '',
      classGroup: student.class_group || '',
      direction: student.direction || 'natural',
      registrationDate: student.registration_date ? new Date(student.registration_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.firstName || !formData.lastName || !formData.classGroup || !formData.direction) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }

    try {
      const updatedData = {
        name: `${formData.firstName} ${formData.lastName}`,
        class_group: formData.classGroup,
        direction: formData.direction,
        registration_date: formData.registrationDate,
      };

      const updatedStudent = await apiService.put(`/users/${studentToEdit.id}/`, updatedData);

      // Update local state
      setStudents(students.map(student =>
        student.id === studentToEdit.id ? updatedStudent : student
      ));

      setSuccess(`O'quvchi ma'lumotlari muvaffaqiyatli yangilandi!`);
      setEditDialogOpen(false);
      setStudentToEdit(null);
      setFormData({
        firstName: '',
        lastName: '',
        classGroup: '',
        direction: 'natural',
        registrationDate: new Date().toISOString().split('T')[0],
      });

    } catch (err) {
      console.error('Failed to update student:', err);
      setError('Xatolik yuz berdi: ' + (err.message || 'Noma\'lum xatolik'));
    }
  };

  const handleBanStudent = async (studentId) => {
    try {
      await apiService.banUser(studentId, 'Admin tomonidan bloklandi');
      // Reload students
      await loadStudents();
      setSuccess('O\'quvchi muvaffaqiyatli bloklandi!');
    } catch (error) {
      console.error('Failed to ban student:', error);
      setError('O\'quvchini bloklashda xatolik yuz berdi');
    }
  };

  const handleUnbanStudent = async (studentId) => {
    try {
      await apiService.unbanUser(studentId);
      // Reload students
      await loadStudents();
      setSuccess('O\'quvchi muvaffaqiyatli blokdan chiqarildi!');
    } catch (error) {
      console.error('Failed to unban student:', error);
      setError('O\'quvchini blokdan chiqarishda xatolik yuz berdi');
    }
  };

  const getDirectionLabel = (direction) => {
    return direction === 'natural' ? 'Tabiiy fanlar' : 'Aniq fanlar';
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

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const name = student.name || '';
    const displayId = student.display_id || student.username || '';

    return name.toLowerCase().includes(searchLower) ||
           displayId.toLowerCase().includes(searchLower);
  });

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
      data-aos="fade-down"
      >
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
          data-aos="zoom-in"
          data-aos-delay="200"
        >
          O'quvchi qo'shish
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Search Input */}
      <Box sx={{ mb: 4 }} data-aos="fade-up" data-aos-delay="300">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="O'quvchi nomini yoki ID sini qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#64748b' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2563eb'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2563eb'
              }
            }
          }}
        />
        {searchTerm && (
          <Typography sx={{ mt: 1, color: '#64748b', fontSize: '0.875rem' }}>
            {filteredStudents.length} ta o'quvchi topildi
          </Typography>
        )}
      </Box>

      <div data-aos="fade-up" data-aos-delay="400">
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
              <TableCell>Status</TableCell>
              <TableCell>Unban kodi</TableCell>
              <TableCell>Harakatlar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => (
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
                  <Chip
                    label={student.is_banned ? 'Bloklangan' : 'Faol'}
                    size="small"
                    sx={{
                      backgroundColor: student.is_banned ? '#fef2f2' : '#ecfdf5',
                      color: student.is_banned ? '#dc2626' : '#059669',
                      fontWeight: 600,
                      borderRadius: '6px',
                      fontSize: '0.75rem'
                    }}
                  />
                </TableCell>
                <TableCell>
                  {student.is_banned && student.unban_code ? (
                    <Tooltip title="Bu kod o'quvchi uchun unikal">
                      <Typography sx={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        letterSpacing: '1px'
                      }}>
                        {student.unban_code}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography sx={{
                      fontSize: '0.75rem',
                      color: '#94a3b8'
                    }}>
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Tahrirlash">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(student)}
                        sx={{
                          color: '#059669',
                          '&:hover': {
                            backgroundColor: '#ecfdf5',
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {student.is_banned ? (
                      <Tooltip title="Blokdan chiqarish">
                        <IconButton
                          size="small"
                          onClick={() => handleUnbanStudent(student.id)}
                          sx={{
                            color: '#059669',
                            '&:hover': {
                              backgroundColor: '#ecfdf5',
                            }
                          }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Bloklash">
                        <IconButton
                          size="small"
                          onClick={() => handleBanStudent(student.id)}
                          sx={{
                            color: '#dc2626',
                            '&:hover': {
                              backgroundColor: '#fef2f2',
                            }
                          }}
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="O'chirish">
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
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </div>

      {filteredStudents.length === 0 && students.length > 0 && (
        <div data-aos="fade-up" data-aos-delay="500">
          <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
            <Typography variant="h6" color="textSecondary">
              Qidiruv natijasi bo'yicha o'quvchi topilmadi
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Qidiruv so'zini o'zgartirib ko'ring
            </Typography>
          </Paper>
        </div>
      )}

      {students.length === 0 && (
        <div data-aos="fade-up" data-aos-delay="500">
          <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
            <Typography variant="h6" color="textSecondary">
              Hali o'quvchilar qo'shilmagan
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Yuqoridagi "O'quvchi qo'shish" tugmasini bosing
            </Typography>
          </Paper>
        </div>
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
              <strong>Generatsiya qilingan ID:</strong> {generateStudentId(formData.firstName, formData.lastName, formData.classGroup, formData.direction, 123)}
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

      {/* Edit Student Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          O'quvchi ma'lumotlarini tahrirlash
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

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleEditSubmit} variant="contained">
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