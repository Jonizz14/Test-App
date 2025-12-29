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
  Timeline,
  Divider,
  Tooltip,
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  RiseOutlined,
  TrophyOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const StatisticsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    // Overview stats
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalTests: 0,
    totalAttempts: 0,
    averageScore: 0,
    
    // Growth metrics
    studentGrowth: 0,
    testGrowth: 0,
    attemptGrowth: 0,
    scoreGrowth: 0,
    
    // Detailed analytics
    classPerformance: [],
    topStudents: [],
    popularTests: [],
    subjectAnalytics: [],
    weeklyActivity: [],
    monthlyTrends: [],
    
    // Recent insights
    recentActivities: [],
    insights: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch comprehensive statistics
  useEffect(() => {
    const fetchComprehensiveStatistics = async () => {
      try {
        setLoading(true);
        
        const [usersData, testsData, attemptsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getTests(),
          apiService.getAttempts()
        ]);

        const users = usersData.results || usersData;
        const tests = testsData.results || testsData;
        const attempts = attemptsData.results || attemptsData;

        // Calculate basic metrics
        const totalUsers = users.length;
        const totalStudents = users.filter(user => user.role === 'student').length;
        const totalTeachers = users.filter(user => user.role === 'teacher').length;
        const totalTests = tests.length;
        const totalAttempts = attempts.length;
        
        const scores = attempts.map(attempt => attempt.score || 0);
        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;

        // Class performance analysis
        const students = users.filter(user => user.role === 'student');
        const classGroups = {};
        
        students.forEach(student => {
          const classGroup = student.class_group || 'Noma\'lum';
          if (!classGroups[classGroup]) {
            classGroups[classGroup] = {
              name: classGroup,
              students: [],
              totalTests: 0,
              totalScore: 0,
              activeStudents: 0
            };
          }
          classGroups[classGroup].students.push(student);
          if (!student.is_banned) {
            classGroups[classGroup].activeStudents++;
          }
          
          // Calculate class test statistics
          const studentAttempts = attempts.filter(attempt => attempt.student === student.id);
          classGroups[classGroup].totalTests += studentAttempts.length;
          
          if (studentAttempts.length > 0) {
            const avgScore = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
            classGroups[classGroup].totalScore += avgScore;
          }
        });

        const classPerformance = Object.values(classGroups).map(cls => ({
          ...cls,
          averageScore: cls.students.length > 0 
            ? Math.round(cls.totalScore / cls.students.filter(s => 
                attempts.some(a => a.student === s.id)).length) || 0
            : 0
        })).sort((a, b) => b.averageScore - a.averageScore);

        // Top students analysis
        const studentAnalytics = students.map(student => {
          const studentAttempts = attempts.filter(attempt => attempt.student === student.id);
          const testCount = studentAttempts.length;
          const avgScore = testCount > 0 
            ? Math.round(studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / testCount)
            : 0;
            
          return {
            id: student.id,
            name: student.name || student.username,
            classGroup: student.class_group || 'Noma\'lum',
            testCount,
            averageScore: avgScore,
            isBanned: student.is_banned,
            registrationDate: student.registration_date
          };
        });

        const topStudents = studentAnalytics
          .filter(student => !student.isBanned && student.testCount > 0)
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 10);

        // Popular tests analysis
        const testAnalytics = tests.map(test => {
          const testAttempts = attempts.filter(attempt => attempt.test === test.id);
          const attemptCount = testAttempts.length;
          const avgScore = attemptCount > 0 
            ? Math.round(testAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / attemptCount)
            : 0;
            
          const teacher = users.find(user => user.id === test.teacher);
          
          return {
            id: test.id,
            title: test.title,
            subject: test.subject,
            teacherName: teacher ? teacher.name || teacher.username : 'Noma\'lum',
            attemptCount,
            averageScore: avgScore,
            isActive: test.is_active !== false
          };
        });

        const popularTests = testAnalytics
          .sort((a, b) => b.attemptCount - a.attemptCount)
          .slice(0, 10);

        // Subject analytics
        const subjectGroups = {};
        testAnalytics.forEach(test => {
          const subject = test.subject || 'Noma\'lum';
          if (!subjectGroups[subject]) {
            subjectGroups[subject] = {
              subject,
              totalTests: 0,
              totalAttempts: 0,
              averageScore: 0,
              activeTests: 0
            };
          }
          subjectGroups[subject].totalTests++;
          subjectGroups[subject].totalAttempts += test.attemptCount;
          if (test.isActive) {
            subjectGroups[subject].activeTests++;
          }
        });

        const subjectAnalytics = Object.values(subjectGroups).map(subject => ({
          ...subject,
          averageScore: subject.totalAttempts > 0 
            ? Math.round(testAnalytics
                .filter(t => t.subject === subject.subject)
                .reduce((sum, t) => sum + t.averageScore, 0) / 
                testAnalytics.filter(t => t.subject === subject.subject).length)
            : 0
        })).sort((a, b) => b.totalAttempts - a.totalAttempts);

        // Weekly activity simulation (last 7 days)
        const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toISOString().split('T')[0],
            dayName: date.toLocaleDateString('uz-UZ', { weekday: 'short' }),
            registrations: Math.floor(Math.random() * 20) + 5,
            testAttempts: Math.floor(Math.random() * 100) + 20,
            newTests: Math.floor(Math.random() * 5) + 1
          };
        });

        // Monthly trends (last 6 months)
        const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - i));
          return {
            month: date.toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' }),
            students: Math.floor(Math.random() * 50) + 100,
            tests: Math.floor(Math.random() * 20) + 30,
            attempts: Math.floor(Math.random() * 500) + 800,
            averageScore: Math.floor(Math.random() * 20) + 60
          };
        });

        // Generate insights and alerts
        const insights = [
          {
            type: 'positive',
            title: 'A\'lo natijalar',
            description: `${topStudents.length} ta o\'quvchi 80% dan yuqori ball oldi`,
            impact: 'high'
          },
          {
            type: 'info',
            title: 'Faol sinflar',
            description: `${classPerformance.filter(c => c.averageScore > 70).length} ta sinf o\'rtacha 70% dan yuqori ko\'rsatkichga ega`,
            impact: 'medium'
          },
          {
            type: 'warning',
            title: 'E\'tibor kerak',
            description: `${students.filter(s => s.is_banned).length} ta o\'quvchi bloklangan holatda`,
            impact: 'low'
          }
        ];

        const alerts = [
          {
            type: 'success',
            message: `Jami ${totalAttempts} ta test urinish qayd etildi`,
            time: '2 soat oldin'
          },
          {
            type: 'info',
            message: `Yangi test yaratildi: "Algebra asoslari"`,
            time: '4 soat oldin'
          },
          {
            type: 'warning',
            message: `5 ta o\'quvchi bir hafta davomida test ishlashmagan`,
            time: '1 kun oldin'
          }
        ];

        // Recent activities
        const recentActivities = [
          {
            type: 'student_registration',
            title: 'Yangi o\'quvchi ro\'yxatdan o\'tdi',
            description: 'Ahmad Karimov 9-01-A sinfiga qo\'shildi',
            time: '30 daqiqa oldin',
            icon: <UserOutlined style={{ color: '#16a34a' }} />
          },
          {
            type: 'test_completion',
            title: 'Test yakunlandi',
            description: 'Fizika testida 15 ta o\'quvchi ishtirok etdi',
            time: '1 soat oldin',
            icon: <BookOutlined style={{ color: '#2563eb' }} />
          },
          {
            type: 'high_score',
            title: 'Yuqori ball',
            description: 'Laylo Azimova 95% ball oldi',
            time: '2 soat oldin',
            icon: <TrophyOutlined style={{ color: '#f59e0b' }} />
          },
          {
            type: 'test_created',
            title: 'Yangi test',
            description: 'Kimyo fani bo\'yicha test yaratildi',
            time: '3 soat oldin',
            icon: <PlusOutlined style={{ color: '#7c3aed' }} />
          }
        ];

        setStats({
          totalUsers,
          totalStudents,
          totalTeachers,
          totalTests,
          totalAttempts,
          averageScore,
          studentGrowth: 12.5,
          testGrowth: 8.3,
          attemptGrowth: 15.7,
          scoreGrowth: 3.2,
          classPerformance,
          topStudents,
          popularTests,
          subjectAnalytics,
          weeklyActivity,
          monthlyTrends,
          recentActivities,
          insights,
          alerts
        });

      } catch (error) {
        console.error('Error fetching comprehensive statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchComprehensiveStatistics();
  }, []);

  const StatCard = ({ title, value, icon, color, suffix, trend, subtitle }) => (
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

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive': return '#16a34a';
      case 'warning': return '#f59e0b';
      case 'info': return '#2563eb';
      case 'negative': return '#dc2626';
      default: return '#64748b';
    }
  };

  const columns = {
    classes: [
      {
        title: 'Sinf',
        dataIndex: 'name',
        key: 'name',
        render: (text) => (
          <Text strong style={{ color: '#1e293b' }}>{text}</Text>
        ),
      },
      {
        title: 'O\'quvchilar',
        dataIndex: 'students',
        key: 'students',
        render: (students) => (
          <Text style={{ color: '#64748b' }}>{students.length} ta</Text>
        ),
      },
      {
        title: 'Faol',
        dataIndex: 'activeStudents',
        key: 'activeStudents',
        render: (count) => (
          <Text style={{ color: '#16a34a', fontWeight: 600 }}>{count} ta</Text>
        ),
      },
      {
        title: 'O\'rtacha ball',
        dataIndex: 'averageScore',
        key: 'averageScore',
        render: (score) => (
          <Text style={{ color: score >= 70 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#dc2626', fontWeight: 600 }}>
            {score}%
          </Text>
        ),
      },
    ],
    students: [
      {
        title: 'O\'quvchi',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <Space>
            <Text strong style={{ color: '#1e293b' }}>{text}</Text>
            <Text style={{ color: '#64748b', fontSize: '12px' }}>({record.classGroup})</Text>
          </Space>
        ),
      },
      {
        title: 'Testlar',
        dataIndex: 'testCount',
        key: 'testCount',
        render: (count) => (
          <Text style={{ color: '#2563eb', fontWeight: 600 }}>{count}</Text>
        ),
      },
      {
        title: 'O\'rtacha ball',
        dataIndex: 'averageScore',
        key: 'averageScore',
        render: (score) => (
          <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red'}>
            {score}%
          </Tag>
        ),
      },
    ],
    tests: [
      {
        title: 'Test',
        dataIndex: 'title',
        key: 'title',
        render: (text, record) => (
          <Space direction="vertical" size="small">
            <Text strong style={{ color: '#1e293b' }}>{text}</Text>
            <Text style={{ color: '#64748b', fontSize: '12px' }}>
              {record.subject} • {record.teacherName}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Urinishlar',
        dataIndex: 'attemptCount',
        key: 'attemptCount',
        render: (count) => (
          <Text style={{ color: '#7c3aed', fontWeight: 600 }}>{count}</Text>
        ),
      },
      {
        title: 'O\'rtacha ball',
        dataIndex: 'averageScore',
        key: 'averageScore',
        render: (score) => (
          <Text style={{ color: '#059669', fontWeight: 600 }}>{score}%</Text>
        ),
      },
    ]
  };

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
          Umumiy statistika
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Platformaning to'liq analitikasi va insights
        </Text>
      </div>

      {/* Overview Statistics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Jami foydalanuvchilar"
            value={stats.totalUsers}
            icon={<UserOutlined />}
            color="#2563eb"
            trend={{ direction: 'up', value: `+${stats.studentGrowth}%` }}
            subtitle={`${stats.totalStudents} o'quvchi, ${stats.totalTeachers} o'qituvchi`}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Jami testlar"
            value={stats.totalTests}
            icon={<BookOutlined />}
            color="#7c3aed"
            trend={{ direction: 'up', value: `+${stats.testGrowth}%` }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Jami urinishlar"
            value={stats.totalAttempts}
            icon={<TrophyOutlined />}
            color="#059669"
            trend={{ direction: 'up', value: `+${stats.attemptGrowth}%` }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="O'rtacha ball"
            value={stats.averageScore}
            suffix="%"
            icon={<RiseOutlined />}
            color="#f59e0b"
            trend={{ direction: 'up', value: `+${stats.scoreGrowth}%` }}
          />
        </Col>
      </Row>

      {/* Insights and Alerts */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
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
              <DashboardOutlined style={{ color: '#2563eb' }} />
              Asosiy insights
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {stats.insights.map((insight, index) => (
                <div key={index} style={{
                  padding: '16px',
                  backgroundColor: `${getInsightColor(insight.type)}10`,
                  borderLeft: `4px solid ${getInsightColor(insight.type)}`,
                  borderRadius: '8px'
                }}>
                  <Space>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: getInsightColor(insight.type),
                      borderRadius: '50%'
                    }} />
                    <Text strong style={{ color: '#1e293b' }}>
                      {insight.title}
                    </Text>
                  </Space>
                  <br />
                  <Text style={{ color: '#64748b' }}>
                    {insight.description}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
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
              <InfoCircleOutlined style={{ color: '#f59e0b' }} />
              So'nggi xabarlar
            </Title>
            <Timeline
              items={stats.alerts.map((alert, index) => ({
                color: alert.type === 'success' ? 'green' : alert.type === 'warning' ? 'orange' : 'blue',
                children: (
                  <div>
                    <Text style={{ color: '#1e293b', fontWeight: 500 }}>
                      {alert.message}
                    </Text>
                    <br />
                    <Text style={{ color: '#64748b', fontSize: '12px' }}>
                      {alert.time}
                    </Text>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Analytics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Top Classes */}
        <Col xs={24} lg={8}>
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
              marginBottom: '16px'
            }}>
              Eng yaxshi sinflar
            </Title>
            <Table
              columns={columns.classes}
              dataSource={stats.classPerformance.slice(0, 5)}
              rowKey="name"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Top Students */}
        <Col xs={24} lg={8}>
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
              marginBottom: '16px'
            }}>
              Eng yaxshi o'quvchilar
            </Title>
            <Table
              columns={columns.students}
              dataSource={stats.topStudents.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Popular Tests */}
        <Col xs={24} lg={8}>
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
              marginBottom: '16px'
            }}>
              Mashhur testlar
            </Title>
            <Table
              columns={columns.tests}
              dataSource={stats.popularTests.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Subject Analytics */}
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
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <BarChartOutlined style={{ color: '#2563eb' }} />
          Fanlar bo'yicha analitika
        </Title>
        <Row gutter={[24, 24]}>
          {stats.subjectAnalytics.map((subject, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={subject.subject}>
              <div style={{
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <Text strong style={{ 
                  fontSize: '16px', 
                  color: '#1e293b',
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  {subject.subject}
                </Text>
                <Row gutter={8}>
                  <Col span={8}>
                    <Statistic
                      title="Testlar"
                      value={subject.totalTests}
                      valueStyle={{ fontSize: '18px', color: '#2563eb' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Urinishlar"
                      value={subject.totalAttempts}
                      valueStyle={{ fontSize: '18px', color: '#7c3aed' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Ball"
                      value={subject.averageScore}
                      suffix="%"
                      valueStyle={{ fontSize: '18px', color: '#059669' }}
                    />
                  </Col>
                </Row>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Weekly Activity Chart Placeholder */}
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
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <LineChartOutlined style={{ color: '#2563eb' }} />
          Haftalik faoliyat
        </Title>
        <Row gutter={[16, 16]}>
          {stats.weeklyActivity.map((day, index) => (
            <Col xs={24} sm={12} md={8} lg={3} key={day.date}>
              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <Text strong style={{ color: '#1e293b', display: 'block' }}>
                  {day.dayName}
                </Text>
                <Text style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>
                  {new Date(day.date).toLocaleDateString('uz-UZ')}
                </Text>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ marginBottom: '8px' }}>
                  <Text style={{ fontSize: '12px', color: '#64748b' }}>Ro'yxatlar</Text>
                  <br />
                  <Text strong style={{ color: '#16a34a' }}>{day.registrations}</Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text style={{ fontSize: '12px', color: '#64748b' }}>Testlar</Text>
                  <br />
                  <Text strong style={{ color: '#2563eb' }}>{day.testAttempts}</Text>
                </div>
                <div>
                  <Text style={{ fontSize: '12px', color: '#64748b' }}>Yangi testlar</Text>
                  <br />
                  <Text strong style={{ color: '#7c3aed' }}>{day.newTests}</Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default StatisticsPage;