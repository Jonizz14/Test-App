import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Card,
  Avatar,
  Row,
  Col,
  Alert,
  Spin,
  Space,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const AdminDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const adminData = await apiService.getUser(id);
        setAdmin(adminData);
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
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
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/headadmin/admins')}
        >
          Adminlarga qaytish
        </Button>
      </div>
    );
  }

  if (!admin) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Admin topilmadi"
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/headadmin/admins')}
        >
          Adminlarga qaytish
        </Button>
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
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/headadmin/admins')}
          style={{ marginBottom: 16 }}
        >
          Adminlarni boshqarishga qaytish
        </Button>
        
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Admin ma'lumotlari
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          {admin.name} haqida batafsil ma'lumot
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Profile Card */}
        <Col xs={24}>
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            bodyStyle={{ padding: '48px 24px' }}
          >
            <Avatar
              size={160}
              icon={<SafetyCertificateOutlined />}
              style={{
                backgroundColor: '#dc2626',
                fontSize: '64px',
                marginBottom: '24px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            />

            <Title level={2} style={{ margin: 0, color: '#1e293b', marginBottom: '16px' }}>
              {admin.name}
            </Title>

            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '16px',
                backgroundColor: '#f1f5f9',
                padding: '12px 20px',
                borderRadius: '8px',
                color: '#475569',
                display: 'inline-block'
              }}
            >
              {admin.email}
            </div>
          </Card>
        </Col>

        {/* Details Card */}
        <Col xs={24}>
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Title level={3} style={{ marginBottom: '24px', color: '#1e293b' }}>
              Ma'lumotlar
            </Title>

            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                  <UserOutlined style={{ color: '#64748b', fontSize: '24px', marginRight: '16px' }} />
                  <div>
                    <Text style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, display: 'block' }}>
                      To'liq ism
                    </Text>
                    <Text style={{ fontSize: '18px', color: '#1e293b', fontWeight: 600 }}>
                      {admin.name}
                    </Text>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                  <MailOutlined style={{ color: '#64748b', fontSize: '24px', marginRight: '16px' }} />
                  <div>
                    <Text style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, display: 'block' }}>
                      Email
                    </Text>
                    <Text style={{ fontSize: '18px', color: '#1e293b', fontWeight: 600 }}>
                      {admin.email}
                    </Text>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                  <CalendarOutlined style={{ color: '#64748b', fontSize: '24px', marginRight: '16px' }} />
                  <div>
                    <Text style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, display: 'block' }}>
                      Ro'yxatdan o'tgan
                    </Text>
                    <Text style={{ fontSize: '18px', color: '#1e293b', fontWeight: 600 }}>
                      {admin.registration_date ? new Date(admin.registration_date).toLocaleDateString('uz-UZ') : 'Noma\'lum'}
                    </Text>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                  <SafetyCertificateOutlined style={{ color: '#64748b', fontSize: '24px', marginRight: '16px' }} />
                  <div>
                    <Text style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, display: 'block' }}>
                      Rol
                    </Text>
                    <Text style={{ fontSize: '18px', color: '#1e293b', fontWeight: 600 }}>
                      Administrator
                    </Text>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                  <BankOutlined style={{ color: '#64748b', fontSize: '24px', marginRight: '16px' }} />
                  <div>
                    <Text style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, display: 'block' }}>
                      Tashkilot
                    </Text>
                    <Text style={{ fontSize: '18px', color: '#1e293b', fontWeight: 600 }}>
                      {admin.organization || 'Aniqlanmagan'}
                    </Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDetails;
