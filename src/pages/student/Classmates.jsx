import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Input, Button, Alert, Row, Col, Avatar, Table, Tag, Space, Select } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  TrophyOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const Classmates = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [classmates, setClassmates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const loadClassmates = async () => {
      try {
        setLoading(true);

        // Get all users and filter by same class_group
        const allUsers = await apiService.getUsers();
        const allStudents = allUsers.filter(user => user.role === 'student');

        // Filter students in the same class, excluding current user
        const sameClassStudents = allStudents.filter(student =>
          student.class_group === currentUser?.class_group &&
          student.id !== currentUser?.id
        );

        setClassmates(sameClassStudents);
      } catch (error) {
        console.error('Failed to load classmates:', error);
        setError('Sinfdoshlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.class_group) {
      loadClassmates();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleViewProfile = (studentId) => {
    navigate(`/student/student-profile/${studentId}`);
  };

  // Filter classmates based on search term
  const filteredClassmates = classmates.filter(classmate => {
    const classmateName = classmate.name || '';
    return classmateName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Gradient presets for background
  const GRADIENT_PRESETS = {
    default: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    sunset: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff4757 100%)',
    ocean: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    cherry: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    royal: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fire: 'linear-gradient(135deg, #ff6b35 0%, #ff4757 50%, #ff3838 100%)',
    ice: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #6c5ce7 100%)',
    sunrise: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    galaxy: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    mint: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };

  if (loading) {
    return (
      <div style={{
        paddingTop: '32px',
        paddingBottom: '32px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        gap: '16px'
      }}>
        <Text>Yuklanmoqda...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        paddingTop: '32px',
        paddingBottom: '32px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Text type="danger">{error}</Text>
      </div>
    );
  }

  if (!currentUser?.class_group) {
    return (
      <div style={{
        paddingTop: '32px',
        paddingBottom: '32px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Text>Sizning sinfingiz aniqlanmagan</Text>
      </div>
    );
  }

  const columns = [
    {
      title: 'Sinfdosh ismi',
      dataIndex: 'name',
      key: 'name',
      render: (name, classmate) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {classmate.is_premium && classmate.profile_photo_url ? (
            <img
              src={classmate.profile_photo_url}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '2px solid #2563eb',
                objectFit: 'cover',
                marginRight: 12
              }}
              alt={name}
            />
          ) : (
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: classmate.is_premium ? '#ffffff' : '#2563eb',
              color: classmate.is_premium ? '#2563eb' : '#ffffff',
              border: classmate.is_premium ? '2px solid #2563eb' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 700,
              marginRight: 12
            }}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{
              fontWeight: 600,
              color: '#1e293b',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              {name}
              {classmate.display_gift && classmate.display_gift.gift && classmate.display_gift.gift.image && (
                <img
                  src={classmate.display_gift.gift.image}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '4px',
                    objectFit: 'cover'
                  }}
                  alt={classmate.display_gift.gift.name || 'Gift'}
                  title={classmate.display_gift.gift.name || 'Gift'}
                />
              )}
            </div>
            {classmate.is_premium && (
              <Text style={{
                fontSize: '0.75rem',
                color: '#d97706',
                fontWeight: 500
              }}>
                Premium o'quvchi
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Yo\'nalish',
      dataIndex: 'direction',
      key: 'direction',
      render: (direction) => (
        <Text style={{
          color: '#64748b',
          fontSize: '0.875rem'
        }}>
          {direction === 'natural' ? 'Tabiiy fanlar' : 'Aniq fanlar'}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, classmate) => (
        <Space direction="vertical" size={4}>
          <Tag
            style={{
              backgroundColor: '#ecfdf5',
              color: '#059669',
              fontWeight: 600,
              borderRadius: '6px',
              fontSize: '0.75rem',
              margin: 0
            }}
          >
            O'quvchi
          </Tag>

          {classmate.is_premium && (
            <Tag
              icon={<CheckCircleOutlined />}
              style={{
                backgroundColor: '#fef3c7',
                color: '#d97706',
                fontWeight: 600,
                borderRadius: '6px',
                fontSize: '0.75rem',
                margin: 0
              }}
            >
              Premium
            </Tag>
          )}

          {classmate.is_banned && (
            <Tag
              style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontWeight: 600,
                borderRadius: '6px',
                fontSize: '0.75rem',
                margin: 0
              }}
            >
              Bloklangan
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Harakatlar',
      key: 'actions',
      render: (_, classmate) => (
        <Button
          size="small"
          type="primary"
          onClick={() => handleViewProfile(classmate.id)}
          style={{
            fontSize: '0.75rem',
            padding: '4px 8px',
            minWidth: 'auto',
            backgroundColor: '#2563eb',
            borderColor: '#2563eb'
          }}
          icon={<UserOutlined />}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#2563eb';
          }}
        >
          Ko'rish
        </Button>
      ),
    },
  ];

  return (
    <div style={{
      paddingTop: '16px',
      paddingBottom: '16px',
      backgroundColor: '#ffffff',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {/* Title, Description, and Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div style={{ flex: 1 }}>
            <Title level={2} style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#1e293b',

            }}>
              Sinfdoshlarim
            </Title>
            <Text style={{
              fontSize: '1.125rem',
              color: '#64748b',
              fontWeight: 400,
            }}>
              {currentUser?.class_group} sinfidagi sinfdoshlaringizni toping va ularning profilini ko'ring
            </Text>
          </div>
        </div>
      </div>

      {/* Search section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <Title level={4} style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: 0
          }}>
            👥 Sinfdoshlarni qidirish
          </Title>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SortAscendingOutlined style={{ color: '#64748b' }} />
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{
                minWidth: 120,
              }}
            >
              <Option value="date">Sana bo'yicha</Option>
              <Option value="name">Nomi bo'yicha</Option>
              <Option value="difficulty">Qiyinchilik bo'yicha</Option>
              <Option value="easy">Oson</Option>
              <Option value="medium">O'rtacha</Option>
              <Option value="hard">Qiyin</Option>
            </Select>
          </div>
        </div>

        <Search
          placeholder="Sinfdosh nomini kiriting..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined style={{ color: '#64748b' }} />}
          style={{
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#2563eb';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
          }}
        />
      </div>

      {/* Classmates section */}
      <div style={{ marginBottom: '24px' }}>

        <Card style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}>
          <Table
            columns={columns}
            dataSource={filteredClassmates.map(classmate => ({ ...classmate, key: classmate.id }))}
            loading={loading}
            pagination={false}
            size="middle"
            bordered={false}
            style={{
              '& .ant-table-thead > tr > th': {
                backgroundColor: '#f8fafc',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: '#1e293b',
                borderBottom: '1px solid #e2e8f0',
                padding: '16px'
              },
              '& .ant-table-tbody > tr > td': {
                borderBottom: '1px solid #f1f5f9',
                padding: '16px',
                fontSize: '0.875rem',
                color: '#334155'
              },
              '& .ant-table-tbody > tr:hover > td': {
                backgroundColor: '#f8fafc'
              }
            }}
          />
        </Card>
      </div>

      {/* No results message */}
      {filteredClassmates.length === 0 && classmates.length > 0 && (
        <Card style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '24px',
          textAlign: 'center'
        }}>
          <Title level={5} style={{
            color: '#64748b',
            fontWeight: 600,
            marginBottom: '8px'
          }}>
            Sizning qidiruvingizga mos sinfdosh topilmadi
          </Title>
          <Text style={{ color: '#94a3b8' }}>
            Qidiruv so'zini o'zgartirib ko'ring
          </Text>
        </Card>
      )}

      {/* No classmates message */}
      {classmates.length === 0 && (
        <Card style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '24px',
          textAlign: 'center'
        }}>
          <TeamOutlined style={{ fontSize: '4rem', color: '#cbd5e1', marginBottom: '8px' }} />
          <Title level={5} style={{
            color: '#64748b',
            fontWeight: 600,
            marginBottom: '8px'
          }}>
            Sinfdoshlar topilmadi
          </Title>
          <Text style={{ color: '#94a3b8' }}>
            Sizning sinfingizda boshqa o'quvchilar yo'q
          </Text>
        </Card>
      )}
    </div>
  );
};

export default Classmates;
