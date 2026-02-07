import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Typography,
  Avatar,
  Tag,
  Table,
  Alert,
  Space,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import apiService from '../../data/apiService';
import { shouldShowPremiumFeatures } from '../../utils/premiumVisibility';

const { Title, Text } = Typography;

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageScore, setAverageScore] = useState(0);
  const [highestScore, setHighestScore] = useState(0);
  const [emojiPositions, setEmojiPositions] = useState([]);

  const generateRandomPositions = (emojiCount) => {
    const positions = [];
    for (let i = 0; i < emojiCount; i++) {
      positions.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 15 + Math.random() * 10,
        scale: 0.7 + Math.random() * 0.6,
        rotation: Math.random() * 360
      });
    }
    return positions;
  };

  const getDirectionLabel = (direction) => {
    if (direction === 'natural') return 'Tabiiy fanlar';
    if (direction === 'exact') return 'Aniq fanlar';
    return 'Yo\'nalish kiritilmagan';
  };

  useEffect(() => {
    const loadStudentDetails = async () => {
      try {
        const users = await apiService.getUsers();
        const studentData = users.find(user => user.id === parseInt(id));
        setStudent(studentData);

        if (studentData.selected_emojis && studentData.selected_emojis.length > 0) {
          setEmojiPositions(generateRandomPositions(studentData.selected_emojis.length));
        }

        const allAttempts = await apiService.getAttempts({ student: id });
        setAttempts(allAttempts);

        const scores = allAttempts.map(attempt => attempt.score || 0);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
        const highScore = scores.length > 0 ? Math.round(Math.max(...scores)) : 0;
        setAverageScore(avgScore);
        setHighestScore(highScore);
      } catch (error) {
        console.error('Failed to load student details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudentDetails();
  }, [id]);

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div >
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',

          }}></div>
        </div>
        <div style={{
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

  if (!student) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
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
          }}>O'quvchi topilmadi</Text>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/students')}

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

  const columns = [
    {
      title: 'Test nomi',
      dataIndex: 'test_title',
      key: 'test_title',
      render: (text, record) => (
        <Text strong style={{ color: '#1e293b' }}>
          {text || `Test ${record.test}`}
        </Text>
      ),
    },
    {
      title: 'Ball',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <Tag
          color={score >= 70 ? 'green' : score >= 50 ? 'orange' : 'red'}
          style={{ fontWeight: 600 }}
        >
          {score?.toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: 'Topshirgan sana',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      render: (date) => (
        <Text style={{ color: '#64748b' }}>
          {new Date(date).toLocaleString('uz-UZ')}
        </Text>
      ),
    },
    {
      title: 'Sarflangan vaqt',
      dataIndex: 'time_taken',
      key: 'time_taken',
      render: (time) => (
        <Text style={{ color: '#64748b' }}>
          {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/students')}

          style={{
            borderColor: '#2563eb',
            color: '#2563eb',
            transition: 'all 0.3s ease'
          }}
        >
          Orqaga
        </Button>
        <Title level={2} style={{
          margin: 0,
          color: '#1e293b',

        }}>
          {student.name} - Batafsil ma'lumotlar
        </Title>
      </div>

      {/* Profile Card */}
      <Card

        style={{
          marginBottom: '24px',
          background: shouldShowPremiumFeatures(student, null) && student.background_gradient?.css
            ? student.background_gradient.css
            : shouldShowPremiumFeatures(student, null)
              ? `
                radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)
              `
              : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          minHeight: '220px',
          border: '0px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease'
        }}
        bodyStyle={{ padding: '32px' }}
      >
        {/* Premium Badge */}
        {shouldShowPremiumFeatures(student, null) && (
          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 2
          }}>
            <Tag
              icon={<TrophyOutlined />}
              color="gold"
              style={{
                fontWeight: 'bold',
                fontSize: '14px',
                padding: '4px 12px'
              }}
            >
              PREMIUM
            </Tag>
          </div>
        )}

        <Row gutter={24} align="middle">
          {/* Profile Photo */}
          <Col style={{}}>
            <div style={{ position: 'relative' }}>
              <Avatar
                src={student.profile_photo_url}
                size={150}

                style={{
                  border: '4px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  backgroundColor: shouldShowPremiumFeatures(student, null) ? '#ffffff' : '#2563eb',
                  fontSize: shouldShowPremiumFeatures(student, null) ? undefined : '48px',
                  fontWeight: 'bold',
                  color: shouldShowPremiumFeatures(student, null) ? '#2563eb' : '#ffffff',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                {!student.profile_photo_url && student.name.charAt(0).toUpperCase()}
              </Avatar>

              {/* Premium Checkmark */}
              {shouldShowPremiumFeatures(student, null) && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    backgroundColor: '#10b981',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease',

                    cursor: 'pointer'
                  }}
                >
                  <CheckCircleOutlined
                    style={{
                      color: 'white',
                      fontSize: '16px',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
              )}
            </div>
          </Col>

          {/* Profile Info */}
          <Col flex="auto" style={{}}>
            <div style={{
              color: student.is_premium ? '#ffffff' : '#1e293b',
              textAlign: 'left'
            }}>
              <Title level={2} style={{
                margin: 0,
                marginBottom: '2px',
                fontWeight: 700,
                textShadow: student.is_premium ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
              }}>
                {student.name}
              </Title>

              {student.profile_status && (
                <Text style={{
                  fontSize: '18px',
                  fontStyle: 'italic',
                  opacity: 0.9,
                  display: 'block',
                  marginBottom: '24px',
                  textShadow: student.is_premium ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                }}>
                  "{student.profile_status}"
                </Text>
              )}

              <Space wrap style={{}}>
                <Tag
                  color="green"

                  style={{
                    fontWeight: 600,
                    transition: 'all 0.3s ease',

                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  O'quvchi
                </Tag>
                <Tag
                  color="blue"

                  style={{
                    fontWeight: 600,
                    transition: 'all 0.3s ease',

                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {student.class_group || 'Noma\'lum'} sinf
                </Tag>
                <Tag
                  color="default"

                  style={{
                    fontWeight: 600,
                    transition: 'all 0.3s ease',

                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {getDirectionLabel(student.direction)}
                </Tag>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <div >
        <Row gutter={24} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <div style={{}}>
              <Card
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                styles={{ body: { padding: '24px' } }}
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
                      Topshirilgan testlar
                    </Text>
                    <Statistic
                      value={attempts.length}
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
                      backgroundColor: '#2563eb',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '16px'
                    }}
                  >
                    <FileTextOutlined style={{ fontSize: '32px', color: '#ffffff' }} />
                  </div>
                </div>
              </Card>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{}}>
              <Card
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                styles={{ body: { padding: '24px' } }}
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
                      O'rtacha ball
                    </Text>
                    <Statistic
                      value={averageScore}
                      suffix="%"
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
                      backgroundColor: '#16a34a',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '16px'
                    }}
                  >
                    <TrophyOutlined style={{ fontSize: '32px', color: '#ffffff' }} />
                  </div>
                </div>
              </Card>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{}}>
              <Card
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                styles={{ body: { padding: '24px' } }}
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
                      Eng yuqori ball
                    </Text>
                    <Statistic
                      value={highestScore}
                      suffix="%"
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
                      backgroundColor: '#d97706',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '16px'
                    }}
                  >
                    <TrophyOutlined style={{ fontSize: '32px', color: '#ffffff' }} />
                  </div>
                </div>
              </Card>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{}}>
              <Card
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                }}
                styles={{ body: { padding: '28px' } }}
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
                      Premium status
                    </Text>
                    <Statistic
                      value={student?.is_premium ? 'Faol' : 'Yo\'q'}
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
                      backgroundColor: student?.is_premium ? '#dc2626' : '#6b7280',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '16px'
                    }}
                  >
                    <TrophyOutlined style={{ fontSize: '32px', color: '#ffffff' }} />
                  </div>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </div>
      {/* Test Results Table */}
      <Card

        title={
          <span >
            {`Test natijalari (${attempts.length})`}
          </span>
        }
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: '0' }}
      >
        {attempts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            margin: '24px'
          }}>
            <FileTextOutlined

              style={{
                fontSize: '48px',
                color: '#cbd5e1',
                marginBottom: '16px',
                display: 'block'
              }}
            />
            <Text style={{ color: '#64748b', fontSize: '16px', fontWeight: 500 }}>
              Hali testlar topshirilmagan
            </Text>
          </div>
        ) : (
          <div style={{}}>
            <Table

              columns={columns}
              dataSource={attempts}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Jami ${total} ta test`,

                style: {}
              }}
              locale={{
                emptyText: 'Test natijalari mavjud emas'
              }}
              rowClassName={(record, index) =>
                `${index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
                }`
              }
              onRow={(record, index) => ({
                className: `${index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
                  }`,
                style: {
                  animationDelay: `${index * 50}ms`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              })}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentDetails;