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
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import SendLessonModal from '../../components/SendLessonModal';

const StudentResult = () => {
  const { attemptId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [student, setStudent] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [givingStars, setGivingStars] = useState(false);

  useEffect(() => {
    const loadStudentResult = async () => {
      try {
        // Load attempt data from API
        const foundAttempt = await apiService.getAttempt(attemptId);

        if (!foundAttempt) {
          setError('Natija topilmadi');
          setLoading(false);
          return;
        }

        // Check if teacher owns this test
        const foundTest = await apiService.getTest(foundAttempt.test);

        if (!foundTest || foundTest.teacher !== currentUser.id) {
          setError('Ruxsat yo\'q');
          setLoading(false);
          return;
        }

        setAttempt(foundAttempt);
        setTest(foundTest);

        // Get all users and find student
        const usersResponse = await apiService.getUsers();
        const allUsers = usersResponse.results || usersResponse;
        const foundStudent = allUsers.find(user => user.id === foundAttempt.student && user.role === 'student');
        setStudent(foundStudent);

        // Load questions from API
        const questionsResponse = await apiService.getQuestions({ test: foundAttempt.test });
        let testQuestions = questionsResponse.results || questionsResponse;

        // If still no questions, create dummy questions based on answers
        if (testQuestions.length === 0 && foundAttempt.answers) {
          const answerKeys = Object.keys(foundAttempt.answers);
          testQuestions = answerKeys.map((questionId, index) => ({
            id: questionId,
            test: foundAttempt.test,
            question_text: `Savol ${index + 1}`,
            question_type: 'short_answer',
            options: [],
            correct_answer: 'Noma\'lum',
            explanation: 'Savol tafsilotlari mavjud emas'
          }));
        }

        setQuestions(testQuestions);

        // Load notifications to check lesson invitations
        const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const lessonNotifications = allNotifications.filter(n =>
          n.type === 'lesson_reminder' && n.studentId === foundAttempt.student && n.testId === foundAttempt.test
        );
        setNotifications(lessonNotifications);

        setLoading(false);
      } catch (err) {
        console.error('Failed to load student result:', err);
        setError('Natija yuklanmadi');
        setLoading(false);
      }
    };

    loadStudentResult();
  }, [attemptId, currentUser.id]);

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

  const handleGiveStars = async () => {
    if (!student) return;

    try {
      setGivingStars(true);
      // Determine stars based on score
      let starsToGive = 1; // default
      if (attempt.score >= 90) starsToGive = 5;
      else if (attempt.score >= 80) starsToGive = 3;
      else if (attempt.score >= 70) starsToGive = 2;

      await apiService.giveStars(student.id, { stars: starsToGive });

      // Reload student data to show updated stars
      const usersResponse = await apiService.getUsers();
      const allUsers = usersResponse.results || usersResponse;
      const updatedStudent = allUsers.find(user => user.id === student.id);
      setStudent(updatedStudent);

      alert(`${starsToGive} yulduz berildi!`);
    } catch (error) {
      console.error('Failed to give stars:', error);
      alert('Yulduz berishda xatolik yuz berdi');
    } finally {
      setGivingStars(false);
    }
  };


  if (loading) {
    return (
      <Box sx={{ 
        pl: { xs: 0, md: 35 }, 
        pr: 4,
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          O'quvchi natijasi
        </Typography>
        <Typography sx={{ color: '#64748b', mt: 2 }}>Yuklanmoqda...</Typography>
      </Box>
    );
  }

  if (error || !attempt || !student || !test) {
    return (
      <Box sx={{ 
        pl: { xs: 0, md: 35 }, 
        pr: 4,
        py: 4,
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
          {error || 'Ma\'lumot topilmadi'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
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

  return (
    <Box sx={{
      width: '100%',
      pl: { xs: 0, md: 35 },
      pr: 4,
      py: 4,
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
          onClick={() => navigate(-1)}
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
          Orqaga
        </Button>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          O'quvchi natijasi
        </Typography>
      </Box>

      {/* Student and Test Info */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon sx={{ mr: 1, color: '#2563eb' }} />
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.125rem' }}>
                  O'quvchi ma'lumotlari
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '1rem', color: '#1e293b', mb: 1 }}>
                <strong>Ism:</strong> {student.first_name} {student.last_name}
              </Typography>
              {student.email && (
                <Typography sx={{ fontSize: '0.875rem', color: '#64748b', mb: 0.5 }}>
                  <strong>Email:</strong> {student.email}
                </Typography>
              )}
              <Typography sx={{ fontSize: '0.875rem', color: '#64748b', mb: 0.5 }}>
                <strong>ID:</strong> {student.id}
              </Typography>
              {student.class_group && (
                <Typography sx={{ fontSize: '0.875rem', color: '#64748b', mb: 0.5 }}>
                  <strong>Sinf:</strong> {student.class_group}
                </Typography>
              )}
              {student.direction && (
                <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>
                  <strong>Yo'nalish:</strong> {student.direction === 'natural' ? 'Tabiiy fanlar' : 'Aniq fanlar'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <AssessmentIcon sx={{ mr: 1, color: '#059669' }} />
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.125rem' }}>
                  Test ma'lumotlari
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '1rem', color: '#1e293b', mb: 1 }}>
                <strong>Test:</strong> {test.title}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#64748b', mb: 0.5 }}>
                <strong>Fan:</strong> {test.subject}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#64748b', mb: 0.5 }}>
                <strong>Sana:</strong> {new Date(attempt.submittedAt).toLocaleDateString('uz-UZ')}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>
                <strong>Vaqt:</strong> {Math.floor(attempt.timeTaken / 60)}:{(attempt.timeTaken % 60).toString().padStart(2, '0')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Score Summary */}
      <Card sx={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        p: 4,
        mb: 4,
        textAlign: 'center'
      }}>
        <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.25rem', mb: 2 }}>
          Umumiy natija
        </Typography>
        <Typography sx={{
          fontSize: '4rem',
          fontWeight: 700,
          color: attempt.score >= 90 ? '#059669' : attempt.score >= 70 ? '#d97706' : '#dc2626',
          lineHeight: 1.2,
          mb: 2
        }}>
          {attempt.score}%
        </Typography>
        <Chip
          label={getScoreText(attempt.score)}
          color={getScoreColor(attempt.score)}
          size="large"
          sx={{ mb: 2, fontWeight: 600 }}
        />
        <Typography sx={{ fontSize: '1rem', color: '#64748b', mb: 3 }}>
          {questions.length} ta savoldan {Object.keys(attempt.answers || {}).length} ta javob berilgan
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Give Stars Button */}
          <Button
            variant="contained"
            startIcon={<StarIcon />}
            onClick={handleGiveStars}
            disabled={givingStars}
            sx={{
              cursor: 'pointer',
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              '&:hover': { backgroundColor: '#d97706' },
              '&:disabled': { backgroundColor: '#d1d5db' }
            }}
          >
            {givingStars ? 'Berilmoqda...' : 'Yulduz berish'}
          </Button>

          {/* Send Additional Lesson Button - Only show if score < 60 */}
          {(() => {
            const hasInvitation = notifications.length > 0;
            if (hasInvitation) {
              return (
                <Chip
                  label="Darsga chaqirilgan"
                  color="warning"
                  size="large"
                  variant="outlined"
                  sx={{
                    px: 3,
                    py: 1,
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                />
              );
            } else if (attempt.score < 60) {
              return (
                <Button
                  variant="contained"
                  startIcon={<SchoolIcon />}
                  onClick={() => setLessonModalOpen(true)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    backgroundColor: 'error.main',
                    '&:hover': { backgroundColor: 'error.main' }
                  }}
                >
                  Qo'shimcha dars yuborish
                </Button>
              );
            } else {
              return (
                <Chip
                  label="Qo'chimcha dars kerak emas"
                  color="success"
                  size="large"
                  variant="outlined"
                  sx={{
                    px: 3,
                    py: 1,
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                />
              );
            }
          })()}
        </Box>
      </Card>

      {/* Detailed Questions and Answers */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Savollar va javoblar
      </Typography>

      {questions.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Savol</TableCell>
                <TableCell>O'quvchi javobi</TableCell>
                <TableCell>To'g'ri javob</TableCell>
                <TableCell>Holat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.map((question, index) => {
                const studentAnswer = attempt.answers?.[question.id] || '';
                const correctAnswer = question.correct_answer;
                const isCorrect = studentAnswer === correctAnswer;

                return (
                  <TableRow key={question.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {index + 1}. {question.question_text}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={studentAnswer ? 'textPrimary' : 'textSecondary'}>
                        {studentAnswer || 'Javob berilmagan'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="success.main">
                        {correctAnswer}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isCorrect ? 'To\'g\'ri' : 'Noto\'g\'ri'}
                        color={isCorrect ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          Savollar mavjud emas.
        </Alert>
      )}

      <SendLessonModal
        open={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        student={student}
        testResult={{
          id: attempt.id,
          score: attempt.score,
          test: test,
          submittedAt: attempt.submittedAt
        }}
      />
    </Box>
  );
};

export default StudentResult;