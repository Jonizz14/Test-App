import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import 'animate.css'
import {
  Card,
  Button,
  Typography,
  Avatar,
  Tag,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const TeacherDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeacherDetails = async () => {
      try {
        const users = await apiService.getUsers();
        const teacherData = users.find(user => user.id === parseInt(id));
        setTeacher(teacherData);

        const allTests = await apiService.getTests();
        const teacherTests = allTests.filter(test => test.teacher === parseInt(id));
        setTests(teacherTests);
      } catch (error) {
        console.error('Failed to load teacher details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="animate__animated animate__fadeIn" style={{
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="animate__animated animate__bounce animate__infinite">
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        <div className="animate__animated animate__pulse" style={{
          color: '#64748b',
          fontSize: '16px',
          fontWeight: 500
        }}>Yuklanmoqda...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate__hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
          }
          .animate__hover-float:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        `}</style>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="animate__animated animate__fadeIn" style={{ padding: '24px' }}>
        <div className="animate__animated animate__bounceIn" style={{ 
          textAlign: 'center', 
          padding: '48px 0',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <FileTextOutlined style={{ 
            fontSize: '64px', 
            color: '#cbd5e1', 
            marginBottom: '16px',
            display: 'block'
          }} />
          <Text style={{ 
            color: '#64748b', 
            fontSize: '18px', 
            fontWeight: 500,
            display: 'block',
            marginBottom: '24px'
          }}>O'qituvchi topilmadi</Text>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/teachers')}
            className="animate__animated animate__pulse animate__infinite"
            style={{ 
              marginTop: '16px',
              borderColor: '#2563eb',
              color: '#2563eb'
            }}
          >
            Orqaga
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div className='animate__animated animate__fadeInDown' style={{
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/teachers')}
          className="animate__animated animate__hover-lift"
          style={{
            borderColor: '#2563eb',
            color: '#2563eb',
            transition: 'all 0.3s ease'
          }}
        >
          Orqaga
        </Button>
        <Title level={2} className="animate__animated animate__fadeInRight" style={{ 
          margin: 0, 
          color: '#1e293b',
          animationDelay: '0.2s'
        }}>
          {teacher.name} - Batafsil ma'lumotlar
        </Title>
      </div>

      {/* Teacher Info Card */}
      <Card
        className="animate__animated animate__fadeInUp"
        style={{
          marginBottom: '24px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease'
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <Row gutter={24} align="middle">
          <Col>
            <Avatar
              size={80}
              className="animate__animated animate__bounceIn"
              style={{
                backgroundColor: '#2563eb',
                fontSize: '32px',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
              }}
            >
              {teacher.name.charAt(0).toUpperCase()}
            </Avatar>
          </Col>
          <Col flex="auto">
            <Title level={3} style={{ margin: 0, marginBottom: '8px', color: '#1e293b' }}>
              {teacher.name}
            </Title>
            <Text style={{ color: '#64748b', marginBottom: '16px', display: 'block' }}>
              ID: {teacher.id}
            </Text>
            <Tag color="green" style={{ fontWeight: 600 }}>
              O'qituvchi
            </Tag>
          </Col>
        </Row>

        <Row gutter={24} style={{ marginTop: '24px' }}>
          <Col xs={24} md={12}>
            <Card
              size="small"
              className="animate__animated animate__fadeInUp"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                animationDelay: '0.1s'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Title level={5} style={{ margin: 0, marginBottom: '8px', color: '#1e293b' }}>
                  Oxirgi kirish
                </Title>
                <Text style={{ color: '#64748b' }}>
                  {teacher.last_login ? new Date(teacher.last_login).toLocaleString('uz-UZ') : 'Ma\'lumot yo\'q'}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              size="small"
              className="animate__animated animate__fadeInUp"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                animationDelay: '0.2s'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Title level={5} style={{ margin: 0, marginBottom: '8px', color: '#1e293b' }}>
                  Ro'yxatdan o'tgan sana
                </Title>
                <Text style={{ color: '#64748b' }}>
                  {teacher.registration_date ? new Date(teacher.registration_date).toLocaleString('uz-UZ') : 'Ma\'lumot yo\'q'}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Tests Created */}
      <Card
        className="animate__animated animate__fadeInUp"
        title={
          <span className="animate__animated animate__slideInRight">
            {`Yaratilgan testlar (${tests.length})`}
          </span>
        }
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease'
        }}
      >
        {tests.length === 0 ? (
          <div className="animate__animated animate__bounceIn" style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <FileTextOutlined 
              className="animate__animated animate__pulse animate__infinite" 
              style={{ 
                fontSize: '48px', 
                color: '#cbd5e1', 
                marginBottom: '16px',
                display: 'block'
              }} 
            />
            <Text style={{ color: '#64748b', fontSize: '16px', fontWeight: 500 }}>
              Hali testlar yaratilmagan
            </Text>
          </div>
        ) : (
          <div className="animate__animated animate__fadeInUp">
            <div style={{
              overflowX: 'auto',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#1e293b',
                      borderBottom: '2px solid #e2e8f0'
                    }}>Test nomi</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#1e293b',
                      borderBottom: '2px solid #e2e8f0'
                    }}>Fan</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#1e293b',
                      borderBottom: '2px solid #e2e8f0'
                    }}>Savollar</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#1e293b',
                      borderBottom: '2px solid #e2e8f0'
                    }}>Vaqt</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#1e293b',
                      borderBottom: '2px solid #e2e8f0'
                    }}>Urinishlar</th>
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#1e293b',
                      borderBottom: '2px solid #e2e8f0'
                    }}>O'rtacha ball</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test, index) => (
                    <tr 
                      key={test.id}
                      className="animate__animated animate__fadeInUp"
                      style={{
                        animationDelay: `${index * 0.05}s`,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.transform = 'scale(1.01)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <td style={{
                        padding: '16px 12px',
                        borderBottom: '1px solid #f1f5f9',
                        fontWeight: 500,
                        color: '#1e293b'
                      }}>
                        {test.title}
                      </td>
                      <td style={{
                        padding: '16px 12px',
                        borderBottom: '1px solid #f1f5f9'
                      }}>
                        <Tag color="blue" style={{ fontSize: '12px' }}>
                          {test.subject}
                        </Tag>
                      </td>
                      <td style={{
                        padding: '16px 12px',
                        borderBottom: '1px solid #f1f5f9',
                        textAlign: 'center',
                        color: '#64748b'
                      }}>
                        <Tag color="green" style={{ fontSize: '12px' }}>
                          {test.total_questions}
                        </Tag>
                      </td>
                      <td style={{
                        padding: '16px 12px',
                        borderBottom: '1px solid #f1f5f9',
                        textAlign: 'center',
                        color: '#64748b'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <ClockCircleOutlined style={{ fontSize: '12px' }} />
                          {test.time_limit} daq
                        </div>
                      </td>
                      <td style={{
                        padding: '16px 12px',
                        borderBottom: '1px solid #f1f5f9',
                        textAlign: 'center',
                        color: '#64748b'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <TeamOutlined style={{ fontSize: '12px' }} />
                          {test.attempt_count || 0}
                        </div>
                      </td>
                      <td style={{
                        padding: '16px 12px',
                        borderBottom: '1px solid #f1f5f9',
                        textAlign: 'center',
                        color: '#64748b'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <TrophyOutlined style={{ fontSize: '12px' }} />
                          <span style={{ 
                            fontWeight: 600,
                            color: (test.average_score || 0) >= 80 ? '#10b981' : 
                                   (test.average_score || 0) >= 60 ? '#f59e0b' : '#ef4444'
                          }}>
                            {(test.average_score || 0).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Test Statistics Summary */}
            <div className="animate__animated animate__fadeInUp" style={{
              marginTop: '24px',
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>
                      {tests.length}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Jami testlar
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                      {tests.reduce((sum, test) => sum + (test.attempt_count || 0), 0)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Jami urinishlar
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                      {tests.length > 0 ? (tests.reduce((sum, test) => sum + (test.average_score || 0), 0) / tests.length).toFixed(1) : '0'}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      O'rtacha natija
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TeacherDetails;