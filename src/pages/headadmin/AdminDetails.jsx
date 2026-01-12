import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Avatar,
  Row,
  Col,
  Alert,
  Spin,
  Space,
  ConfigProvider,
  Divider,
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
import 'animate.css';

const { Title, Text, Paragraph } = Typography;

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
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, fontWeight: 800 }}>YUKLANMOQDA...</Text>
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
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/headadmin/admins')}
            style={{ marginBottom: 24, fontWeight: 800, textTransform: 'uppercase', padding: 0 }}
          >
            ORTGA QAYTISH
          </Button>
          
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
            Tafsilotlar
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
            Admin Profili
          </Title>
          <div style={{ 
            width: '80px', 
            height: '10px', 
            backgroundColor: '#000', 
            margin: '24px 0' 
          }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Administrator haqida batafsil ma'lumotlar va tizimdagi huquqlari.
          </Paragraph>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ borderRadius: 0, border: '3px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 900, marginBottom: '24px', maxWidth: '800px' }}
          />
        )}

        {admin && (
          <div className="animate__animated animate__fadeIn" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <Row gutter={[32, 32]}>
              {/* Profile Card */}
              <Col xs={24} md={8}>
                <div style={{ 
                  padding: '40px 24px', 
                  border: '4px solid #000', 
                  boxShadow: '10px 10px 0px #000', 
                  backgroundColor: '#fff',
                  textAlign: 'center'
                }}>
                  <Avatar
                    size={120}
                    icon={<SafetyCertificateOutlined />}
                    style={{ backgroundColor: '#000', borderRadius: 0, border: '4px solid #000', marginBottom: '20px' }}
                  />
                  <Title level={3} style={{ fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{admin.name}</Title>
                  <Text style={{ fontWeight: 700, color: '#666', fontSize: '12px' }}>ADMINISTRATOR</Text>
                </div>
              </Col>

              {/* Info Card */}
              <Col xs={24} md={16}>
                <div style={{ 
                  padding: '40px', 
                  border: '4px solid #000', 
                  boxShadow: '10px 10px 0px #000', 
                  backgroundColor: '#fff'
                }}>
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <UserOutlined style={{ fontSize: '24px', color: '#000' }} />
                      <div>
                        <Text style={{ fontSize: '12px', fontWeight: 900, color: '#999', textTransform: 'uppercase' }}>Foydalanuvchi nomi</Text>
                        <Paragraph style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{admin.name.toUpperCase()}</Paragraph>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <MailOutlined style={{ fontSize: '24px', color: '#000' }} />
                      <div>
                        <Text style={{ fontSize: '12px', fontWeight: 900, color: '#999', textTransform: 'uppercase' }}>Email manzil</Text>
                        <Paragraph style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{admin.email}</Paragraph>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <BankOutlined style={{ fontSize: '24px', color: '#000' }} />
                      <div>
                        <Text style={{ fontSize: '12px', fontWeight: 900, color: '#999', textTransform: 'uppercase' }}>Tashkilot</Text>
                        <Paragraph style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{admin.organization?.toUpperCase() || 'ANIQLANMAGAN'}</Paragraph>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <CalendarOutlined style={{ fontSize: '24px', color: '#000' }} />
                      <div>
                        <Text style={{ fontSize: '12px', fontWeight: 900, color: '#999', textTransform: 'uppercase' }}>Ro'yxatdan o'tgan sana</Text>
                        <Paragraph style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                          {admin.registration_date ? new Date(admin.registration_date).toLocaleDateString('uz-UZ') : 'NOMA\'LUM'}
                        </Paragraph>
                      </div>
                    </div>
                  </Space>

                  <Divider style={{ borderTop: '4px solid #000', margin: '40px 0' }} />

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Button 
                      type="primary" 
                      onClick={() => navigate(`/headadmin/edit-admin/${admin.id}`)}
                      style={{ borderRadius: 0, border: '3px solid #000', height: '50px', fontWeight: 900, padding: '0 30px', backgroundColor: '#000', color: '#fff' }}
                    >TAHRIRLASH</Button>
                    <Button 
                      onClick={() => navigate('/headadmin/admins')}
                      style={{ borderRadius: 0, border: '3px solid #000', height: '50px', fontWeight: 900, padding: '0 30px' }}
                    >ORTGA</Button>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </div>
    </ConfigProvider>
  );
};

export default AdminDetails;
