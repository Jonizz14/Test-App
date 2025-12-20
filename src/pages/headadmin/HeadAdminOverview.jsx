import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  List,
  Alert,
  Spin,
  Collapse,
  Badge,
  Statistic,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
  RiseOutlined,
  BarChartOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const HeadAdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalSellers: 0,
    totalTests: 0,
    totalAttempts: 0,
    activeTests: 0,
    recentActivity: [],
    allRecentActivity: [],
    bannedUsers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Fetch real statistics from the database
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);

        // Fetch all users, tests, and attempts in parallel
        const [usersData, testsData, attemptsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getTests(),
          apiService.getAttempts()
        ]);

        const users = usersData.results || usersData;
        const bannedUsers = users.filter(user => user.is_banned);
        const tests = testsData.results || testsData;
        const attempts = attemptsData.results || attemptsData;

        // Calculate statistics
        const totalUsers = users.length;
        const totalAdmins = users.filter(user => user.role === 'admin' || user.role === 'head_admin').length;
        const totalTeachers = users.filter(user => user.role === 'teacher').length;
        const totalStudents = users.filter(user => user.role === 'student').length;
        const totalSellers = users.filter(user => user.role === 'seller').length;
        const totalTests = tests.length;
        const totalAttempts = attempts.length;
        const activeTests = tests.filter(test => test.is_active !== false).length;

        // Calculate score statistics
        const scores = attempts.map(attempt => attempt.score || 0);

        // Calculate statistics
        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;

        const highestScore = scores.length > 0
          ? Math.round(Math.max(...scores))
          : 0;

        const lowestScore = scores.length > 0
          ? Math.round(Math.min(...scores))
          : 0;

        // Get recent activity (last 10 attempts for modal, 3 for overview)
        const allRecentActivity = attempts
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
          .slice(0, 10)
          .map(attempt => ({
            id: attempt.id,
            action: `Test yakunlandi: ${attempt.test_title || 'Noma\'lum test'}`,
            user: attempt.student_name || 'Noma\'lum o\'quvchi',
            time: new Date(attempt.submitted_at).toLocaleDateString('uz-UZ'),
            score: attempt.score
          }));

        const recentActivity = allRecentActivity.slice(0, 3);

        setStats({
          totalUsers,
          totalAdmins,
          totalTeachers,
          totalStudents,
          totalSellers,
          totalTests,
          totalAttempts,
          activeTests,
          averageScore,
          highestScore,
          lowestScore,
          recentActivity,
          allRecentActivity,
          bannedUsers
        });

      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const StatCard = ({ title, value, icon, color, suffix }) => (
    <Card
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}
      bodyStyle={{ padding: '24px' }}
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
            valueStyle={{
              fontSize: '40px',
              fontWeight: 700,
              color: '#1e293b',
              lineHeight: 1.2
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
              fontSize: '32px',
              color: '#ffffff'
            }
          })}
        </div>
      </div>
    </Card>
  );

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
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Head Admin Umumiy ko'rinishi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Platformaning to'liq statistikasi va barcha faoliyati
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Jami foydalanuvchilar"
            value={stats.totalUsers}
            icon={<SafetyCertificateOutlined />}
            color="#2563eb"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Administratorlar"
            value={stats.totalAdmins}
            icon={<TeamOutlined />}
            color="#dc2626"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="O'qituvchilar"
            value={stats.totalTeachers}
            icon={<BookOutlined />}
            color="#16a34a"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="O'quvchilar"
            value={stats.totalStudents}
            icon={<UserOutlined />}
            color="#059669"
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatCard
            title="Sotuvchilar"
            value={stats.totalSellers}
            icon={<TeamOutlined />}
            color="#d97706"
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatCard
            title="Jami testlar"
            value={stats.totalTests}
            icon={<BarChartOutlined />}
            color="#7c3aed"
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatCard
            title="Jami urinishlar"
            value={stats.totalAttempts}
            icon={<TrophyOutlined />}
            color="#2563eb"
          />
        </Col>
      </Row>

      {/* Detailed Statistics */}
      <Collapse
        activeKey={detailsExpanded ? ['details'] : []}
        onChange={(keys) => setDetailsExpanded(keys.includes('details'))}
        ghost
        style={{
          backgroundColor: 'transparent'
        }}
      >
        <Panel
          key="details"
          showArrow={false}
          header={
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChartOutlined style={{ color: '#2563eb', fontSize: '24px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <Title level={4} style={{ margin: 0, color: '#1e293b', marginBottom: '4px' }}>
                  📊 To'liq statistika va faoliyatni ko'rish
                </Title>
                <Text style={{ fontSize: '14px', color: '#64748b' }}>
                  Platformaning batafsil statistikasi va faoliyat tarixi
                </Text>
              </div>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: detailsExpanded ? '#2563eb' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: detailsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'all 0.3s ease'
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 9L1 4h10L6 9z" fill="white"/>
                </svg>
              </div>
            </div>
          }
        >
          <div style={{ padding: '24px 0' }}>
            {/* Recent Activity */}
            <Card
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                marginBottom: '24px'
              }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <ClockCircleOutlined style={{ color: '#d97706', fontSize: '20px' }} />
                <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                  So'nggi faoliyat
                </Title>
              </div>
            </Card>

            <Card
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                maxHeight: '400px',
                overflow: 'auto'
              }}
            >
              <List
                dataSource={stats.allRecentActivity}
                locale={{ emptyText: 'Hozircha faoliyat yo\'q' }}
                renderItem={(activity, index) => (
                  <List.Item
                    style={{
                      padding: '16px 24px',
                      borderBottom: index < stats.allRecentActivity.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <Text style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#1e293b'
                        }}>
                          {activity.action}
                        </Text>
                        <Badge
                          count={`${activity.score}%`}
                          style={{
                            backgroundColor: activity.score >= 80 ? '#ecfdf5' :
                                           activity.score >= 60 ? '#fffbeb' : '#fef2f2',
                            color: activity.score >= 80 ? '#059669' :
                                   activity.score >= 60 ? '#d97706' : '#dc2626',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        />
                      </div>
                      <Text style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: 400
                      }}>
                        {activity.user} • {activity.time}
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

export default HeadAdminOverview;