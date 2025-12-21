import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, Spin, Alert } from 'antd';
import {
  BookOutlined,
  TrophyOutlined,
  BarChartOutlined,
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import { useCountdown } from '../../hooks/useCountdown';

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
    recentTests: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Countdown timer for premium expiry
  const handlePremiumExpire = async () => {
    try {
      // Refresh user data when premium expires
      const updatedUser = await apiService.getUser(currentUser.id);
      // You might want to update the user context here
    } catch (error) {
      console.error('Failed to refresh user data on premium expiry:', error);
    }
  };

  const { formattedTime, isExpired } = useCountdown(currentUser?.premium_expiry_date, handlePremiumExpire);

  useEffect(() => {
    if (currentUser) {
      loadStudentStats();
    }
  }, [currentUser]);

  const loadStudentStats = async () => {
    try {
      setLoading(true);
      
      // Fetch student attempts
      const attemptsData = await apiService.getAttempts({ student: currentUser.id });
      const attempts = attemptsData.results || attemptsData;
      
      // Calculate statistics
      const completedTests = attempts.length;
      const scores = attempts.map(attempt => attempt.score || 0);
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
      const highestScore = scores.length > 0
        ? Math.round(Math.max(...scores))
        : 0;
      const lowestScore = scores.length > 0
        ? Math.round(Math.min(...scores))
        : 0;

      // Get recent tests (last 5)
      const recentTests = attempts
        .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
        .slice(0, 5)
        .map(attempt => ({
          id: attempt.id,
          title: attempt.test_title || 'Noma\'lum test',
          score: attempt.score,
          subject: attempt.subject || 'Noma\'lum fan',
          date: new Date(attempt.submitted_at).toLocaleDateString('uz-UZ')
        }));

      setStats({
        totalTests: completedTests,
        completedTests,
        averageScore,
        highestScore,
        lowestScore,
        totalAttempts: attempts.length,
        activeTests: completedTests, // For students, all completed tests are "active"
        recentTests
      });

    } catch (error) {
      console.error('Error loading student stats:', error);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

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
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '16px'
          }}
        >
          {React.cloneElement(icon, {
            style: {
              fontSize: '24px',
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
        <Text style={{ marginTop: 16, color: '#64748b' }}>Ma'lumotlar yuklanmoqda...</Text>
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
        marginTop: '-6px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={2} style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '16px'
        }}>
          Talaba boshqaruv paneli
        </Title>
        <Text style={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          O'quv faoliyatingiz haqida umumiy ma'lumot
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
            title="O'rtacha ball"
            value={stats.averageScore}
            suffix="%"
            icon={<TrophyOutlined />}
            color="#16a34a"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Eng yuqori ball"
            value={stats.highestScore}
            suffix="%"
            icon={<BarChartOutlined />}
            color="#059669"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Eng past ball"
            value={stats.lowestScore}
            suffix="%"
            icon={<RiseOutlined />}
            color="#dc2626"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Jami urinishlar"
            value={stats.totalAttempts}
            icon={<ClockCircleOutlined />}
            color="#7c3aed"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Topshirilgan testlar"
            value={stats.completedTests}
            icon={<TeamOutlined />}
            color="#d97706"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Premium status"
            value={currentUser?.premium_info?.is_premium ? 'Faol' : 'Yoq'}
            icon={<SafetyCertificateOutlined />}
            color={currentUser?.premium_info?.is_premium ? '#d97706' : '#6b7280'}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Yulduzlar"
            value={currentUser?.stars || 0}
            icon={<StarOutlined />}
            color="#f59e0b"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Premium vaqti"
            value={currentUser?.premium_info?.is_premium && !isExpired ? formattedTime : 'Yoq'}
            icon={<ClockCircleOutlined />}
            color={currentUser?.premium_info?.is_premium ? '#d97706' : '#6b7280'}
          />
        </Col>
      </Row>
    </div>
  );
};

export default StudentOverview;