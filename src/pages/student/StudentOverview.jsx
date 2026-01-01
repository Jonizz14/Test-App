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
  ClockCircleOutlined,
  StarOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const StudentOverview = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalTests: 0,
    completedTests: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    totalAttempts: 0,
    activeTests: 0,
    totalPoints: 0,
    stars: 0,
    isPremium: false,
    premiumExpiry: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch student statistics from the database
  useEffect(() => {
    const fetchStudentStatistics = async () => {
      try {
        setLoading(true);
        
        // Fetch student's attempts and user data in parallel
        const [attemptsData, userData] = await Promise.all([
          apiService.getAttempts({ student: currentUser.id }),
          apiService.getUser(currentUser.id)
        ]);

        const attempts = attemptsData.results || attemptsData;
        const user = userData;

        // Calculate statistics
        const totalAttempts = attempts.length;
        const completedTests = attempts.filter(attempt => attempt.submitted_at).length;
        const activeTests = attempts.filter(attempt => !attempt.submitted_at).length;

        // Calculate score statistics
        const scores = attempts
          .filter(attempt => attempt.score !== null && attempt.score !== undefined)
          .map(attempt => attempt.score || 0);

        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;

        const highestScore = scores.length > 0
          ? Math.round(Math.max(...scores))
          : 0;

        const lowestScore = scores.length > 0
          ? Math.round(Math.min(...scores))
          : 0;

        // Calculate total points (assuming points are calculated from scores)
        const totalPoints = attempts.reduce((sum, attempt) => {
          return sum + (attempt.score || 0);
        }, 0);

        setStats({
          totalTests: completedTests + activeTests,
          completedTests,
          averageScore,
          highestScore,
          lowestScore,
          totalAttempts,
          activeTests,
          totalPoints,
          stars: user.stars || 0,
          isPremium: user.premium_info?.is_premium || false,
          premiumExpiry: user.premium_expiry_date
        });

      } catch (error) {
        console.error('Error fetching student statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchStudentStatistics();
    }
  }, [currentUser]);

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
      <div className="animate__animated animate__fadeInDown" style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Talaba Umumiy ko'rinishi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          O'quv faoliyatingiz haqida umumiy statistika
        </Text>
      </div>

      {/* All Statistics Cards with Entrance Animations */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '100ms' }}>
            <StatCard
              title="Jami testlar"
              value={stats.totalTests}
              icon={<BookOutlined />}
              color="#2563eb"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '200ms' }}>
            <StatCard
              title="Topshirilgan testlar"
              value={stats.completedTests}
              icon={<CheckCircleOutlined />}
              color="#16a34a"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '300ms' }}>
            <StatCard
              title="Jami urinishlar"
              value={stats.totalAttempts}
              icon={<ClockCircleOutlined />}
              color="#059669"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '400ms' }}>
            <StatCard
              title="Faol testlar"
              value={stats.activeTests}
              icon={<RiseOutlined />}
              color="#7c3aed"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '500ms' }}>
            <StatCard
              title="O'rtacha ball"
              value={stats.averageScore}
              suffix="%"
              icon={<BarChartOutlined />}
              color="#2563eb"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '600ms' }}>
            <StatCard
              title="Eng yuqori ball"
              value={stats.highestScore}
              suffix="%"
              icon={<TrophyOutlined />}
              color="#16a34a"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '700ms' }}>
            <StatCard
              title="Eng past ball"
              value={stats.lowestScore}
              suffix="%"
              icon={<ReadOutlined />}
              color="#dc2626"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '800ms' }}>
            <StatCard
              title="Jami ballar"
              value={stats.totalPoints}
              icon={<StarOutlined />}
              color="#f59e0b"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '900ms' }}>
            <StatCard
              title="Yulduzlar"
              value={stats.stars}
              icon={<StarOutlined />}
              color="#f59e0b"
            />
          </div>
        </Col>
      </Row>

      {/* Premium Status Section with Entrance Animation */}
      {stats.isPremium && (
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
              ⭐ Premium a'zolik
            </Title>
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12}>
                <Card style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                }}
                hoverable
                >
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <SafetyCertificateOutlined style={{ fontSize: '24px', color: '#d97706' }} />
                      <Text style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#92400e'
                      }}>
                        Faol Premium
                      </Text>
                    </div>
                    <Text style={{
                      fontSize: '14px',
                      color: '#78350f',
                      display: 'block'
                    }}>
                      Barcha premium imtiyozlardan foydalanishingiz mumkin
                    </Text>
                    {stats.premiumExpiry && (
                      <Text style={{
                        fontSize: '14px',
                        color: '#78350f',
                        marginTop: '8px',
                        display: 'block'
                      }}>
                        <strong>Muddati:</strong> {new Date(stats.premiumExpiry).toLocaleDateString('uz-UZ')}
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentOverview;