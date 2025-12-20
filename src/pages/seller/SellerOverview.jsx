import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col } from 'antd';
import { TeamOutlined, StarOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import 'antd/dist/reset.css';

const SellerOverview = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    premiumStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const usersData = await apiService.getUsers();
      const users = usersData.results || usersData;
      const students = users.filter(user => user.role === 'student');

      const totalStudents = students.length;
      const premiumStudents = students.filter(student => student.is_premium).length;

      setStats({
        totalStudents,
        premiumStudents,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}
      hoverable
    >
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <Typography.Text
              style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#64748b',
                marginBottom: '8px',
                display: 'block'
              }}
            >
              {title}
            </Typography.Text>
            <Typography.Title level={1} style={{ margin: 0, color: '#1e293b', lineHeight: 1.2 }}>
              {loading ? '...' : value}
            </Typography.Title>
          </div>
          <div
            style={{
              backgroundColor: color === 'primary.main' ? '#eff6ff' :
                              color === 'secondary.main' ? '#f0fdf4' :
                              color === 'success.main' ? '#ecfdf5' :
                              color === 'warning.main' ? '#fffbeb' :
                              '#f8fafc',
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
                color: color === 'primary.main' ? '#2563eb' :
                       color === 'secondary.main' ? '#16a34a' :
                       color === 'success.main' ? '#059669' :
                       color === 'warning.main' ? '#d97706' :
                       '#64748b'
              }
            })}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Typography.Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Seller Panel - Umumiy ma'lumotlar
        </Typography.Title>
        <Typography.Text style={{ fontSize: '18px', color: '#64748b' }}>
          Premium obunalar va o'quvchilarni boshqarish uchun panel
        </Typography.Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} md={8}>
          <StatCard
            title="Jami o'quvchilar"
            value={stats.totalStudents}
            icon={<TeamOutlined />}
            color="primary.main"
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <StatCard
            title="Premium o'quvchilar"
            value={stats.premiumStudents}
            icon={<StarOutlined />}
            color="warning.main"
          />
        </Col>
      </Row>

      {/* Welcome Message */}
      <Card
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Typography.Title level={4} style={{ marginBottom: '8px', color: '#1e293b' }}>
          Xush kelibsiz, {currentUser?.name}!
        </Typography.Title>
        <Typography.Text style={{ color: '#334155', lineHeight: 1.6 }}>
          Bu seller panel orqali siz o'quvchilarga premium status berishingiz va narxlarni boshqarishingiz mumkin.
          Chap menudan kerakli bo'limni tanlang.
        </Typography.Text>
      </Card>
    </div>
  );
};

export default SellerOverview;