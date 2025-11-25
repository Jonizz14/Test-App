import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  LinearProgress,
  Alert,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useServerTest } from '../../context/ServerTestContext';
import apiService from '../../data/apiService';
import useAntiCheating from '../../hooks/useAntiCheating';
import WarningModal from '../../components/WarningModal';
import TestUnbanModal from '../../components/TestUnbanModal';

const TakeTest = () => {
  const { currentUser } = useAuth();
  const {
    currentSession,
    timeRemaining,
    isLoading,
    error,
    sessionStarted,
    startTestSession,
    continueTestSession,
    updateAnswers,
    submitTest,
    checkActiveSession,
    clearSession,
    formatTime,
    isSessionActive,
    hasTimeRemaining,
  } = useServerTest();

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [teacherTests, setTeacherTests] = useState({});
  const [allTests, setAllTests] = useState([]); // For "Barcha testlar" section
  const [takenTests, setTakenTests] = useState(new Set());
  const [selectedTest, setSelectedTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'easy', 'medium', 'hard', 'difficulty'
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [urgentSubmitDialogOpen, setUrgentSubmitDialogOpen] = useState(false);
  const [sessionRecovering, setSessionRecovering] = useState(false);
  const [activeTestSessions, setActiveTestSessions] = useState({}); // Track active sessions for each test

  // Anti-cheating hook - only active during test session
  const [sessionId, setSessionId] = useState(null);
  const {
    showWarning,
    warningMessage,
    closeWarning,
    showUnbanPrompt,
    unbanCode,
    setUnbanCode,
    unbanError,
    handleUnbanSubmit,
    closeUnbanPrompt,
    warningCount
  } = useAntiCheating(
    sessionStarted,
    sessionId,
    currentSession?.warning_count || 0,
    currentSession?.unban_prompt_shown || false
  );

  // Update sessionId when currentSession changes
  useEffect(() => {
    if (currentSession?.session_id) {
      setSessionId(currentSession.session_id);
    } else if (!sessionStarted) {
      setSessionId(null);
    }
  }, [currentSession, sessionStarted]);


  // Difficulty labels mapping
  const difficultyLabels = {
    easy: 'Oson',
    medium: 'O\'rtacha',
    hard: 'Qiyin'
  };

  // Sort and filter all tests by difficulty
  const getSortedTests = () => {
    let filteredTests = allTests.filter(test => test.is_active);
    
    // Filter by difficulty if selected
    if (sortBy === 'easy' || sortBy === 'medium' || sortBy === 'hard') {
      filteredTests = filteredTests.filter(test => test.difficulty === sortBy);
    }
    
    // Sort tests
    if (sortBy === 'difficulty') {
      const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
      filteredTests.sort((a, b) => (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0));
    } else {
      // Default sort by title
      filteredTests.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    return filteredTests;
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // Check for active sessions for all tests
  useEffect(() => {
    const checkAllActiveSessions = async () => {
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

    checkAllActiveSessions();
  }, [allTests]);

  // Check for testId in URL parameters
  useEffect(() => {
    const testIdFromParams = searchParams.get('testId');

    if (testIdFromParams && teachers.length > 0) {
      // Check if there's an active session for this test
      const checkAndHandleTest = async () => {
        try {
          setSessionRecovering(true);
          const activeSession = await checkActiveSession(testIdFromParams);

          if (activeSession) {
            // Continue existing session
            await continueTestFromSession(activeSession, testIdFromParams);
          } else {
            // Load test and check if it should auto-start
            const test = await apiService.getTest(testIdFromParams);
            if (test && test.is_active) {
              const alreadyTaken = takenTests.has(testIdFromParams);

              if (!alreadyTaken) {
                // Auto-start the test since user came from preview page
                await startTest(test);
              } else {
                // Just show the test details if already taken
                setSelectedTest(test);
              }
            }
          }
        } catch (error) {
          console.error('Failed to handle test from URL:', error);
          // Clear any session data that might be invalid
          clearSession();
        } finally {
          setSessionRecovering(false);
        }
      };

      checkAndHandleTest();
    }
  }, [searchParams, teachers, takenTests]);

  // Handle session completion
  useEffect(() => {
    if (currentSession && hasTimeRemaining === false && sessionStarted) {
      // Session has expired or completed
      handleTestComplete();
    }
  }, [hasTimeRemaining, sessionStarted]);

  const continueTestFromSession = async (session, testId) => {
    try {
      const test = await apiService.getTest(testId);
      if (test) {
        const questionsData = await apiService.getQuestions({ test: test.id });
        const questionsList = questionsData.results || questionsData;
        
        setSelectedTest({
          ...test,
          questions: questionsList
        });
        setAnswers(session.answers || {});
        setCurrentQuestionIndex(0);
      }
    } catch (error) {
      console.error('Failed to continue test session:', error);
      clearSession();
    }
  };

  const loadTeachers = async () => {
    try {
      // Load teachers from API
      const allUsers = await apiService.getUsers();
      const allTeachers = allUsers.filter(user => user.role === 'teacher');
      setTeachers(allTeachers);

      // Load tests for each teacher
      const testsMap = {};
      const allTestsArray = [];
      
      for (const teacher of allTeachers) {
        try {
          const tests = await apiService.getTests({ teacher: teacher.id });
          const activeTests = tests.filter(test => test.is_active);
          testsMap[teacher.id] = activeTests;
          
          // Add tests to allTests array with teacher info
          activeTests.forEach(test => {
            allTestsArray.push({
              ...test,
              teacherName: teacher.name || teacher.username,
              teacherId: teacher.id
            });
          });
        } catch (error) {
          console.error(`Failed to load tests for teacher ${teacher.id}:`, error);
          testsMap[teacher.id] = [];
        }
      }
      setTeacherTests(testsMap);
      setAllTests(allTestsArray);

      // Load student's taken tests
      try {
        const attempts = await apiService.getAttempts({ student: currentUser.id });
        const takenTestIds = new Set(attempts.map(attempt => attempt.test));
        setTakenTests(takenTestIds);
      } catch (error) {
        console.error('Failed to load taken tests:', error);
      }
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  };

  const getTeacherTests = (teacherId) => {
    const teacherTestsList = teacherTests[teacherId] || [];
    const studentGrade = currentUser.grade_level?.toString() || currentUser.class_group?.split('-')[0];
    
    return teacherTestsList.filter(test => {
      // Check if test is active
      if (!test.is_active) {
        return false;
      }
      
      // Check if test is appropriate for student's grade
      const targetGrades = test.target_grades || [];
      
      // If no target grades specified, test is available to all grades
      if (targetGrades.length === 0) {
        return true; // Available to all grades
      }
      
      // Check if student's grade is in target grades
      const gradeMatch = targetGrades.some(grade => 
        grade === studentGrade || 
        grade === `${studentGrade}-01` || 
        grade === `grade_${studentGrade}`
      );
      
      return gradeMatch;
    });
  };

  const hasStudentTakenTest = (testId) => {
    return takenTests.has(testId);
  };

  const startTest = async (test) => {
    // Check if student has already taken this test
    if (hasStudentTakenTest(test.id)) {
      return; // Don't start test if already taken
    }

    try {
      // Start server-side session
      const session = await startTestSession(test.id);
      
      // Load questions for the test
      const questionsData = await apiService.getQuestions({ test: test.id });
      const questionsList = questionsData.results || questionsData;
      
      // Add questions to test object
      const testWithQuestions = {
        ...test,
        questions: questionsList
      };

      setSelectedTest(testWithQuestions);
      setCurrentQuestionIndex(0);
      setAnswers({});
    } catch (error) {
      console.error('Failed to start test:', error);
      if (error.response?.status === 400) {
        // Test already completed
        alert('Test allaqachon tugallangan!');
        window.location.reload();
      }
    }
  };

  const continueTest = async (test) => {
    // Use existing active session if available
    const existingSession = activeTestSessions[test.id];
    
    if (existingSession) {
      try {
        await continueTestFromSession(existingSession, test.id);
      } catch (error) {
        console.error('Failed to continue test from existing session:', error);
        // Remove invalid session from cache
        const updatedSessions = { ...activeTestSessions };
        delete updatedSessions[test.id];
        setActiveTestSessions(updatedSessions);
      }
    } else {
      // Fallback: check for session via API
      try {
        const activeSession = await checkActiveSession(test.id);
        if (activeSession) {
          await continueTestFromSession(activeSession, test.id);
        } else {
          console.log('No active session found, starting new test');
          await startTest(test);
        }
      } catch (error) {
        console.error('Failed to continue test:', error);
      }
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    const newAnswers = {
      ...answers,
      [questionId]: answer
    };
    setAnswers(newAnswers);
    
    // Save to server for persistence
    updateAnswers({ [questionId]: answer });
  };

  const handleExitTest = () => {
    setExitDialogOpen(false);
    clearSession();
    resetTest();
  };

  const handleNext = () => {
    if (currentQuestionIndex < selectedTest.total_questions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Clear all answers when moving to avoid confusion between questions
      setAnswers({});
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Clear all answers when moving back to avoid confusion between questions
      setAnswers({});
    }
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
    // Clear all answers when navigating to avoid confusion between questions
    setAnswers({});
  };

  const handleTestComplete = async () => {
    try {
      const result = await submitTest();
      if (result.success) {
        setScore(result.score);
        setTestCompleted(true);
      }
    } catch (error) {
      console.error('Failed to complete test:', error);
    }
  };

  const handleSubmitTest = async () => {
    try {
      const result = await submitTest();
      if (result.success) {
        setScore(result.score);
        setTestCompleted(true);
      }
    } catch (error) {
      console.error('Failed to submit test:', error);
    }
  };

  const resetTest = () => {
    setSelectedTest(null);
    setTestCompleted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setScore(0);
    clearSession();
  };

  // Show loading during session recovery
  if (sessionRecovering) {
    return (
      <Box sx={{ 
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          textAlign: 'center',
          mb: 4
        }}>
          Test davom ettirilmoqda...
        </Typography>
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="body1">
            Iltimos kuting, sizning test seansingiz tiklanmoqda...
          </Typography>
        </Paper>
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
        data-aos="fade-down"
        >
          <Typography sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b'
          }}>
            Test natijasi
          </Typography>
        </Box>

        <div data-aos="zoom-in" data-aos-delay="300">
          <Paper sx={{
            p: 4,
            textAlign: 'center',
            background: score >= 70
              ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: score >= 70 ? '1px solid #22c55e' : '1px solid #dc2626',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
          <Typography variant="h3" sx={{
            fontWeight: 700,
            color: score >= 70 ? 'success.main' : 'error.main',
            mb: 2
          }}>
            {score}%
          </Typography>

          <Typography variant="h6" gutterBottom>
            {selectedTest?.title}
          </Typography>

          <Typography variant="body1" sx={{ mb: 3 }}>
            {score >= 70 ? 'Tabriklaymiz! Testni muvaffaqiyatli topshirdingiz.' : 'Testni qayta topshirib ko\'ring.'}
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
              onClick={() => window.location.href = '/student/results'}
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

  if (sessionStarted && selectedTest) {
    const testQuestions = selectedTest.questions || [];
    const currentQuestion = testQuestions[currentQuestionIndex];

    // If questions are not loaded yet or current question is undefined, show loading
    if (!testQuestions.length || !currentQuestion) {
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
            Test yuklanmoqda...
          </Typography>
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <Typography variant="body1">
              Iltimos kuting, test savollari yuklanmoqda...
            </Typography>
          </Paper>
        </Box>
      );
    }

    return (
      <Box sx={{
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
            {error}
          </Alert>
        )}

        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          p: 2,
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: 2,
          border: '1px solid rgba(148, 163, 184, 0.2)'
        }}
        data-aos="fade-down"
        >
          <Typography variant="h6">
            {selectedTest.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="textSecondary">
              {currentQuestionIndex + 1} / {selectedTest.total_questions}
            </Typography>
            <Chip
              icon={<TimeIcon />}
              label={formatTime(timeRemaining)}
              color={timeRemaining < 300 ? 'error' : 'primary'}
              size="small"
            />
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={(currentQuestionIndex + 1) / selectedTest.total_questions * 100}
          sx={{ mb: 3, height: 8, borderRadius: 4 }}
        />

        {/* Exit Test Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setExitDialogOpen(true)}
            sx={{ 
              borderColor: '#ef4444',
              color: '#ef4444',
              '&:hover': { 
                backgroundColor: '#fef2f2',
                borderColor: '#dc2626'
              }
            }}
          >
            Testdan chiqish
          </Button>
        </Box>

        <Paper
          className="anti-screenshot"
          sx={{
            p: 4,
            backgroundColor: '#ffffff',
            border: '1px solid #e9ecef',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
          data-aos="fade-up"
          data-aos-delay="200"
        >
          {/* Image displayed at the top - bigger */}
          {currentQuestion.image && (
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <img
                src={currentQuestion.image}
                alt="Question"
                style={{
                  maxWidth: '100%',
                  maxHeight: '600px',
                  width: 'auto',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}

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
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio sx={{
                    cursor: 'pointer',
                    color: 'primary.main',
                    '&.Mui-checked': {
                      color: 'primary.main',
                    }
                  }} />}
                  label={option}
                  sx={{
                    cursor: 'pointer',
                    mb: 1,
                    p: 2,
                    border: '1px solid #f0f0f0',
                    borderRadius: 2,
                    width: '100%',
                    m: 0,
                    transition: 'none',
                    '&:hover': { backgroundColor: 'transparent' }
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
                borderColor: '#d1d5db',
                color: currentQuestionIndex === 0 ? '#9ca3af' : '#374151',
                '&:hover': { backgroundColor: 'transparent' }
              }}
            >
              Oldingi
            </Button>

            {currentQuestionIndex === selectedTest.total_questions - 1 ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmitTest}
                  disabled={isLoading}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    backgroundColor: '#10b981',
                    '&:hover': { backgroundColor: '#10b981' }
                  }}
                >
                  Testni topshirish
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => setUrgentSubmitDialogOpen(true)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    borderColor: '#f59e0b',
                    color: '#f59e0b',
                    '&:hover': { 
                      backgroundColor: '#fef3c7',
                      borderColor: '#d97706'
                    }
                  }}
                >
                  Tez tugatish
                </Button>
              </Box>
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
                  backgroundColor: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.main' }
                }}
              >
                Keyingi
              </Button>
            )}
          </Box>
        </Paper>

        {/* Question Navigation Panel */}
        <Box sx={{ mt: 3 }} data-aos="fade-up" data-aos-delay="400">
          <Typography variant="h6" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
            Savollar ro'yxati:
          </Typography>
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            backgroundColor: '#ffffff',
            p: 2,
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            {testQuestions.map((_, index) => (
              <Button
                key={index}
                variant={currentQuestionIndex === index ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleQuestionNavigation(index)}
                sx={{
                  minWidth: '50px',
                  height: '40px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  backgroundColor: currentQuestionIndex === index ? '#3b82f6' : 'transparent',
                  color: currentQuestionIndex === index ? '#ffffff' : '#64748b',
                  borderColor: currentQuestionIndex === index ? '#3b82f6' : '#d1d5db',
                  '&:hover': {
                    backgroundColor: currentQuestionIndex === index ? '#2563eb' : '#f8fafc',
                    borderColor: currentQuestionIndex === index ? '#2563eb' : '#94a3b8'
                  }
                }}
              >
                {index + 1}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Exit Test Dialog */}
        <Dialog
          open={exitDialogOpen}
          onClose={() => setExitDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: '#ef4444', fontWeight: 600 }}>
            Testdan chiqish
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#374151' }}>
              Agar testdan chiqsangiz, vaqt davom etadi va sizning javoblaringiz saqlanmaydi. 
              Rostdan ham chiqishni xohlaysizmi?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setExitDialogOpen(false)} sx={{ color: '#64748b' }}>
              Bekor qilish
            </Button>
            <Button 
              onClick={handleExitTest}
              variant="contained"
              color="error"
              sx={{ ml: 1 }}
            >
              Chiqish
            </Button>
          </DialogActions>
        </Dialog>

        {/* Urgent Submit Dialog */}
        <Dialog
          open={urgentSubmitDialogOpen}
          onClose={() => setUrgentSubmitDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: '#dc2626', fontWeight: 600 }}>
            Testni tez tugatish
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#374151' }}>
              Testni tugatish uchun tugmani bosing. Bu sizning oxirgi imkoniyatingiz!
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setUrgentSubmitDialogOpen(false)} sx={{ color: '#64748b' }}>
              Bekor qilish
            </Button>
            <Button 
              onClick={() => {
                setUrgentSubmitDialogOpen(false);
                handleSubmitTest();
              }}
              variant="contained"
              color="warning"
              sx={{ ml: 1 }}
            >
              Testni tugatish
            </Button>
          </DialogActions>
        </Dialog>

        {/* Anti-cheating Warning Modal */}
        <WarningModal
          open={showWarning}
          message={warningMessage}
          onClose={closeWarning}
        />

        {/* Test Unban Prompt Modal */}
        <TestUnbanModal
          open={showUnbanPrompt}
          onUnbanSuccess={() => {
            closeUnbanPrompt();
            // Reset warning count and continue test
          }}
          onUnbanFail={() => {
            // User failed to enter code, they will be banned by backend
            closeUnbanPrompt();
          }}
          unbanCode={unbanCode}
          setUnbanCode={setUnbanCode}
          unbanError={unbanError}
          handleUnbanSubmit={handleUnbanSubmit}
        />
      </Box>
    );
  }

  return (
    <Box sx={{
      py: 4,
      backgroundColor: '#ffffff'
    }}>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
          Test topshirish
        </Typography>
      </Box>

      {/* Barcha testlar section with difficulty sorting */}
      <Box sx={{ mb: 6 }} data-aos="fade-up" data-aos-delay="200">
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4
        }}>
          <Typography sx={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1e293b'
          }}>
            📋 Barcha testlar
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SortIcon sx={{ color: '#64748b' }} />
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ 
                minWidth: 120,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                }
              }}
            >
              <MenuItem value="name">Nomi bo'yicha</MenuItem>
              <MenuItem value="difficulty">Qiyinchilik bo'yicha</MenuItem>
              <MenuItem value="easy">Oson</MenuItem>
              <MenuItem value="medium">O'rtacha</MenuItem>
              <MenuItem value="hard">Qiyin</MenuItem>
            </Select>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {getSortedTests().map((test, index) => {
            const alreadyTaken = hasStudentTakenTest(test.id);
            const hasActiveSession = !!activeTestSessions[test.id];

            // Determine button state
            let buttonText = 'Testni boshlash';
            let buttonIcon = <PlayArrowIcon />;
            let buttonColor = '#3b82f6';
            let buttonDisabled = false;
            let buttonAction = () => startTest(test);

            if (hasActiveSession) {
              // Has active session - allow continuing
              buttonText = 'Testni davom ettirish';
              buttonIcon = <PlayArrowIcon />;
              buttonColor = '#10b981'; // Green for continue
              buttonAction = () => continueTest(test);
            } else if (alreadyTaken) {
              // Test already completed
              buttonText = 'Test allaqachon topshirildi';
              buttonIcon = <CheckCircleIcon />;
              buttonColor = '#e5e7eb';
              buttonDisabled = true;
            }

            return (
              <Grid item xs={12} md={6} lg={4} key={test.id}>
                <div data-aos="zoom-in" data-aos-delay={300 + index * 100}>
                  <Card sx={{
                    height: '100%',
                    cursor: buttonDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: buttonDisabled ? '#f8f9fa' : '#ffffff',
                    '&:hover': {
                      transform: buttonDisabled ? 'none' : 'translateY(-4px)',
                      boxShadow: buttonDisabled ? 'none' : '0 12px 40px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                  onClick={() => {
                    if (!buttonDisabled) {
                      navigate(`/student/test-preview/${test.id}`);
                    }
                  }}
                  >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label={difficultyLabels[test.difficulty] || test.difficulty}
                        color={
                          test.difficulty === 'easy' ? 'success' : 
                          test.difficulty === 'medium' ? 'warning' : 'error'
                        }
                        size="small"
                        sx={{ mr: 2 }}
                      />
                      <Typography variant="body2" color="textSecondary">
                        {test.subject}
                      </Typography>
                    </Box>

                    <Typography variant="h6" sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      color: buttonDisabled ? '#6b7280' : '#1e293b'
                    }}>
                      {test.title}
                    </Typography>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {test.description || 'Tavsif mavjud emas'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
                        👨‍🏫 {test.teacherName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ⏱️ {test.time_limit} daqiqa
                      </Typography>
                    </Box>

                    {/* Show active session indicator */}
                    {hasActiveSession && (
                      <Alert severity="info" sx={{ mb: 2, py: 1 }}>
                        ⚡ Faol test seansi mavjud
                      </Alert>
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={buttonAction}
                      disabled={buttonDisabled}
                      sx={{
                        cursor: buttonDisabled ? 'not-allowed' : 'pointer',
                        backgroundColor: buttonColor,
                        color: buttonDisabled ? '#6b7280' : '#ffffff',
                        '&:hover': {
                          backgroundColor: buttonDisabled ? '#e5e7eb' : (hasActiveSession ? '#059669' : '#2563eb'),
                        }
                      }}
                      startIcon={buttonIcon}
                    >
                      {buttonText}
                    </Button>
                  </CardContent>
                </Card>
                </div>
              </Grid>
            );
          })}
        </Grid>

        {getSortedTests().length === 0 && (
          <Paper sx={{ 
            p: 6, 
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0'
          }}>
            <Typography variant="h6" sx={{ 
              color: '#64748b',
              fontWeight: 600,
              mb: 2
            }}>
              {sortBy === 'easy' || sortBy === 'medium' || sortBy === 'hard' 
                ? `${difficultyLabels[sortBy]} testlar topilmadi`
                : 'Hozircha testlar mavjud emas'
              }
            </Typography>
            <Typography sx={{ color: '#94a3b8' }}>
              {sortBy === 'easy' || sortBy === 'medium' || sortBy === 'hard' 
                ? 'Boshqa qiyinchilik darajasini tanlang'
                : 'Admin o\'qituvchilarni va testlarni qo\'shishi kerak'
              }
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default TakeTest;