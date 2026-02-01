import React, { useState, useEffect } from 'react';
import 'animate.css';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Card,
  Tag,
  Row,
  Col,
  Table,
  Alert,
  Avatar,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useServerTest } from '../../context/ServerTestContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

// TeacherDetails Component - Student view for individual teacher and their tests
// Shows teacher information and allows students to take or retake tests
const TeacherDetails = () => {
  // URL parameters and navigation
  const { teacherId } = useParams();
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const { checkActiveSession } = useServerTest();

  // Component state management
  const [teacher, setTeacher] = useState(null);
  const [tests, setTests] = useState([]);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [activeTestSessions, setActiveTestSessions] = useState({}); // Track active sessions for each test
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [teacherId]);

  // Load teacher data, tests, and student attempts
  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch all required data
      const [usersData, testsData, attemptsData] = await Promise.all([
        apiService.getUsers(),
        apiService.getTests(),
        apiService.getAttempts({ student: currentUser.id })
      ]);

      // Extract results from API responses
      const users = usersData.results || usersData;
      const tests = testsData.results || testsData;
      const attempts = attemptsData.results || attemptsData;

      // Find the specific teacher
      const foundTeacher = users.find(user =>
        user.id === parseInt(teacherId) && user.role === 'teacher'
      );

      console.log('Teacher details loading:', {
        teacherId,
        foundTeacher,
        totalUsers: users.length,
        totalTests: tests.length,
        userAttempts: attempts.length
      });

      if (!foundTeacher) {
        setError('O\'qituvchi topilmadi');
        return;
      }

      setTeacher(foundTeacher);
      setTests(tests);
      setStudentAttempts(attempts);

      // Check for active sessions for all tests
      await checkActiveSessions(tests);

    } catch (error) {
      console.error('Error loading teacher details:', error);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Check for active sessions for all tests
  const checkActiveSessions = async (allTests) => {
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

  // Get tests for the current teacher
  const getTeacherTests = () => {
    return tests.filter(test => test.teacher === parseInt(teacherId));
  };

  // Get test completion status and attempt history
  const getTestCompletionStatus = (testId) => {
    const attempts = studentAttempts.filter(attempt => attempt.test === testId);
    return {
      hasCompleted: attempts.length > 0,
      attempts: attempts,
      lastScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0,
      attemptCount: attempts.length
    };
  };

  // Navigate back to search teachers
  const handleBack = () => {
    navigate('/student/search');
  };

  // Loading state display
  if (loading) {
    return (
      <div style={{
        paddingTop: '24px',
        paddingBottom: '24px',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <Button
            onClick={handleBack}
            icon={<ArrowLeftOutlined />}
            style={{ marginRight: '8px', color: '#64748b' }}
          >
            Orqaga qaytish
          </Button>
        </div>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <ReloadOutlined style={{ fontSize: '32px', color: '#2563eb' }} spin />
          <Title level={4} style={{ marginTop: '16px', color: '#64748b' }}>
            Ma'lumotlar yuklanmoqda...
          </Title>
        </div>
      </div>
    );
  }

  // Error state display
  if (error || !teacher) {
    return (
      <div style={{
        paddingTop: '24px',
        paddingBottom: '24px',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <Button
            onClick={handleBack}
            icon={<ArrowLeftOutlined />}
            style={{ marginRight: '8px', color: '#64748b' }}
          >
            Orqaga qaytish
          </Button>
        </div>
        <Alert
          message={error || 'O\'qituvchi topilmadi'}
          type="error"
        />
      </div>
    );
  }

  const teacherTests = getTeacherTests();

  // Table columns for tests
  const testColumns = [
    {
      title: 'Test nomi',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <Text style={{
            fontWeight: 600,
            color: '#1e293b',
            fontSize: '0.875rem'
          }}>
            {text || 'Test nomi ko\'rsatilmagan'}
          </Text>
          {record.description && (
            <Text style={{
              fontSize: '0.75rem',
              color: '#64748b',
              display: 'block',
              marginTop: '4px'
            }}>
              {record.description.length > 50 ? record.description.substring(0, 50) + '...' : record.description}
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
        <div
          style={{
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            fontWeight: 800,
            fontSize: '0.75rem',
            padding: '4px 12px',
            border: '2px solid #2563eb',
            display: 'inline-block'
          }}
        >
          {subject || 'Noma\'lum'}
        </div>
      ),
    },
    {
      title: 'Qiyinlik',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => {
        if (!difficulty) return null;

        const getDifficultyStyle = (level) => {
          switch (level) {
            case 'Oson':
              return { bg: '#dcfce7', color: '#166534', border: '#166534' };
            case 'O\'rta':
              return { bg: '#fef3c7', color: '#92400e', border: '#92400e' };
            default:
              return { bg: '#fee2e2', color: '#991b1b', border: '#991b1b' };
          }
        };

        const style = getDifficultyStyle(difficulty);

        return (
          <div
            style={{
              backgroundColor: style.bg,
              color: style.color,
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '4px 12px',
              border: `2px solid ${style.border}`,
              display: 'inline-block'
            }}
          >
            {difficulty}
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const completionStatus = getTestCompletionStatus(record.id);
        const isCompleted = completionStatus.hasCompleted;
        const hasActiveSession = !!activeTestSessions[record.id];

        if (hasActiveSession) {
          return (
            <div
              style={{
                backgroundColor: '#ecfdf5',
                color: '#059669',
                fontWeight: 900,
                fontSize: '0.75rem',
                padding: '4px 12px',
                border: '2px solid #059669',
                display: 'inline-block'
              }}
            >
              FAOL SEANS
            </div>
          );
        } else if (isCompleted) {
          return (
            <div>
              <div
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  padding: '4px 12px',
                  border: '2px solid #064e3b',
                  display: 'inline-block',
                  marginBottom: '4px'
                }}
              >
                ISHLANGAN
              </div>
              <div>
                <Text style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#64748b'
                }}>
                  Ball: {completionStatus.lastScore}%
                </Text>
              </div>
            </div>
          );
        } else {
          return (
            <div
              style={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontWeight: 900,
                fontSize: '0.75rem',
                padding: '4px 12px',
                border: '2px solid #6b7280',
                display: 'inline-block'
              }}
            >
              ISHLANMAGAN
            </div>
          );
        }
      },
    },
    {
      title: 'Harakatlar',
      key: 'actions',
      render: (_, record) => {
        const completionStatus = getTestCompletionStatus(record.id);
        const isCompleted = completionStatus.hasCompleted;
        const hasActiveSession = !!activeTestSessions[record.id];

        const getButtonStyle = () => {
          if (hasActiveSession) {
            return { bg: '#059669', border: '#064e3b' };
          } else if (isCompleted) {
            return { bg: '#94a3b8', border: '#475569' };
          } else {
            return { bg: '#2563eb', border: '#1e3a8a' };
          }
        };

        const buttonStyle = getButtonStyle();

        return (
          <Button
            size="small"
            type="primary"
            onClick={() => {
              if (hasActiveSession) {
                navigate(`/student/take-test?testId=${record.id}`);
              } else if (!isCompleted) {
                navigate(`/student/take-test?testId=${record.id}`);
              }
            }}
            disabled={!hasActiveSession && isCompleted}
            style={{
              fontSize: '0.875rem',
              fontWeight: 900,
              padding: '8px 16px',
              height: 'auto',
              borderRadius: 0,
              backgroundColor: buttonStyle.bg,
              border: `2px solid ${buttonStyle.border}`,
              boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
              textTransform: 'uppercase'
            }}
            icon={hasActiveSession ? <PlayCircleOutlined /> : (isCompleted ? <CheckCircleOutlined /> : <PlayCircleOutlined />)}
          >
            {hasActiveSession ? 'Davom ettirish' : (isCompleted ? 'Ishlangan' : 'Boshlash')}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="animate__animated animate__fadeIn" style={{
      paddingTop: '24px',
      paddingBottom: '24px',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '60px' }}>
        <div style={{ backgroundColor: '#2563eb', color: '#fff', padding: '8px 16px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', display: 'inline-block' }}>
          O'qituvchi
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <Title level={1} style={{ fontWeight: 900, fontSize: '3rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#1e293b', margin: 0 }}>
            O'qituvchi <span style={{ color: '#2563eb' }}>Ma'lumotlari</span>
          </Title>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{
              borderColor: '#e2e8f0',
              borderWidth: '2px',
              color: '#64748b',
              fontWeight: 900,
              borderRadius: 0,
              boxShadow: '4px 4px 0px rgba(0,0,0,0.05)',
              height: 'auto',
              padding: '12px 24px',
              textTransform: 'uppercase'
            }}
          >
            ORQAGA QAYTISH
          </Button>
        </div>
        <div style={{ width: '80px', height: '10px', backgroundColor: '#2563eb', margin: '24px 0' }}></div>
        <Text style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px', display: 'block' }}>
          O'qituvchi bilan tanishing, ularning fanlari va o'quvchilarga taqdim etgan testlari haqida to'liq ma'lumot oling.
        </Text>
      </div>

      {/* Teacher information section */}
      <div className="animate__animated animate__fadeIn" style={{ animationDelay: '200ms' }}>
        <Card style={{
          backgroundColor: '#ffffff',
          border: '4px solid #2563eb',
          borderRadius: 0,
          boxShadow: '12px 12px 0px rgba(37, 99, 235, 0.1)',
          marginBottom: '32px',
          overflow: 'hidden'
        }}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={8} style={{ textAlign: { xs: 'center', md: 'left' } }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                <Avatar size={140} style={{
                  fontSize: '4rem',
                  backgroundColor: '#2563eb',
                  borderRadius: 0,
                  border: '6px solid #2563eb',
                  boxShadow: '8px 8px 0px rgba(0,0,0,0.1)'
                }}>
                  👨‍🏫
                </Avatar>
              </div>
              <Title level={2} style={{
                fontWeight: 900,
                color: '#1e293b',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em'
              }}>
                {teacher.name || 'Ismi ko\'rsatilmagan'}
              </Title>
              <div
                style={{
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  fontWeight: 900,
                  fontSize: '1rem',
                  padding: '8px 16px',
                  border: '3px solid #2563eb',
                  display: 'inline-block',
                  textTransform: 'uppercase'
                }}
              >
                O'qituvchi
              </div>
            </Col>

            <Col xs={24} md={16}>
              {teacher.bio && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <EditOutlined style={{ color: '#2563eb', fontSize: '20px' }} />
                    <Text style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                      Biografiya
                    </Text>
                  </div>
                  <div style={{ borderLeft: '6px solid #2563eb', paddingLeft: '16px', backgroundColor: '#f8fafc', padding: '16px' }}>
                    <Text style={{ color: '#334155', fontSize: '1.1rem', lineHeight: 1.6, fontWeight: 500 }}>
                      {teacher.bio}
                    </Text>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <BookOutlined style={{ color: '#2563eb', fontSize: '20px' }} />
                  <Text style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                    O'qitiladigan fanlar
                  </Text>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {teacher.subjects?.map((subject) => (
                    <div
                      key={subject}
                      style={{
                        backgroundColor: '#fff',
                        color: '#2563eb',
                        fontWeight: 900,
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                        border: '3px solid #2563eb',
                        boxShadow: '4px 4px 0px rgba(37, 99, 235, 0.1)'
                      }}
                    >
                      {subject}
                    </div>
                  )) || (
                      <Text style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 600 }}>
                        Fanlar ko'rsatilmagan
                      </Text>
                    )}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <BarChartOutlined style={{ color: '#2563eb', fontSize: '20px' }} />
                  <Text style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                    Statistika
                  </Text>
                </div>
                <Row gutter={[24, 24]}>
                  <Col xs={12} md={8}>
                    <div style={{
                      backgroundColor: '#fff',
                      border: '4px solid #2563eb',
                      borderRadius: 0,
                      textAlign: 'center',
                      padding: '20px',
                      boxShadow: '8px 8px 0px rgba(37, 99, 235, 0.1)'
                    }}>
                      <Title level={2} style={{ fontSize: '2.5rem', fontWeight: 900, color: '#2563eb', marginBottom: '4px', lineHeight: 1 }}>
                        {teacherTests.length}
                      </Title>
                      <Text style={{ color: '#64748b', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        Jami testlar
                      </Text>
                    </div>
                  </Col>
                  <Col xs={12} md={8}>
                    <div style={{
                      backgroundColor: '#fff',
                      border: '4px solid #10b981',
                      borderRadius: 0,
                      textAlign: 'center',
                      padding: '20px',
                      boxShadow: '8px 8px 0px rgba(16, 185, 129, 0.1)'
                    }}>
                      <Title level={2} style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981', marginBottom: '4px', lineHeight: 1 }}>
                        {teacher.subjects?.length || 0}
                      </Title>
                      <Text style={{ color: '#64748b', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        Fanlar soni
                      </Text>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Tests section */}
      <div className="animate__animated animate__fadeIn" style={{ animationDelay: '400ms', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <BookOutlined style={{ color: '#2563eb', fontSize: '24px' }} />
          <Title level={2} style={{
            fontSize: '1.8rem',
            fontWeight: 900,
            color: '#1e293b',
            margin: 0,
            textTransform: 'uppercase'
          }}>
            {teacher.name}ning <span style={{ color: '#2563eb' }}>testlari</span>
          </Title>
        </div>

        {teacherTests.length > 0 ? (
          <div className="animate__animated animate__fadeIn" style={{ animationDelay: '600ms' }}>
            <Card style={{
              backgroundColor: '#ffffff',
              border: '4px solid #000',
              borderRadius: 0,
              boxShadow: '12px 12px 0px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              padding: 0
            }}>
              <Table
                columns={testColumns}
                dataSource={teacherTests.map(test => ({ ...test, key: test.id }))}
                pagination={false}
              />
            </Card>
          </div>
        ) : (
          <div className="animate__animated animate__fadeIn" style={{ animationDelay: '800ms' }}>
            <Card style={{
              backgroundColor: '#ffffff',
              border: '4px solid #e2e8f0',
              borderRadius: 0,
              boxShadow: '8px 8px 0px rgba(0,0,0,0.02)',
              textAlign: 'center',
              padding: '48px 24px'
            }}>
              <Text style={{ fontSize: '3rem', marginBottom: '16px', display: 'block' }}>📝</Text>
              <Title level={4} style={{
                color: '#64748b',
                fontWeight: 900,
                marginBottom: '16px',
                textTransform: 'uppercase'
              }}>
                Bu o'qituvchining hali testlari yo'q
              </Title>
              <Text style={{ color: '#94a3b8', fontWeight: 600 }}>
                Tez orada yangi testlar qo'shilishi mumkin
              </Text>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDetails;