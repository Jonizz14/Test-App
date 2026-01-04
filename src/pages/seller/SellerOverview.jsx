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
  CrownOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const SellerOverview = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    premiumStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all users with pagination
      let allUsers = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        try {
          const usersData = await apiService.getUsers({ page });
          const users = usersData.results || usersData;
          allUsers = allUsers.concat(users);
          
          // Check if there are more pages
          if (usersData.next) {
            page++;
          } else {
            hasMore = false;
          }
        } catch (pageError) {
          console.warn(`Failed to fetch page ${page}:`, pageError);
          hasMore = false;
        }
      }

      console.log('API Response - All Users:', allUsers);

      // Calculate student statistics - more flexible filtering
      const totalStudents = allUsers.filter(user => {
        // Check different possible role values
        const role = user.role?.toLowerCase() || user.user_type?.toLowerCase() || '';
        return role === 'student' || role === 'students' || user.is_student === true;
      }).length;
      
      const premiumStudents = allUsers.filter(user => {
        const role = user.role?.toLowerCase() || user.user_type?.toLowerCase() || '';
        const isStudent = role === 'student' || role === 'students' || user.is_student === true;
        const isPremium = user.is_premium === true || user.premium_status === true;
        return isStudent && isPremium;
      }).length;
      
      console.log('Calculated - Total Students:', totalStudents);
      console.log('Calculated - Premium Students:', premiumStudents);

      setStats({
        totalStudents,
        premiumStudents
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi: ' + error.message);
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
          Seller Panel - O'quvchilar ko'rinishi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          O'quvchilar va premium obunalarni boshqarish uchun panel
        </Text>
      </div>

      {/* Student Statistics Cards with Entrance Animations */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '100ms' }}>
            <StatCard
              title="Jami o'quvchilar"
              value={stats.totalStudents}
              icon={<TeamOutlined />}
              color="#3b82f6"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '200ms' }}>
            <StatCard
              title="Premium o'quvchilar"
              value={stats.premiumStudents}
              icon={<CrownOutlined />}
              color="#f59e0b"
            />
          </div>
        </Col>
      </Row>

    </div>
  );
};

export default SellerOverview;