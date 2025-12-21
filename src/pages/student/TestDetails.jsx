import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Button,
  Tag,
  Avatar,
  Progress,
  Radio,
  Input,
  Alert,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;
const { TextArea } = Input;

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
      <div style={{ 
        padding: '24px',
        backgroundColor: '#ffffff'
      }}>
        <Text style={{ 
          fontSize: '1.125rem',
          color: '#64748b',
          display: 'block',
          textAlign: 'center'
        }}>
          Ma'lumotlar yuklanmoqda...
        </Text>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div style={{ 
        padding: '24px',
        backgroundColor: '#ffffff'
      }}>
        <Alert 
          message={error || 'Test topilmadi'}
          type="error"
          style={{ 
            marginBottom: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b'
          }}
        />
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/student/search')}
          style={{ 
            borderColor: '#2563eb',
            color: '#2563eb',
            fontWeight: 600,
            textTransform: 'none'
          }}
        >
          O'qituvchilarni qidirishga qaytish
        </Button>
      </div>
    );
  }

  if (testCompleted) {
    return (
      <div style={{
        padding: '24px',
        backgroundColor: '#ffffff'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <Title level={2} style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: 0
          }}>
            Test natijasi
          </Title>
        </div>

        <Card style={{
          textAlign: 'center',
          background: score >= 70
            ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
            : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: score >= 70 ? '1px solid #22c55e' : '1px solid #dc2626',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '32px'
        }}>
          <CheckCircleOutlined style={{ 
            fontSize: '64px', 
            color: score >= 70 ? '#10b981' : '#dc2626', 
            marginBottom: '16px' 
          }} />
          
          <Title level={1} style={{
            fontWeight: 700,
            color: score >= 70 ? '#10b981' : '#dc2626',
            marginBottom: '16px',
            fontSize: '3rem'
          }}>
            {score}%
          </Title>

          <Title level={3} style={{ marginBottom: '16px' }}>
            {test.title}
          </Title>

          <Text style={{ 
            fontSize: '1rem',
            marginBottom: '24px',
            display: 'block',
            color: '#374151'
          }}>
            {score >= 70 ? '🎉 Tabriklaymiz! Testni muvaffaqiyatli topshirdingiz.' : '💪 Testni qayta topshirib ko\'ring.'}
          </Text>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button
              type="primary"
              onClick={resetTest}
              size="large"
              style={{
                backgroundColor: '#2563eb',
                borderColor: '#2563eb',
                fontWeight: 600,
                borderRadius: '8px'
              }}
            >
              Boshqa test topshirish
            </Button>
            <Button
              onClick={() => navigate('/student/results')}
              size="large"
              style={{
                borderColor: '#e2e8f0',
                color: '#64748b',
                fontWeight: 600,
                borderRadius: '8px'
              }}
            >
              Natijalarimni ko'rish
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={2} style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          {test.title}
        </Title>
        <Text style={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Test haqida ma'lumot va testni boshlash
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Side - Test Details */}
        <Col xs={24} md={8}>
          <Card style={{
            height: 'fit-content',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            position: 'sticky',
            top: '20px'
          }}>
            <Title level={4} style={{ 
              fontWeight: 600,
              marginBottom: '24px',
              color: '#1e293b'
            }}>
              📋 Test ma'lumotlari
            </Title>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <UserOutlined style={{ marginRight: '8px', color: '#2563eb' }} />
                <Text style={{ fontSize: '0.875rem' }}>
                  <strong>O'qituvchi:</strong> {teacher?.name || 'Noma\'lum'}
                </Text>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <FileTextOutlined style={{ marginRight: '8px', color: '#2563eb' }} />
                <Text style={{ fontSize: '0.875rem' }}>
                  <strong>Fan:</strong> {test.subject}
                </Text>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <QuestionCircleOutlined style={{ marginRight: '8px', color: '#2563eb' }} />
                <Text style={{ fontSize: '0.875rem' }}>
                  <strong>Savollar soni:</strong> {questions.length} ta
                </Text>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <ClockCircleOutlined style={{ marginRight: '8px', color: '#2563eb' }} />
                <Text style={{ fontSize: '0.875rem' }}>
                  <strong>Vaqt:</strong> {test.time_limit} daqiqa
                </Text>
              </div>
            </div>

            {test.description && (
              <div style={{ marginBottom: '24px' }}>
                <Text style={{ 
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  <strong>Test haqida:</strong>
                </Text>
                <Text style={{ 
                  fontSize: '0.875rem',
                  color: '#64748b'
                }}>
                  {test.description}
                </Text>
              </div>
            )}

            {testStarted ? (
              <div>
                <Title level={5} style={{ 
                  fontWeight: 600,
                  marginBottom: '16px'
                }}>
                  ⏱️ Test jarayonida
                </Title>
                
                <div style={{ marginBottom: '16px' }}>
                  <Text style={{ 
                    fontSize: '0.875rem',
                    color: '#64748b',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Progress: {currentQuestionIndex + 1} / {questions.length}
                  </Text>
                  <Progress
                    percent={Math.round((currentQuestionIndex + 1) / questions.length * 100)}
                    strokeColor="#2563eb"
                    showInfo={false}
                    style={{ marginBottom: '16px' }}
                  />
                  
                  <Tag
                    icon={<ClockCircleOutlined />}
                    color={timeLeft < 300 ? 'red' : 'blue'}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {formatTime(timeLeft)}
                  </Tag>
                </div>

                <Text style={{ 
                  fontSize: '0.875rem',
                  color: '#64748b'
                }}>
                  Testni to'liq boshlash uchun o'ng tomondagi savollarga javob bering.
                </Text>
              </div>
            ) : hasTakenTest ? (
              <Alert
                message={
                  <Text style={{ fontSize: '0.875rem' }}>
                    <strong>Diqqat:</strong> Siz ushbu testni allaqachon topshirgansiz.
                  </Text>
                }
                type="warning"
                showIcon={false}
              />
            ) : (
              <Button
                type="primary"
                size="large"
                onClick={startTest}
                block
                style={{ 
                  padding: '16px',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  backgroundColor: '#2563eb',
                  borderColor: '#2563eb'
                }}
                icon={<PlayCircleOutlined />}
              >
                Testni boshlash
              </Button>
            )}
          </Card>
        </Col>

        {/* Right Side - Test Taking */}
        <Col xs={24} md={16}>
          {testStarted && currentQuestion ? (
            <Card style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              padding: '32px'
            }}>
              <Title level={4} style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '24px'
              }}>
                {currentQuestion.question_text}
              </Title>

              {currentQuestion.question_type === 'multiple_choice' && (
                <Radio.Group
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  {currentQuestion.options?.map((option, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '8px',
                        padding: '16px',
                        border: '1px solid #f0f0f0',
                        borderRadius: '8px',
                        width: '100%',
                        cursor: 'pointer',
                        backgroundColor: '#fafafa',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => handleAnswerChange(currentQuestion.id, option.text)}
                    >
                      <Radio 
                        value={option.text}
                        style={{ width: '100%' }}
                      >
                        {option.text}
                      </Radio>
                    </div>
                  ))}
                </Radio.Group>
              )}

              {currentQuestion.question_type === 'short_answer' && (
                <TextArea
                  placeholder="Javobingizni kiriting"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  rows={4}
                  style={{
                    marginTop: '24px',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa'
                  }}
                />
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '32px',
                gap: '12px'
              }}>
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  style={{
                    cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                    borderRadius: '8px',
                    padding: '8px 24px',
                    fontWeight: 600,
                    borderColor: '#e2e8f0',
                    color: '#64748b'
                  }}
                >
                  Oldingi
                </Button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    type="primary"
                    onClick={handleSubmitTest}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      padding: '8px 24px',
                      fontWeight: 600,
                      backgroundColor: '#10b981',
                      borderColor: '#10b981'
                    }}
                  >
                    Testni topshirish
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={handleNext}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      padding: '8px 24px',
                      fontWeight: 600,
                      backgroundColor: '#2563eb',
                      borderColor: '#2563eb'
                    }}
                  >
                    Keyingi
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card style={{
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              padding: '48px 24px'
            }}>
              <QuestionCircleOutlined style={{ 
                fontSize: '64px', 
                color: '#2563eb', 
                marginBottom: '16px' 
              }} />
              <Title level={3} style={{ 
                fontWeight: 600,
                marginBottom: '16px',
                color: '#1e293b'
              }}>
                Testni boshlashga tayyormisiz?
              </Title>
              <Text style={{ 
                fontSize: '1rem',
                color: '#64748b',
                marginBottom: '24px',
                display: 'block'
              }}>
                "Testni boshlash" tugmasini bosib testni boshlang.
                Test vaqt davomida davom etadi va natijalaringiz saqlanadi.
              </Text>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default TestDetails;