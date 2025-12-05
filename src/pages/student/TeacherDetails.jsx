import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Paper,
  Card,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Repeat as RepeatIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useServerTest } from '../../context/ServerTestContext';
import apiService from '../../data/apiService';

// TeacherDetails Component - Student view for individual teacher and their tests
// Shows teacher information and allows students to take or retake tests
const TeacherDetails = () => {
  // URL parameters and navigation
  const { teacherId } = useParams();
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const { checkActiveSession } = useServerTest();

  // Component state management
  const [teacher, setTeacher] = useState(null);
  const [tests, setTests] = useState([]);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [activeTestSessions, setActiveTestSessions] = useState({}); // Track active sessions for each test
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [teacherId]);

  // Load teacher data, tests, and student attempts
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data
      const [usersData, testsData, attemptsData] = await Promise.all([
        apiService.getUsers(),
        apiService.getTests(),
        apiService.getAttempts({ student: currentUser.id })
      ]);

      // Extract results from API responses
      const users = usersData.results || usersData;
      const tests = testsData.results || testsData;
      const attempts = attemptsData.results || attemptsData;

      // Find the specific teacher
      const foundTeacher = users.find(user => 
        user.id === parseInt(teacherId) && user.role === 'teacher'
      );

      console.log('Teacher details loading:', {
        teacherId,
        foundTeacher,
        totalUsers: users.length,
        totalTests: tests.length,
        userAttempts: attempts.length
      });

      if (!foundTeacher) {
        setError('O\'qituvchi topilmadi');
        return;
      }

      setTeacher(foundTeacher);
      setTests(tests);
      setStudentAttempts(attempts);
      
      // Check for active sessions for all tests
      await checkActiveSessions(tests);
      
    } catch (error) {
      console.error('Error loading teacher details:', error);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Check for active sessions for all tests
  const checkActiveSessions = async (allTests) => {
    if (allTests.length === 0) return;

    const sessionsMap = {};
    
    for (const test of allTests) {
      try {
        const activeSession = await checkActiveSession(test.id);
        if (activeSession) {
          sessionsMap[test.id] = activeSession;
        }
      } catch (error) {
        // Silently handle errors for each test
        console.debug(`No active session for test ${test.id}`);
      }
    }
    
    setActiveTestSessions(sessionsMap);
  };

  // Get tests for the current teacher
  const getTeacherTests = () => {
    return tests.filter(test => test.teacher === parseInt(teacherId));
  };

  // Get test completion status and attempt history
  const getTestCompletionStatus = (testId) => {
    const attempts = studentAttempts.filter(attempt => attempt.test === testId);
    return {
      hasCompleted: attempts.length > 0,
      attempts: attempts,
      lastScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0,
      attemptCount: attempts.length
    };
  };

  // Navigate back to search teachers
  const handleBack = () => {
    navigate('/student/search');
  };

  // Loading state display
  if (loading) {
    return (
      <Box sx={{ 
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          O'qituvchi ma'lumotlari
        </Typography>
        <Typography sx={{ color: '#64748b', mt: 2 }}>Yuklanmoqda...</Typography>
      </Box>
    );
  }

  // Error state display
  if (error || !teacher) {
    return (
      <Box sx={{ 
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2, color: '#64748b' }}
          >
            Orqaga qaytish
          </Button>
        </Box>
        <Alert severity="error">
          {error || 'O\'qituvchi topilmadi'}
        </Alert>
      </Box>
    );
  }

  const teacherTests = getTeacherTests();

  return (
    <Box sx={{
      py: 4,
      backgroundColor: '#ffffff'
    }}>
      {/* Header with back button */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}
      >
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          O'qituvchi ma'lumotlari
        </Typography>
        <Button
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{
            borderColor: '#e2e8f0',
            color: '#64748b',
            '&:hover': {
              borderColor: '#cbd5e1',
              backgroundColor: '#f8fafc'
            }
          }}
          >
          O'qituvchilarni qidirishga qaytish
        </Button>
      </Box>

      {/* Teacher information section */}
      <div>
        <Paper sx={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          p: 4,
          mb: 6
        }}>
        <Grid container spacing={4} alignItems="center">
          {/* Teacher avatar and basic info */}
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Avatar sx={{
              width: 120,
              height: 120,
              fontSize: '3rem',
              backgroundColor: '#2563eb',
              mx: { xs: 'auto', md: 0 },
              mb: 2
            }}>
              👨‍🏫
            </Avatar>
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              color: '#1e293b',
              mb: 2
            }}>
              {teacher.name || 'Ismi ko\'rsatilmagan'}
            </Typography>
            <Chip
              label="O'qituvchi"
              icon={<PersonIcon />}
              sx={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            />
          </Grid>

          {/* Teacher details */}
          <Grid item xs={12} md={8}>
            {/* Bio */}
            {teacher.bio && (
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ 
                  fontWeight: 600, 
                  color: '#374151',
                  fontSize: '1rem',
                  mb: 2
                }}>
                  📝 Biografiya:
                </Typography>
                <Typography sx={{ 
                  color: '#64748b',
                  fontSize: '1rem',
                  lineHeight: 1.6
                }}>
                  {teacher.bio}
                </Typography>
              </Box>
            )}

            {/* Subjects */}
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#374151',
                fontSize: '1rem',
                mb: 2
              }}>
                📚 O'qitiladigan fanlar:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {teacher.subjects?.map((subject) => (
                  <Chip
                    key={subject}
                    label={subject}
                    sx={{
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 500,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      height: '32px'
                    }}
                  />
                )) || (
                  <Typography sx={{ 
                    color: '#94a3b8',
                    fontSize: '0.875rem'
                  }}>
                    Fanlar ko'rsatilmagan
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Statistics */}
            <Box>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#374151',
                fontSize: '1rem',
                mb: 2
              }}>
                📊 Statistika:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={4}>
                  <Card sx={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    p: 2
                  }}>
                    <Typography sx={{ 
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#2563eb'
                    }}>
                      {teacherTests.length}
                    </Typography>
                    <Typography sx={{ 
                      color: '#64748b',
                      fontSize: '0.75rem'
                    }}>
                      Jami testlar
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Card sx={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    p: 2
                  }}>
                    <Typography sx={{ 
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#059669'
                    }}>
                      {teacher.subjects?.length || 0}
                    </Typography>
                    <Typography sx={{ 
                      color: '#64748b',
                      fontSize: '0.75rem'
                    }}>
                      Fanlar soni
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      </div>

      {/* Tests section */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 4
        }}>
          📝 {teacher.name}ning testlari
        </Typography>

        {/* Tests table */}
        {teacherTests.length > 0 ? (
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
                  <TableCell>Test nomi</TableCell>
                  <TableCell>Fan</TableCell>
                  <TableCell>Qiyinlik</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Harakatlar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teacherTests.map((test) => {
                  const completionStatus = getTestCompletionStatus(test.id);
                  const isCompleted = completionStatus.hasCompleted;
                  const hasActiveSession = !!activeTestSessions[test.id];

                  return (
                    <TableRow key={test.id} sx={{
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
                          fontWeight: 600,
                          color: '#1e293b',
                          fontSize: '0.875rem'
                        }}>
                          {test.title || 'Test nomi ko\'rsatilmagan'}
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
                          label={test.subject || 'Noma\'lum'}
                          size="small"
                          sx={{
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            fontWeight: 500,
                            borderRadius: '6px',
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {test.difficulty && (
                          <Chip
                            label={test.difficulty}
                            size="small"
                            sx={{
                              backgroundColor: test.difficulty === 'Oson' ? '#dcfce7' :
                                              test.difficulty === 'O\'rta' ? '#fef3c7' : '#fee2e2',
                              color: test.difficulty === 'Oson' ? '#166534' :
                                    test.difficulty === 'O\'rta' ? '#92400e' : '#991b1b',
                              fontWeight: 500,
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {hasActiveSession ? (
                          <Chip
                            label="Faol seans"
                            size="small"
                            sx={{
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              fontWeight: 600,
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          />
                        ) : isCompleted ? (
                          <Box>
                            <Chip
                              label="Ishlangan"
                              size="small"
                              sx={{
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                fontWeight: 600,
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                mb: 0.5
                              }}
                            />
                            <Typography sx={{
                              fontSize: '0.625rem',
                              color: '#64748b'
                            }}>
                              Ball: {completionStatus.lastScore}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip
                            label="Ishlanmagan"
                            size="small"
                            sx={{
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              fontWeight: 600,
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            if (hasActiveSession) {
                              navigate(`/student/take-test?testId=${test.id}`);
                            } else if (!isCompleted) {
                              navigate(`/student/take-test?testId=${test.id}`);
                            }
                          }}
                          disabled={!hasActiveSession && isCompleted}
                          sx={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            minWidth: 'auto',
                            backgroundColor: hasActiveSession ? '#059669' : (isCompleted ? '#94a3b8' : '#2563eb'),
                            '&:hover': {
                              backgroundColor: hasActiveSession ? '#047857' : (isCompleted ? '#94a3b8' : '#1d4ed8'),
                            },
                            '&:disabled': {
                              backgroundColor: '#94a3b8'
                            }
                          }}
                          startIcon={hasActiveSession ? <PlayArrowIcon /> : (isCompleted ? <CheckCircleIcon /> : <PlayArrowIcon />)}
                        >
                          {hasActiveSession ? 'Davom ettirish' : (isCompleted ? 'Ishlangan' : 'Boshlash')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          // No tests message
          <div>
            <Card sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              p: 6,
              textAlign: 'center'
            }}>
              <Typography sx={{ fontSize: '3rem', mb: 2 }}>📝</Typography>
              <Typography variant="h6" sx={{
                color: '#64748b',
                fontWeight: 600,
                mb: 2
              }}>
                Bu o'qituvchining hali testlari yo'q
              </Typography>
              <Typography sx={{ color: '#94a3b8' }}>
                Tez orada yangi testlar qo'shilishi mumkin
              </Typography>
            </Card>
          </div>
        )}
      </Box>
    </Box>
  );
};

export default TeacherDetails;