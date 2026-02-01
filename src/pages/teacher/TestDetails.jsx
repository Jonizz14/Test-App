import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Table,
  Button,
  Tag,
  Alert,
  Row,
  Col,
  Avatar,
  Space,
  Statistic,
  Divider,
  Modal,
  message,
} from 'antd';
import {
  ArrowLeftOutlined as ArrowBackIcon,
  BarChartOutlined as AssessmentIcon,
  UserOutlined as PersonIcon,
  CheckCircleOutlined as CheckCircleIcon,
  CloseCircleOutlined as CancelIcon,
  TeamOutlined as PeopleIcon,
  ArrowUpOutlined as TrendingUpIcon,
  TrophyOutlined as EmojiEventsIcon,
  ArrowDownOutlined as TrendingDownIcon,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import SendLessonModal from '../../components/SendLessonModal';

const { Title, Text } = Typography;

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

  const reloadNotifications = () => {
    const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const lessonNotifications = allNotifications.filter(n => n.type === 'lesson_reminder' && n.testId === testId);
    setNotifications(lessonNotifications);
  };

  const handleCloseLessonModal = () => {
    setLessonModalOpen(false);
    setSelectedStudent(null);
    setSelectedAttempt(null);
    reloadNotifications();
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
      <div style={{
        padding: '32px',
        backgroundColor: '#ffffff',
        minHeight: '100vh'
      }}>
        <Title level={1} style={{ color: '#1e293b', marginBottom: '16px' }}>
          Test tafsilotlari
        </Title>
        <Text style={{ color: '#64748b' }}>Yuklanmoqda...</Text>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div style={{
        padding: '32px',
        backgroundColor: '#ffffff',
        minHeight: '100vh'
      }}>
        <Title level={1} style={{ color: '#1e293b', marginBottom: '24px' }}>
          Xatolik
        </Title>
        <Alert
          message={error || 'Test topilmadi'}
          type="error"
          style={{ marginBottom: '24px' }}
        />
        <Button
          type="primary"
          icon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/my-tests')}
          size="large"
          style={{
            backgroundColor: '#2563eb',
            borderColor: '#2563eb',
            fontWeight: 600,
          }}
        >
          Orqaga
        </Button>
      </div>
    );
  }

  // Calculate statistics
  const totalAttempts = attempts.length;
  const averageScore = totalAttempts > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
    : 0;
  const highestScore = totalAttempts > 0 ? Math.max(...attempts.map(a => a.score)) : 0;
  const lowestScore = totalAttempts > 0 ? Math.min(...attempts.map(a => a.score)) : 0;

  // Table columns
  const columns = [
    {
      title: 'O\'quvchi ismi va yo\'nalishi',
      key: 'student',
      render: (attempt) => {
        const student = allStudents.find(s => s.id === attempt.student);
        return (
          <Space>
            {student?.is_premium && student?.profile_photo ? (
              <Avatar
                src={student.profile_photo.startsWith('http') ? student.profile_photo : `${apiService.baseURL.replace('/api', '')}${student.profile_photo}`}
                style={{
                  border: '2px solid #f59e0b'
                }}
              />
            ) : (
              <Avatar icon={<PersonIcon />} style={{ backgroundColor: '#1890ff' }} />
            )}
            <div>
              <div
                style={{
                  cursor: 'pointer',
                  fontWeight: 500,
                  color: '#1890ff'
                }}
                onClick={() => navigate(`/teacher/student-profile/${student?.id}`)}
              >
                {student?.name || student?.first_name || 'Noma\'lum'} {student?.last_name || ''}
                {student?.is_premium && (
                  <Tag color="orange" style={{ marginLeft: 8, fontSize: '10px' }}>
                    Premium
                  </Tag>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {getDirectionLabel(student?.direction) || 'Yo\'nalish kiritilmagan'}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Ball',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <Text strong style={{ color: score >= 90 ? '#52c41a' : score >= 70 ? '#faad14' : '#ff4d4f' }}>
          {score}%
        </Text>
      ),
    },
    {
      title: 'To\'g\'ri / Noto\'g\'ri',
      key: 'answers',
      render: (attempt) => {
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
          <Space>
            <Tag icon={<CheckCircleIcon />} color="success">
              {correctCount}
            </Tag>
            <Tag icon={<CancelIcon />} color="error">
              {incorrectCount}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Baho',
      dataIndex: 'score',
      key: 'grade',
      render: (score) => (
        <Tag color={getScoreColor(score)}>
          {getScoreText(score)}
        </Tag>
      ),
    },
    {
      title: 'Vaqt',
      dataIndex: 'time_taken',
      key: 'time',
      render: (time) => (
        <Text>{`${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`}</Text>
      ),
    },
    {
      title: 'Sana',
      dataIndex: 'submitted_at',
      key: 'date',
      render: (date) => (
        <Text>{new Date(date).toLocaleDateString('uz-UZ')}</Text>
      ),
    },
    {
      title: 'Harakatlar',
      key: 'actions',
      render: (attempt) => {
        const student = allStudents.find(s => s.id === attempt.student);
        const lessonInvitation = notifications.find(n => n.studentId === attempt.student);

        if (lessonInvitation) {
          return (
            <div style={{ minWidth: '200px' }}>
              <Text strong style={{ color: '#d97706', display: 'block', marginBottom: 4 }}>
                Qo'shimcha dars yuborilgan
              </Text>
              <Text style={{ color: '#1e293b', display: 'block', marginBottom: 4 }}>
                {lessonInvitation.lessonTopic}
              </Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: '11px' }}>
                {lessonInvitation.lessonDate} • {lessonInvitation.lessonTime}
              </Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: '11px' }}>
                {lessonInvitation.room}
              </Text>
              <Text type="danger" style={{ fontSize: '11px', fontWeight: 500 }}>
                Dars hali o'tilmagan
              </Text>
            </div>
          );
        } else if (attempt.score < 60 && student) {
          return (
            <Button
              size="small"
              danger
              onClick={() => handleOpenLessonModal(student.id, attempt)}
              style={{ cursor: 'pointer' }}
            >
              Qo'shimcha dars
            </Button>
          );
        } else if (attempt.score >= 60) {
          return (
            <Button
              size="small"
              disabled
              style={{
                backgroundColor: '#ecfdf5',
                color: '#059669',
                borderColor: '#10b981',
              }}
            >
              Qo'shimcha dars kerak emas
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div style={{
      width: '100%',
      padding: '32px',
      backgroundColor: '#ffffff',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '48px',
        paddingBottom: '32px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Button
          icon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/my-tests')}
          style={{
            borderColor: '#e2e8f0',
            color: '#64748b',
          }}
        >
          Mening testlarimga qaytish
        </Button>
        <Title level={1} style={{ color: '#1e293b', margin: 0 }}>
          Test tafsilotlari
        </Title>
      </div>

      {/* Test Info */}
      <Card
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ padding: '24px' }}>
          <Title level={2} style={{ color: '#1e293b', marginBottom: '16px' }}>
            {test.title}
          </Title>
          <Text style={{
            color: '#64748b',
            fontSize: '16px',
            lineHeight: 1.5,
            display: 'block',
            marginBottom: '24px'
          }}>
            {test.description || 'Tavsif mavjud emas'}
          </Text>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Tag color="blue">
              Fan: {test.subject}
            </Tag>
            <Tag color="green">
              {test.total_questions} ta savol
            </Tag>
            <Tag color="orange">
              {test.time_limit} daqiqa
            </Tag>

            {/* Target Grades Display */}
            {test.target_grades && test.target_grades.length > 0 ? (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Tag color="default" style={{ fontSize: '11px' }}>
                  Maqsadlangan sinflar:
                </Tag>
                {test.target_grades.map((grade) => (
                  <Tag
                    key={grade}
                    color="blue"
                    style={{
                      fontSize: '11px',
                      height: '20px',
                      lineHeight: '18px'
                    }}
                  >
                    {grade}-sinf
                  </Tag>
                ))}
              </div>
            ) : (
              <Tag color="success">
                Barcha sinflar uchun
              </Tag>
            )}

            <Tag color={test.is_active ? 'success' : 'default'}>
              {test.is_active ? 'Faol' : 'Nofaol'}
            </Tag>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <Statistic
              title={
                <Text style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b'
                }}>
                  Test topshirganlar
                </Text>
              }
              value={totalAttempts}
              valueStyle={{
                fontSize: '40px',
                fontWeight: 700,
                color: '#1e293b',
              }}
              prefix={
                <div style={{
                  backgroundColor: '#eff6ff',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <PeopleIcon style={{ fontSize: '24px', color: '#2563eb' }} />
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <Statistic
              title={
                <Text style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b'
                }}>
                  O'rtacha ball
                </Text>
              }
              value={averageScore}
              suffix="%"
              valueStyle={{
                fontSize: '40px',
                fontWeight: 700,
                color: '#1e293b',
              }}
              prefix={
                <div style={{
                  backgroundColor: '#ecfdf5',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <TrendingUpIcon style={{ fontSize: '24px', color: '#059669' }} />
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <Statistic
              title={
                <Text style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b'
                }}>
                  Eng yuqori ball
                </Text>
              }
              value={highestScore}
              suffix="%"
              valueStyle={{
                fontSize: '40px',
                fontWeight: 700,
                color: '#1e293b',
              }}
              prefix={
                <div style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <EmojiEventsIcon style={{ fontSize: '24px', color: '#16a34a' }} />
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <Statistic
              title={
                <Text style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b'
                }}>
                  Eng past ball
                </Text>
              }
              value={lowestScore}
              suffix="%"
              valueStyle={{
                fontSize: '40px',
                fontWeight: 700,
                color: '#1e293b',
              }}
              prefix={
                <div style={{
                  backgroundColor: '#fffbeb',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <TrendingDownIcon style={{ fontSize: '24px', color: '#d97706' }} />
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Students Who Took the Test */}
      <Title level={3} style={{ marginBottom: '24px' }}>
        Test topshirgan o'quvchilar ({attempts.length})
      </Title>

      {attempts.length === 0 ? (
        <Alert
          message="Hozircha hech kim bu testni topshirmagan."
          type="info"
          style={{ marginBottom: '24px' }}
        />
      ) : (
        <Card
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
          }}
        >
          <Table
            columns={columns}
            dataSource={attempts}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} ta`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      )}

      {/* Lesson Modal */}
      <SendLessonModal
        open={lessonModalOpen}
        onClose={handleCloseLessonModal}
        student={selectedStudent}
        testResult={selectedAttempt}
        teacherInfo={currentUser}
      />
    </div>
  );
};

export default TestDetails;
