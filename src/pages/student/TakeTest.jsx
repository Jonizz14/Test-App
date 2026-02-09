import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Tag,
  Radio,
  Input,
  Progress,
  Modal,
  Alert,
  Select,
  ConfigProvider,
  Row,
  Col,
  Table,
  Spin,
  Divider,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  SortAscendingOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useServerTest } from '../../context/ServerTestContext';
import { useSettings } from '../../context/SettingsContext';
import apiService from '../../data/apiService';
import LaTeXPreview from '../../components/LaTeXPreview';
import MathSymbols from '../../components/MathSymbols';
import 'animate.css';
import {
  disableDevToolsShortcuts,
  disableContextMenu,
  disableCopyPaste
} from '../../utils/security';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const TakeTest = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
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
  const _location = useLocation();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [_teacherTests, _setTeacherTests] = useState({});
  const [allTests, setAllTests] = useState([]);
  const [takenTests, setTakenTests] = useState(new Set());
  const [selectedTest, setSelectedTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sessionRecovering, setSessionRecovering] = useState(false);
  const [activeTestSessions, setActiveTestSessions] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [mathSymbolsOpen, setMathSymbolsOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [urgentSubmitDialogOpen, setUrgentSubmitDialogOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [warningsCount, setWarningsCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastWarningReason, setLastWarningReason] = useState('');
  const [showDailyLimitModal, setShowDailyLimitModal] = useState(false);
  const [dailyLimitInfo, setDailyLimitInfo] = useState({ dailyLimit: 5, dailyTestsTaken: 0, isPremium: false });

  const difficultyLabels = {
    easy: 'Oson',
    medium: 'O\'rtacha',
    hard: 'Qiyin'
  };

  const getSortedTests = () => {
    let filteredTests = allTests.filter(test => test.is_active);

    if (sortBy === 'easy' || sortBy === 'medium' || sortBy === 'hard') {
      filteredTests = filteredTests.filter(test => test.difficulty === sortBy);
    }

    if (sortBy === 'difficulty') {
      const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
      filteredTests.sort((a, b) => (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0));
    } else if (sortBy === 'name') {
      filteredTests.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      filteredTests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filteredTests;
  };

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



  const continueTestFromSession = useCallback(async (session, testId) => {
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
  }, [clearSession]);

  const loadTeachers = useCallback(async () => {
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
      _setTeacherTests(testsMap);
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
  }, [currentUser]);

  const hasStudentTakenTest = (testId) => {
    return takenTests.has(testId);
  };

  const startTest = useCallback(async (test) => {
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

      // Check for daily limit error
      if (error.response?.data?.error === 'daily_limit_reached') {
        const limitData = error.response.data;
        setDailyLimitInfo({
          dailyLimit: limitData.daily_limit || 5,
          dailyTestsTaken: limitData.daily_tests_taken || 0,
          isPremium: limitData.is_premium || false
        });
        setShowDailyLimitModal(true);
        return;
      }

      if (error.message && (error.message.includes('Test already completed') || error.message.includes('400'))) {
        setTakenTests(prev => new Set([...prev, test.id]));
        navigate('/student/results');
      } else {
        alert('Testni boshlashda muammo yuz berdi. Keyinroq qayta urinib ko\'ring.');
      }
    }
  }, [navigate, startTestSession]);

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

    try {
      await updateAnswers({ [questionId]: answer });
    } catch (error) {
      console.error('Failed to save answer:', error);
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
    if (selectedTest && currentQuestionIndex < selectedTest.total_questions - 1) {
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

  const handleSymbolSelect = (symbol) => {
    if (selectedTest && currentQuestionIndex >= 0) {
      const currentAnswer = answers[selectedTest.questions[currentQuestionIndex].id] || '';
      const newAnswer = currentAnswer + symbol;
      handleAnswerChange(selectedTest.questions[currentQuestionIndex].id, newAnswer);
    }
    setMathSymbolsOpen(false);
  };

  const handleSubmitTest = useCallback(() => {
    navigate('/student/submit-test');
  }, [navigate]);

  const resetTest = () => {
    setSelectedTest(null);
    setTestCompleted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setScore(0);
    setWarningsCount(0);
    setShowWarningModal(false);
    clearSession();
  };

  const handleViolation = useCallback(async (reason) => {
    if (!sessionStarted || !settings?.features?.antiCheat) return;

    setLastWarningReason(reason);
    setWarningsCount(prev => prev + 1);
    setShowWarningModal(true);

    try {
      await apiService.logWarning({
        test_id: selectedTest?.id,
        reason: reason,
        details: `Question index: ${currentQuestionIndex}`
      });
    } catch (error) {
      console.error('Failed to log warning:', error);
    }

    // Auto-submit if more than 3 warnings
    if (warningsCount >= 2) {
      message.error("Ko'p marta qoidabuzarlik qilganingiz uchun test avtomatik yakunlandi!");
      handleSubmitTest();
    }
  }, [sessionStarted, selectedTest, currentQuestionIndex, warningsCount, handleSubmitTest]);

  useEffect(() => {
    if (sessionStarted) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          handleViolation('Boshqa oynaga o\'tish (Tab switching)');
        }
      };

      const handleKeyDown = (e) => {
        if (disableDevToolsShortcuts(e) === false) {
          handleViolation('DevTools ochishga urinish (Shortcut)');
        }
      };

      const handleContext = (e) => {
        disableContextMenu(e);
        handleViolation('Sichqonchaning o\'ng tugmasini bosish');
      };

      const handleCP = (e) => {
        disableCopyPaste(e);
        handleViolation('Nusxa olish yoki qo\'yish (Copy/Paste)');
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContext);
      document.addEventListener('copy', handleCP);
      document.addEventListener('paste', handleCP);
      document.addEventListener('cut', handleCP);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('contextmenu', handleContext);
        document.removeEventListener('copy', handleCP);
        document.removeEventListener('paste', handleCP);
        document.removeEventListener('cut', handleCP);
      };
    }
  }, [sessionStarted, handleViolation]);

  useEffect(() => {
    if (currentUser) {
      loadTeachers();
    }
  }, [currentUser, loadTeachers]);

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
        } catch (_error) {
          console.debug(`No active session for test ${test.id}`);
        }
      }

      setActiveTestSessions(sessionsMap);
    };

    checkAllActiveSessions();
  }, [allTests, currentUser, checkActiveSession]);

  useEffect(() => {
    const testIdFromParams = searchParams.get('testId');

    if (testIdFromParams && teachers.length > 0 && currentUser) {
      const checkAndHandleTest = async () => {
        try {
          setSessionRecovering(true);

          const attempts = await apiService.getAttempts({ student: currentUser.id, test: testIdFromParams });
          const hasAttempt = attempts && attempts.length > 0;

          if (hasAttempt) {
            navigate('/student/results');
            return;
          }

          const activeSession = await checkActiveSession(testIdFromParams);

          if (activeSession) {
            await continueTestFromSession(activeSession, testIdFromParams);
          } else {
            const test = await apiService.getTest(testIdFromParams);
            if (test && test.is_active) {
              startTest(test);
            }
          }
        } catch (error) {
          console.error('Failed to handle test from URL:', error);
          if (error.message && (error.message.includes('Test already completed') || error.message.includes('400') || error.message.includes('already completed'))) {
            navigate('/student/results');
            return;
          }
          clearSession();
        } finally {
          setSessionRecovering(false);
        }
      };

      checkAndHandleTest();
    }
  }, [searchParams, teachers, navigate, checkActiveSession, currentUser, continueTestFromSession, startTest, clearSession]);

  useEffect(() => {
    if (currentSession && hasTimeRemaining === false && sessionStarted) {
      handleSubmitTest();
    }
  }, [currentSession, hasTimeRemaining, sessionStarted, handleSubmitTest]);

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, fontWeight: 700, textTransform: 'uppercase' }}>Yuklanmoqda...</Text>
      </div>
    );
  }

  // Show loading during session recovery
  if (sessionRecovering) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, fontWeight: 900, textTransform: 'uppercase' }}>Test seansingiz tiklanmoqda...</Text>
      </div>
    );
  }



  if (sessionStarted && selectedTest) {
    const testQuestions = selectedTest.questions || [];
    const currentQuestion = testQuestions[currentQuestionIndex];

    if (!testQuestions.length || !currentQuestion) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
          <Spin size="large" />
          <Text style={{ marginTop: 16, fontWeight: 700, textTransform: 'uppercase' }}>Savollar yuklanmoqda...</Text>
        </div>
      );
    }

    return (
      <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
        <div style={{ padding: '40px 0' }}>
          {error && <Alert message={error} type="error" style={{ border: '3px solid #000', boxShadow: '4px 4px 0px #000', fontWeight: 700, marginBottom: '24px' }} showIcon />}

          {/* Test Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '16px', backgroundColor: '#4f46e5', color: '#fff', border: '4px solid #000', boxShadow: '8px 8px 0px #000' }}>
            <div>
              <Text style={{ color: '#e0e7ff', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', letterSpacing: '1px' }}>Hozirgi test</Text>
              <Title level={4} style={{ color: '#fff', margin: 0, textTransform: 'uppercase', fontWeight: 900, fontSize: '1.4rem', textShadow: '2px 2px 0px #000' }}>{selectedTest.title}</Title>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                <ClockCircleOutlined style={{ fontSize: '20px' }} />
                <Text style={{ color: '#fff', fontSize: '24px', fontWeight: 900, letterSpacing: '1px', textShadow: '2px 2px 0px #000' }}>{formatTime(timeRemaining)}</Text>
              </div>
              <Tag color="volcano" style={{ margin: 0, border: '2px solid #000', fontWeight: 800 }}>{selectedTest.subject}</Tag>
              <Text style={{ color: '#fff', fontSize: '12px', fontWeight: 700, display: 'block', marginTop: '4px' }}>{currentQuestionIndex + 1} / {selectedTest.total_questions} SAVOL</Text>
            </div>
          </div>

          <Progress
            percent={((currentQuestionIndex + 1) / selectedTest.total_questions) * 100}
            strokeColor="#fbbf24"
            trailColor="#e2e8f0"
            strokeWidth={16}
            style={{ borderRadius: 0, marginBottom: '32px', filter: 'drop-shadow(4px 4px 0px #000)' }}
            showInfo={false}
          />

          <Card style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '12px 12px 0px #000', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <Button danger onClick={() => setExitDialogOpen(true)} style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900, textTransform: 'uppercase', height: '36px' }}>
                Testdan chiqish
              </Button>
            </div>

            {currentQuestion.image && (
              <div style={{ marginBottom: '32px', textAlign: 'center', backgroundColor: '#f8fafc', padding: '16px', border: '2px dashed #000' }}>
                <img src={currentQuestion.image} alt="Question" style={{ maxWidth: '100%', maxHeight: '500px', border: '4px solid #000', objectFit: 'contain' }} />
              </div>
            )}

            <div style={{ marginBottom: '32px' }}>
              <div style={{ backgroundColor: '#4f46e5', color: '#fff', display: 'inline-block', padding: '4px 12px', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', marginBottom: '12px', border: '2px solid #000', boxShadow: '4px 4px 0px #000' }}>Savol</div>
              <LaTeXPreview text={currentQuestion.question_text} style={{ fontSize: '1.3rem', lineHeight: 1.5, color: '#000', fontWeight: 600 }} />
            </div>

            {currentQuestion.question_type === 'multiple_choice' && (
              <Radio.Group value={answers[currentQuestion.id] || ''} onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)} style={{ width: '100%' }}>
                <Row gutter={[16, 16]}>
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = answers[currentQuestion.id] === option.text;
                    const optionImageField = ['option_a_image', 'option_b_image', 'option_c_image', 'option_d_image'][index];
                    const optionImage = currentQuestion[optionImageField];

                    return (
                      <Col xs={24} key={index}>
                        <Radio value={option.text} className="brutalist-radio" style={{ width: '100%', margin: 0 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            backgroundColor: isSelected ? '#4f46e5' : '#fff',
                            color: isSelected ? '#fff' : '#000',
                            border: '4px solid #000',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: isSelected ? 'translate(-4px, -4px)' : 'none',
                            boxShadow: isSelected ? '8px 8px 0px #000' : '4px 4px 0px #000'
                          }}>
                            <div style={{
                              fontWeight: 900,
                              fontSize: '1.1rem',
                              backgroundColor: isSelected ? '#fff' : '#e2e8f0',
                              color: isSelected ? '#4f46e5' : '#000',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #000'
                            }}>{String.fromCharCode(65 + index)}</div>
                            <div style={{ flex: 1 }}>
                              <LaTeXPreview text={option.text} />
                            </div>
                            {optionImage && <img src={optionImage} alt={`Option ${String.fromCharCode(65 + index)}`} style={{ maxWidth: '80px', maxHeight: '50px', border: '2px solid #000', objectFit: 'contain', backgroundColor: '#fff' }} />}
                          </div>
                        </Radio>
                      </Col>
                    );
                  })}
                </Row>
              </Radio.Group>
            )}

            {currentQuestion.question_type === 'short_answer' && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <Text style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '12px' }}>Sizning javobingiz:</Text>
                  <Button size="small" onClick={() => setMathSymbolsOpen(true)} style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800, backgroundColor: '#fbbf24', color: '#000' }}>🧮 Belgilar</Button>
                </div>
                <Input.TextArea
                  placeholder="Javobingizni kiriting..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  rows={4}
                  style={{ borderRadius: 0, border: '4px solid #000', fontWeight: 600, fontSize: '1.2rem', padding: '16px', backgroundColor: '#f8fafc' }}
                />
                {(answers[currentQuestion.id] || '').trim() && (
                  <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#e0e7ff', border: '2px dashed #4f46e5' }}>
                    <Text style={{ display: 'block', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#4f46e5', marginBottom: '8px' }}>Preview:</Text>
                    <LaTeXPreview text={answers[currentQuestion.id]} />
                  </div>
                )}
              </div>
            )}

            <Divider style={{ borderTop: '4px solid #000', margin: '40px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <Button size="large" onClick={handlePrevious} disabled={currentQuestionIndex === 0} style={{ borderRadius: 0, border: '4px solid #000', boxShadow: currentQuestionIndex === 0 ? 'none' : '6px 6px 0px #000', fontWeight: 900, textTransform: 'uppercase', height: '56px', flex: 1, backgroundColor: '#fff' }}>Oldingi</Button>

              {currentQuestionIndex === selectedTest.total_questions - 1 ? (
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                  <Button size="large" type="primary" onClick={handleSubmitTest} style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 900, textTransform: 'uppercase', height: '56px', flex: 1, backgroundColor: '#16a34a' }}>Tugatish (Finish)</Button>
                  <Button size="large" onClick={() => setUrgentSubmitDialogOpen(true)} style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 900, textTransform: 'uppercase', height: '56px', backgroundColor: '#fff', color: '#d97706', borderColor: '#000' }}>Tezkor</Button>
                </div>
              ) : (
                <Button size="large" type="primary" onClick={handleNext} style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 900, textTransform: 'uppercase', height: '56px', flex: 1, backgroundColor: '#4f46e5' }}>Keyingi</Button>
              )}
            </div>
          </Card>

          {/* Nav Panel */}
          <Card style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '10px 10px 0px #000' }}>
            <Title level={5} style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '16px', fontSize: '12px' }}>Savollar navigatsiyasi</Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {testQuestions.map((_, index) => {
                const isCurrent = currentQuestionIndex === index;
                const hasAnswer = !!answers[testQuestions[index].id];
                return (
                  <Button
                    key={index}
                    onClick={() => handleQuestionNavigation(index)}
                    style={{
                      borderRadius: 0,
                      border: '2px solid #000',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      backgroundColor: isCurrent ? '#4f46e5' : (hasAnswer ? '#bbf7d0' : '#fff'),
                      color: isCurrent ? '#fff' : '#000',
                      boxShadow: isCurrent ? 'none' : '3px 3px 0px #000',
                      transform: isCurrent ? 'translate(2px, 2px)' : 'none'
                    }}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* Modals */}
          <Modal
            title={<Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>Testdan chiqish</Title>}
            open={exitDialogOpen}
            onCancel={() => setExitDialogOpen(false)}
            centered
            styles={{ mask: { backdropFilter: 'blur(4px)' } }}
            footer={[
              <Button key="no" onClick={() => setExitDialogOpen(false)} style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900 }}>BEKOR QILISH</Button>,
              <Button key="yes" danger onClick={handleExitTest} style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900, backgroundColor: '#000', color: '#fff' }}>CHIQUV</Button>
            ]}
          >
            <Paragraph style={{ fontWeight: 600, fontSize: '1.1rem', margin: '20px 0' }}>Agar testdan chiqsangiz, vaqt davom etaveradi. Rostdan ham chiqmoqchimisiz?</Paragraph>
          </Modal>

          <Modal
            title={<Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', color: '#d97706' }}>Tezkor tugatish</Title>}
            open={urgentSubmitDialogOpen}
            onCancel={() => setUrgentSubmitDialogOpen(false)}
            centered
            styles={{ mask: { backdropFilter: 'blur(4px)' } }}
            footer={[
              <Button key="no" onClick={() => setUrgentSubmitDialogOpen(false)} style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900 }}>BEKOR QILISH</Button>,
              <Button key="yes" onClick={() => { setUrgentSubmitDialogOpen(false); handleSubmitTest(); }} style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900, backgroundColor: '#d97706', color: '#fff' }}>TASDIQLASH</Button>
            ]}
          >
            <Paragraph style={{ fontWeight: 600, fontSize: '1.1rem', margin: '20px 0' }}>Testni hoziroq yakunlamoqchimisiz? Barcha javoblaringiz tekshiruvga yuboriladi.</Paragraph>
          </Modal>

          <MathSymbols open={mathSymbolsOpen} onClose={() => setMathSymbolsOpen(false)} onSymbolSelect={handleSymbolSelect} />

          <Modal
            title={<Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', color: '#ff4d4f' }}>DIQQAT! QOIDABUZARLIK</Title>}
            open={showWarningModal}
            onOk={() => setShowWarningModal(false)}
            onCancel={() => setShowWarningModal(false)}
            centered
            footer={[
              <Button key="ok" type="primary" onClick={() => setShowWarningModal(false)} style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900, backgroundColor: '#000' }}>TUSHUNDIM</Button>
            ]}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <WarningOutlined style={{ fontSize: '64px', color: '#ff4d4f', marginBottom: '20px' }} />
              <Paragraph style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                {lastWarningReason} aniqlandi!
              </Paragraph>
              <Paragraph style={{ fontWeight: 600 }}>
                Test davomida boshqa oynalarga o'tish yoki DevTools dan foydalanish taqiqlanadi.
                Sizda yana <Text type="danger" style={{ fontWeight: 900 }}>{3 - warningsCount}</Text> ta imkoniyat qoldi.
                Shundan so'ng test bekor qilinadi!
              </Paragraph>
            </div>
          </Modal>

          <style>{`
            .brutalist-radio .ant-radio { display: none; }
            .brutalist-radio .ant-radio-wrapper { padding: 0; margin: 0; width: 100%; }
            .brutalist-radio { margin: 0 !important; }
          `}</style>
        </div>
      </ConfigProvider>
    );
  }

  const testColumns = [
    {
      title: 'Test',
      dataIndex: 'title',
      key: 'title',
      render: (title, test) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#000', color: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>T</div>
          <div>
            <Text style={{ fontWeight: 700, fontSize: '0.9rem' }}>{title}</Text>
            {test.description && <div style={{ fontSize: '11px', color: '#666' }}>{test.description}</div>}
          </div>
        </div>
      ),
    },
    {
      title: 'Fan',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => (
        <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, backgroundColor: '#fff', color: '#000', textTransform: 'uppercase', fontSize: '10px' }}>{subject}</Tag>
      ),
    },
    {
      title: 'Qiyinchilik',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => (
        <Tag color={difficulty === 'easy' ? 'green' : difficulty === 'medium' ? 'orange' : 'red'} style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>
          {difficultyLabels[difficulty] || difficulty}
        </Tag>
      ),
    },
    {
      title: 'O\'qituvchi',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (name) => <Text style={{ fontWeight: 600 }}>{name}</Text>,
    },
    {
      title: 'Vaqt / Savol',
      key: 'info',
      render: (_, test) => (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#000', color: '#fff', padding: '4px 8px', fontWeight: 900, fontSize: '11px', border: '2px solid #000' }}>{test.time_limit}M</div>
          <div style={{ backgroundColor: '#fff', color: '#000', padding: '4px 8px', fontWeight: 900, fontSize: '11px', border: '2px solid #000' }}>{test.total_questions}Q</div>
        </div>
      ),
    },
    {
      title: 'Harakat',
      key: 'actions',
      width: 150,
      render: (_, test) => {
        const alreadyTaken = hasStudentTakenTest(test.id);
        const hasActive = !!activeTestSessions[test.id];

        if (alreadyTaken) {
          return (
            <Button
              onClick={() => navigate(`/student/results?highlight=${test.id}`)}
              style={{
                borderRadius: 0,
                border: '3px solid #000',
                backgroundColor: '#e0e7ff', // Light indigo/blue
                color: '#000',
                fontWeight: 900,
                textTransform: 'uppercase',
                fontSize: '11px',
                height: '36px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              TOPShIRILGAN
            </Button>
          );
        }

        return (
          <Button
            type="primary"
            onClick={hasActive ? () => continueTest(test) : () => startTest(test)}
            style={{
              borderRadius: 0,
              border: '3px solid #000',
              boxShadow: '4px 4px 0px #000',
              backgroundColor: hasActive ? '#f59e0b' : '#4f46e5',
              color: '#fff',
              fontWeight: 900,
              textTransform: 'uppercase',
              fontSize: '11px',
              height: '36px',
              width: '100%'
            }}
            icon={hasActive ? <PlayCircleOutlined /> : <PlayCircleOutlined />}
          >
            {hasActive ? 'Davom etish' : 'Boshlash'}
          </Button>
        );
      },
    },
  ];

  return (
    <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
      <div style={{ padding: '40px 0' }}>
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '60px' }}>
          <div style={{ backgroundColor: '#000', color: '#fff', padding: '8px 16px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', display: 'inline-block' }}>
            Testlar
          </div>
          <Title level={1} style={{ fontWeight: 900, fontSize: '2.5rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#000' }}>
            Test topshirish
          </Title>
          <div style={{ width: '80px', height: '10px', backgroundColor: '#000', margin: '24px 0' }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Bilimingizni sinab ko'ring. Mavjud testlardan birini tanlang va topshirishni boshlang.
          </Paragraph>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ border: '3px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 700, marginBottom: '40px' }} />}

        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '40px' }}>
          <Card style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '10px 10px 0px #000' }}>
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} md={18}>
                <Search
                  placeholder="Test nomi, fan yoki o'qituvchini qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: 0, width: '100%' }}
                  size="large"
                />
              </Col>
              <Col xs={24} md={6}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                  <SortAscendingOutlined style={{ fontSize: '20px' }} />
                  <Select value={sortBy} onChange={setSortBy} style={{ width: '100%' }} size="large">
                    <Select.Option value="date">Sana</Select.Option>
                    <Select.Option value="name">Nomi</Select.Option>
                    <Select.Option value="difficulty">Qiyinchilik</Select.Option>
                    <Select.Option value="easy">Osonlar</Select.Option>
                    <Select.Option value="medium">O'rtachalar</Select.Option>
                    <Select.Option value="hard">Qiyinlar</Select.Option>
                  </Select>
                </div>
              </Col>
            </Row>
          </Card>
        </div>

        <div className="animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
          <Table
            columns={testColumns}
            dataSource={getFilteredTests().map(test => ({ ...test, key: test.id }))}
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              onShowSizeChange: (_, size) => setPageSize(size),
            }}
            rowHoverable={false}
            style={{ border: '4px solid #000', boxShadow: '10px 10px 0px #000' }}
            scroll={{ x: 800 }}
          />
        </div>
      </div>

      {/* Daily Limit Modal */}
      <Modal
        open={showDailyLimitModal}
        onCancel={() => setShowDailyLimitModal(false)}
        footer={null}
        centered
        closable={false}
        width={480}
        styles={{
          content: {
            borderRadius: 0,
            border: '6px solid #000',
            boxShadow: '16px 16px 0px #000',
            padding: 0,
          },
          body: { padding: 0 },
        }}
      >
        <div style={{ padding: '32px' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#ef4444',
            color: '#fff',
            padding: '6px 12px',
            fontWeight: 900,
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '16px'
          }}>
            Kunlik Limit
          </div>

          <Typography.Title level={2} style={{
            margin: 0,
            fontWeight: 900,
            fontSize: '1.8rem',
            lineHeight: 1.1,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            color: '#000',
            marginBottom: '16px'
          }}>
            Bugungi testlar tugadi!
          </Typography.Title>

          <Typography.Paragraph style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#333',
            marginBottom: '24px'
          }}>
            Sizning kunlik test ishlash limitingiz tugadi.
            {!dailyLimitInfo.isPremium && (
              <> Premium obuna bilan kuniga <strong>30 ta</strong> test ishlang!</>
            )}
          </Typography.Paragraph>

          <div style={{
            backgroundColor: '#f3f4f6',
            border: '3px solid #000',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography.Text style={{ fontWeight: 900, fontSize: '14px', textTransform: 'uppercase' }}>
                  Bugungi testlar
                </Typography.Text>
              </div>
              <div>
                <Typography.Text style={{ fontWeight: 900, fontSize: '24px' }}>
                  {dailyLimitInfo.dailyTestsTaken}/{dailyLimitInfo.dailyLimit}
                </Typography.Text>
              </div>
            </div>
            <Progress
              percent={100}
              strokeColor="#ef4444"
              trailColor="#e5e7eb"
              showInfo={false}
              style={{ marginTop: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {!dailyLimitInfo.isPremium && (
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  setShowDailyLimitModal(false);
                  navigate('/student/pricing');
                }}
                style={{
                  flex: 1,
                  borderRadius: 0,
                  border: '3px solid #000',
                  boxShadow: '4px 4px 0px #000',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  height: '48px',
                  backgroundColor: '#22c55e',
                }}
              >
                Premium Olish
              </Button>
            )}
            <Button
              size="large"
              onClick={() => setShowDailyLimitModal(false)}
              style={{
                flex: dailyLimitInfo.isPremium ? 1 : undefined,
                borderRadius: 0,
                border: '3px solid #000',
                boxShadow: '4px 4px 0px #000',
                fontWeight: 800,
                textTransform: 'uppercase',
                height: '48px',
              }}
            >
              Yopish
            </Button>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default TakeTest;