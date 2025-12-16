import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Badge,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Bookmark as BookmarkIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import SendLessonModal from '../../components/SendLessonModal';
import TodoList from '../../components/TodoList';

const MyTests = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [testAttempts, setTestAttempts] = useState({});
  const [students, setStudents] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [studentDetailDialogOpen, setStudentDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [testDetailsModalOpen, setTestDetailsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGrade, setFilterGrade] = useState('');
  const [todoTasks, setTodoTasks] = useState([]);

  useEffect(() => {
    loadData();
    // Load saved todo tasks from localStorage
    const savedTasks = localStorage.getItem('teacher-todo-tasks');
    if (savedTasks) {
      setTodoTasks(JSON.parse(savedTasks));
    }
  }, []);

  const handleOpenTestDetails = (test) => {
    setSelectedTest(test);
    setTestDetailsModalOpen(true);
  };

  const handleCloseTestDetails = () => {
    setTestDetailsModalOpen(false);
    setSelectedTest(null);
  };

  const loadData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) setRefreshing(true);
      else setLoading(true);

      // Load tests from API
      const response = await apiService.getTests({ teacher: currentUser.id });
      const teacherTests = response.results || response;
      const teacherTestsFiltered = teacherTests.filter(test =>
        test.teacher === currentUser.id
      ).map(test => {
        let parsedGrades = [];
        if (Array.isArray(test.target_grades)) {
          parsedGrades = test.target_grades;
        } else if (typeof test.target_grades === 'string') {
          try {
            parsedGrades = JSON.parse(test.target_grades);
            if (!Array.isArray(parsedGrades)) {
              parsedGrades = [parsedGrades];
            }
          } catch {
            // If not JSON, treat as comma separated
            parsedGrades = test.target_grades.split(',').map(g => g.trim()).filter(g => g);
          }
        }
        return {
          ...test,
          target_grades: parsedGrades
        };
      });
      setTests(teacherTestsFiltered);

      // Load all users to get student information
      const usersResponse = await apiService.getUsers();
      const allUsers = usersResponse.results || usersResponse;
      const studentUsers = allUsers.filter(user => user.role === 'student');
      setStudents(studentUsers);

      // Load all attempts to calculate statistics
      const attemptsResponse = await apiService.getAttempts();
      const allAttempts = attemptsResponse.results || attemptsResponse;
      
      // Group attempts by test for quick lookup
      const attemptsByTest = {};
      allAttempts.forEach(attempt => {
        if (!attemptsByTest[attempt.test]) {
          attemptsByTest[attempt.test] = [];
        }
        attemptsByTest[attempt.test].push(attempt);
      });
      setTestAttempts(attemptsByTest);

      console.log('Loaded data:', {
        tests: teacherTestsFiltered.length,
        students: studentUsers.length,
        attempts: allAttempts.length
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      setSnackbar({
        open: true,
        message: 'Ma\'lumotlarni yuklashda xatolik yuz berdi',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTestStats = (testId) => {
    const attempts = testAttempts[testId] || [];
    const uniqueStudents = new Set(attempts.map(a => a.student)).size;
    const averageScore = attempts.length > 0 
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
      : 0;
    const maxScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0;
    
    return {
      totalAttempts: attempts.length,
      uniqueStudents,
      averageScore,
      maxScore,
      completionRate: Math.round((uniqueStudents / students.length) * 100) || 0
    };
  };

  const getStudentDetails = (testId) => {
    const attempts = testAttempts[testId] || [];
    return attempts.map(attempt => {
      const student = students.find(s => s.id === attempt.student);
      return {
        ...attempt,
        studentName: student?.name || 'Noma\'lum o\'quvchi',
        studentId: student?.display_id || student?.username || 'N/A'
      };
    }).sort((a, b) => b.score - a.score); // Sort by score descending
  };

  const handleDeleteTest = (test) => {
    setSelectedTest(test);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTest) return;

    try {
      setLoading(true);
      
      await apiService.updateTest(selectedTest.id, { is_active: false });
      await apiService.deleteTest(selectedTest.id);

      setTests(prevTests => prevTests.filter(test => test.id !== selectedTest.id));
      
      setSnackbar({
        open: true,
        message: `"${selectedTest.title}" testi muvaffaqiyatli o'chirildi`,
        severity: 'success'
      });

      setDeleteDialogOpen(false);
      setSelectedTest(null);
      
      setTimeout(() => loadData(), 500);
      
    } catch (error) {
      console.error('Failed to delete test:', error);
      setSnackbar({
        open: true,
        message: 'Testni o\'chirishda xatolik yuz berdi',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTestStatus = async (testId) => {
    try {
      setLoading(true);
      
      const test = tests.find(t => t.id === testId);
      if (test) {
        const newStatus = !test.is_active;
        
        await apiService.updateTest(testId, { is_active: newStatus });
        
        setTests(prevTests => 
          prevTests.map(t => 
            t.id === testId ? { ...t, is_active: newStatus } : t
          )
        );
        
        setSnackbar({
          open: true,
          message: `Test ${newStatus ? 'faollashtirildi' : 'nofaollashtirildi'}`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Failed to toggle test status:', error);
      setSnackbar({
        open: true,
        message: 'Test holatini o\'zgartirishda xatolik yuz berdi',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentDetails = (test) => {
    setSelectedTest(test);
    setStudentDetailDialogOpen(true);
  };

  const handleOpenLessonModal = (student, attempt, test) => {
    setSelectedStudent(student);
    setSelectedAttempt({
      ...attempt,
      test: test
    });
    setSelectedTest(test);
    setLessonModalOpen(true);
  };

  const handleCloseLessonModal = () => {
    setLessonModalOpen(false);
    setSelectedStudent(null);
    setSelectedAttempt(null);
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'Matematika': 'primary',
      'Fizika': 'secondary',
      'Kimyo': 'success',
      'Biologiya': 'info',
      'Tarix': 'warning',
      'Geografiya': 'error',
      'O\'zbek tili': 'primary',
      'Ingliz tili': 'secondary',
      'Adabiyot': 'success',
      'Informatika': 'info',
    };
    return colors[subject] || 'default';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const handleTodoTasksChange = (tasks) => {
    setTodoTasks(tasks);
    localStorage.setItem('teacher-todo-tasks', JSON.stringify(tasks));
  };

  // Generate test-related todo suggestions
  const generateTestSuggestions = () => {
    const suggestions = [];
    
    tests.forEach(test => {
      const stats = getTestStats(test.id);
      if (stats.averageScore < 60) {
        suggestions.push({
          id: `suggestion-${test.id}-1`,
          text: `"${test.title}" testi uchun o'quvchilarga qo'shimcha dars tashkil qiling`,
          completed: false,
          priority: 'high',
          createdAt: new Date().toISOString(),
          type: 'suggestion'
        });
      }
      if (stats.completionRate < 50) {
        suggestions.push({
          id: `suggestion-${test.id}-2`,
          text: `"${test.title}" testini ko'proq o'quvchilarga tarqating`,
          completed: false,
          priority: 'medium',
          createdAt: new Date().toISOString(),
          type: 'suggestion'
        });
      }
      if (!test.is_active) {
        suggestions.push({
          id: `suggestion-${test.id}-3`,
          text: `"${test.title}" testini qayta faollashtiring yoki o'chiring`,
          completed: false,
          priority: 'low',
          createdAt: new Date().toISOString(),
          type: 'suggestion'
        });
      }
    });

    return suggestions;
  };

  const addTestSuggestions = () => {
    const suggestions = generateTestSuggestions();
    const existingIds = todoTasks.map(task => task.id);
    const newSuggestions = suggestions.filter(suggestion => !existingIds.includes(suggestion.id));
    
    if (newSuggestions.length > 0) {
      const updatedTasks = [...todoTasks, ...newSuggestions];
      setTodoTasks(updatedTasks);
      localStorage.setItem('teacher-todo-tasks', JSON.stringify(updatedTasks));
    }
  };

  // Compute filtered and sorted tests
  const uniqueSubjects = [...new Set(tests.map(test => test.subject))];
  const filteredTests = tests.filter(test => {
    if (filterSubject && test.subject !== filterSubject) return false;
    if (filterStatus === 'active' && !test.is_active) return false;
    if (filterStatus === 'inactive' && test.is_active) return false;

    // Class filter - check if test is for the selected grade
    if (filterGrade) {
      // If test has no target grades, it should be included (available to all grades)
      if (!test.target_grades || test.target_grades.length === 0) return true;

      // Check if any of the test's target grades match the selected grade
      const hasMatchingGrade = test.target_grades.some(grade => {
        // Handle different grade formats: "9", "9-A", "9-01", etc.
        const gradeStr = String(grade).trim();
        const filterNum = filterGrade;

        // Debug logging (remove in production)
        console.log(`Checking test "${test.title}": grade "${gradeStr}" against filter "${filterNum}"`);

        return gradeStr === filterNum ||
               gradeStr.startsWith(filterNum + '-') ||
               gradeStr.startsWith(filterNum + ' ') ||
               gradeStr.split('-')[0] === filterNum ||
               gradeStr.split(' ')[0] === filterNum;
      });

      console.log(`Test "${test.title}" with grades ${JSON.stringify(test.target_grades)}: ${hasMatchingGrade ? 'INCLUDED' : 'FILTERED OUT'}`);

      if (!hasMatchingGrade) return false;
    }

    return true;
  });
  const sortedTests = [...filteredTests].sort((a, b) => {
    switch (sortBy) {
      case 'created_at':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'subject':
        return a.subject.localeCompare(b.subject);
      case 'class':
        // Sort by the minimum target grade number ascending, then by title
        const aMinGrade = a.target_grades.length > 0 ? Math.min(...a.target_grades.map(g => parseInt(g.split('-')[0]))) : 0;
        const bMinGrade = b.target_grades.length > 0 ? Math.min(...b.target_grades.map(g => parseInt(g.split('-')[0]))) : 0;
        if (aMinGrade !== bMinGrade) {
          return aMinGrade - bMinGrade;
        }
        return a.title.localeCompare(b.title);
      case 'average_score':
        return getTestStats(b.id).averageScore - getTestStats(a.id).averageScore;
      case 'attempts':
        return getTestStats(b.id).totalAttempts - getTestStats(a.id).totalAttempts;
      default:
        return 0;
    }
  });

  return (
    <Box sx={{
      width: '100%',
      py: 4,
      backgroundColor: '#ffffff'
    }}>
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 2
          }}>
            Mening testlarim ({sortedTests.length})
          </Typography>
          <Typography sx={{
            fontSize: '1.125rem',
            color: '#64748b',
            fontWeight: 400
          }}>
            Barcha testlaringizni boshqaring, o'quvchilarning natijalarini kuzating
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Tooltip title="Yangilash">
            <IconButton
              onClick={() => loadData(true)}
              disabled={refreshing}
              sx={{
                color: '#64748b',
                '&:hover': {
                  backgroundColor: '#f8fafc',
                  color: '#2563eb'
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/teacher/create-test')}
            sx={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none',
              minWidth: '200px',
              '&:hover': {
                backgroundColor: '#1d4ed8',
              }
            }}
          >
            Yangi test yaratish
          </Button>
        </Box>
      </Box>

      {/* Filters and Sort */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Sort qilish</InputLabel>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Sort qilish">
            <MenuItem value="created_at">Yangi avval</MenuItem>
            <MenuItem value="title">Sarlavha</MenuItem>
            <MenuItem value="subject">Fan</MenuItem>
            <MenuItem value="class">Sinf</MenuItem>
            <MenuItem value="average_score">O'rtacha ball</MenuItem>
            <MenuItem value="attempts">Urinishlar</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Fan</InputLabel>
          <Select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} label="Fan">
            <MenuItem value="">Barcha</MenuItem>
            {uniqueSubjects.map(sub => <MenuItem key={sub} value={sub}>{sub}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
            <MenuItem value="all">Barcha</MenuItem>
            <MenuItem value="active">Faol</MenuItem>
            <MenuItem value="inactive">Nofaol</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sinf</InputLabel>
          <Select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} label="Sinf">
            <MenuItem value="">Barcha</MenuItem>
            {Array.from({ length: 7 }, (_, i) => i + 5).map(g => (
              <MenuItem key={g} value={g}>{g}-sinf</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && sortedTests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ color: '#64748b' }}>Testlar yuklanmoqda...</Typography>
        </Box>
      ) : sortedTests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
          <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {tests.length === 0 ? 'Siz hali test yaratmagansiz' : 'Testlar topilmadi'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {tests.length === 0 ? '"Yangi test yaratish" tugmasini bosib boshlang' : 'Testlar mavjud emas'}
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Siz {sortedTests.length} ta test yaratgansiz
          </Alert>
        <TableContainer component={Paper} sx={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'auto',
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
                <TableCell>Sinflar</TableCell>
                <TableCell>Savollar</TableCell>
                <TableCell>Vaqt</TableCell>
                <TableCell>O'quvchilar</TableCell>
                <TableCell>O'rtacha ball</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Harakatlar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTests.map((test) => {
                const stats = getTestStats(test.id);
                return (
                  <TableRow 
                    key={test.id} 
                    sx={{
                      opacity: test.is_active ? 1 : 0.7,
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                      },
                      '& td': {
                        borderBottom: '1px solid #f1f5f9',
                        padding: '16px',
                        fontSize: '0.875rem',
                        color: '#334155'
                      }
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ 
                        fontWeight: 600, 
                        color: '#1e293b',
                        fontSize: '0.875rem'
                      }}>
                        {test.title}
                      </Typography>
                      {test.description && (
                        <Typography sx={{ 
                          fontSize: '0.75rem',
                          color: '#64748b',
                          mt: 0.5
                        }}>
                          {test.description.length > 50 ? test.description.substring(0, 50) + '...' : test.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={test.subject}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          backgroundColor: test.subject === 'Ingliz tili' ? '#3b82f6' : undefined,
                          color: test.subject === 'Ingliz tili' ? '#ffffff' : undefined,
                          borderColor: test.subject === 'Ingliz tili' ? '#3b82f6' : undefined,
                          '& .MuiChip-label': {
                            color: test.subject === 'Ingliz tili' ? '#ffffff' : undefined,
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {test.target_grades && test.target_grades.length > 0 ? (
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {test.target_grades.slice(0, 3).map((grade) => (
                            <Chip
                              key={grade}
                              label={`${grade.replace(/^\[|"|\]$/g, '')}`}
                              size="small"
                              color="info"
                              sx={{
                                fontWeight: 500,
                                fontSize: '0.625rem',
                                height: '20px'
                              }}
                            />
                          ))}
                          {test.target_grades.length > 3 && (
                            <Chip
                              label={`+${test.target_grades.length - 3}`}
                              size="small"
                              sx={{
                                fontWeight: 500,
                                fontSize: '0.625rem',
                                height: '20px',
                                backgroundColor: '#e2e8f0'
                              }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Chip
                          label="Barcha"
                          size="small"
                          variant="outlined"
                          color="success"
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.625rem'
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ 
                        fontWeight: 700,
                        color: '#2563eb',
                        fontSize: '1rem'
                      }}>
                        {test.total_questions || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ 
                        fontWeight: 500,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                      }}>
                        {test.time_limit} daq
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ 
                        fontWeight: 700,
                        color: '#059669',
                        fontSize: '1rem'
                      }}>
                        {stats.uniqueStudents}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{
                        fontWeight: 700,
                        color: stats.averageScore >= 60 ? '#059669' : '#dc2626',
                        fontSize: '1rem'
                      }}>
                        {stats.averageScore}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={test.is_active ? 'Faol' : 'Nofaol'}
                        size="small"
                        sx={{
                          backgroundColor: test.is_active ? '#ecfdf5' : '#f1f5f9',
                          color: test.is_active ? '#059669' : '#64748b',
                          fontWeight: 600,
                          borderRadius: '6px',
                          fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Batafsil ko'rish">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/teacher/test-details/${test.id}`)}
                            sx={{
                              color: '#2563eb',
                              '&:hover': {
                                backgroundColor: '#eff6ff',
                              }
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Tahrirlash">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/teacher/edit-test/${test.id}`)}
                            sx={{
                              color: '#f59e0b',
                              '&:hover': {
                                backgroundColor: '#fffbeb',
                              }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={test.is_active ? 'Nofaollashtirish' : 'Faollashtirish'}>
                          <IconButton
                            size="small"
                            onClick={() => toggleTestStatus(test.id)}
                            disabled={loading}
                            sx={{
                              color: test.is_active ? '#64748b' : '#059669',
                              '&:hover': {
                                backgroundColor: test.is_active ? '#f1f5f9' : '#ecfdf5',
                              }
                            }}
                          >
                            {test.is_active ? <AssessmentIcon /> : <AssessmentIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="O'chirish">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTest(test)}
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
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        </Box>
      )}

      {/* Student Details Dialog */}
      <Dialog 
        open={studentDetailDialogOpen} 
        onClose={() => setStudentDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTest?.title} - O'quvchi natijalari
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedTest && getStudentDetails(selectedTest.id).map((attempt, index) => {
              const student = students.find(s => s.id === attempt.student);
              return (
                <React.Fragment key={`${attempt.student}-${attempt.id}`}>
                  <ListItem>
                    <ListItemAvatar>
                      <Badge badgeContent={index + 1} color="primary">
                        <Avatar>
                          {attempt.studentName.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1">
                            {attempt.studentName}
                          </Typography>
                          <Chip
                            label={`${attempt.score}%`}
                            color={getScoreColor(attempt.score)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            ID: {attempt.studentId}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Topshirilgan: {new Date(attempt.submitted_at).toLocaleString('uz-UZ')}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AssessmentIcon />}
                        onClick={() => navigate(`/teacher/test-details/${selectedTest.id}`)}
                      >
                        Batafsil
                      </Button>
                      {attempt.score < 60 && student && (
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<SchoolIcon />}
                          onClick={() => handleOpenLessonModal(student, attempt, selectedTest)}
                        >
                          Dars chaqirish
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                  {index < getStudentDetails(selectedTest.id).length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
          {selectedTest && getStudentDetails(selectedTest.id).length === 0 && (
            <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ py: 3 }}>
              Hali hech kim bu testni topshirmagan
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentDetailDialogOpen(false)}>Yopish</Button>
        </DialogActions>
      </Dialog>

      {/* Test Details Modal */}
      <Dialog 
        open={testDetailsModalOpen} 
        onClose={handleCloseTestDetails}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedTest?.title} - To'liq ma'lumotlar
            </Typography>
            <Chip
              label={selectedTest?.is_active ? 'Faol' : 'Nofaol'}
              color={selectedTest?.is_active ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTest && (
            <Box>
              {/* Basic Test Information */}
              <Box mb={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Test ma'lumotlari
                </Typography>
                <Typography variant="body1" paragraph>
                  {selectedTest.description || 'Tavsif mavjud emas'}
                </Typography>
                
                <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                  <Chip
                    label={selectedTest.subject}
                    color={getSubjectColor(selectedTest.subject)}
                    variant="outlined"
                  />
                  <Chip
                    label={`${selectedTest.total_questions} savol`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`${selectedTest.time_limit} daqiqa`}
                    color="secondary"
                    variant="outlined"
                  />
                </Box>

                {/* Target Grades */}
                {selectedTest.target_grades && selectedTest.target_grades.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Maqsadli sinflar:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {selectedTest.target_grades.map((grade) => (
                        <Chip
                          key={grade}
                          label={`${grade.replace(/^\[|"|\]$/g, '')}-sinf`}
                          size="small"
                          color="info"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* All Grades Available */}
                {(!selectedTest.target_grades || selectedTest.target_grades.length === 0) && (
                  <Box mb={2}>
                    <Chip
                      label="Barcha sinflar uchun"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                )}

                <Typography variant="body2" color="textSecondary" paragraph>
                  Yaratilgan: {new Date(selectedTest.created_at).toLocaleString('uz-UZ')}
                </Typography>
                
                {selectedTest.updated_at && selectedTest.updated_at !== selectedTest.created_at && (
                  <Typography variant="body2" color="textSecondary">
                    Yangilangan: {new Date(selectedTest.updated_at).toLocaleString('uz-UZ')}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Statistics */}
              <Box mb={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  O'quvchi statistikasi
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, textAlign: 'center' }}>
                      <PeopleIcon fontSize="large" color="primary" />
                      <Typography variant="h4" color="primary">
                        {getTestStats(selectedTest.id).uniqueStudents}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        O'quvchi
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, textAlign: 'center' }}>
                      <AssessmentIcon fontSize="large" color="success" />
                      <Typography variant="h4" color="success">
                        {getTestStats(selectedTest.id).averageScore}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        O'rtacha ball
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, textAlign: 'center' }}>
                      <BookmarkIcon fontSize="large" color="warning" />
                      <Typography variant="h4" color="warning">
                        {getTestStats(selectedTest.id).completionRate}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Tugallangan
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, textAlign: 'center' }}>
                      <SchoolIcon fontSize="large" color="info" />
                      <Typography variant="h4" color="info">
                        {getTestStats(selectedTest.id).totalAttempts}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Urinish
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Action Buttons */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Amallar
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<ViewIcon />}
                    onClick={() => navigate(`/teacher/test-details/${selectedTest.id}`)}
                  >
                    To'liq ko'rish
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/teacher/edit-test/${selectedTest.id}`)}
                  >
                    Tahrirlash
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PeopleIcon />}
                    onClick={() => {
                      handleStudentDetails(selectedTest);
                      handleCloseTestDetails();
                    }}
                    color="primary"
                  >
                    O'quvchilar natijalari
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => toggleTestStatus(selectedTest.id)}
                    color={selectedTest.is_active ? 'warning' : 'success'}
                    disabled={loading}
                  >
                    {selectedTest.is_active ? 'Nofaollashtirish' : 'Faollashtirish'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteTest(selectedTest)}
                  >
                    O'chirish
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestDetails}>Yopish</Button>
        </DialogActions>
      </Dialog>

      {/* Lesson Modal */}
      <SendLessonModal
        open={lessonModalOpen}
        onClose={handleCloseLessonModal}
        student={selectedStudent}
        testResult={selectedAttempt}
        teacherInfo={currentUser}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Testni o'chirish</DialogTitle>
        <DialogContent>
          <Typography>
            "{selectedTest?.title}" testini o'chirishni xohlaysizmi? 
            Bu amalni ortga qaytarib bo'lmaydi.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            O'chirilgan test o'quvchilar tomonidan ko'rinmaydi va barcha ma'lumotlar o'chiriladi.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Bekor qilish</Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'O\'chirilmoqda...' : 'O\'chirish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyTests;
