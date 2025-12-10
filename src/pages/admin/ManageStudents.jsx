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
  Avatar,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Block as BlockIcon, CheckCircle as CheckCircleIcon, Edit as EditIcon, Search as SearchIcon, Info as InfoIcon, Save as SaveIcon, Cancel as CancelIcon, Group as GroupIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

const ManageStudents = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [expandedClasses, setExpandedClasses] = useState(new Set());
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allUsers, allAttempts] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts()
        ]);
        const allStudents = allUsers.filter(user => user.role === 'student');
        const allTeachers = allUsers.filter(user => user.role === 'teacher');
        setStudents(allStudents);
        setTeachers(allTeachers);
        setAttempts(allAttempts.results || allAttempts);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
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
      const [allUsers, allAttempts] = await Promise.all([
        apiService.getUsers(),
        apiService.getAttempts()
      ]);
      const allStudents = allUsers.filter(user => user.role === 'student');
      const allTeachers = allUsers.filter(user => user.role === 'teacher');
      setStudents(allStudents);
      setTeachers(allTeachers);
      setAttempts(allAttempts.results || allAttempts);
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
      const [allUsers, allAttempts] = await Promise.all([
        apiService.getUsers(),
        apiService.getAttempts()
      ]);
      const allStudents = allUsers.filter(user => user.role === 'student');
      const allTeachers = allUsers.filter(user => user.role === 'teacher');
      setStudents(allStudents);
      setTeachers(allTeachers);
      setAttempts(allAttempts.results || allAttempts);
      setSuccess('O\'quvchi muvaffaqiyatli blokdan chiqarildi!');
    } catch (error) {
      console.error('Failed to unban student:', error);
      setError('O\'quvchini blokdan chiqarishda xatolik yuz berdi');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      class_group: item.class_group || '',
      direction: item.direction || 'natural',
      is_banned: item.is_banned || false,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async () => {
    try {
      await apiService.put(`/users/${editingId}/`, editData);
      // Reload data
      const [allUsers, allAttempts] = await Promise.all([
        apiService.getUsers(),
        apiService.getAttempts()
      ]);
      const allStudents = allUsers.filter(user => user.role === 'student');
      setStudents(allStudents);
      setAttempts(allAttempts.results || allAttempts);
      setEditingId(null);
      setEditData({});
      setSuccess('Ma\'lumotlar muvaffaqiyatli saqlandi');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
      setError('Saqlashda xatolik yuz berdi');
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const getStudentLastActivity = (studentId) => {
    const studentAttempts = attempts.filter(attempt => attempt.student === studentId);
    if (studentAttempts.length === 0) return null;

    const lastAttempt = studentAttempts.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
    return new Date(lastAttempt.completed_at).toLocaleString('uz-UZ');
  };

  // Group students by class
  const groupStudentsByClass = () => {
    const classGroups = {};
    students.forEach(student => {
      const classGroup = student.class_group || 'Noma\'lum';
      if (!classGroups[classGroup]) {
        classGroups[classGroup] = [];
      }
      classGroups[classGroup].push(student);
    });
    return classGroups;
  };

  // Get class statistics
  const getClassStatistics = (classStudents) => {
    if (classStudents.length === 0) return { totalStudents: 0, averageScore: 0, totalAttempts: 0 };

    let totalScore = 0;
    let totalAttempts = 0;
    let studentsWithAttempts = 0;

    classStudents.forEach(student => {
      const studentAttempts = attempts.filter(attempt => attempt.student === student.id);
      totalAttempts += studentAttempts.length;

      if (studentAttempts.length > 0) {
        const studentAverage = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
        totalScore += studentAverage;
        studentsWithAttempts++;
      }
    });

    return {
      totalStudents: classStudents.length,
      averageScore: studentsWithAttempts > 0 ? Math.round(totalScore / studentsWithAttempts) : 0,
      totalAttempts: totalAttempts
    };
  };

  // Get class curator
  const getClassCurator = (classGroup) => {
    return teachers.find(teacher => teacher.curator_class === classGroup);
  };

  // Toggle class expansion
  const toggleClassExpansion = (classGroup) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classGroup)) {
      newExpanded.delete(classGroup);
    } else {
      newExpanded.add(classGroup);
    }
    setExpandedClasses(newExpanded);
  };

  const classGroups = groupStudentsByClass();
  const sortedClasses = Object.keys(classGroups).sort();

  // Filter students and classes based on search term
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const name = student.name || '';
    const displayId = student.display_id || student.username || '';

    return name.toLowerCase().includes(searchLower) ||
           displayId.toLowerCase().includes(searchLower);
  });

  const filteredClasses = sortedClasses.filter(classGroup => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const classStudents = classGroups[classGroup];

    // Check class name
    if (classGroup.toLowerCase().includes(searchLower)) return true;

    // Check curator name
    const curator = getClassCurator(classGroup);
    if (curator && curator.name && curator.name.toLowerCase().includes(searchLower)) return true;

    // Check student names
    return classStudents.some(student => {
      const name = student.name || '';
      const displayId = student.display_id || student.username || '';
      return name.toLowerCase().includes(searchLower) || displayId.toLowerCase().includes(searchLower);
    });
  });

  return (
    <Box sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Typography
          sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 2
          }}
        >
          O'quvchilarni boshqarish
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          O'quvchilar va sinflar ma'lumotlarini boshqaring
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              minHeight: 48,
              color: '#64748b',
              '&.Mui-selected': {
                color: '#2563eb',
              }
            }
          }}
        >
          <Tab label="👥 O'quvchilar" />
          <Tab label="🏫 Sinflar" />
        </Tabs>
      </Box>

      {/* Search and Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="O'quvchi yoki sinf nomini qidirish..."
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
            mr: 2,
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
            whiteSpace: 'nowrap',
            '&:hover': {
              backgroundColor: '#1d4ed8',
            }
          }}
        >
          O'quvchi qo'shish
        </Button>
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

      {/* Data Table */}
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
                {activeTab === 0 ? (
                  // Students tab columns
                  <>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 3 }}>O'quvchi</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Sinf</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Yo'nalish</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Test urinishlari</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>O'rtacha ball</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Amallar</TableCell>
                  </>
                ) : (
                  // Classes tab columns
                  <>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 3 }}>Sinf</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Sinf rahbari</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>O'quvchilar soni</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Jami testlar</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>O'rtacha ball</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Amallar</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {activeTab === 0 ? (
                // Students tab content
                filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                      O'quvchilar mavjud emas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} sx={{
                      '&:hover': {
                        backgroundColor: '#f8fafc'
                      }
                    }}>
                      <TableCell sx={{ py: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {student.is_premium && student.profile_photo_url ? (
                            <Avatar
                              src={student.profile_photo_url}
                              sx={{
                                width: 40,
                                height: 40,
                                border: '2px solid #e2e8f0',
                                mr: 2
                              }}
                              imgProps={{
                                style: { objectFit: 'cover' }
                              }}
                            />
                          ) : (
                            <Box sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              backgroundColor: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #e2e8f0',
                              mr: 2
                            }}>
                              <Typography sx={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#64748b'
                              }}>
                                {student.name ? student.name.charAt(0) : 'S'}
                              </Typography>
                            </Box>
                          )}
                          <Box>
                            <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {student.name}
                            </Typography>
                            <Typography sx={{ 
                              color: '#64748b', 
                              fontSize: '0.75rem',
                              fontFamily: 'monospace'
                            }}>
                              {student.display_id || student.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                          {student.class_group || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getDirectionLabel(student.direction)}
                          size="small"
                          sx={{
                            backgroundColor: student.direction === 'natural' ? '#ecfdf5' : '#eff6ff',
                            color: student.direction === 'natural' ? '#059669' : '#2563eb',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                          {getStudentAttemptCount(student.id)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                          {getStudentAverageScore(student.id)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{
                          color: student.is_banned ? '#dc2626' : '#059669',
                          fontWeight: 600
                        }}>
                          {student.is_banned ? 'Bloklangan' : 'Faol'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/admin/student-details/${student.id}`)}
                            startIcon={<InfoIcon />}
                            sx={{
                              borderColor: '#2563eb',
                              color: '#2563eb',
                              '&:hover': {
                                backgroundColor: '#eff6ff',
                                borderColor: '#2563eb'
                              }
                            }}
                          >
                            Batafsil
                          </Button>
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
                  ))
                )
              ) : (
                // Classes tab content
                filteredClasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                      Sinflar mavjud emas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClasses.map((classGroup) => {
                    const classStudents = classGroups[classGroup];
                    const stats = getClassStatistics(classStudents);
                    const curator = getClassCurator(classGroup);

                    return (
                      <TableRow key={classGroup} sx={{
                        '&:hover': {
                          backgroundColor: '#f8fafc'
                        }
                      }}>
                        <TableCell sx={{ py: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <GroupIcon sx={{ color: '#64748b', mr: 1 }} />
                            <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {classGroup}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {curator ? (
                            <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                              {curator.name}
                            </Typography>
                          ) : (
                            <Typography sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                              Rahbar yo'q
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                            {stats.totalStudents}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                            {stats.totalAttempts}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                            {stats.averageScore}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/admin/class-details/${classGroup}`)}
                            startIcon={<InfoIcon />}
                            sx={{
                              borderColor: '#2563eb',
                              color: '#2563eb',
                              '&:hover': {
                                backgroundColor: '#eff6ff',
                                borderColor: '#2563eb'
                              }
                            }}
                          >
                            Batafsil
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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