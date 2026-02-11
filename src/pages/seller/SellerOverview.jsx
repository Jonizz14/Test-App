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
  ConfigProvider,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text, Paragraph } = Typography;

const SellerOverview = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    premiumStudents: 0,
    regularStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const allUsersData = await apiService.getUsers();
      const allUsers = allUsersData.results || allUsersData;

      const totalStudents = allUsers.filter(user =>
        user.role?.toLowerCase() === 'student' || user.is_student === true
      ).length;

      const premiumStudents = allUsers.filter(user => {
        const isStudent = user.role?.toLowerCase() === 'student' || user.is_student === true;
        const isPremium = user.is_premium === true || user.premium_status === true;
        return isStudent && isPremium;
      }).length;

      setStats({
        totalStudents,
        premiumStudents,
        regularStudents: totalStudents - premiumStudents
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  const StatBox = ({ title, value, icon, color, delay, suffix }) => (
    <div className="animate__animated animate__fadeIn" style={{ animationDelay: delay }}>
      <Card
        style={{
          borderRadius: 0,
          border: '3px solid #000',
          boxShadow: '8px 8px 0px #000',
          backgroundColor: '#fff',
          height: '100%'
        }}
        styles={{ body: { padding: '20px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
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
            width: '52px',
            height: '52px',
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
      <div style={{ padding: '32px 0' }}>
        {/* Brutalist Header */}
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#000',
            color: '#fff',
            padding: '8px 14px',
            fontWeight: 900,
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            marginBottom: '14px'
          }}>
            Sotuvchi umumiy
          </div>
          <Title level={1} style={{
            margin: 0,
            fontWeight: 900,
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '-0.04em',
            color: '#000'
          }}>
            Analitika Ko'rinishi
          </Title>
          <div style={{
            width: '70px',
            height: '9px',
            backgroundColor: '#000',
            margin: '20px 0'
          }}></div>
          <Paragraph style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            O'quvchilar balansi, premium obunalar va maktab statistikasi uchun markaziy boshqaruv paneli.
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

        {/* Stats Grid */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <StatBox
              title="Jami o'quvchilar"
              value={stats.totalStudents}
              icon={<TeamOutlined />}
              delay="100ms"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatBox
              title="Premium Talabalar"
              value={stats.premiumStudents}
              icon={<CrownOutlined />}
              delay="200ms"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatBox
              title="Oddiy Talabalar"
              value={stats.regularStudents}
              icon={<UserOutlined />}
              delay="300ms"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatBox
              title="Premium Ulush"
              value={stats.totalStudents > 0 ? Math.round((stats.premiumStudents / stats.totalStudents) * 100) : 0}
              icon={<DashboardOutlined />}
              suffix="%"
              delay="400ms"
            />
          </Col>
        </Row>

        {/* Action Button Section (Brutalist Style) */}
        <div className="animate__animated animate__fadeIn" style={{ marginTop: '60px' }}>
          <div style={{
            border: '4px solid #000',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            backgroundColor: '#fff',
            boxShadow: '12px 12px 0px #000'
          }}>
            <Title level={4} style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '14px', fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}>
              Boshqaruvni boshlamoqchimisiz?
            </Title>
            <Paragraph style={{ fontWeight: 600, marginBottom: '20px', fontSize: '1rem' }}>
              O'quvchilar ro'yxatini ko'rish va ularning holatini o'zgartirish uchun talabalar bo'limiga o'ting.
            </Paragraph>
            <button style={{
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              padding: '14px 32px',
              fontSize: '1rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333';
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = '2px 2px 0px #000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#000';
                e.currentTarget.style.transform = 'translate(0, 0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Talabalarni boshqarish
            </button>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default SellerOverview;
