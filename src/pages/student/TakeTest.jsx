import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, Typography, Row, Col, Button, Tag, Avatar, Radio, Input, Progress, Modal, Alert, Select, Table, Space, Checkbox } from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  SortAscendingOutlined,
  SearchOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useServerTest } from '../../context/ServerTestContext';
import apiService from '../../data/apiService';
import LaTeXPreview from '../../components/LaTeXPreview';
import MathSymbols from '../../components/MathSymbols';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

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

  if (!currentUser) {
    return (
      <div style={{
        paddingTop: '16px',
        paddingBottom: '16px',
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card style={{
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <Title level={2} style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '16px'
          }}>
            Yuklanmoqda...
          </Title>
          <Progress percent={100} status="active" style={{ marginBottom: '8px' }} />
          <Text style={{ color: '#64748b' }}>
            Iltimos kuting, sahifa yuklanmoqda...
          </Text>
        </Card>
      </div>
    );
  }

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [teacherTests, setTeacherTests] = useState({});
  const [allTests, setAllTests] = useState([]); 
  const [takenTests, setTakenTests] = useState(new Set());
  const [selectedTest, setSelectedTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [sortBy, setSortBy] = useState('date'); 
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [urgentSubmitDialogOpen, setUrgentSubmitDialogOpen] = useState(false);
  const [sessionRecovering, setSessionRecovering] = useState(false);
  const [activeTestSessions, setActiveTestSessions] = useState({}); 
  const [searchTerm, setSearchTerm] = useState('');
  const [mathSymbolsOpen, setMathSymbolsOpen] = useState(false);

  const handleTestComplete = async () => {
    try {
      const result = await submitTest();
      if (result && result.success) {
        setScore(result.score);
        setTestCompleted(true);
        setTakenTests(prev => new Set([...prev, selectedTest.id]));
      } else {
        alert('Test yakunini saqlashda muammo yuz berdi.');
      }
    } catch (error) {
      alert('Test yakunida xatolik. Internet yoki serverda muammo bo‘lishi mumkin.');
      console.error('Failed to complete test:', error);
    }
  };

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

  useEffect(() => {
    if (currentUser) {
      loadTeachers();
    }
  }, [currentUser]);

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
          console.debug(`No active session for test ${test.id}`);
        }
      }

      setActiveTestSessions(sessionsMap);
    };

    checkAllActiveSessions();
  }, [allTests, currentUser]);

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
  }, [searchParams, teachers, navigate, checkActiveSession, currentUser]);

  useEffect(() => {
    if (currentSession && hasTimeRemaining === false && sessionStarted) {
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

  const handleSymbolSelect = (symbol) => {
    if (selectedTest && currentQuestionIndex >= 0) {
      const currentAnswer = answers[selectedTest.questions[currentQuestionIndex].id] || '';
      const newAnswer = currentAnswer + symbol;
      handleAnswerChange(selectedTest.questions[currentQuestionIndex].id, newAnswer);
    }
    setMathSymbolsOpen(false);
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
      <div style={{ 
        paddingTop: '16px',
        paddingBottom: '16px',
        backgroundColor: '#ffffff'
      }}>
        <Title level={2} style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          Test davom ettirilmoqda...
        </Title>
        <Card style={{ 
          padding: '24px', 
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <Progress percent={100} status="active" style={{ marginBottom: '8px' }} />
          <Text>
            Iltimos kuting, sizning test seansingiz tiklanmoqda...
          </Text>
        </Card>
      </div>
    );
  }

  if (testCompleted) {
    return (
      <div style={{
        paddingTop: '16px',
        paddingBottom: '16px',
        backgroundColor: '#ffffff'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e2e8f0'
        }}
        >
          <Title level={2} style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: 0
          }}>
            Test natijasi
          </Title>
        </div>

        <div>
          <Card style={{
            padding: '24px',
            textAlign: 'center',
            background: score >= 70
              ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: score >= 70 ? '1px solid #22c55e' : '1px solid #dc2626',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <Title level={1} style={{
              fontWeight: 700,
              color: score >= 70 ? '#22c55e' : '#dc2626',
              marginBottom: '8px'
            }}>
              {score}%
            </Title>

            <Title level={4} style={{ marginBottom: '16px' }}>
              {selectedTest?.title}
            </Title>

            <Text style={{ marginBottom: '16px', display: 'block' }}>
              {score >= 70 ? 'Tabriklaymiz! Testni muvaffaqiyatli topshirdingiz.' : 'Testni qayta topshirib ko\'ring.'}
            </Text>

            <Space size="middle">
              <Button
                type="primary"
                onClick={resetTest}
                style={{ cursor: 'pointer' }}
              >
                Boshqa test topshirish
              </Button>
              <Button
                onClick={() => window.location.href = '/student/results'}
                style={{ cursor: 'pointer' }}
              >
                Natijalarimni ko'rish
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  if (sessionStarted && selectedTest) {
    const testQuestions = selectedTest.questions || [];
    const currentQuestion = testQuestions[currentQuestionIndex];

    // If questions are not loaded yet or current question is undefined, show loading
    if (!testQuestions.length || !currentQuestion) {
      return (
        <div style={{ 
          paddingTop: '16px',
          paddingBottom: '16px',
          backgroundColor: '#ffffff'
        }}>
          <Title level={2} style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: 0
          }}>
            Test yuklanmoqda...
          </Title>
          <Card style={{ 
            padding: '24px', 
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <Text>
              Iltimos kuting, test savollari yuklanmoqda...
            </Text>
          </Card>
        </div>
      );
    }

    return (
      <div style={{
        paddingTop: '16px',
        paddingBottom: '16px',
        backgroundColor: '#ffffff'
      }}>
        {/* Error Display */}
        {error && (
          <Alert message={error} type="error" style={{ marginBottom: '16px' }} showIcon />
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          padding: '8px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '8px',
          border: '1px solid rgba(148, 163, 184, 0.2)'
        }}
        >
          <Title level={5} style={{ marginBottom: 0 }}>
            {selectedTest.title}
          </Title>
          <Space size="middle">
            <Text style={{ color: '#64748b' }}>
              {currentQuestionIndex + 1} / {selectedTest.total_questions}
            </Text>
            <Tag
              icon={<ClockCircleOutlined />}
              color={timeRemaining < 300 ? 'red' : 'blue'}
              style={{ margin: 0 }}
            >
              {formatTime(timeRemaining)}
            </Tag>
          </Space>
        </div>

        <Progress
          percent={(currentQuestionIndex + 1) / selectedTest.total_questions * 100}
          style={{ marginBottom: '16px' }}
        />

        {/* Exit Test Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <Button
            danger
            onClick={() => setExitDialogOpen(true)}
            style={{ 
              borderColor: '#ef4444',
              color: '#ef4444',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#fef2f2';
              e.target.style.borderColor = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = '#ef4444';
            }}
          >
            Testdan chiqish
          </Button>
        </div>

        <Card
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            border: '1px solid #e9ecef',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            marginBottom: '16px'
          }}
        >
          {/* Image displayed at the top - bigger */}
          {currentQuestion.image && (
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
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
                onError={(e) => {
                  console.error('Image failed to load:', currentQuestion.image);
                  e.target.style.display = 'none';
                  // Show error message instead of broken image
                  const errorDiv = document.createElement('div');
                  errorDiv.style.cssText = `
                    padding: 20px;
                    background: #f3f4f6;
                    border: 2px dashed #d1d5db;
                    border-radius: 12px;
                    color: #6b7280;
                    font-size: 14px;
                    text-align: center;
                    margin: 10px 0;
                  `;
                  errorDiv.textContent = 'Rasm yuklanmadi. Internet aloqasini tekshiring yoki administratorga murojaat qiling.';
                  e.target.parentNode.appendChild(errorDiv);
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', currentQuestion.image);
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <Title level={5} style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              Savol:
            </Title>
            <LaTeXPreview
              text={currentQuestion.question_text}
              style={{
                fontSize: '1.1rem',
                lineHeight: 1.6,
                color: '#1e293b'
              }}
            />
          </div>

          {currentQuestion.question_type === 'multiple_choice' && (
            <Radio.Group
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {currentQuestion.options.map((option, index) => {
                const optionImageField = ['option_a_image', 'option_b_image', 'option_c_image', 'option_d_image'][index];
                const optionImage = currentQuestion[optionImageField];

                return (
                  <Radio
                    key={index}
                    value={option.text}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '4px',
                      padding: '8px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
                      <LaTeXPreview text={option.text} />
                      {optionImage && (
                        <img
                          src={optionImage}
                          alt={`Option ${String.fromCharCode(65 + index)}`}
                          style={{
                            maxWidth: '100px',
                            maxHeight: '60px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                            objectFit: 'contain'
                          }}
                          onError={(e) => {
                            console.error('Option image failed to load:', optionImage);
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </Radio>
                );
              })}
            </Radio.Group>
          )}

          {currentQuestion.question_type === 'short_answer' && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <Text style={{ flex: 1 }}>
                  Javobingiz:
                </Text>
                <Button
                  size="small"
                  onClick={() => setMathSymbolsOpen(true)}
                  style={{
                    minWidth: 'auto',
                    padding: '2px 8px',
                    fontSize: '0.75rem'
                  }}
                >
                  🧮 Belgilar
                </Button>
              </div>
              <Input.TextArea
                placeholder="Javobingizni kiriting (LaTeX uchun $...$ dan foydalaning)"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                rows={3}
                style={{
                  borderRadius: '8px',
                  backgroundColor: '#fafafa',
                }}
              />
              {(answers[currentQuestion.id] || '').trim() && (
                <Card style={{
                  padding: '8px',
                  marginTop: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}>
                  <Text style={{ marginBottom: '4px', color: '#64748b', fontWeight: 500, display: 'block' }}>
                    Sizning javobingiz ko'rinishi:
                  </Text>
                  <LaTeXPreview text={answers[currentQuestion.id]} />
                </Card>
              )}
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '24px',
            gap: '8px'
          }}>
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              style={{
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                borderColor: '#d1d5db',
                color: currentQuestionIndex === 0 ? '#9ca3af' : '#374151',
              }}
              onMouseEnter={(e) => {
                if (currentQuestionIndex !== 0) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              Oldingi
            </Button>

            {currentQuestionIndex === selectedTest.total_questions - 1 ? (
              <Space size="small">
                <Button
                  type="primary"
                  onClick={handleSubmitTest}
                  disabled={isLoading}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    backgroundColor: '#10b981',
                    borderColor: '#10b981'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#10b981';
                  }}
                >
                  Testni topshirish
                </Button>
                <Button
                  onClick={() => setUrgentSubmitDialogOpen(true)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontWeight: 600,
                    borderColor: '#f59e0b',
                    color: '#f59e0b',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#fef3c7';
                    e.target.style.borderColor = '#d97706';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = '#f59e0b';
                  }}
                >
                  Tez tugatish
                </Button>
              </Space>
            ) : (
              <Button
                type="primary"
                onClick={handleNext}
                style={{
                  cursor: 'pointer',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  backgroundColor: '#3b82f6',
                  borderColor: '#3b82f6'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#3b82f6';
                }}
              >
                Keyingi
              </Button>
            )}
          </div>
        </Card>

        {/* Question Navigation Panel */}
        <div style={{ marginTop: '16px' }}>
          <Title level={5} style={{ marginBottom: '8px', color: '#1e293b', fontWeight: 600 }}>
            Savollar ro'yxati:
          </Title>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            backgroundColor: '#ffffff',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            {testQuestions.map((_, index) => (
              <Button
                key={index}
                type={currentQuestionIndex === index ? 'primary' : 'default'}
                size="small"
                onClick={() => handleQuestionNavigation(index)}
                style={{
                  minWidth: '50px',
                  height: '40px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  backgroundColor: currentQuestionIndex === index ? '#3b82f6' : 'transparent',
                  color: currentQuestionIndex === index ? '#ffffff' : '#64748b',
                  borderColor: currentQuestionIndex === index ? '#3b82f6' : '#d1d5db',
                }}
                onMouseEnter={(e) => {
                  if (currentQuestionIndex === index) {
                    e.target.style.backgroundColor = '#2563eb';
                  } else {
                    e.target.style.backgroundColor = '#f8fafc';
                    e.target.style.borderColor = '#94a3b8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentQuestionIndex === index) {
                    e.target.style.backgroundColor = '#3b82f6';
                  } else {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = '#d1d5db';
                  }
                }}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>

        {/* Exit Test Dialog */}
        <Modal
          title={
            <span style={{ color: '#ef4444', fontWeight: 600 }}>
              Testdan chiqish
            </span>
          }
          open={exitDialogOpen}
          onCancel={() => setExitDialogOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setExitDialogOpen(false)} style={{ color: '#64748b' }}>
              Bekor qilish
            </Button>,
            <Button key="submit" danger onClick={handleExitTest} style={{ marginLeft: '8px' }}>
              Chiqish
            </Button>
          ]}
        >
          <Text style={{ color: '#374151' }}>
            Agar testdan chiqsangiz, vaqt davom etadi va sizning javoblaringiz saqlanmaydi. 
            Rostdan ham chiqishni xohlaysizmi?
          </Text>
        </Modal>

        {/* Urgent Submit Dialog */}
        <Modal
          title={
            <span style={{ color: '#dc2626', fontWeight: 600 }}>
              Testni tez tugatish
            </span>
          }
          open={urgentSubmitDialogOpen}
          onCancel={() => setUrgentSubmitDialogOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setUrgentSubmitDialogOpen(false)} style={{ color: '#64748b' }}>
              Bekor qilish
            </Button>,
            <Button 
              key="submit" 
              onClick={() => {
                setUrgentSubmitDialogOpen(false);
                handleSubmitTest();
              }}
              style={{ marginLeft: '8px', backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
            >
              Testni tugatish
            </Button>
          ]}
        >
          <Text style={{ color: '#374151' }}>
            Testni tugatish uchun tugmani bosing. Bu sizning oxirgi imkoniyatingiz!
          </Text>
        </Modal>

        {/* Math Symbols Dialog */}
        <MathSymbols
          open={mathSymbolsOpen}
          onClose={() => setMathSymbolsOpen(false)}
          onSymbolSelect={handleSymbolSelect}
        />
      </div>
    );
  }

  const testColumns = [
    {
      title: 'Test nomi',
      dataIndex: 'title',
      key: 'title',
      render: (title, test) => (
        <div>
          <Text style={{
            fontWeight: 600,
            color: '#1e293b',
            fontSize: '0.875rem'
          }}>
            {title}
          </Text>
          {test.description && (
            <Text style={{
              fontSize: '0.75rem',
              color: '#64748b',
              display: 'block',
              marginTop: '2px'
            }}>
              {test.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Fan',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => (
        <Text style={{
          fontWeight: 500,
          color: '#1e293b',
          fontSize: '0.875rem'
        }}>
          {subject}
        </Text>
      ),
    },
    {
      title: 'Sana',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (created_at) => (
        <Text style={{
          fontWeight: 600,
          color: '#2563eb',
          fontSize: '0.875rem'
        }}>
          {new Date(created_at).toLocaleDateString('uz-UZ')}
        </Text>
      ),
    },
    {
      title: 'Qiyinchilik',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => (
        <Tag
          color={
            difficulty === 'easy' ? 'green' :
            difficulty === 'medium' ? 'orange' : 'red'
          }
          style={{
            fontWeight: 600,
            borderRadius: '6px',
            fontSize: '0.75rem',
            margin: 0
          }}
        >
          {difficultyLabels[difficulty] || difficulty}
        </Tag>
      ),
    },
    {
      title: 'O\'qituvchi',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (teacherName) => (
        <Text style={{
          fontWeight: 500,
          color: '#1e293b',
          fontSize: '0.875rem'
        }}>
          {teacherName}
        </Text>
      ),
    },
    {
      title: 'Vaqt',
      dataIndex: 'time_limit',
      key: 'time_limit',
      render: (time_limit) => (
        <Text style={{
          fontWeight: 600,
          color: '#2563eb',
          fontSize: '0.875rem'
        }}>
          {time_limit} daq
        </Text>
      ),
    },
    {
      title: 'Savollar',
      dataIndex: 'total_questions',
      key: 'total_questions',
      render: (total_questions) => (
        <Text style={{
          fontWeight: 600,
          color: '#059669',
          fontSize: '0.875rem'
        }}>
          {total_questions}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, test) => {
        const alreadyTaken = hasStudentTakenTest(test.id);
        const hasActiveSession = !!activeTestSessions[test.id];

        if (hasActiveSession) {
          return (
            <Tag
              style={{
                backgroundColor: '#ecfdf5',
                color: '#059669',
                fontWeight: 600,
                borderRadius: '6px',
                fontSize: '0.75rem',
                margin: 0
              }}
            >
              Faol
            </Tag>
          );
        } else if (alreadyTaken) {
          return (
            <Tag
              style={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontWeight: 600,
                borderRadius: '6px',
                fontSize: '0.75rem',
                margin: 0
              }}
            >
              Topshirilgan
            </Tag>
          );
        } else {
          return (
            <Tag
              style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontWeight: 600,
                borderRadius: '6px',
                fontSize: '0.75rem',
                margin: 0
              }}
            >
              Mavjud
            </Tag>
          );
        }
      },
    },
    {
      title: 'Harakatlar',
      key: 'actions',
      render: (_, test) => {
        const alreadyTaken = hasStudentTakenTest(test.id);
        const hasActiveSession = !!activeTestSessions[test.id];

        // Determine button state
        let buttonText = 'Testni boshlash';
        let buttonIcon = <PlayCircleOutlined />;
        let buttonColor = '#2563eb';
        let buttonDisabled = false;
        let buttonAction = () => startTest(test);

        if (hasActiveSession) {
          // Has active session - allow continuing
          buttonText = 'Davom ettirish';
          buttonIcon = <PlayCircleOutlined />;
          buttonColor = '#059669'; // Green for continue
          buttonAction = () => continueTest(test);
        } else if (alreadyTaken) {
          // Test already completed
          buttonText = 'Topshirilgan';
          buttonIcon = <CheckCircleOutlined />;
          buttonColor = '#059669';
          buttonDisabled = true;
        }

        return (
          <div style={{ display: 'flex', gap: '4px' }}>
            {!alreadyTaken && (
              <Button
                size="small"
                type="primary"
                onClick={buttonAction}
                disabled={buttonDisabled}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                  minWidth: 'auto',
                  backgroundColor: buttonColor,
                  borderColor: buttonColor
                }}
                icon={buttonIcon}
                onMouseEnter={(e) => {
                  if (!buttonDisabled) {
                    e.target.style.backgroundColor = buttonColor;
                  }
                }}
              >
                {buttonText}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{
      paddingTop: '16px',
      paddingBottom: '16px',
      backgroundColor: '#ffffff'
    }}>
      {/* Error Display */}
      {error && (
        <Alert message={error} type="error" style={{ marginBottom: '16px' }} showIcon />
      )}

      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {/* Title */}
        <div style={{
          marginBottom: '16px'
        }}>
          <Title level={2} style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '4px'
          }}>
            Test topshirish
          </Title>
        </div>
        
        {/* Description */}
        <Text style={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Mavjud testlarni ko'rish va test topshirish
        </Text>
      </div>

      {/* Barcha testlar section with table layout */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <Title level={4} style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: 0
          }}>
            📋 Barcha testlar
          </Title>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SortAscendingOutlined style={{ color: '#64748b' }} />
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{
                minWidth: 120,
              }}
            >
              <Option value="date">Sana bo'yicha</Option>
              <Option value="name">Nomi bo'yicha</Option>
              <Option value="difficulty">Qiyinchilik bo'yicha</Option>
              <Option value="easy">Oson</Option>
              <Option value="medium">O'rtacha</Option>
              <Option value="hard">Qiyin</Option>
            </Select>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: '24px' }}>
          <Search
            placeholder="Test nomini, fanini yoki o'qituvchi nomini qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined style={{ color: '#64748b' }} />}
            style={{
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2563eb';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
            }}
          />
        </div>

        <Card style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}>
          <Table
            columns={testColumns}
            dataSource={getFilteredTests().map(test => ({ ...test, key: test.id }))}
            pagination={false}
            size="middle"
            bordered={false}
            style={{
              '& .ant-table-thead > tr > th': {
                backgroundColor: '#f8fafc',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: '#1e293b',
                borderBottom: '1px solid #e2e8f0',
                padding: '16px'
              },
              '& .ant-table-tbody > tr > td': {
                borderBottom: '1px solid #f1f5f9',
                padding: '16px',
                fontSize: '0.875rem',
                color: '#334155'
              },
              '& .ant-table-tbody > tr:hover > td': {
                backgroundColor: '#f8fafc'
              }
            }}
          />
        </Card>

        {getFilteredTests().length === 0 && getSortedTests().length > 0 && (
          <Card style={{ padding: '16px', textAlign: 'center', marginTop: '8px' }}>
            <Title level={5} style={{ color: '#64748b' }}>
              Qidiruv natijasi bo'yicha test topilmadi
            </Title>
            <Text style={{ color: '#64748b' }}>
              Qidiruv so'zini o'zgartirib ko'ring
            </Text>
          </Card>
        )}

        {getSortedTests().length === 0 && (
          <Card style={{ padding: '16px', textAlign: 'center', marginTop: '8px' }}>
            <Title level={5} style={{ color: '#64748b' }}>
              {sortBy === 'easy' || sortBy === 'medium' || sortBy === 'hard'
                ? `${difficultyLabels[sortBy]} testlar topilmadi`
                : 'Hozircha testlar mavjud emas'
              }
            </Title>
            <Text style={{ color: '#64748b' }}>
              {sortBy === 'easy' || sortBy === 'medium' || sortBy === 'hard'
                ? 'Boshqa qiyinchilik darajasini tanlang'
                : 'Admin o\'qituvchilarni va testlarni qo\'shishi kerak'
              }
            </Text>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TakeTest;