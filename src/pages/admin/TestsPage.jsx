import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Alert,
  Spin,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  Tooltip,
} from 'antd';
import {
  BookOutlined,
  UserOutlined,
  RiseOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const TestsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTests: 0,
    activeTests: 0,
    inactiveTests: 0,
    totalAttempts: 0,
    averageScore: 0,
    popularTests: [],
    testStatistics: [],
    recentActivity: [],
    subjectDistribution: [],
    difficultyDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch test statistics
  useEffect(() => {
    const fetchTestStatistics = async () => {
      try {
        setLoading(true);
        
        const [testsData, attemptsData, usersData] = await Promise.all([
          apiService.getTests(),
          apiService.getAttempts(),
          apiService.getUsers()
        ]);

        const tests = testsData.results || testsData;
        const attempts = attemptsData.results || attemptsData;
        const users = usersData.results || usersData;

        // Calculate test performance and statistics
        const testStatistics = tests.map(test => {
          const testAttempts = attempts.filter(attempt => attempt.test === test.id);
          const attemptCount = testAttempts.length;
          const averageScore = attemptCount > 0 
            ? testAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / attemptCount
            : 0;

          // Get teacher name
          const teacher = users.find(user => user.id === test.teacher);
          const teacherName = teacher ? teacher.name || teacher.username : 'Noma\'lum';

          return {
            id: test.id,
            title: test.title,
            subject: test.subject,
            teacherName,
            totalQuestions: test.total_questions || 0,
            timeLimit: test.time_limit || 0,
            difficulty: test.difficulty || 'O\'rta',
            isActive: test.is_active !== false,
            attemptCount,
            averageScore: Math.round(averageScore),
            createdAt: test.created_at,
            performance: averageScore >= 80 ? 'Yuqori' : averageScore >= 60 ? 'O\'rta' : 'Past'
          };
        });

        // Calculate overall statistics
        const totalTests = tests.length;
        const activeTests = tests.filter(test => test.is_active !== false).length;
        const inactiveTests = totalTests - activeTests;
        const totalAttempts = attempts.length;
        const averageScore = testStatistics.length > 0 
          ? Math.round(testStatistics.reduce((sum, test) => sum + test.averageScore, 0) / testStatistics.length)
          : 0;

        // Get popular tests (top 10 by attempt count)
        const popularTests = testStatistics
          .sort((a, b) => b.attemptCount - a.attemptCount)
          .slice(0, 10);

        // Subject distribution
        const subjectGroups = {};
        testStatistics.forEach(test => {
          const subject = test.subject || 'Noma\'lum';
          if (!subjectGroups[subject]) {
            subjectGroups[subject] = { total: 0, active: 0, totalAttempts: 0 };
          }
          subjectGroups[subject].total++;
          if (test.isActive) {
            subjectGroups[subject].active++;
          }
          subjectGroups[subject].totalAttempts += test.attemptCount;
        });

        const subjectDistribution = Object.entries(subjectGroups).map(([subject, data]) => ({
          subject,
          ...data
        })).sort((a, b) => b.totalAttempts - a.totalAttempts);

        // Difficulty distribution
        const difficultyGroups = {};
        testStatistics.forEach(test => {
          const difficulty = test.difficulty || 'O\'rta';
          if (!difficultyGroups[difficulty]) {
            difficultyGroups[difficulty] = { total: 0, active: 0, totalAttempts: 0 };
          }
          difficultyGroups[difficulty].total++;
          if (test.isActive) {
            difficultyGroups[difficulty].active++;
          }
          difficultyGroups[difficulty].totalAttempts += test.attemptCount;
        });

        const difficultyDistribution = Object.entries(difficultyGroups).map(([difficulty, data]) => ({
          difficulty,
          ...data
        }));

        // Recent activity (simulated based on test creation dates)
        const recentTestCreations = tests
          .filter(test => test.created_at)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(test => {
            const teacher = users.find(user => user.id === test.teacher);
            return {
              testTitle: test.title,
              subject: test.subject,
              teacher: teacher ? teacher.name || teacher.username : 'Noma\'lum',
              action: 'Test yaratildi',
              time: new Date(test.created_at).toLocaleDateString('uz-UZ'),
              type: 'test_creation'
            };
          });

        setStats({
          totalTests,
          activeTests,
          inactiveTests,
          totalAttempts,
          averageScore,
          popularTests,
          testStatistics,
          recentActivity: recentTestCreations,
          subjectDistribution,
          difficultyDistribution
        });

      } catch (error) {
        console.error('Error fetching test statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchTestStatistics();
  }, []);

  const StatCard = ({ title, value, icon, color, suffix, trend }) => (
    <div>
      <Card
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          marginBottom: '12px'
        }}
        styles={{ body: { padding: '24px' } }}
        hoverable
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#64748b',
                display: 'block',
                marginBottom: '8px'
              }}
            >
              {title}
            </Text>
            <Statistic
              value={value}
              suffix={suffix}
              styles={{
                content: {
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#1e293b',
                  lineHeight: 1.2
                }
              }}
            />
          </div>
          <div
            style={{
              backgroundColor: color,
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '16px'
            }}
          >
            {React.cloneElement(icon, {
              style: {
                fontSize: '28px',
                color: '#ffffff'
              }
            })}
          </div>
        </div>
      </Card>
      {trend && (
        <Card
          style={{
            backgroundColor: trend.direction === 'up' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${trend.direction === 'up' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '12px 16px'
          }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {trend.direction === 'up' ? (
              <ArrowUpOutlined style={{ color: '#16a34a', fontSize: '14px', marginRight: '6px' }} />
            ) : (
              <ArrowDownOutlined style={{ color: '#dc2626', fontSize: '14px', marginRight: '6px' }} />
            )}
            <Text style={{ 
              fontSize: '13px', 
              fontWeight: 600,
              color: trend.direction === 'up' ? '#16a34a' : '#dc2626'
            }}>
              {trend.value} o'tgan oyga nisbatan
            </Text>
          </div>
        </Card>
      )}
    </div>
  );

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Yuqori': return '#16a34a';
      case 'O\'rta': return '#f59e0b';
      case 'Past': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Oson': return '#059669';
      case 'O\'rta': return '#f59e0b';
      case 'Qiyin': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'Matematika': '#2563eb',
      'Fizika': '#7c3aed',
      'Kimyo': '#059669',
      'Biologiya': '#16a34a',
      'Tarix': '#dc2626',
      'Geografiya': '#0ea5e9',
      'Ingliz tili': '#f59e0b',
      'Ona tili': '#8b5cf6',
      'Adabiyot': '#ec4899',
    };
    return colors[subject] || '#64748b';
  };

  const columns = [
    {
      title: 'Test nomi',
      key: 'test',
      render: (_, record) => (
        <Space>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: getSubjectColor(record.subject) + '20',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOutlined style={{ color: getSubjectColor(record.subject), fontSize: '18px' }} />
          </div>
          <div>
            <Text strong style={{ color: '#1e293b' }}>
              {record.title}
            </Text>
            <br />
            <Text style={{ color: '#64748b', fontSize: '12px' }}>
              {record.subject}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'O\'qituvchi',
      key: 'teacher',
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ color: '#64748b' }} />
          <Text style={{ color: '#64748b', fontWeight: 600 }}>
            {record.teacherName}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Savollar',
      key: 'questions',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.totalQuestions}
        </Text>
      ),
    },
    {
      title: 'Vaqt (daq)',
      key: 'time',
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#64748b' }} />
          <Text style={{ color: '#64748b', fontWeight: 600 }}>
            {record.timeLimit}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Urinishlar',
      key: 'attempts',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.attemptCount}
        </Text>
      ),
    },
    {
      title: 'O\'rtacha ball',
      key: 'average',
      render: (_, record) => (
        <div>
          <Progress
            percent={record.averageScore}
            size="small"
            strokeColor={getPerformanceColor(record.performance)}
            showInfo={false}
            style={{ marginBottom: '4px' }}
          />
          <Text style={{ color: '#64748b', fontWeight: 600 }}>
            {record.averageScore}%
          </Text>
        </div>
      ),
    },
    {
      title: 'Qiyinchilik',
      key: 'difficulty',
      render: (_, record) => (
        <Tag
          color={getDifficultyColor(record.difficulty)}
          style={{
            backgroundColor: `${getDifficultyColor(record.difficulty)}20`,
            color: getDifficultyColor(record.difficulty),
            fontWeight: 600
          }}
        >
          {record.difficulty}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'default'} icon={record.isActive ? <CheckCircleOutlined /> : <StopOutlined />}>
          {record.isActive ? 'Faol' : 'Nofaol'}
        </Tag>
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => navigate(`/admin/test-details/${record.id}`)}
          style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
        >
          Batafsil
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16 }}>Ma'lumotlar yuklanmoqda...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      </div>
    );
  }

  return (
    <div className="animate__animated animate__fadeIn" style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Testlar statistikasi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Barcha testlarning umumiy ko'rsatkichlari va faoliyati
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Jami testlar"
            value={stats.totalTests}
            icon={<BookOutlined />}
            color="#2563eb"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Faol testlar"
            value={stats.activeTests}
            icon={<PlayCircleOutlined />}
            color="#16a34a"
            trend={{ direction: 'up', value: '+5.2%' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Jami urinishlar"
            value={stats.totalAttempts}
            icon={<TrophyOutlined />}
            color="#7c3aed"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="O'rtacha ball"
            value={stats.averageScore}
            suffix="%"
            icon={<RiseOutlined />}
            color="#f59e0b"
          />
        </Col>
      </Row>

      {/* Popular Tests and Subject Distribution */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Popular Tests */}
        <Col xs={24} lg={12}>
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <Title level={3} style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TrophyOutlined style={{ color: '#f59e0b' }} />
              Mashhur testlar
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {stats.popularTests.map((test, index) => (
                <div key={test.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <Space>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: index < 3 ? '#f59e0b' : '#e2e8f0',
                      color: index < 3 ? '#ffffff' : '#64748b',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <Text strong style={{ color: '#1e293b' }}>
                        {test.title}
                      </Text>
                      <br />
                      <Text style={{ color: '#64748b', fontSize: '12px' }}>
                        {test.subject} • {test.teacherName}
                      </Text>
                    </div>
                  </Space>
                  <Space direction="vertical" align="end">
                    <Text strong style={{ color: '#2563eb', fontSize: '16px' }}>
                      {test.attemptCount} urinish
                    </Text>
                    <Text style={{ color: '#059669', fontSize: '12px' }}>
                      {test.averageScore}% o'rtacha
                    </Text>
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Subject Distribution */}
        <Col xs={24} lg={12}>
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <Title level={3} style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <BookOutlined style={{ color: '#2563eb' }} />
              Fan bo'yicha taqsimot
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {stats.subjectDistribution.slice(0, 8).map((subject) => (
                <div key={subject.subject} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <Space>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: getSubjectColor(subject.subject),
                      borderRadius: '50%'
                    }} />
                    <Text strong style={{ color: '#1e293b' }}>
                      {subject.subject}
                    </Text>
                  </Space>
                  <Space>
                    <Tag color="blue">{subject.active} faol</Tag>
                    <Text style={{ color: '#64748b', fontWeight: 600 }}>
                      {subject.totalAttempts} urinish
                    </Text>
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}
      >
        <Title level={3} style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CalendarOutlined style={{ color: '#2563eb' }} />
          So'nggi faoliyat
        </Title>
        <Row gutter={[16, 16]}>
          {stats.recentActivity.map((activity, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <Text strong style={{ color: '#1e293b' }}>
                  {activity.testTitle}
                </Text>
                <br />
                <Text style={{ color: '#64748b', fontSize: '14px' }}>
                  {activity.action}
                </Text>
                <br />
                <Text style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {activity.teacher} • {activity.time}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Tests Table */}
      <Card
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <Title level={3} style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '24px'
        }}>
          Testlar ro'yxati
        </Title>
        <Table
          columns={columns}
          dataSource={stats.testStatistics}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami ${total} ta test`,
          }}
          locale={{
            emptyText: 'Testlar mavjud emas'
          }}
        />
      </Card>
    </div>
  );
};

export default TestsPage;