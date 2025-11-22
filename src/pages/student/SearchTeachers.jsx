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
} from '@mui/material';
import {
  Search as SearchIcon,
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
      
      console.log('Data loaded:', {
        totalUsers: users.length,
        teachersFound: teachersData.length,
        teachers: teachersData.map(t => ({ id: t.id, name: t.name })),
        testsFound: tests.length,
        tests: tests.map(t => ({ id: t.id, title: t.title, teacher: t.teacher })),
        currentUser: currentUser
      });
      
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
      
      console.log('Teacher test filtering:', {
        teacherId,
        testTitle: test.title,
        testTeacherId: test.teacher,
        isForTeacher,
        currentUser
      });
      
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
      }}>
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
      <Box sx={{ mb: 6 }}>
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
      <Box sx={{ mb: 6 }}>
        <Typography sx={{ 
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 4
        }}>
          📚 {filteredTeachers.length} ta o'qituvchi topildi
        </Typography>

        {/* Teacher list view */}
        <Grid container spacing={3}>
          {filteredTeachers.map((teacher) => {
            const teacherTests = getTeacherTests(teacher.id);
            return (
              <Grid item xs={12} md={6} lg={4} key={teacher.id}>
                <Card sx={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-4px)',
                  },
                  height: '100%'
                }}
                onClick={() => navigate(`/student/teacher-details/${teacher.id}`)}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Teacher info header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography sx={{ fontSize: '1.5rem', mr: 2 }}>👨‍🏫</Typography>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '1rem'
                      }}>
                        {teacher.name || 'Ismi ko\'rsatilmagan'}
                      </Typography>
                    </Box>

                    {/* Teacher bio */}
                    <Typography sx={{ 
                      color: '#64748b',
                      fontSize: '0.875rem',
                      mb: 3,
                      minHeight: '40px',
                      lineHeight: 1.4
                    }}>
                      {teacher.bio || 'Ma\'lumot mavjud emas'}
                    </Typography>

                    {/* Subjects */}
                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ 
                        fontWeight: 600, 
                        color: '#374151',
                        fontSize: '0.875rem',
                        mb: 2
                      }}>
                        Fanlar:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {teacher.subjects?.map((subject) => (
                          <Chip
                            key={subject}
                            label={subject}
                            size="small"
                            sx={{
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              fontWeight: 500,
                              borderRadius: '6px',
                              fontSize: '0.75rem'
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
                      </Box>
                    </Box>

                    {/* Test count and view button */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography sx={{ 
                          color: '#64748b',
                          fontSize: '0.875rem'
                        }}>
                          📊 {teacherTests.length} ta faol test mavjud
                        </Typography>
                        {hasActiveSessionsForTeacher(teacher.id) && (
                          <Typography sx={{ 
                            color: '#059669',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            mt: 0.5
                          }}>
                            ⚡ {getActiveSessionsCountForTeacher(teacher.id)} ta faol test seansi
                          </Typography>
                        )}
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: hasActiveSessionsForTeacher(teacher.id) ? '#059669' : '#2563eb',
                          color: hasActiveSessionsForTeacher(teacher.id) ? '#059669' : '#2563eb',
                          '&:hover': {
                            backgroundColor: hasActiveSessionsForTeacher(teacher.id) ? '#ecfdf5' : '#eff6ff',
                            borderColor: hasActiveSessionsForTeacher(teacher.id) ? '#047857' : '#1d4ed8'
                          },
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          fontWeight: 600,
                          ml: '10px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/student/teacher-details/${teacher.id}`);
                        }}
                      >
                        {hasActiveSessionsForTeacher(teacher.id) ? 'Davom ettirish' : 'Ko\'rish'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>



      {/* No results message */}
      {filteredTeachers.length === 0 && allTests.length === 0 && (
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
      )}
    </Box>
  );
};

export default SearchTeachers;