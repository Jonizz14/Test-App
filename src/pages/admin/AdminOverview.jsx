import React, { useState, useEffect } from 'react';
import 'animate.css';
import {
  Row,
  Col,
  Card,
  Typography,
  Alert,
  Spin,
  Statistic,
} from 'antd';
import { ConfigProvider, theme } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
  RiseOutlined,
  TrophyOutlined,
  ReadOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalTests: 0,
    totalAttempts: 0,
    activeTests: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    recentActivity: [],
    allRecentActivity: [],
    bannedUsers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const totalTeachers = users.filter(user => user.role === 'teacher').length;
        const totalStudents = users.filter(user => user.role === 'student').length;
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
          totalTeachers,
          totalStudents,
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
                fontSize: '40px',
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
    <div className="animate__animated animate__fadeIn" style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Admin Umumiy ko'rinishi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Platformaning umumiy statistikasi va faoliyati
        </Text>
      </div>

      {/* All Statistics Cards with Entrance Animations */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '100ms' }}>
            <StatCard
              title="Jami foydalanuvchilar"
              value={stats.totalUsers}
              icon={<SafetyCertificateOutlined />}
              color="#2563eb"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '200ms' }}>
            <StatCard
              title="O'qituvchilar"
              value={stats.totalTeachers}
              icon={<BookOutlined />}
              color="#16a34a"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '300ms' }}>
            <StatCard
              title="O'quvchilar"
              value={stats.totalStudents}
              icon={<UserOutlined />}
              color="#059669"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '400ms' }}>
            <StatCard
              title="Jami testlar"
              value={stats.totalTests}
              icon={<RiseOutlined />}
              color="#7c3aed"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '500ms' }}>
            <StatCard
              title="Jami urinishlar"
              value={stats.totalAttempts}
              icon={<TrophyOutlined />}
              color="#2563eb"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '600ms' }}>
            <StatCard
              title="Faol testlar"
              value={stats.activeTests}
              icon={<TeamOutlined />}
              color="#d97706"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '700ms' }}>
            <StatCard
              title="O'rtacha ball"
              value={stats.averageScore}
              suffix="%"
              icon={<RiseOutlined />}
              color="#16a34a"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '800ms' }}>
            <StatCard
              title="Eng yuqori ball"
              value={stats.highestScore}
              suffix="%"
              icon={<TrophyOutlined />}
              color="#059669"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '900ms' }}>
            <StatCard
              title="Eng past ball"
              value={stats.lowestScore}
              suffix="%"
              icon={<ReadOutlined />}
              color="#dc2626"
            />
          </div>
        </Col>
      </Row>

      {/* Banned Users Section with Entrance Animation */}
      {stats.bannedUsers.length > 0 && (
        <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '1000ms' }}>
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              marginTop: '24px'
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
              🚫 Bloklangan o'quvchilar
            </Title>
            <Row gutter={[24, 24]}>
              {stats.bannedUsers.map((user) => (
                <Col xs={24} sm={12} md={8} key={user.id}>
                  <Card style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  hoverable
                  >
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <Text style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#dc2626'
                        }}>
                          {user.name || user.username}
                        </Text>
                        <Text style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          backgroundColor: '#fee2e2',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontWeight: 'bold'
                        }}>
                          Kod: {user.unban_code}
                        </Text>
                      </div>
                      <Text style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '8px',
                        display: 'block'
                      }}>
                        <strong>Bloklash sababi:</strong> {user.ban_reason}
                      </Text>
                      <Text style={{
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        <strong>Bloklangan:</strong> {user.ban_date ? new Date(user.ban_date).toLocaleDateString('uz-UZ') : 'Noma\'lum'}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
