import React, { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Select,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from '@mui/material';
import {
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useServerTest } from '../../context/ServerTestContext';
import apiService from '../../data/apiService';
import useAntiCheating from '../../hooks/useAntiCheating';
import WarningModal from '../../components/WarningModal';

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

  // Show loading if user is not authenticated
  if (!currentUser) {
    return (
      <Box sx={{
        py: 4,
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Paper sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <Typography sx={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 3
          }}>
            Yuklanmoqda...
          </Typography>
          <LinearProgress sx={{ mb: 2, height: 8, borderRadius: 4 }} />
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Iltimos kuting, sahifa yuklanmoqda...
          </Typography>
        </Paper>
      </Box>
    );
  }

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
  const [searchTerm, setSearchTerm] = useState('');

  // Define handleTestComplete before using it in the hook
  const handleTestComplete = async () => {
    try {
      const result = await submitTest();
      if (result && result.success) {
        setScore(result.score);
        setTestCompleted(true);
        // Update takenTests to include this completed test
        setTakenTests(prev => new Set([...prev, selectedTest.id]));
      } else {
        alert('Test yakunini saqlashda muammo yuz berdi.');
      }
    } catch (error) {
      alert('Test yakunida xatolik. Internet yoki serverda muammo bo‘lishi mumkin.');
      console.error('Failed to complete test:', error);
    }
  };

  // Anti-cheat system
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
    warningCount,
    exitFullscreen,
  } = useAntiCheating(
    sessionStarted, // isActive
    currentSession?.session_id, // sessionId
    currentSession?.warning_count || 0, // initialWarningCount
    currentSession?.unban_prompt_shown || false, // initialUnbanPromptShown
    handleTestComplete // onBan callback
  );
  const [antiCheatModalOpen, setAntiCheatModalOpen] = useState(false);
  const [pendingTest, setPendingTest] = useState(null); // Store test to start after anti-cheat check
  const [modalConfirmed, setModalConfirmed] = useState(false); // Track if user confirmed all requirements



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

  // Filter tests based on search term
  const getFilteredTests = () => {
    const sortedTests = getSortedTests();
    if (!searchTerm) return sortedTests;

    const searchLower = searchTerm.toLowerCase();
    return sortedTests.filter(test => {
      const title = test.title || '';
      const subject = test.subject || '';
      const teacherName = test.teacherName || '';

      return title.toLowerCase().includes(searchLower) ||
             subject.toLowerCase().includes(searchLower) ||
             teacherName.toLowerCase().includes(searchLower);
    });
  };

  useEffect(() => {
    if (currentUser) {
      loadTeachers();
    }
  }, [currentUser]);

  // Check for active sessions for all tests
  useEffect(() => {
    const checkAllActiveSessions = async () => {
      if (allTests.length === 0 || !currentUser) return;

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
  }, [allTests, currentUser]);

  // Check for testId in URL parameters
  useEffect(() => {
    const testIdFromParams = searchParams.get('testId');

    if (testIdFromParams && teachers.length > 0 && currentUser) {
      // Check if there's an active session for this test
      const checkAndHandleTest = async () => {
        try {
          setSessionRecovering(true);

          // Check if student has already taken this test via API
          const attempts = await apiService.getAttempts({ student: currentUser.id, test: testIdFromParams });
          const hasAttempt = attempts && attempts.length > 0;

          if (hasAttempt) {
            // Test already completed - redirect to results page
            navigate('/student/results');
            return;
          }

          const activeSession = await checkActiveSession(testIdFromParams);

          if (activeSession) {
            // Continue existing session
            await continueTestFromSession(activeSession, testIdFromParams);
          } else {
            // Load test and show anti-cheat modal before starting
            const test = await apiService.getTest(testIdFromParams);
            if (test && test.is_active) {
              // Show anti-cheat modal before auto-starting the test
              handleStartTestWithAntiCheat(test);
            }
          }
        } catch (error) {
          console.error('Failed to handle test from URL:', error);
          // If test is already completed, redirect to results
          if (error.message && (error.message.includes('Test already completed') || error.message.includes('400') || error.message.includes('already completed'))) {
            navigate('/student/results');
            return;
          }
          // Clear any session data that might be invalid
          clearSession();
        } finally {
          setSessionRecovering(false);
        }
      };

      checkAndHandleTest();
    }
  }, [searchParams, teachers, navigate, checkActiveSession, currentUser]);

  // Handle session completion
  useEffect(() => {
    if (currentSession && hasTimeRemaining === false && sessionStarted) {
      // Session has expired or completed
      handleTestComplete();
    }
  }, [hasTimeRemaining, sessionStarted]);


  const continueTestFromSession = async (session, testId) => {
    if (!session || !testId) {
      alert("Sessiya yoki test ID topilmadi. Iltimos, sahifani yangilang yoki administratorga murojaat qiling.");
      return;
    }
    try {
      const test = await apiService.getTest(testId);
      if (!test) {
        alert('Test topilmadi.');
        return;
      }
      const questionsData = await apiService.getQuestions({ test: test.id });
      const questionsList = questionsData.results || questionsData;
      setSelectedTest({ ...test, questions: questionsList });
      setAnswers(session.answers || {});
      setCurrentQuestionIndex(0);
    } catch (error) {
      alert('Sessiyani tiklashda muammo yuz berdi.');
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

  // Check if browser is in fullscreen mode
  const isFullscreen = () => {
    // Check standard fullscreen APIs
    const standardFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    // On Mac, also check if window is maximized or in presentation mode
    const isMacFullscreen = window.innerWidth === screen.width && window.innerHeight === screen.height;

    // Accept either standard fullscreen or Mac-style fullscreen
    return standardFullscreen || isMacFullscreen;
  };

  // Handle anti-cheat modal and test start
  const handleStartTestWithAntiCheat = (test) => {
    setPendingTest(test);
    setAntiCheatModalOpen(true);
  };

  // Confirm test start after anti-cheat check
  const confirmStartTest = () => {
    if (!modalConfirmed) {
      alert('Iltimos, barcha talablarni bajarilganligini tasdiqlang!');
      return;
    }

    if (pendingTest) {
      startTest(pendingTest);
      setPendingTest(null);
      setModalConfirmed(false);
    }
    setAntiCheatModalOpen(false);
  };



  const startTest = async (test) => {
    if (!test || !test.id) {
      alert("Test ma'lumotlari to'liq emas yoki noto'g'ri. Iltimos, boshqa test tanlang yoki administratorga murojaat qiling.");
      return;
    }
    try {
      const session = await startTestSession(test.id);
      if (!session) throw new Error('Test session yaratilmagan.');
      const questionsData = await apiService.getQuestions({ test: test.id });
      const questionsList = questionsData.results || questionsData;
      setSelectedTest({ ...test, questions: questionsList });
      setCurrentQuestionIndex(0);
      setAnswers({});
    } catch (error) {
      console.error('Failed to start test:', error);
      // Check if the error is due to test already being completed
      if (error.message && (error.message.includes('Test already completed') || error.message.includes('400'))) {
        // Update takenTests to include this test and redirect to results
        setTakenTests(prev => new Set([...prev, test.id]));
        navigate('/student/results');
      } else {
        alert('Testni boshlashda muammo yuz berdi. Keyinroq qayta urinib ko‘ring.');
      }
    }
  };

  const continueTest = async (test) => {
    if (!test || !test.id) {
      alert("Davom ettirish uchun test ma'lumotlari to'liq emas!");
      return;
    }
    const existingSession = activeTestSessions[test.id];
    if (existingSession) {
      try {
        await continueTestFromSession(existingSession, test.id);
      } catch (error) {
        alert('Davom etuvchilar sessiyasini yuklashda muammo!');
        console.error('Failed to continue test from existing session:', error);
        const updatedSessions = { ...activeTestSessions };
        delete updatedSessions[test.id];
        setActiveTestSessions(updatedSessions);
      }
    } else {
      try {
        const activeSession = await checkActiveSession(test.id);
        if (activeSession) {
          await continueTestFromSession(activeSession, test.id);
        } else {
          await startTest(test);
        }
      } catch (error) {
        alert('Sessiyani davom ettirishda muammo. Keyinroq urinib ko‘ring.');
        console.error('Failed to continue test:', error);
      }
    }
  };

  const handleAnswerChange = async (questionId, answer) => {
    const newAnswers = {
      ...answers,
      [questionId]: answer
    };
    setAnswers(newAnswers);

    // Save to server for persistence
    try {
      await updateAnswers({ [questionId]: answer });
    } catch (error) {
      console.error('Failed to save answer:', error);
      // Revert the local change if server save failed
      const revertedAnswers = { ...answers };
      delete revertedAnswers[questionId];
      setAnswers(revertedAnswers);
      alert('Javob saqlanmadi. Internet yoki serverda muammo bo\'lishi mumkin.');
    }
  };

  const handleExitTest = () => {
    setExitDialogOpen(false);
    clearSession();
    resetTest();
  };

  const handleNext = () => {
    if (currentQuestionIndex < selectedTest.total_questions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
  };


  const handleSubmitTest = () => {
    // Navigate to separate submission page
    navigate('/student/submit-test');
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
            {warningCount > 0 && (
              <Chip
                label={`Ogohlantirish: ${warningCount}/3`}
                color={warningCount >= 3 ? 'error' : 'warning'}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
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
          sx={{
            p: 4,
            backgroundColor: '#ffffff',
            border: '1px solid #e9ecef',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
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
        <Box sx={{ mt: 3 }}>
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
      >
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Test topshirish
        </Typography>
      </Box>

      {/* Barcha testlar section with table layout */}
      <Box sx={{ mb: 6 }}>
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

        {/* Search Input */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Test nomini, fanini yoki o'qituvchi nomini qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          {searchTerm && (
            <Typography sx={{ mt: 1, color: '#64748b', fontSize: '0.875rem' }}>
              {getFilteredTests().length} ta test topildi
            </Typography>
          )}
        </Box>

        <div>
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
                  <TableCell>Qiyinchilik</TableCell>
                  <TableCell>O'qituvchi</TableCell>
                  <TableCell>Vaqt</TableCell>
                  <TableCell>Savollar</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Harakatlar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredTests().map((test) => {
                  const alreadyTaken = hasStudentTakenTest(test.id);
                  const hasActiveSession = !!activeTestSessions[test.id];

                  // Determine button state
                  let buttonText = 'Testni boshlash';
                  let buttonIcon = <PlayArrowIcon />;
                  let buttonColor = '#2563eb';
                  let buttonDisabled = false;
                  let buttonAction = () => handleStartTestWithAntiCheat(test);

                  if (hasActiveSession) {
                    // Has active session - allow continuing
                    buttonText = 'Davom ettirish';
                    buttonIcon = <PlayArrowIcon />;
                    buttonColor = '#059669'; // Green for continue
                    buttonAction = () => continueTest(test);
                  } else if (alreadyTaken) {
                    // Test already completed
                    buttonText = 'Topshirilgan';
                    buttonIcon = <CheckCircleIcon />;
                    buttonColor = '#059669';
                    buttonDisabled = true;
                  }

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
                          {test.title}
                        </Typography>
                        {test.description && (
                          <Typography sx={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            mt: 0.5
                          }}>
                            {test.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{
                          fontWeight: 500,
                          color: '#1e293b',
                          fontSize: '0.875rem'
                        }}>
                          {test.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={difficultyLabels[test.difficulty] || test.difficulty}
                          color={
                            test.difficulty === 'easy' ? 'success' :
                            test.difficulty === 'medium' ? 'warning' : 'error'
                          }
                          size="small"
                          sx={{
                            fontWeight: 600,
                            borderRadius: '6px',
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{
                          fontWeight: 500,
                          color: '#1e293b',
                          fontSize: '0.875rem'
                        }}>
                          {test.teacherName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{
                          fontWeight: 600,
                          color: '#2563eb',
                          fontSize: '0.875rem'
                        }}>
                          {test.time_limit} daq
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{
                          fontWeight: 600,
                          color: '#059669',
                          fontSize: '0.875rem'
                        }}>
                          {test.total_questions}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {hasActiveSession ? (
                          <Chip
                            label="Faol"
                            size="small"
                            sx={{
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              fontWeight: 600,
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          />
                        ) : alreadyTaken ? (
                          <Chip
                            label="Topshirilgan"
                            size="small"
                            sx={{
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              fontWeight: 600,
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          />
                        ) : (
                          <Chip
                            label="Mavjud"
                            size="small"
                            sx={{
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              fontWeight: 600,
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {!alreadyTaken && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={buttonAction}
                              disabled={buttonDisabled}
                              sx={{
                                fontSize: '0.75rem',
                                padding: '4px 8px',
                                minWidth: 'auto',
                                backgroundColor: buttonColor,
                                '&:hover': {
                                  backgroundColor: buttonColor,
                                }
                              }}
                              startIcon={buttonIcon}
                            >
                              {buttonText}
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {getFilteredTests().length === 0 && getSortedTests().length > 0 && (
          <div>
            <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
              <Typography variant="h6" color="textSecondary">
                Qidiruv natijasi bo'yicha test topilmadi
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Qidiruv so'zini o'zgartirib ko'ring
              </Typography>
            </Paper>
          </div>
        )}

        {getSortedTests().length === 0 && (
          <div>
            <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
              <Typography variant="h6" color="textSecondary">
                {sortBy === 'easy' || sortBy === 'medium' || sortBy === 'hard'
                  ? `${difficultyLabels[sortBy]} testlar topilmadi`
                  : 'Hozircha testlar mavjud emas'
                }
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {sortBy === 'easy' || sortBy === 'medium' || sortBy === 'hard'
                  ? 'Boshqa qiyinchilik darajasini tanlang'
                  : 'Admin o\'qituvchilarni va testlarni qo\'shishi kerak'
                }
              </Typography>
            </Paper>
          </div>
        )}

        {/* Anti-Cheat Modal */}
        <Dialog
          open={antiCheatModalOpen}
          onClose={() => setAntiCheatModalOpen(false)}
          maxWidth="md"
          fullWidth
          disableEscapeKeyDown
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: '16px',
              padding: '8px'
            }
          }}
        >
          <DialogTitle sx={{
            color: '#1e293b',
            fontWeight: 700,
            fontSize: '1.5rem',
            textAlign: 'center',
            pb: 1
          }}>
            ⚠️ Testni boshlashdan oldin
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
            <Typography sx={{
              color: '#374151',
              fontSize: '1.1rem',
              mb: 3,
              fontWeight: 500
            }}>
              Test davomida quyidagi qoidalarga rioya qiling:
            </Typography>

            <Box sx={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              p: 3,
              mb: 3,
              border: '1px solid #e2e8f0'
            }}>
              <Typography sx={{
                color: '#1e293b',
                fontWeight: 600,
                mb: 2,
                fontSize: '1.1rem'
              }}>
                📋 Anti-Cheat qoidalari:
              </Typography>
              <Box sx={{ textAlign: 'left', maxWidth: '400px', mx: 'auto' }}>
                <Typography sx={{ color: '#374151', mb: 1, fontSize: '0.95rem' }}>
                  • Test davomida boshqa oynalarga o'tmang
                </Typography>
                <Typography sx={{ color: '#374151', mb: 1, fontSize: '0.95rem' }}>
                  • Boshqa dasturlarni ishga tushirmang
                </Typography>
                <Typography sx={{ color: '#374151', mb: 1, fontSize: '0.95rem' }}>
                  • Testni to'xtatib qo'ymang yoki yangilamang
                </Typography>
                <Typography sx={{ color: '#374151', mb: 1, fontSize: '0.95rem' }}>
                  • Vaqt tugaguncha testni yakunlang
                </Typography>
              </Box>
            </Box>

            <Typography sx={{
              color: '#dc2626',
              fontWeight: 600,
              fontSize: '1.2rem',
              mb: 2
            }}>
              F11 tugmasini bosib to'liq ekran rejimiga o'ting!
            </Typography>

            <Typography sx={{
              color: '#64748b',
              fontSize: '0.9rem',
              mb: 3
            }}>
              Test faqat to'liq ekran rejimida boshlanadi
            </Typography>

            {/* Additional requirements */}
            <Box sx={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              p: 3,
              mb: 3
            }}>
              <Typography sx={{
                color: '#1e293b',
                fontWeight: 600,
                mb: 2,
                fontSize: '1.1rem'
              }}>
                📋 Testdan oldin tekshiring:
              </Typography>
              <Box sx={{ textAlign: 'left', maxWidth: '400px', mx: 'auto' }}>
                <Typography sx={{ color: '#374151', mb: 1, fontSize: '0.95rem' }}>
                  • Qurilmangiz zaryadi kam bo'lsa, uni quvvat manbaiga ulang
                </Typography>
                <Typography sx={{ color: '#374151', mb: 1, fontSize: '0.95rem' }}>
                  • Internetga to'g'ri ulanganligingizni tekshiring
                </Typography>
                <Typography sx={{ color: '#374151', mb: 1, fontSize: '0.95rem' }}>
                  • Internet uzulishlari bo'lmasligiga amin bo'ling
                </Typography>
                <Typography sx={{ color: '#374151', mb: 1, fontSize: '0.95rem' }}>
                  • Barcha talablar bajarilganligini tasdiqlang
                </Typography>
              </Box>
            </Box>

            {/* Anti-cheat warning */}
            <Box sx={{
              backgroundColor: '#fef2f2',
              border: '2px solid #dc2626',
              borderRadius: '12px',
              p: 3,
              mb: 2,
              textAlign: 'center'
            }}>
              <Typography sx={{
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '1.2rem',
                mb: 1
              }}>
                ⚠️ ANTI-CHEAT OGOHLANTIRISH
              </Typography>
              <Typography sx={{
                color: '#dc2626',
                fontSize: '1rem',
                fontWeight: 600
              }}>
                Agar test sahifani Fullscreenga o'tkazmagan bo'lsangiz, ANTI-CHEAT tizimi ogohlantirish beradi!
              </Typography>
            </Box>

            {/* Confirmation checkbox */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              p: 2,
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={modalConfirmed}
                    onChange={(e) => setModalConfirmed(e.target.checked)}
                    sx={{
                      color: '#64748b',
                      '&.Mui-checked': {
                        color: '#10b981',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{
                    color: '#374151',
                    fontWeight: 500,
                    fontSize: '0.95rem'
                  }}>
                    Hammasi bajarilgan
                  </Typography>
                }
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{
            justifyContent: 'center',
            gap: 2,
            pb: 3,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button
              onClick={() => {
                setAntiCheatModalOpen(false);
                setPendingTest(null);
                setModalConfirmed(false);
              }}
              variant="outlined"
              sx={{
                borderColor: '#d1d5db',
                color: '#374151',
                px: 4,
                py: 1.5,
                borderRadius: '8px',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#f9fafb' }
              }}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={confirmStartTest}
              variant="contained"
              sx={{
                backgroundColor: '#10b981',
                px: 4,
                py: 1.5,
                borderRadius: '8px',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#059669' }
              }}
            >
              Davom ettirish
            </Button>
          </DialogActions>
        </Dialog>

        {/* Anti-Cheat Warning Modal */}
        <WarningModal
          open={showWarning}
          message={warningMessage}
          onClose={closeWarning}
        />

        {/* Unban Prompt Modal */}
        {showUnbanPrompt && (
          <Dialog
            open={showUnbanPrompt}
            onClose={closeUnbanPrompt}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
          >
            <DialogTitle sx={{
              backgroundColor: '#dc2626',
              color: 'white',
              textAlign: 'center',
              fontWeight: 700
            }}>
              Profilingiz bloklandi!
            </DialogTitle>
            <DialogContent sx={{ pt: 3, textAlign: 'center' }}>
              <Typography sx={{ mb: 2, color: '#374151' }}>
                Siz 3 marta test qoidalarini buzdingiz. Profilingiz bloklandi.
              </Typography>
              <Typography sx={{ mb: 3, color: '#6b7280', fontSize: '0.9rem' }}>
                Blokdan chiqish uchun 4 xonali kodni kiriting:
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Kodni kiriting"
                value={unbanCode}
                onChange={(e) => setUnbanCode(e.target.value)}
                inputProps={{ maxLength: 4 }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    letterSpacing: '0.5rem'
                  }
                }}
              />
              {unbanError && (
                <Typography sx={{ color: '#dc2626', fontSize: '0.9rem' }}>
                  {unbanError}
                </Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button
                onClick={() => handleUnbanSubmit(unbanCode)}
                variant="contained"
                sx={{
                  backgroundColor: '#10b981',
                  '&:hover': { backgroundColor: '#059669' }
                }}
              >
                Kodni tekshirish
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </Box>
  );
};

export default TakeTest;