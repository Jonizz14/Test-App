import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Alert,
  Spin,
  Statistic,
  ConfigProvider,
  Divider,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  BarChartOutlined,
  TrophyOutlined,
  ReadOutlined,
  StarOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;

const StudentOverview = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => {
    const fetchStudentStatistics = async () => {
      try {
        setLoading(true);
        const [attemptsData, userData] = await Promise.all([
          apiService.getAttempts({ student: currentUser.id }),
          apiService.getUser(currentUser.id)
        ]);

        const attempts = attemptsData.results || attemptsData;
        const user = userData;

        const totalAttempts = attempts.length;
        const completedTests = attempts.filter(attempt => attempt.submitted_at).length;
        const activeTests = attempts.filter(attempt => !attempt.submitted_at).length;

        const scores = attempts
          .filter(attempt => attempt.score !== null && attempt.score !== undefined)
          .map(attempt => attempt.score || 0);

        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;

        const highestScore = scores.length > 0 ? Math.round(Math.max(...scores)) : 0;
        const lowestScore = scores.length > 0 ? Math.round(Math.min(...scores)) : 0;

        const totalPoints = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);

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

  const StatBox = ({ title, value, icon, delay, suffix }) => (
    <div className="animate__animated animate__fadeIn" style={{ animationDelay: delay }}>
      <Card
        style={{
          borderRadius: 0,
          border: '4px solid #000',
          boxShadow: '10px 10px 0px #000',
          backgroundColor: '#fff',
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <Text style={{
              fontSize: '11px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#000',
              display: 'block',
              marginBottom: '4px'
            }}>
              {title}
            </Text>
            <Statistic
              value={value}
              suffix={suffix}
              valueStyle={{
                fontSize: '32px',
                fontWeight: 900,
                color: '#000',
                letterSpacing: '-1px',
                lineHeight: 1
              }}
            />
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            backgroundColor: '#000',
            color: '#fff',
            border: '2px solid #000',
            flexShrink: 0
          }}>
            {React.cloneElement(icon, { style: { fontSize: '20px' } })}
          </div>
        </div>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, fontWeight: 800, textTransform: 'uppercase' }}>Yuklanmoqda...</Text>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 0,
          colorPrimary: '#000',
        },
      }}
    >
      <div style={{ padding: '20px 0' }}>
        {/* Brutalist Header */}
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#000',
            color: '#fff',
            padding: '8px 16px',
            fontWeight: 900,
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '16px'
          }}>
            Talaba Umumiy
          </div>
          <Title level={1} style={{
            margin: 0,
            fontWeight: 900,
            fontSize: '2.5rem',
            lineHeight: 0.9,
            textTransform: 'uppercase',
            letterSpacing: '-0.05em',
            color: '#000'
          }}>
            Mening O'quv Faoliyatim
          </Title>
          <div style={{
            width: '80px',
            height: '10px',
            backgroundColor: '#000',
            margin: '24px 0'
          }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Sizning barcha topshirgan testlaringiz, urinishlaringiz va natijalaringiz haqidagi to'liq tahlil va ko'rsatkichlar.
          </Paragraph>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{
              borderRadius: 0,
              border: '3px solid #000',
              boxShadow: '6px 6px 0px #000',
              fontWeight: 800,
              marginBottom: '40px'
            }}
          />
        )}

        {/* Statistics Grid */}
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="Jami testlar"
              value={stats.totalTests}
              icon={<BookOutlined />}
              delay="0.1s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="Topshirilganlar"
              value={stats.completedTests}
              icon={<CheckCircleOutlined />}
              delay="0.2s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="Jami urinishlar"
              value={stats.totalAttempts}
              icon={<ClockCircleOutlined />}
              delay="0.3s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="Faol testlar"
              value={stats.activeTests}
              icon={<RiseOutlined />}
              delay="0.4s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="O'rtacha ball"
              value={stats.averageScore}
              suffix="%"
              icon={<BarChartOutlined />}
              delay="0.5s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="Eng yuqori ball"
              value={stats.highestScore}
              suffix="%"
              icon={<TrophyOutlined />}
              delay="0.6s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="Jami ballar"
              value={stats.totalPoints}
              icon={<StarOutlined />}
              delay="0.7s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="Yulduzlar"
              value={stats.stars}
              icon={<StarOutlined />}
              delay="0.8s"
            />
          </Col>
        </Row>

        {stats.isPremium && (
          <div className="animate__animated animate__fadeIn" style={{ marginTop: '40px', animationDelay: '0.85s' }}>
            <Card
              style={{
                borderRadius: 0,
                border: '4px solid #000',
                boxShadow: '10px 10px 0px #000',
                backgroundColor: '#fef3c7',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <CrownOutlined style={{ fontSize: '32px', color: '#000' }} />
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>Premium A'zolik Faol</Title>
                  <Text style={{ fontWeight: 600 }}>Barcha imkoniyatlardan cheksiz foydalanishingiz mumkin.</Text>
                  {stats.premiumExpiry && (
                    <Text style={{ display: 'block', fontWeight: 800, marginTop: '4px' }}>Muddati: {new Date(stats.premiumExpiry).toLocaleDateString()}</Text>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        <Divider style={{ margin: '48px 0', borderTop: '4px solid #000' }} />

        <div className="animate__animated animate__fadeIn" style={{ animationDelay: '0.9s' }}>
          <Title level={2} style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '32px' }}>
            Tezkor Havolalar
          </Title>
          <Row gutter={[32, 32]}>
            <Col xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => navigate('/student/take-test')}
                style={{
                  borderRadius: 0,
                  border: '4px solid #000',
                  boxShadow: '10px 10px 0px #000',
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <div style={{ textAlign: 'center', padding: '12px' }}>
                  <RiseOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <Title level={4} style={{ fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Test Topshirish</Title>
                  <Text style={{ fontWeight: 600 }}>Yangi testlarni boshlang va bilimingizni sinang</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => navigate('/student/results')}
                style={{
                  borderRadius: 0,
                  border: '4px solid #000',
                  boxShadow: '10px 10px 0px #000',
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <div style={{ textAlign: 'center', padding: '12px' }}>
                  <TrophyOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <Title level={4} style={{ fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Natijalarim</Title>
                  <Text style={{ fontWeight: 600 }}>Barcha topshirilgan testlar tahlili</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => navigate('/student/search')}
                style={{
                  borderRadius: 0,
                  border: '4px solid #000',
                  boxShadow: '10px 10px 0px #000',
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <div style={{ textAlign: 'center', padding: '12px' }}>
                  <SearchOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <Title level={4} style={{ fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Ustozlarni Izlash</Title>
                  <Text style={{ fontWeight: 600 }}>Tajribali o'qituvchilarni toping va dars oling</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default StudentOverview;