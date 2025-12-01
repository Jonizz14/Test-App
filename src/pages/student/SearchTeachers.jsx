import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  Alert,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Repeat as RepeatIcon,
  ArrowBack as ArrowBackIcon,
  AccessTime as TimeIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useServerTest } from '../../context/ServerTestContext';
import apiService from '../../data/apiService';

// SearchTeachers Component - Student interface for finding and taking tests
// Allows students to search teachers, filter by subjects, and access available tests
const SearchTeachers = () => {
  // Authentication context and navigation
  const { currentUser } = useAuth();
  const { checkActiveSession } = useServerTest();
  const navigate = useNavigate();

  // Component state management
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [tests, setTests] = useState([]);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [activeTestSessions, setActiveTestSessions] = useState({}); // Track active sessions for each test
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherTests, setTeacherTests] = useState([]);

  // Load initial data from API on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load teachers, tests, and student attempts data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch teachers, tests, and student's attempts from API
      const [usersData, testsData, attemptsData] = await Promise.all([
        apiService.getUsers(),
        apiService.getTests(),
        apiService.getAttempts({ student: currentUser.id })
      ]);

      // Extract results from API responses
      const users = usersData.results || usersData;
      const tests = testsData.results || testsData;
      const attempts = attemptsData.results || attemptsData;

      // Filter teachers from all users
      const teachersData = users.filter(user => user.role === 'teacher');
      
      
      setTeachers(teachersData);
      setTests(tests);
      setStudentAttempts(attempts);
      
      // Check for active sessions for all tests
      await checkActiveSessions(tests);
      
    } catch (error) {
      console.error('Error loading data:', error);
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

  // Get tests for a specific teacher that match student's grade level
  const getTeacherTests = (teacherId) => {
    return tests.filter(test => {
      // Check if test is for this teacher (temporarily removed all other filters)
      const isForTeacher = test.teacher === teacherId;
      
      
      return isForTeacher;
    });
  };

  // Get test completion status and attempt history for a specific test
  const getTestCompletionStatus = (testId) => {
    const attempts = studentAttempts.filter(attempt => attempt.test === testId);
    return {
      hasCompleted: attempts.length > 0,
      attempts: attempts,
      lastScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0,
      attemptCount: attempts.length
    };
  };

  // Check if teacher has any active test sessions
  const hasActiveSessionsForTeacher = (teacherId) => {
    const teacherTests = getTeacherTests(teacherId);
    return teacherTests.some(test => !!activeTestSessions[test.id]);
  };

  // Get count of active sessions for teacher
  const getActiveSessionsCountForTeacher = (teacherId) => {
    const teacherTests = getTeacherTests(teacherId);
    return teacherTests.filter(test => !!activeTestSessions[test.id]).length;
  };

  // Handle teacher selection to show their tests
  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher);
    const testsForTeacher = getTeacherTests(teacher.id);
    setTeacherTests(testsForTeacher);
  };

  // Handle back to teachers list
  const handleBackToTeachers = () => {
    setSelectedTeacher(null);
    setTeacherTests([]);
  };

  // Handle start test
  const handleStartTest = (testId) => {
    navigate(`/student/take-test?testId=${testId}`);
  };

  // Filter teachers based on search term and subject filter
  const filteredTeachers = teachers.filter(teacher => {
    const teacherName = teacher.name || '';
    const matchesName = teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !subjectFilter ||
      teacher.subjects?.some(subject =>
        subject.toLowerCase().includes(subjectFilter.toLowerCase())
      );
    return matchesName && matchesSubject;
  });

  // Collect all tests from all teachers with teacher information
  const allTests = [];
  teachers.forEach(teacher => {
    const teacherTests = getTeacherTests(teacher.id);
    console.log(`Teacher ${teacher.name} (ID: ${teacher.id}) has ${teacherTests.length} tests:`, teacherTests);
    teacherTests.forEach(test => {
      allTests.push({
        ...test,
        teacherName: teacher.name,
        teacherId: teacher.id
      });
    });
  });
  
  console.log('Total allTests collected:', allTests.length, allTests);

  // Get all unique subjects for filtering
  const allSubjects = [...new Set(teachers.flatMap(teacher => teacher.subjects || []))];

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
          O'qituvchilarni qidirish
        </Typography>
        <Typography sx={{ color: '#64748b' }}>Yuklanmoqda...</Typography>
      </Box>
    );
  }

  // Error state display
  if (error) {
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
          O'qituvchilarni qidirish
        </Typography>
        <Alert severity="error" sx={{ 
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b'
        }}>
          {error}
        </Alert>
      </Box>
    );
  }

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
      }}
      data-aos="fade-down"
      >
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 2
        }}>
          O'qituvchilarni qidirish
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          O'qituvchilarni toping va ularning testlarini ko'ring
        </Typography>
      </Box>

      {/* Search and filter section */}
      <Box sx={{ mb: 6 }} data-aos="fade-up" data-aos-delay="200">
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Teacher name search */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#374151',
                fontSize: '0.875rem',
                mb: 1
              }}>
                O'qituvchi ismi bo'yicha qidirish
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="O'qituvchi nomini kiriting..."
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
            </Box>
          </Grid>

          {/* Subject filter */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#374151',
                fontSize: '0.875rem',
                mb: 1
              }}>
                Fan bo'yicha filtr
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                placeholder="masalan: Matematika, Fizika"
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
            </Box>
          </Grid>
        </Grid>

        {/* Popular subjects quick filters */}
        <Box>
          <Typography sx={{ 
            fontWeight: 600, 
            color: '#374151',
            fontSize: '0.875rem',
            mb: 2
          }}>
            Mashhur fanlar:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {allSubjects.slice(0, 8).map((subject) => (
              <Chip
                key={subject}
                label={subject}
                onClick={() => setSubjectFilter(subjectFilter === subject ? '' : subject)}
                variant={subjectFilter === subject ? "filled" : "outlined"}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: subjectFilter === subject ? '#2563eb' : 'transparent',
                  color: subjectFilter === subject ? '#ffffff' : '#374151',
                  borderColor: subjectFilter === subject ? '#2563eb' : '#e2e8f0',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: subjectFilter === subject ? '#1d4ed8' : '#f8fafc',
                    borderColor: subjectFilter === subject ? '#1d4ed8' : '#2563eb'
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Teachers section */}
      <Box sx={{ mb: 6 }} data-aos="fade-up" data-aos-delay="400">
        <Typography sx={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 4
        }}>
          📚 {filteredTeachers.length} ta o'qituvchi topildi
        </Typography>

        <div data-aos="fade-up" data-aos-delay="500">
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
                  <TableCell>O'qituvchi ismi</TableCell>
                  <TableCell>Fanlar</TableCell>
                  <TableCell>Testlar soni</TableCell>
                  <TableCell>Faol seanslar</TableCell>
                  <TableCell>Harakatlar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTeachers.map((teacher) => {
                  const teacherTests = getTeacherTests(teacher.id);
                  const activeSessionsCount = getActiveSessionsCountForTeacher(teacher.id);
                  const hasActiveSessions = activeSessionsCount > 0;

                  return (
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: '1.25rem', mr: 2 }}>👨‍🏫</Typography>
                          <Box>
                            <Typography sx={{
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '0.875rem'
                            }}>
                              {teacher.name || 'Ismi ko\'rsatilmagan'}
                            </Typography>
                            {teacher.bio && (
                              <Typography sx={{
                                fontSize: '0.75rem',
                                color: '#64748b',
                                mt: 0.5
                              }}>
                                {teacher.bio}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {teacher.subjects?.slice(0, 3).map((subject) => (
                            <Chip
                              key={subject}
                              label={subject}
                              size="small"
                              sx={{
                                backgroundColor: '#eff6ff',
                                color: '#2563eb',
                                fontWeight: 500,
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                height: '24px'
                              }}
                            />
                          )) || (
                            <Typography sx={{
                              color: '#94a3b8',
                              fontSize: '0.75rem'
                            }}>
                              Fanlar ko'rsatilmagan
                            </Typography>
                          )}
                          {teacher.subjects && teacher.subjects.length > 3 && (
                            <Chip
                              label={`+${teacher.subjects.length - 3}`}
                              size="small"
                              sx={{
                                backgroundColor: '#f3f4f6',
                                color: '#6b7280',
                                fontWeight: 500,
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                height: '24px'
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{
                          fontWeight: 600,
                          color: '#059669',
                          fontSize: '0.875rem'
                        }}>
                          {teacherTests.length}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {hasActiveSessions ? (
                          <Chip
                            label={`${activeSessionsCount} ta`}
                            size="small"
                            sx={{
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              fontWeight: 600,
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          />
                        ) : (
                          <Chip
                            label="Yo'q"
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
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate(`/student/teacher-details/${teacher.id}`)}
                            sx={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              minWidth: 'auto',
                              backgroundColor: hasActiveSessions ? '#059669' : '#2563eb',
                              '&:hover': {
                                backgroundColor: hasActiveSessions ? '#047857' : '#1d4ed8',
                              }
                            }}
                            startIcon={<PersonIcon />}
                          >
                            {hasActiveSessions ? 'Davom ettirish' : 'Ko\'rish'}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </Box>

      {/* No results message */}
      {filteredTeachers.length === 0 && allTests.length === 0 && (
        <div data-aos="fade-up" data-aos-delay="600">
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
              Sizning kriteriyalaringizga mos o'qituvchi topilmadi
            </Typography>
            <Typography sx={{ color: '#94a3b8' }}>
              Qidiruv so'zlarini yoki fan filtrlarini o'zgartirib ko'ring
            </Typography>
          </Card>
        </div>
      )}
    </Box>
  );
};

export default SearchTeachers;