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
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  AccessTime as TimeIcon,
  Quiz as QuizIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const TestDetails = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [test, setTest] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [hasTakenTest, setHasTakenTest] = useState(false);

  useEffect(() => {
    loadTestData();
  }, [testId]);

  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && testStarted && !testCompleted) {
      handleSubmitTest();
    }
  }, [timeLeft, testStarted, testCompleted]);

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

  const startTest = () => {
    if (hasTakenTest) {
      return; // Don't start test if already taken
    }

    // Go directly to test taking page
    navigate(`/student/take-test?testId=${testId}`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitTest = async () => {
    // Calculate score
    let correctAnswers = 0;
    
    console.log('=== TEST SCORING DEBUG ===');
    console.log('Questions:', questions.length);
    console.log('Answers given:', answers);
    console.log('Total questions in test:', questions.length);

    questions.forEach((question, index) => {
      const userAnswer = answers[question.id] || '';
      const correctAnswer = question.correct_answer || '';
      
      // Clean and normalize answers for comparison
      const normalizedUserAnswer = userAnswer.toString().trim().toLowerCase();
      const normalizedCorrectAnswer = correctAnswer.toString().trim().toLowerCase();
      
      console.log(`Q${index + 1}: User="${normalizedUserAnswer}" | Correct="${normalizedCorrectAnswer}" | Match: ${normalizedUserAnswer === normalizedCorrectAnswer}`);
      
      // Check if the answer matches the correct answer
      if (normalizedUserAnswer && normalizedCorrectAnswer && normalizedUserAnswer === normalizedCorrectAnswer) {
        correctAnswers++;
        console.log(`✅ Question ${index + 1}: CORRECT`);
      } else {
        console.log(`❌ Question ${index + 1}: INCORRECT`);
      }
    });

    const finalScore = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    console.log(`Final Score: ${correctAnswers}/${questions.length} = ${finalScore}%`);
    
    setScore(finalScore);
    setTestCompleted(true);
    setHasTakenTest(true);

    // Save result to API
    try {
      const timeTakenSeconds = test.time_limit * 60 - timeLeft;
      await apiService.createAttempt({
        student: currentUser.id,
        test: testId,
        score: finalScore, // Store as percentage (0-100)
        answers: answers,
        time_taken: Math.round(timeTakenSeconds / 60), // Convert back to minutes
      });
      console.log('Test result saved successfully');
    } catch (error) {
      console.error('Failed to save test result:', error);
    }
  };

  const resetTest = () => {
    setTestStarted(false);
    setTestCompleted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(0);
    setScore(0);
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
          onClick={() => navigate('/student/search')}
          sx={{ 
            cursor: 'pointer',
            color: '#2563eb',
            fontWeight: 600,
            textTransform: 'none'
          }}
        >
          O'qituvchilarni qidirishga qaytish
        </Button>
      </Box>
    );
  }

  if (testCompleted) {
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
        >
          <Typography sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b'
          }}>
            Test natijasi
          </Typography>
        </Box>

        <div>
          <Paper sx={{
            p: 4,
            textAlign: 'center',
            background: score >= 70
              ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: score >= 70 ? '1px solid #22c55e' : '1px solid #dc2626',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: score >= 70 ? 'success.main' : 'error.main', mb: 2 }} />
          
          <Typography variant="h3" sx={{
            fontWeight: 700,
            color: score >= 70 ? 'success.main' : 'error.main',
            mb: 2
          }}>
            {score}%
          </Typography>

          <Typography variant="h5" gutterBottom>
            {test.title}
          </Typography>

          <Typography variant="body1" sx={{ mb: 3 }}>
            {score >= 70 ? '🎉 Tabriklaymiz! Testni muvaffaqiyatli topshirdingiz.' : '💪 Testni qayta topshirib ko\'ring.'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={resetTest}
              sx={{ cursor: 'pointer' }}
            >
              Boshqa test topshirish
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/student/results')}
              sx={{ cursor: 'pointer' }}
            >
              Natijalarimni ko'rish
            </Button>
          </Box>
        </Paper>
        </div>
      </Box>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Box sx={{
      pl: { xs: 0, md: 35 },
      pr: 4,
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
      >
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          {test.title}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Side - Test Details */}
        <Grid item xs={12} md={5}>
          <div>
            <Card sx={{
              height: 'fit-content',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              position: 'sticky',
              top: 20,
            }}>
            <CardContent sx={{ p: 3 }}>
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

              {testStarted ? (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    ⏱️ Test jarayonida
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Progress: {currentQuestionIndex + 1} / {questions.length}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(currentQuestionIndex + 1) / questions.length * 100}
                      sx={{ mb: 2, height: 8, borderRadius: 4 }}
                    />
                    
                    <Chip
                      icon={<TimeIcon />}
                      label={formatTime(timeLeft)}
                      color={timeLeft < 300 ? 'error' : 'primary'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary">
                    Testni to'liq boshlash uchun o'ng tomondagi savollarga javob bering.
                  </Typography>
                </Box>
              ) : hasTakenTest ? (
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
                  onClick={startTest}
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
        </Grid>

        {/* Right Side - Test Taking */}
        <Grid item xs={12} md={7}>
          {testStarted && currentQuestion ? (
            <div>
              <Paper sx={{
                p: 4,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3
                }}
              >
                {currentQuestion.question_text}
              </Typography>

              {currentQuestion.question_type === 'multiple_choice' && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  sx={{ mt: 2 }}
                >
                  {currentQuestion.options?.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={option.text}
                      control={<Radio sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        }
                      }} />}
                      label={option.text}
                      sx={{
                        cursor: 'pointer',
                        mb: 1,
                        p: 2,
                        border: '1px solid #f0f0f0',
                        borderRadius: 2,
                        width: '100%',
                        m: 0,
                        '&:hover': { backgroundColor: '#f8f9fa' }
                      }}
                    />
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.question_type === 'short_answer' && (
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Javobingizni kiriting"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  sx={{
                    mt: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#fafafa',
                    }
                  }}
                />
              )}

              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 4,
                gap: 2
              }}>
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  sx={{
                    cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                  }}
                >
                  Oldingi
                </Button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSubmitTest}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      backgroundColor: '#10b981',
                    }}
                  >
                    Testni topshirish
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    Keyingi
                  </Button>
                )}
              </Box>
            </Paper>
            </div>
          ) : (
            <div>
              <Paper sx={{
                p: 6,
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: 3,
              }}>
                <AssessmentIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Testni boshlashga tayyormisiz?
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                  "Testni boshlash" tugmasini bosib testni boshlang.
                  Test vaqt davomida davom etadi va natijalaringiz saqlanadi.
                </Typography>
              </Paper>
            </div>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestDetails;