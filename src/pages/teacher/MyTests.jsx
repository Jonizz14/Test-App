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
  Snackbar,
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

  useEffect(() => {
    loadData();
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
      );
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

  // Compute filtered and sorted tests
  const uniqueSubjects = [...new Set(tests.map(test => test.subject))];
  const filteredTests = tests.filter(test => {
    if (filterSubject && test.subject !== filterSubject) return false;
    if (filterStatus === 'active' && !test.is_active) return false;
    if (filterStatus === 'inactive' && test.is_active) return false;
    if (filterGrade && !test.target_grades.some(g => g.startsWith(filterGrade + '-')) && test.target_grades.length > 0) return false;
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
      p: 4,
      backgroundColor: '#ffffff'
    }}>
      <Box sx={{ 
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}>
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
          fontWeight: 400,
          mb: 3
        }}>
          Barcha testlaringizni boshqaring, o'quvchilarning natijalarini kuzating
        </Typography>
        <Box display="flex" gap={1}>
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
            {[5,6,7,8,9,10,11].map(g => <MenuItem key={g} value={g}>{g}-sinf</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Success/Error Messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {loading && sortedTests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ color: '#64748b' }}>Testlar yuklanmoqda...</Typography>
        </Box>
      ) : sortedTests.length === 0 ? (
        <Card sx={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          p: 6,
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ 
            color: '#64748b', 
            fontWeight: 600,
            mb: 2
          }}>
            {tests.length === 0 ? 'Siz hali test yaratmagansiz' : 'Filtrga mos testlar topilmadi'}
          </Typography>
          <Typography sx={{ color: '#94a3b8' }}>
            {tests.length === 0 ? '"Yangi test yaratish" tugmasini bosib boshlang' : 'Filtr sozlamalarini o\'zgartirib ko\'ring'}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {sortedTests.map((test) => {
            const stats = getTestStats(test.id);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={test.id}>
                <Card
                  onClick={() => handleOpenTestDetails(test)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    opacity: test.is_active ? 1 : 0.7,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-4px)',
                    }
                  }}
                >
                  <CardContent sx={{ flex: 1, p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2" sx={{ flex: 1, pr: 1, color: '#1e293b' }}>
                        {test.title}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={test.is_active ? 'Faol' : 'Nofaol'}
                          color={test.is_active ? 'success' : 'default'}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.625rem'
                          }}
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" color="#64748b" paragraph sx={{ minHeight: 40, fontSize: '0.875rem' }}>
                      {test.description || 'Tavsif yo\'q'}
                    </Typography>

                    <Box mb={2}>
                      <Chip
                        label={test.subject}
                        size="small"
                        variant="outlined"
                        color={getSubjectColor(test.subject)}
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      />
                      
                      {/* Target Grades Display */}
                      {test.target_grades && test.target_grades.length > 0 && (
                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                          {test.target_grades.map((grade) => (
                            <Chip
                              key={grade}
                              label={`${grade}-sinf`}
                              size="small"
                              variant="filled"
                              color="info"
                              sx={{
                                fontWeight: 500,
                                fontSize: '0.625rem',
                                height: '20px'
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      
                      {/* All Grades Available Indicator */}
                      {(!test.target_grades || test.target_grades.length === 0) && (
                        <Box mt={1}>
                          <Chip
                            label="Barcha sinflar uchun"
                            size="small"
                            variant="outlined"
                            color="success"
                            sx={{
                              fontWeight: 500,
                              fontSize: '0.625rem'
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
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
                          label={`${grade}-sinf`}
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