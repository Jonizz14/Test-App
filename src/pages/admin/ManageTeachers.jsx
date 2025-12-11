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
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon, Info as InfoIcon, FileDownload as FileDownloadIcon, FileUpload as FileUploadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';
import * as XLSX from 'xlsx';

const ManageTeachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [tests, setTests] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load teachers from API
        const allUsers = await apiService.getUsers();
        const allTeachers = allUsers.filter(user => user.role === 'teacher');
        setTeachers(allTeachers);

        // Load tests
        const allTests = await apiService.getTests();
        setTests(allTests);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
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

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = teachers.map((teacher, index) => ({
      '№': index + 1,
      'Ism': teacher.name || '',
      'Familiya': teacher.name ? teacher.name.split(' ').slice(1).join(' ') : '',
      'Fanlar': teacher.subjects ? teacher.subjects.join(', ') : '',
      'Kurator': teacher.is_curator ? 'Ha' : 'Yo\'q',
      'Kurator sinfi': teacher.curator_class || '',
      'Testlar soni': tests.filter(test => test.teacher === teacher.id).length,
      'Display ID': teacher.display_id || teacher.username || ''
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 5 },  // №
      { wch: 15 }, // Ism
      { wch: 15 }, // Familiya
      { wch: 20 }, // Fanlar
      { wch: 10 }, // Kurator
      { wch: 15 }, // Kurator sinfi
      { wch: 12 }, // Testlar soni
      { wch: 20 }  // Display ID
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'O\'qituvchilar');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `oqituvchilar_${currentDate}.xlsx`;

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
          // Handle simple format: №, Ism, Familiya, Fanlar, Kurator, Kurator sinfi
          const rowIndex = jsonData.indexOf(row) + 2; // +2 because Excel rows start at 1 and we skip header

          // Get values - could be by column name or by position
          let firstName, lastName, subjects, isCurator, curatorClass;

          if (row.Ism && row.Familiya && row.Fanlar) {
            // Named columns
            firstName = row.Ism;
            lastName = row.Familiya;
            subjects = row.Fanlar;
            isCurator = row.Kurator === 'Ha';
            curatorClass = row['Kurator sinfi'] || '';
          } else {
            // Try positional access
            const values = Object.values(row);
            if (values.length >= 4) {
              firstName = values[1]; // Index 1 = Ism
              lastName = values[2];  // Index 2 = Familiya
              subjects = values[3];  // Index 3 = Fanlar
              isCurator = values[4] === 'Ha'; // Index 4 = Kurator
              curatorClass = values[5] || ''; // Index 5 = Kurator sinfi
            }
          }

          // Validate required fields
          if (!firstName || !lastName || !subjects) {
            errors.push(`Qator ${rowIndex}: Ism, Familiya va Fanlar maydonlari majburiy`);
            errorCount++;
            continue;
          }

          const fullName = `${firstName} ${lastName}`;

          // Generate credentials
          const randomDigits = Math.floor(Math.random() * 900) + 100;
          const displayId = generateTeacherId(firstName, lastName, randomDigits);
          const username = generateTeacherUsername(firstName, lastName);
          const email = generateTeacherEmail(firstName, lastName);

          // Check if teacher already exists
          const existingTeacher = teachers.find(t => t.username === username);
          if (existingTeacher) {
            errors.push(`Qator ${rowIndex}: ${fullName} - bu o'qituvchi allaqachon mavjud`);
            errorCount++;
            continue;
          }

          // Create teacher
          const teacherData = {
            username: displayId,
            email: email,
            password: displayId,
            name: fullName,
            role: 'teacher',
            subjects: subjects.split(',').map(s => s.trim()),
            is_curator: isCurator,
            curator_class: isCurator ? curatorClass : null,
          };

          await apiService.post('/users/', teacherData);
          successCount++;

        } catch (error) {
          errors.push(`Qator ${jsonData.indexOf(row) + 2}: ${error.message || 'Xatolik'}`);
          errorCount++;
        }
      }

      // Reload data
      const [allUsers, allTests] = await Promise.all([
        apiService.getUsers(),
        apiService.getTests()
      ]);
      const allTeachers = allUsers.filter(user => user.role === 'teacher');
      setTeachers(allTeachers);
      setTests(allTests);

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
    navigate(`/admin/edit-teacher/${teacher.id}`);
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
          O'qituvchilarni boshqarish
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          O'qituvchilar ma'lumotlarini boshqaring
        </Typography>
      </Box>

      {/* Search and Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="O'qituvchi nomini qidirish..."
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
            onClick={() => navigate('/admin/add-teacher')}
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
            O'qituvchi qo'shish
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
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
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
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
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 4 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {searchTerm && (
        <Typography sx={{ mb: 2, color: '#64748b', fontSize: '0.875rem' }}>
          {filteredTeachers.length} ta o'qituvchi topildi
        </Typography>
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
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/admin/teacher-details/${teacher.id}`)}
                      startIcon={<InfoIcon />}
                      sx={{
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        minWidth: 'auto',
                        borderColor: '#2563eb',
                        color: '#2563eb',
                        '&:hover': {
                          backgroundColor: '#eff6ff',
                          borderColor: '#1d4ed8',
                        }
                      }}
                    >
                      Batafsil
                    </Button>
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
            O'qituvchilarni Excel fayldan import qilish uchun fayl quyidagi formatda bo'lishi kerak:
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
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Fanlar</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Kurator</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Kurator sinfi (ixtiyoriy)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.875rem' }}>1</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Ahmad</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Karimov</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Matematika, Fizika</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Ha</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>9-01-A</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.875rem' }}>2</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Malika</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Toshmatova</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Kimyo, Biologiya</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Yo'q</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
            <strong>Izohlar:</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3, color: '#64748b' }}>
            <li>Fanlar vergul bilan ajratilgan bo'lishi kerak</li>
            <li>Kurator maydoni: "Ha" yoki "Yo'q"</li>
            <li>Kurator sinfi faqat kurator bo'lsa to'ldiriladi</li>
            <li>Har bir qator uchun o'qituvchi yaratiladi va avtomatik ID beriladi</li>
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>E'tibor:</strong> Import jarayonida mavjud o'qituvchilar tekshiriladi. Agar o'qituvchi allaqachon mavjud bo'lsa, u o'tkazib yuboriladi.
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
            Quyidagi ma'lumotlar Excel faylga export qilinadi. Jami {teachers.length} ta o'qituvchi.
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
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Fanlar</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Kurator</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Kurator sinfi</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Testlar soni</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Display ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teachers.slice(0, 5).map((teacher, index) => (
                  <TableRow key={teacher.id}>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{index + 1}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{teacher.name || ''}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{teacher.name ? teacher.name.split(' ').slice(1).join(' ') : ''}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{teacher.subjects ? teacher.subjects.join(', ') : ''}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{teacher.is_curator ? 'Ha' : 'Yo\'q'}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{teacher.curator_class || ''}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{tests.filter(test => test.teacher === teacher.id).length}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{teacher.display_id || teacher.username || ''}</TableCell>
                  </TableRow>
                ))}
                {teachers.length > 5 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', fontStyle: 'italic', color: '#64748b', fontSize: '0.875rem' }}>
                      ...va yana {teachers.length - 5} ta o'qituvchi
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
            <li>Fayl nomi: oqituvchilar_[bugungi_sana].xlsx</li>
            <li>Barcha o'qituvchilar ma'lumotlari kiritiladi</li>
            <li>Fanlar vergul bilan ajratilgan</li>
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