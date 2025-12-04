import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import SendLessonModal from '../../components/SendLessonModal';

const TestDetails = () => {
  const { testId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadTestDetails();
  }, [testId]);

  const loadTestDetails = async () => {
    try {
      // Load test data from API
      const foundTest = await apiService.getTest(testId);

      if (!foundTest) {
        setError('Test not found');
        setLoading(false);
        return;
      }

      // Check if teacher owns this test
      if (foundTest.teacher !== currentUser.id) {
        setError('Access denied');
        setLoading(false);
        return;
      }

      setTest(foundTest);

      // Load attempts for this test from API
      const attemptsResponse = await apiService.getAttempts({ test: testId });
      const testAttempts = attemptsResponse.results || attemptsResponse;
      setAttempts(testAttempts);

      // Load questions for this test from API
      const questionsResponse = await apiService.getQuestions({ test: testId });
      const testQuestions = questionsResponse.results || questionsResponse;
      setQuestions(testQuestions);

      // Load only students from API
      const usersResponse = await apiService.getUsers();
      const allUsers = usersResponse.results || usersResponse;
      const storedStudents = allUsers.filter(user => user.role === 'student');
      setAllStudents(storedStudents);

      // Load notifications to check lesson invitations
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const lessonNotifications = allNotifications.filter(n => n.type === 'lesson_reminder' && n.testId === testId);
      setNotifications(lessonNotifications);

      setLoading(false);
    } catch (err) {
      console.error('Failed to load test details:', err);
      setError('Failed to load test details');
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getScoreText = (score) => {
    if (score >= 90) return 'Ajoyib';
    if (score >= 80) return 'Yaxshi';
    if (score >= 70) return 'Qoniqarli';
    if (score >= 60) return 'Qoniqarsiz';
    return 'Yomon';
  };

  const getDirectionLabel = (direction) => {
    return direction === 'natural' ? 'Tabiiy fanlar' : direction === 'exact' ? 'Aniq fanlar' : 'Yo\'nalish kiritilmagan';
  };

  const handleOpenLessonModal = (studentId, attempt) => {
    const student = allStudents.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setSelectedAttempt({
        ...attempt,
        test: test
      });
      setLessonModalOpen(true);
    }
  };

  const handleCloseLessonModal = () => {
    setLessonModalOpen(false);
    setSelectedStudent(null);
    setSelectedAttempt(null);
  };

  // Get student's answers for a question
  const getStudentAnswer = (attempt, questionId) => {
    return attempt.answers?.[questionId] || '';
  };

  // Check if answer is correct
  const isAnswerCorrect = (attempt, question) => {
    const studentAnswer = getStudentAnswer(attempt, question.id);
    return studentAnswer === question.correct_answer || studentAnswer === question.correctAnswer;
  };

  if (loading) {
    return (
      <Box sx={{ 
        p: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Test tafsilotlari
        </Typography>
        <Typography sx={{ color: '#64748b', mt: 2 }}>Yuklanmoqda...</Typography>
      </Box>
    );
  }

  if (error || !test) {
    return (
      <Box sx={{ 
        p: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 3
        }}>
          Xatolik
        </Typography>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Test topilmadi'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/my-tests')}
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
          Orqaga
        </Button>
      </Box>
    );
  }

  // Calculate statistics
  const totalAttempts = attempts.length;
  const averageScore = totalAttempts > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
    : 0;
  const highestScore = totalAttempts > 0 ? Math.max(...attempts.map(a => a.score)) : 0;
  const lowestScore = totalAttempts > 0 ? Math.min(...attempts.map(a => a.score)) : 0;

  return (
    <Box sx={{ 
      p: 4,
      backgroundColor: '#ffffff'
    }}>
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/my-tests')}
          variant="outlined"
          sx={{
            mr: 3,
            borderColor: '#e2e8f0',
            color: '#64748b',
            '&:hover': {
              borderColor: '#cbd5e1',
              backgroundColor: '#f8fafc'
            }
          }}
        >
          Mening testlarimga qaytish
        </Button>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Test tafsilotlari
        </Typography>
      </Box>



      {/* Test Info */}
      <Card sx={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        mb: 4
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography sx={{ 
            fontWeight: 600, 
            color: '#1e293b',
            fontSize: '1.5rem',
            mb: 2
          }}>
            {test.title}
          </Typography>
          <Typography sx={{ 
            color: '#64748b',
            fontSize: '1rem',
            mb: 3,
            lineHeight: 1.5
          }}>
            {test.description || 'Tavsif mavjud emas'}
          </Typography>

          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip 
              label={`Fan: ${test.subject}`} 
              variant="outlined"
              sx={{
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            />
            <Chip 
              label={`${test.total_questions} ta savol`} 
              variant="outlined"
              sx={{
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            />
            <Chip 
              label={`${test.time_limit} daqiqa`} 
              variant="outlined"
              sx={{
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            />
            
            {/* Target Grades Display */}
            {test.target_grades && test.target_grades.length > 0 ? (
              <Box display="flex" gap={0.5} flexWrap="wrap">
                <Chip 
                  label="Maqsadlangan sinflar:" 
                  variant="outlined" 
                  size="small"
                  sx={{ fontWeight: 500, fontSize: '0.625rem' }}
                />
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
            ) : (
              <Chip
                label="Barcha sinflar uchun"
                variant="outlined"
                color="success"
                sx={{
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              />
            )}
            
            <Chip
              label={test.is_active ? 'Faol' : 'Nofaol'}
              color={test.is_active ? 'success' : 'default'}
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            p: 3
          }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#64748b',
                mb: 1
              }}
            >
              Test topshirganlar
            </Typography>
            <Typography sx={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#2563eb',
              lineHeight: 1.2
            }}>
              {totalAttempts}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            p: 3
          }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#64748b',
                mb: 1
              }}
            >
              O'rtacha ball
            </Typography>
            <Typography sx={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#059669',
              lineHeight: 1.2
            }}>
              {averageScore}%
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            p: 3
          }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#64748b',
                mb: 1
              }}
            >
              Eng yuqori ball
            </Typography>
            <Typography sx={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#10b981',
              lineHeight: 1.2
            }}>
              {highestScore}%
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            p: 3
          }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#64748b',
                mb: 1
              }}
            >
              Eng past ball
            </Typography>
            <Typography sx={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#d97706',
              lineHeight: 1.2
            }}>
              {lowestScore}%
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Students Who Took the Test */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Test topshirgan o'quvchilar ({attempts.length})
      </Typography>

      {attempts.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Hozircha hech kim bu testni topshirmagan.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>O'quvchi ismi va yo'nalishi</TableCell>
                <TableCell>Ball</TableCell>
                <TableCell>To'g'ri / Noto'g'ri</TableCell>
                <TableCell>Baho</TableCell>
                <TableCell>Vaqt</TableCell>
                <TableCell>Sana</TableCell>
                <TableCell>Harakatlar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attempts.map((attempt) => {
                // Find student info
                const student = allStudents.find(s => s.id === attempt.student);
                
                // Calculate correct/incorrect answers
                let correctCount = 0;
                let incorrectCount = 0;
                questions.forEach(question => {
                  if (isAnswerCorrect(attempt, question)) {
                    correctCount++;
                  } else {
                    incorrectCount++;
                  }
                });

                return (
                  <TableRow key={attempt.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              cursor: 'pointer',
                              fontWeight: 500,
                              '&:hover': { textDecoration: 'underline', color: 'primary.main' }
                            }}
                            onClick={() => {
                              const details = `Ism: ${student?.name || student?.first_name || 'Noma\'lum'} ${student?.last_name || ''}\nYo'nalish: ${getDirectionLabel(student?.direction) || 'Kiritilmagan'}\nID: ${attempt.student}`;
                              alert(details);
                            }}
                          >
                            {student?.name || student?.first_name || 'Noma\'lum'} {student?.last_name || ''}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {getDirectionLabel(student?.direction) || 'Yo\'nalish kiritilmagan'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6" color={`${getScoreColor(attempt.score)}.main`}>
                        {attempt.score}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={correctCount}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<CancelIcon />}
                          label={incorrectCount}
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getScoreText(attempt.score)}
                        color={getScoreColor(attempt.score)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {`${Math.floor(attempt.time_taken / 60)}:${(attempt.time_taken % 60).toString().padStart(2, '0')}`}
                    </TableCell>
                    <TableCell>
                      {new Date(attempt.submitted_at).toLocaleDateString('uz-UZ')}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1} flexDirection="column">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AssessmentIcon />}
                          onClick={() => {
                            navigate(`/teacher/student-result/${attempt.id}`);
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          Tafsilotlar
                        </Button>
                        {(() => {
                          const hasInvitation = notifications.some(n => n.studentId === attempt.student);
                          if (hasInvitation) {
                            return (
                              <Chip
                                label="Darsga chaqirilgan"
                                color="warning"
                                size="small"
                                variant="outlined"
                              />
                            );
                          } else if (attempt.score < 60 && student) {
                            return (
                              <Button
                                size="small"
                                color="error"
                                variant="contained"
                                onClick={() => handleOpenLessonModal(student.id, attempt)}
                                sx={{ cursor: 'pointer' }}
                              >
                                Qo'shimcha dars
                              </Button>
                            );
                          }
                          return null;
                        })()}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Lesson Modal */}
      <SendLessonModal
        open={lessonModalOpen}
        onClose={handleCloseLessonModal}
        student={selectedStudent}
        testResult={selectedAttempt}
        teacherInfo={currentUser}
      />
    </Box>
  );
};

export default TestDetails;