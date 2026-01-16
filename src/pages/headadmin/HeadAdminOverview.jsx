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
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
  RiseOutlined,
  TrophyOutlined,
  CrownOutlined
} from '@ant-design/icons';
import apiService from '../../data/apiService';
import { useAuth } from '../../context/AuthContext';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;

const HeadAdminOverview = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalSellers: 0,
    totalTests: 0,
    totalAttempts: 0,
    activeTests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
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

        setStats({
          totalUsers: users.length,
          totalAdmins: users.filter(user => user.role === 'admin' || user.role === 'head_admin').length,
          totalTeachers: users.filter(user => user.role === 'teacher').length,
          totalStudents: users.filter(user => user.role === 'student').length,
          totalSellers: users.filter(user => user.role === 'seller').length,
          totalTests: tests.length,
          totalAttempts: attempts.length,
          activeTests: tests.filter(test => test.is_active !== false).length,
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
              fontSize: '12px', 
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
                fontSize: '36px', 
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
            width: '50px',
            height: '50px',
            backgroundColor: '#000',
            color: '#fff',
            border: '2px solid #000',
            flexShrink: 0
          }}>
            {React.cloneElement(icon, { style: { fontSize: '24px' } })}
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
      <div style={{ padding: '40px 0' }}>
        {/* Brutalist Header */}
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '60px' }}>
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
            Head Admin Umumiy
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
            Platforma Statistikasi
          </Title>
          <div style={{ 
            width: '80px', 
            height: '10px', 
            backgroundColor: '#000', 
            margin: '24px 0' 
          }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Butun platforma bo'ylab foydalanuvchilar, testlar va urinishlar haqida to'liq hisobot.
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
              title="Jami foydalanuvchilar"
              value={stats.totalUsers}
              icon={<UserOutlined />}
              delay="0.1s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="Adminlar"
              value={stats.totalAdmins}
              icon={<SafetyCertificateOutlined />}
              delay="0.2s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="O'qituvchilar"
              value={stats.totalTeachers}
              icon={<BookOutlined />}
              delay="0.3s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="O'quvchilar"
              value={stats.totalStudents}
              icon={<TeamOutlined />}
              delay="0.4s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="Sotuvchilar"
              value={stats.totalSellers}
              icon={<CrownOutlined />}
              delay="0.5s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="Jami testlar"
              value={stats.totalTests}
              icon={<RiseOutlined />}
              delay="0.6s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="Urinishlar"
              value={stats.totalAttempts}
              icon={<TrophyOutlined />}
              delay="0.7s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              title="Faol testlar"
              value={stats.activeTests}
              icon={<RiseOutlined />}
              delay="0.8s"
            />
          </Col>
        </Row>

        <Divider style={{ margin: '48px 0', borderTop: '4px solid #000' }} />

        <div className="animate__animated animate__fadeIn" style={{ animationDelay: '0.9s' }}>
          <Title level={2} style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '32px' }}>
            Tezkor Amallar
          </Title>
          <Row gutter={[32, 32]}>
            <Col xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => navigate('/headadmin/settings')}
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
                  <Title level={4} style={{ fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Sayt Sozlamalari</Title>
                  <Text style={{ fontWeight: 600 }}>Header va Welcome page qismlarini boshqarish</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => navigate('/headadmin/admins')}
                style={{
                  borderRadius: 0,
                  border: '4px solid #000',
                  boxShadow: '10px 10px 0px #000',
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <div style={{ textAlign: 'center', padding: '12px' }}>
                  <SafetyCertificateOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <Title level={4} style={{ fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Adminlarni Boshqarish</Title>
                  <Text style={{ fontWeight: 600 }}>Yangi adminlar qo'shish va tahrirlash</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => navigate('/headadmin/messages')}
                style={{
                  borderRadius: 0,
                  border: '4px solid #000',
                  boxShadow: '10px 10px 0px #000',
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <div style={{ textAlign: 'center', padding: '12px' }}>
                  <UserOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <Title level={4} style={{ fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Aloqa Xabarlari</Title>
                  <Text style={{ fontWeight: 600 }}>Foydalanuvchilardan kelgan murojaatlar</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default HeadAdminOverview;

