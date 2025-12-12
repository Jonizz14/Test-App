import React, { useState, useEffect } from 'react';
import {Typography,
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
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Avatar,
  Tabs,
  Tab,
  Collapse,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Block as BlockIcon, CheckCircle as CheckCircleIcon, Search as SearchIcon, Info as InfoIcon, Group as GroupIcon, KeyboardArrowUp as KeyboardArrowUpIcon, KeyboardArrowDown as KeyboardArrowDownIcon, FileDownload as FileDownloadIcon, FileUpload as FileUploadIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';
import * as XLSX from 'xlsx';

const ManageStudents = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [expandedClasses, setExpandedClasses] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const generateStudentId = (firstName, lastName, classGroup, direction, randomDigits) => {
    // Create ID like: TO'XTAYEVJT9-03N478@test (LASTNAMEFIRSTINITIALTGRADE_DIRECTION_RANDOM@test)
    const lastNameUpper = lastName.toUpperCase().replace("'", '');
    const firstNameInitial = firstName.charAt(0).toUpperCase();
    // Extract grade from class like "9-01-A" -> "901"
    const grade = classGroup.split('-').slice(0, 2).join('');
    const directionCode = direction === 'natural' ? 'N' : 'E';
    return `${lastNameUpper}${firstNameInitial}T${grade}${directionCode}${randomDigits}@test`;
  };

  const generateStudentUsername = (firstName, lastName, classGroup, direction) => {
    // Create valid username: ahmedova501n (lowercase, replace - with empty)
    const lastNameLower = lastName.toLowerCase();
    const firstNameInitial = firstName.charAt(0).toLowerCase();
    // Extract class code from class like "9-01-A" -> "901"
    const classCode = classGroup.split('-').slice(0, 2).join('');
    const directionCode = direction === 'natural' ? 'n' : 'e';
    return `${lastNameLower}${firstNameInitial}${classCode}${directionCode}`;
  };

  const generateStudentEmail = (firstName, lastName, classGroup, direction) => {
    // Create valid email: ahmedova501n@student.testplatform.com
    const username = generateStudentUsername(firstName, lastName, classGroup, direction);
    return `${username}@student.testplatform.com`;
  };

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

  const handleDelete = async (studentId) => {
    try {
      await apiService.deleteUser(studentId);
      // Remove from local state
      setStudents(students.filter(student => student.id !== studentId));
      // Reload data to refresh the view
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
      console.error('Failed to delete student:', error);
    }
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (student) => {
    // Navigate to edit student page (we'll create this later)
    navigate(`/admin/edit-student/${student.id}`);
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
    } catch (error) {
      console.error('Failed to ban student:', error);
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
    } catch (error) {
      console.error('Failed to unban student:', error);
    }
  };

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = students.map((student, index) => ({
      '№': index + 1,
      'Ism': student.name || '',
      'Familiya': student.name ? student.name.split(' ').slice(1).join(' ') : '',
      'Sinf': student.class_group || '',
      'Yo\'nalish': getDirectionLabel(student.direction),
      'Testlar soni': getStudentAttemptCount(student.id),
      'O\'rtacha ball': getStudentAverageScore(student.id),
      'Status': student.is_banned ? 'Bloklangan' : 'Faol',
      'Ro\'yxatdan o\'tgan sana': student.registration_date ? new Date(student.registration_date).toLocaleDateString('uz-UZ') : '',
      'Oxirgi faollik': getStudentLastActivity(student.id) || '',
      'Display ID': student.display_id || student.username || ''
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 5 },  // №
      { wch: 15 }, // Ism
      { wch: 15 }, // Familiya
      { wch: 10 }, // Sinf
      { wch: 15 }, // Yo'nalish
      { wch: 12 }, // Testlar soni
      { wch: 12 }, // O'rtacha ball
      { wch: 10 }, // Status
      { wch: 15 }, // Ro'yxatdan o'tgan sana
      { wch: 15 }, // Oxirgi faollik
      { wch: 20 }  // Display ID
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'O\'quvchilar');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `oquvchilar_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  const handleImportFromExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('Excel faylda ma\'lumotlar topilmadi');
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const row of jsonData) {
        try {
          // Handle simple 4-column format: №, Ism, Familiya, Sinf
          const rowIndex = jsonData.indexOf(row) + 2; // +2 because Excel rows start at 1 and we skip header

          // Get values - could be by column name or by position
          let firstName, lastName, classGroup;

          if (row.Ism && row.Familiya && row.Sinf) {
            // Named columns
            firstName = row.Ism;
            lastName = row.Familiya;
            classGroup = row.Sinf;
          } else {
            // Try positional access (assuming order: №, Ism, Familiya, Sinf)
            const values = Object.values(row);
            if (values.length >= 4) {
              firstName = values[1]; // Index 1 = Ism
              lastName = values[2];  // Index 2 = Familiya
              classGroup = values[3]; // Index 3 = Sinf
            }
          }

          // Validate required fields
          if (!firstName || !lastName || !classGroup) {
            errors.push(`Qator ${rowIndex}: Ism, Familiya va Sinf maydonlari majburiy`);
            errorCount++;
            continue;
          }

          const fullName = `${firstName} ${lastName}`;
          const direction = classGroup.endsWith('-A') ? 'exact' : classGroup.endsWith('-T') ? 'natural' : 'natural';

          // Generate credentials
          const randomDigits = Math.floor(Math.random() * 900) + 100;
          const displayId = generateStudentId(firstName, lastName, classGroup, direction, randomDigits);
          const username = generateStudentUsername(firstName, lastName, classGroup, direction);
          const email = generateStudentEmail(firstName, lastName, classGroup, direction);

          // Check if student already exists
          const existingStudent = students.find(s => s.username === username);
          if (existingStudent) {
            errors.push(`Qator ${rowIndex}: ${fullName} - bu o'quvchi allaqachon mavjud`);
            errorCount++;
            continue;
          }

          // Create student
          const studentData = {
            username: displayId,
            email: email,
            password: displayId,
            name: fullName,
            role: 'student',
            class_group: classGroup,
            direction: direction,
            registration_date: row['Ro\'yxatdan o\'tgan sana'] ? new Date(row['Ro\'yxatdan o\'tgan sana']).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          };

          await apiService.post('/users/', studentData);
          successCount++;

        } catch (error) {
          errors.push(`Qator ${jsonData.indexOf(row) + 2}: ${error.message || 'Xatolik'}`);
          errorCount++;
        }
      }

      // Reload data
      const [allUsers, allAttempts] = await Promise.all([
        apiService.getUsers(),
        apiService.getAttempts()
      ]);
      const allStudents = allUsers.filter(user => user.role === 'student');
      setStudents(allStudents);
      setAttempts(allAttempts.results || allAttempts);

      // Show results
      let message = `Import yakunlandi!\nMuvaffaqiyatli: ${successCount}\nXatoliklar: ${errorCount}`;
      if (errors.length > 0) {
        message += '\n\nXatoliklar:\n' + errors.slice(0, 5).join('\n');
        if (errors.length > 5) {
          message += `\n...va yana ${errors.length - 5} ta xatolik`;
        }
      }
      alert(message);

    } catch (error) {
      console.error('Import error:', error);
      alert('Excel faylini o\'qishda xatolik yuz berdi: ' + error.message);
    }

    // Clear file input
    event.target.value = '';
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
    // Match curator class with student class (ignoring direction suffix)
    // e.g., curator_class "9-03" should match "9-03-A", "9-03-T", etc.
    const baseClass = classGroup.split('-').slice(0, 2).join('-'); // Extract "9-03" from "9-03-A"
    return teachers.find(teacher => teacher.curator_class === baseClass);
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/add-student')}
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
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => setImportDialogOpen(true)}
            sx={{
              borderColor: '#7c3aed',
              color: '#7c3aed',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: '#faf5ff',
                borderColor: '#7c3aed'
              }
            }}
          >
            Excel fayldan import
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => setExportDialogOpen(true)}
            sx={{
              borderColor: '#059669',
              color: '#059669',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: '#ecfdf5',
                borderColor: '#059669'
              }
            }}
          >
            Excel faylga export
          </Button>
        </Box>
      </Box>


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
                  // Students tab columns with fixed widths
                  <>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 3, width: '30%' }}>O'quvchi</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', width: '12%' }}>Sinf</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', width: '15%' }}>Yo'nalish</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', width: '12%' }}>Test urinishlari</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', width: '12%' }}>O'rtacha ball</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', width: '10%' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', width: '9%' }}>Amallar</TableCell>
                  </>
                ) : (
                  // Classes tab columns with fixed widths
                  <>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 3, width: '25%' }}>Sinf</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', width: '20%' }}>Sinf rahbari</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', width: '15%' }}>O'quvchilar soni</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', width: '15%' }}>Jami testlar</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', width: '15%' }}>O'rtacha ball</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', width: '10%' }}>Amallar</TableCell>
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
                            <Typography sx={{
                              fontWeight: 600,
                              color: '#1e293b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '200px'
                            }}>
                              {student.name}
                            </Typography>
                            <Typography sx={{
                              color: '#64748b',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '200px'
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
                          <Tooltip title="Batafsil">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/student-details/${student.id}`)}
                              sx={{
                                color: '#2563eb',
                                '&:hover': {
                                  backgroundColor: '#eff6ff',
                                }
                              }}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
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
                    const isExpanded = expandedClasses.has(classGroup);

                    return (
                      <React.Fragment key={classGroup}>
                        <TableRow sx={{
                          '&:hover': {
                            backgroundColor: '#f8fafc'
                          }
                        }}>
                          <TableCell sx={{ py: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <GroupIcon sx={{ color: '#64748b', mr: 1 }} />
                                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                                  {classGroup}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => toggleClassExpansion(classGroup)}
                                sx={{
                                  ml: 1,
                                  transition: 'transform 0.3s ease-in-out',
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  '&:hover': {
                                    backgroundColor: '#f1f5f9'
                                  }
                                }}
                              >
                                <KeyboardArrowDownIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {curator ? (
                              <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>
                                {curator.name}
                              </Typography>
                            ) : (
                              <Typography sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.875rem' }}>
                                Rahbar yo'q
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>
                              {stats.totalStudents}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>
                              {stats.totalAttempts}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>
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

                        {/* Expanded students list with smooth animation */}
                        <TableRow>
                          <TableCell colSpan={6} sx={{ p: 0 }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{
                                backgroundColor: '#f8fafc',
                                borderLeft: '4px solid #2563eb',
                                borderRadius: '0 0 8px 8px',
                                overflow: 'hidden'
                              }}>
                                <Table size="small" sx={{ minWidth: '100%' }}>
                                  <TableHead>
                                    <TableRow sx={{ backgroundColor: '#e2e8f0' }}>
                                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 2, fontSize: '0.875rem' }}>O'quvchi</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>Yo'nalish</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>Testlar</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>O'rtacha ball</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>Status</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>Amallar</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {classStudents.length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={6} sx={{ textAlign: 'center', py: 2, color: '#64748b' }}>
                                          Bu sinfda o'quvchilar mavjud emas
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      classStudents.map((student) => (
                                        <TableRow key={student.id} sx={{
                                          '&:hover': {
                                            backgroundColor: '#e2e8f0'
                                          }
                                        }}>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                              {student.is_premium && student.profile_photo_url ? (
                                                <Avatar
                                                  src={student.profile_photo_url}
                                                  sx={{
                                                    width: 32,
                                                    height: 32,
                                                    border: '2px solid #e2e8f0',
                                                    mr: 1
                                                  }}
                                                  imgProps={{
                                                    style: { objectFit: 'cover' }
                                                  }}
                                                />
                                              ) : (
                                                <Box sx={{
                                                  width: 32,
                                                  height: 32,
                                                  borderRadius: '50%',
                                                  backgroundColor: '#f1f5f9',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  border: '2px solid #e2e8f0',
                                                  mr: 1
                                                }}>
                                                  <Typography sx={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: '#64748b'
                                                  }}>
                                                    {student.name ? student.name.charAt(0) : 'S'}
                                                  </Typography>
                                                </Box>
                                              )}
                                              <Box>
                                                <Typography sx={{
                                                  fontWeight: 600,
                                                  color: '#1e293b',
                                                  fontSize: '0.875rem',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  whiteSpace: 'nowrap',
                                                  maxWidth: '150px'
                                                }}>
                                                  {student.name}
                                                </Typography>
                                                <Typography sx={{
                                                  color: '#64748b',
                                                  fontSize: '0.75rem',
                                                  fontFamily: 'monospace',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  whiteSpace: 'nowrap',
                                                  maxWidth: '150px'
                                                }}>
                                                  {student.display_id || student.username}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </TableCell>
                                          <TableCell>
                                            <Chip
                                              label={getDirectionLabel(student.direction)}
                                              size="small"
                                              sx={{
                                                backgroundColor: student.direction === 'natural' ? '#ecfdf5' : '#eff6ff',
                                                color: student.direction === 'natural' ? '#059669' : '#2563eb',
                                                fontWeight: 600,
                                                fontSize: '0.75rem'
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>
                                              {getStudentAttemptCount(student.id)}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>
                                              {getStudentAverageScore(student.id)}%
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography sx={{
                                              color: student.is_banned ? '#dc2626' : '#059669',
                                              fontWeight: 600,
                                              fontSize: '0.875rem'
                                            }}>
                                              {student.is_banned ? 'Bloklangan' : 'Faol'}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                              <Tooltip title="Batafsil">
                                                <IconButton
                                                  size="small"
                                                  onClick={() => navigate(`/admin/student-details/${student.id}`)}
                                                  sx={{
                                                    color: '#2563eb',
                                                    '&:hover': {
                                                      backgroundColor: '#eff6ff',
                                                    }
                                                  }}
                                                >
                                                  <InfoIcon />
                                                </IconButton>
                                              </Tooltip>
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
                                    )}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>


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

      {/* Import Instructions Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: '#7c3aed', fontWeight: 700 }}>
          Excel fayldan import qilish
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            O'quvchilarni Excel fayldan import qilish uchun fayl quyidagi formatda bo'lishi kerak:
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Fayl formati:</strong> .xlsx (Excel 2007 va undan keyingi versiyalar)
          </Alert>

          <Typography variant="h6" sx={{ mb: 2, color: '#1e293b' }}>
            Excel fayl namunasi:
          </Typography>

          <Paper sx={{ p: 2, backgroundColor: '#f8fafc', mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#e2e8f0' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>№</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Ism</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Familiya</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Sinf</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Ro'yxatdan o'tgan sana (ixtiyoriy)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.875rem' }}>1</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Ahmad</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Karimov</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>9-01-A</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>2024-09-01</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.875rem' }}>2</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Malika</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Toshmatova</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>9-01-T</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>2024-09-01</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.875rem' }}>3</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Jasur</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Rahimov</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>10-02-A</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
            <strong>Izohlar:</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3, color: '#64748b' }}>
            <li>Sinf formati: "9-01-A" (9-sinf, 01-sinf raqami, A-aniq fanlar) yoki "9-01-T" (T-tabiiy fanlar)</li>
            <li>Sana formati: YYYY-MM-DD (masalan: 2024-09-01)</li>
            <li>Sana maydoni ixtiyoriy, agar bo'lmasa bugungi sana qo'yiladi</li>
            <li>Har bir qator uchun o'quvchi yaratiladi va avtomatik ID beriladi</li>
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>E'tibor:</strong> Import jarayonida mavjud o'quvchilar tekshiriladi. Agar o'quvchi allaqachon mavjud bo'lsa, u o'tkazib yuboriladi.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            component="label"
            sx={{
              backgroundColor: '#7c3aed',
              '&:hover': {
                backgroundColor: '#6d28d9'
              }
            }}
          >
            Fayl tanlash (.xlsx)
            <input
              type="file"
              accept=".xlsx"
              hidden
              onChange={(event) => {
                setImportDialogOpen(false);
                handleImportFromExcel(event);
              }}
            />
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Preview Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ color: '#059669', fontWeight: 700 }}>
          Excel faylga export qilish
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Quyidagi ma'lumotlar Excel faylga export qilinadi. Jami {students.length} ta o'quvchi.
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: '#1e293b' }}>
            Export qilinadigan ma'lumotlar namunasi:
          </Typography>

          <Paper sx={{ p: 2, backgroundColor: '#f8fafc', mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#e2e8f0' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>№</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Ism</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Familiya</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Sinf</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Yo'nalish</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Testlar soni</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>O'rtacha ball</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Ro'yxatdan o'tgan sana</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Oxirgi faollik</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Display ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.slice(0, 5).map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{index + 1}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{student.name || ''}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{student.name ? student.name.split(' ').slice(1).join(' ') : ''}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{student.class_group || ''}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{getDirectionLabel(student.direction)}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{getStudentAttemptCount(student.id)}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{getStudentAverageScore(student.id)}%</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{student.is_banned ? 'Bloklangan' : 'Faol'}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{student.registration_date ? new Date(student.registration_date).toLocaleDateString('uz-UZ') : ''}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{getStudentLastActivity(student.id) || ''}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{student.display_id || student.username || ''}</TableCell>
                  </TableRow>
                ))}
                {students.length > 5 && (
                  <TableRow>
                    <TableCell colSpan={11} sx={{ textAlign: 'center', fontStyle: 'italic', color: '#64748b', fontSize: '0.875rem' }}>
                      ...va yana {students.length - 5} ta o'quvchi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>

          <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
            <strong>Export fayl haqida:</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3, color: '#64748b' }}>
            <li>Fayl nomi: oquvchilar_[bugungi_sana].xlsx</li>
            <li>Barcha o'quvchilar ma'lumotlari kiritiladi</li>
            <li>Sana format: DD.MM.YYYY (masalan: 01.09.2024)</li>
            <li>Ballar foizda ko'rsatiladi</li>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Eslatma:</strong> Export qilish uchun "Export qilish" tugmasini bosing. Fayl avtomatik tarzda yuklab olinadi.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setExportDialogOpen(false);
              handleExportToExcel();
            }}
            sx={{
              backgroundColor: '#059669',
              '&:hover': {
                backgroundColor: '#047857'
              }
            }}
          >
            Export qilish
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ManageStudents;
