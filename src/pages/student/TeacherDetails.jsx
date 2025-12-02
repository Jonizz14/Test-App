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

        {/* Tests grid */}
        {teacherTests.length > 0 ? (
          <Grid container spacing={3}>
            {teacherTests.map((test, index) => {
              const completionStatus = getTestCompletionStatus(test.id);
              const isCompleted = completionStatus.hasCompleted;
              const hasActiveSession = !!activeTestSessions[test.id];

              return (
                <Grid item xs={12} md={6} lg={4} key={test.id}>
                  <div>
                    <Card sx={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                      overflow: 'visible',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                        transform: 'translateY(-4px)',
                      }
                    }}
                    onClick={() => navigate(`/student/take-test?testId=${test.id}`)}
                    >
                    {/* Status badge */}
                    {hasActiveSession ? (
                      <Chip
                        label="⚡ Faol test seansi"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: 12,
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.625rem',
                          height: '20px',
                          zIndex: 1
                        }}
                      />
                    ) : isCompleted && (
                      <Chip
                        label="✅ Test ishlangan"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: 12,
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.625rem',
                          height: '20px',
                          zIndex: 1
                        }}
                      />
                    )}

                    <CardContent sx={{ p: 3, minHeight: '280px', display: 'flex', flexDirection: 'column' }}>
                      {/* Test title and difficulty */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          color: '#1e293b',
                          fontSize: '1rem',
                          mb: 1,
                          lineHeight: 1.3
                        }}>
                          {test.title || 'Test nomi ko\'rsatilmagan'}
                        </Typography>
                        
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
                              fontSize: '0.625rem'
                            }}
                          />
                        )}
                      </Box>

                      {/* Test description */}
                      <Box sx={{ flex: 1, mb: 3 }}>
                        {test.description && (
                          <Typography sx={{
                            color: '#64748b',
                            fontSize: '0.75rem',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {test.description}
                          </Typography>
                        )}
                      </Box>



                      {/* Completion info for completed tests */}
                      {isCompleted ? (
                        <Box sx={{
                          backgroundColor: '#f0f9ff',
                          border: '1px solid #0ea5e9',
                          borderRadius: '8px',
                          p: 2,
                          mb: 3
                        }}>
                          <Typography sx={{
                            color: '#0c4a6e',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            mb: 1
                          }}>
                            ✅ Bu test ishlangan
                          </Typography>
                          <Typography sx={{
                            color: '#0c4a6e',
                            fontSize: '0.625rem'
                          }}>
                            Eng yuqori ball: {completionStatus.lastScore}
                          </Typography>
                          <Typography sx={{
                            color: '#0c4a6e',
                            fontSize: '0.625rem'
                          }}>
                            Urinishlar soni: {completionStatus.attemptCount}
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ mb: 3, minHeight: '90px' }}></Box>
                      )}

                      {/* Test actions */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          startIcon={hasActiveSession ? <PlayArrowIcon /> : (isCompleted ? <CheckCircleIcon /> : <PlayArrowIcon />)}
                          disabled={!hasActiveSession && isCompleted}
                          onClick={() => {
                            if (hasActiveSession) {
                              // Navigate to TakeTest with test ID to continue
                              navigate(`/student/take-test?testId=${test.id}`);
                            } else if (!isCompleted) {
                              // Navigate to TakeTest with test ID to start
                              navigate(`/student/take-test?testId=${test.id}`);
                            }
                          }}
                          sx={{
                            backgroundColor: hasActiveSession ? '#059669' : (isCompleted ? '#94a3b8' : '#2563eb'),
                            color: '#ffffff',
                            borderColor: 'transparent',
                            '&:hover': {
                              backgroundColor: hasActiveSession ? '#047857' : (isCompleted ? '#94a3b8' : '#1d4ed8'),
                              borderColor: hasActiveSession ? '#047857' : (isCompleted ? '#94a3b8' : '#1d4ed8')
                            },
                            '&:disabled': {
                              backgroundColor: '#94a3b8',
                              color: '#cbd5e1'
                            },
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        >
                          {hasActiveSession ? 'Testni davom ettirish' : (isCompleted ? 'Ishlangan' : 'Testni boshlash')}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                  </div>
                </Grid>
              );
            })}
          </Grid>
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