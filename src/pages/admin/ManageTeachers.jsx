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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';
import apiService from '../../data/apiService';

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [tests, setTests] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [teacherToEdit, setTeacherToEdit] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    subjects: '',
    isCurator: false,
    curatorClass: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadTeachers = async () => {
    try {
      // Load teachers from API
      const allUsers = await apiService.getUsers();
      const allTeachers = allUsers.filter(user => user.role === 'teacher');
      setTeachers(allTeachers);
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  };

  const loadTests = async () => {
    try {
      const allTests = await apiService.getTests();
      setTests(allTests);
    } catch (error) {
      console.error('Failed to load tests:', error);
    }
  };

  useEffect(() => {
    loadTeachers();
    loadTests();
  }, []);

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
      // Generate display ID and valid credentials
      const randomDigits = Math.floor(Math.random() * 900) + 100; // Random 3 digits
      const displayId = generateTeacherId(formData.firstName, formData.lastName, randomDigits);
      const username = generateTeacherUsername(formData.firstName, formData.lastName);
      const email = generateTeacherEmail(formData.firstName, formData.lastName);

      // Check if username already exists
      const existingTeacher = teachers.find(t => t.username === username);
      if (existingTeacher) {
        setError('Bu ma\'lumotlar bilan o\'qituvchi allaqachon mavjud');
        return;
      }

      // Create new teacher via API
      const teacherData = {
        username: displayId, // Use display ID as username (will be stored as-is)
        email: email, // Valid email format
        password: displayId, // Use display ID as password
        name: `${formData.firstName} ${formData.lastName}`,
        role: 'teacher',
        subjects: formData.subjects.split(',').map(s => s.trim()),
        is_curator: formData.isCurator,
        curator_class: formData.isCurator ? formData.curatorClass : null,
      };

      const savedTeacher = await apiService.post('/users/', teacherData);

      // Update local state
      setTeachers([...teachers, savedTeacher]);

      setSuccess(`O'qituvchi muvaffaqiyatli qo'shildi! ID: ${displayId}`);
      setFormData({
        firstName: '',
        lastName: '',
        subjects: '',
        isCurator: false,
        curatorClass: ''
      });
      setDialogOpen(false);

    } catch (err) {
      console.error('Failed to create teacher:', err);
      setError('Xatolik yuz berdi: ' + (err.message || 'Noma\'lum xatolik'));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.firstName || !formData.lastName || !formData.subjects) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }

    try {
      const updatedData = {
        name: `${formData.firstName} ${formData.lastName}`,
        subjects: formData.subjects.split(',').map(s => s.trim()),
        is_curator: formData.isCurator,
        curator_class: formData.isCurator ? formData.curatorClass : null,
      };

      const updatedTeacher = await apiService.put(`/users/${teacherToEdit.id}/`, updatedData);

      // Update local state
      setTeachers(teachers.map(teacher => 
        teacher.id === teacherToEdit.id ? updatedTeacher : teacher
      ));

      setSuccess(`O'qituvchi ma'lumotlari muvaffaqiyatli yangilandi!`);
      setEditDialogOpen(false);
      setTeacherToEdit(null);
      setFormData({
        firstName: '',
        lastName: '',
        subjects: '',
        isCurator: false,
        curatorClass: ''
      });

    } catch (err) {
      console.error('Failed to update teacher:', err);
      setError('Xatolik yuz berdi: ' + (err.message || 'Noma\'lum xatolik'));
    }
  };

  const handleDelete = async (teacherId) => {
    try {
      await apiService.deleteUser(teacherId);
      // Remove from local state
      setTeachers(teachers.filter(teacher => teacher.id !== teacherId));
      setSuccess('O\'qituvchi muvaffaqiyatli o\'chirildi!');
      setDeleteDialogOpen(false);
      setTeacherToDelete(null);
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      setError('O\'qituvchini o\'chirishda xatolik yuz berdi');
    }
  };

  const handleDeleteClick = (teacher) => {
    setTeacherToDelete(teacher);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (teacher) => {
    setTeacherToEdit(teacher);
    setFormData({
      firstName: teacher.name ? teacher.name.split(' ')[0] : '',
      lastName: teacher.name ? teacher.name.split(' ').slice(1).join(' ') : '',
      subjects: teacher.subjects ? teacher.subjects.join(', ') : '',
      isCurator: teacher.is_curator || false,
      curatorClass: teacher.curator_class || '',
    });
    setEditDialogOpen(true);
  };

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(teacher => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const name = teacher.name || '';
    const displayId = teacher.display_id || teacher.username || '';

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
          O'qituvchilarni boshqarish
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
          O'qituvchi qo'shish
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
          placeholder="O'qituvchi nomini yoki ID sini qidirish..."
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
            {filteredTeachers.length} ta o'qituvchi topildi
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
              <TableCell>Ism</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Fanlar</TableCell>
              <TableCell>Kurator</TableCell>
              <TableCell>Kurator sinfi</TableCell>
              <TableCell>Yaratgan testlari</TableCell>
              <TableCell>Harakatlar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTeachers.map((teacher) => (
              <TableRow key={teacher.id} sx={{
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
                  <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                    {teacher.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    backgroundColor: '#f1f5f9',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    color: '#475569'
                  }}>
                    {teacher.display_id || teacher.username}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {teacher.subjects?.map((subject) => (
                      <Chip
                        key={subject}
                        label={subject}
                        size="small"
                        sx={{
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          borderRadius: '6px'
                        }}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={teacher.is_curator ? 'Ha' : 'Yo\'q'}
                    size="small"
                    sx={{
                      backgroundColor: teacher.is_curator ? '#ecfdf5' : '#f1f5f9',
                      color: teacher.is_curator ? '#059669' : '#64748b',
                      fontWeight: 600,
                      borderRadius: '6px'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography sx={{ 
                    fontWeight: 500,
                    color: teacher.curator_class ? '#1e293b' : '#64748b'
                  }}>
                    {teacher.curator_class || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ 
                    fontWeight: 700,
                    color: '#2563eb',
                    fontSize: '1.125rem'
                  }}>
                    {tests.filter(test => test.teacher === teacher.id).length}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(teacher)}
                      sx={{
                        color: '#059669',
                        '&:hover': {
                          backgroundColor: '#ecfdf5',
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(teacher)}
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
      </div>

      {/* Add Teacher Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          O'qituvchi qo'shish
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
          <TextField
            margin="dense"
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
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ cursor: 'pointer' }}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ cursor: 'pointer' }}>
            O'qituvchi qo'shish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          O'qituvchi ma'lumotlarini tahrirlash
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
          <TextField
            margin="dense"
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
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ cursor: 'pointer' }}>
            Bekor qilish
          </Button>
          <Button onClick={handleEditSubmit} variant="contained" sx={{ cursor: 'pointer' }}>
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
          O'qituvchini o'chirishni tasdiqlang
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Haqiqatan ham ushbu o'qituvchini o'chirishni xohlaysizmi?
          </Typography>
          {teacherToDelete && (
            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', mb: 2 }}>
              <Typography variant="h6">{teacherToDelete.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                ID: {teacherToDelete.display_id || teacherToDelete.username}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Fanlar: {teacherToDelete.subjects?.join(', ') || 'Aniqlanmagan'}
              </Typography>
            </Paper>
          )}
          <Alert severity="warning">
            <strong>E'tibor:</strong> Bu amal qaytarib bo'lmaydi. O'qituvchi va uning yaratgan testlari o'chiriladi.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={() => handleDelete(teacherToDelete.id)}
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

export default ManageTeachers;