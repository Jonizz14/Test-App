import React, { useState, useEffect } from 'react';
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
        <Tag
          style={{
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            fontWeight: 500,
            borderRadius: '6px',
            fontSize: '0.75rem',
            margin: 0
          }}
        >
          {subject || 'Noma\'lum'}
        </Tag>
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
              return { bg: '#dcfce7', color: '#166534' };
            case 'O\'rta':
              return { bg: '#fef3c7', color: '#92400e' };
            default:
              return { bg: '#fee2e2', color: '#991b1b' };
          }
        };
        
        const style = getDifficultyStyle(difficulty);
        
        return (
          <Tag
            style={{
              backgroundColor: style.bg,
              color: style.color,
              fontWeight: 500,
              borderRadius: '6px',
              fontSize: '0.75rem',
              margin: 0
            }}
          >
            {difficulty}
          </Tag>
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
            <div>
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
                Faol seans
              </Tag>
            </div>
          );
        } else if (isCompleted) {
          return (
            <div>
              <Tag
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontWeight: 600,
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  margin: 0,
                  marginBottom: '4px'
                }}
              >
                Ishlangan
              </Tag>
              <div>
                <Text style={{
                  fontSize: '0.625rem',
                  color: '#64748b'
                }}>
                  Ball: {completionStatus.lastScore}
                </Text>
              </div>
            </div>
          );
        } else {
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
              Ishlanmagan
            </Tag>
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
            return { bg: '#059669', hoverBg: '#047857' };
          } else if (isCompleted) {
            return { bg: '#94a3b8', hoverBg: '#94a3b8' };
          } else {
            return { bg: '#2563eb', hoverBg: '#1d4ed8' };
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
              fontSize: '0.75rem',
              padding: '4px 8px',
              minWidth: 'auto',
              backgroundColor: buttonStyle.bg,
              border: 'none'
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
    <div style={{
      paddingTop: '24px',
      paddingBottom: '24px',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        marginTop: '-6px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              O'qituvchi ma'lumotlari
            </Title>
            <Text style={{
              fontSize: '1.125rem',
              color: '#64748b',
              fontWeight: 400
            }}>
              O'qituvchi haqida to'liq ma'lumot va uning testlari
            </Text>
          </div>
          <Button
            onClick={handleBack}
            icon={<ArrowLeftOutlined />}
            style={{
              borderColor: '#e2e8f0',
              color: '#64748b'
            }}
          >
            O'qituvchilarni qidirishga qaytish
          </Button>
        </div>
      </div>

      {/* Teacher information section */}
      <div>
        <Card style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '32px'
        }}>
          <Row gutter={[24, 24]} align="middle">
            {/* Teacher avatar and basic info */}
            <Col xs={24} md={8} style={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Avatar size={120} style={{
                fontSize: '3rem',
                backgroundColor: '#2563eb',
                margin: { xs: '0 auto 16px', md: '0 0 16px 0' }
              }}>
                👨‍🏫
              </Avatar>
              <Title level={3} style={{ 
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                {teacher.name || 'Ismi ko\'rsatilmagan'}
              </Title>
              <Tag
                icon={<UserOutlined />}
                style={{
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                O'qituvchi
              </Tag>
            </Col>

            {/* Teacher details */}
            <Col xs={24} md={16}>
              {/* Bio */}
              {teacher.bio && (
                <div style={{ marginBottom: '24px' }}>
                  <Text style={{ 
                    fontWeight: 600, 
                    color: '#374151',
                    fontSize: '1rem',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    📝 Biografiya:
                  </Text>
                  <Text style={{ 
                    color: '#64748b',
                    fontSize: '1rem',
                    lineHeight: 1.6
                  }}>
                    {teacher.bio}
                  </Text>
                </div>
              )}

              {/* Subjects */}
              <div style={{ marginBottom: '24px' }}>
                <Text style={{ 
                  fontWeight: 600, 
                  color: '#374151',
                  fontSize: '1rem',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  📚 O'qitiladigan fanlar:
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {teacher.subjects?.map((subject) => (
                    <Tag
                      key={subject}
                      style={{
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        fontWeight: 500,
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        margin: 0
                      }}
                    >
                      {subject}
                    </Tag>
                  )) || (
                    <Text style={{ 
                      color: '#94a3b8',
                      fontSize: '0.875rem'
                    }}>
                      Fanlar ko'rsatilmagan
                    </Text>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div>
                <Text style={{ 
                  fontWeight: 600, 
                  color: '#374151',
                  fontSize: '1rem',
                  marginBottom: '16px',
                  display: 'block'
                }}>
                  📊 Statistika:
                </Text>
                <Row gutter={[16, 16]}>
                  <Col xs={12} md={8}>
                    <Card style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      textAlign: 'center',
                      padding: '16px'
                    }}>
                      <Title level={3} style={{ 
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#2563eb',
                        marginBottom: '4px'
                      }}>
                        {teacherTests.length}
                      </Title>
                      <Text style={{ 
                        color: '#64748b',
                        fontSize: '0.75rem'
                      }}>
                        Jami testlar
                      </Text>
                    </Card>
                  </Col>
                  <Col xs={12} md={8}>
                    <Card style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      textAlign: 'center',
                      padding: '16px'
                    }}>
                      <Title level={3} style={{ 
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#059669',
                        marginBottom: '4px'
                      }}>
                        {teacher.subjects?.length || 0}
                      </Title>
                      <Text style={{ 
                        color: '#64748b',
                        fontSize: '0.75rem'
                      }}>
                        Fanlar soni
                      </Text>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Tests section */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '24px'
        }}>
          📝 {teacher.name}ning testlari
        </Title>

        {/* Tests table */}
        {teacherTests.length > 0 ? (
          <Card style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <Table
              columns={testColumns}
              dataSource={teacherTests.map(test => ({ ...test, key: test.id }))}
              pagination={false}
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
        ) : (
          // No tests message
          <div>
            <Card style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              padding: '48px 24px'
            }}>
              <Text style={{ fontSize: '3rem', marginBottom: '16px', display: 'block' }}>📝</Text>
              <Title level={4} style={{
                color: '#64748b',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                Bu o'qituvchining hali testlari yo'q
              </Title>
              <Text style={{ color: '#94a3b8' }}>
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