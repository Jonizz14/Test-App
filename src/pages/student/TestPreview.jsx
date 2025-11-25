import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Paper,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  AccessTime as TimeIcon,
  Quiz as QuizIcon,
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const TestPreview = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [test, setTest] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasTakenTest, setHasTakenTest] = useState(false);

  useEffect(() => {
    loadTestData();
  }, [testId]);

  const loadTestData = async () => {
    try {
      setLoading(true);

      // Load test details
      const testData = await apiService.getTest(testId);
      setTest(testData);

      // Load teacher info
      const usersData = await apiService.getUsers();
      const users = usersData.results || usersData;
      const teacherData = users.find(user => user.id === testData.teacher);
      setTeacher(teacherData);

      // Load questions
      const questionsData = await apiService.getQuestions({ test: testId });
      const questionsList = questionsData.results || questionsData;
      setQuestions(questionsList);

      // Check if student has already taken this test
      if (currentUser) {
        try {
          const attempts = await apiService.getAttempts({ student: currentUser.id, test: testId });
          const attemptsList = attempts.results || attempts;
          setHasTakenTest(attemptsList.length > 0);
        } catch (error) {
          console.error('Failed to check test attempts:', error);
        }
      }

    } catch (error) {
      console.error('Error loading test data:', error);
      setError('Test ma\'lumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    navigate(`/student/take-test?testId=${testId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Box sx={{
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography variant="h6" align="center">
          Ma'lumotlar yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  if (error || !test) {
    return (
      <Box sx={{
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        <Alert severity="error" sx={{
          mb: 2,
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b'
        }}>
          {error || 'Test topilmadi'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{
            cursor: 'pointer',
            color: '#2563eb',
            fontWeight: 600,
            textTransform: 'none'
          }}
        >
          Orqaga qaytish
        </Button>
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
          Test tafsilotlari
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
          data-aos="zoom-in"
          data-aos-delay="200"
        >
          Orqaga qaytish
        </Button>
      </Box>

      <Container maxWidth="md">
        <div data-aos="fade-up" data-aos-delay="200">
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📋 Test ma'lumotlari
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1">
                    <strong>O'qituvchi:</strong> {teacher?.name || 'Noma\'lum'}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={2}>
                  <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1">
                    <strong>Fan:</strong> {test.subject}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={2}>
                  <QuizIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1">
                    <strong>Savollar soni:</strong> {questions.length} ta
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={2}>
                  <TimeIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1">
                    <strong>Vaqt:</strong> {test.time_limit} daqiqa
                  </Typography>
                </Box>

                {test.difficulty && (
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="body1">
                      <strong>Qiyinlik darajasi:</strong>
                      <Chip
                        label={test.difficulty}
                        size="small"
                        sx={{
                          ml: 1,
                          backgroundColor: test.difficulty === 'Oson' ? '#dcfce7' :
                                         test.difficulty === 'O\'rta' ? '#fef3c7' : '#fee2e2',
                          color: test.difficulty === 'Oson' ? '#166534' :
                               test.difficulty === 'O\'rta' ? '#92400e' : '#991b1b',
                          fontWeight: 500,
                          borderRadius: '6px',
                          fontSize: '0.625rem'
                        }}
                      />
                    </Typography>
                  </Box>
                )}

                {test.target_grades && test.target_grades.length > 0 && (
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="body1">
                      <strong>Mo'ljallangan sinflar:</strong> {test.target_grades.join(', ')}
                    </Typography>
                  </Box>
                )}
              </Box>

              {test.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Test haqida:</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {test.description}
                  </Typography>
                </Box>
              )}

              {hasTakenTest ? (
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>Diqqat:</strong> Siz ushbu testni allaqachon topshirgansiz.
                  </Typography>
                </Alert>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStartTest}
                  sx={{
                    py: 2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}
                >
                  Testni boshlash
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </Box>
  );
};

export default TestPreview;