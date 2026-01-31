import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Input,
  Button,
  Alert,
  Row,
  Col,
  Table,
  Tag,
  Space,
  Select,
  ConfigProvider,
  Spin,
  Divider,
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;
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
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const loadClassmates = async () => {
      try {
        setLoading(true);
        const allUsers = await apiService.getUsers();
        const allStudents = allUsers.filter(user => user.role === 'student');
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

  const filteredClassmates = classmates.filter(classmate => {
    const classmateName = classmate.name || '';
    return classmateName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getSortedClassmates = () => {
    const data = [...filteredClassmates];
    if (sortBy === 'name') {
      return data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return data;
  };

  const columns = [
    {
      title: 'Sinfdosh',
      dataIndex: 'name',
      key: 'name',
      render: (name, classmate) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {classmate.profile_photo_url ? (
            <img
              src={classmate.profile_photo_url}
              style={{
                width: 40,
                height: 40,
                border: '2px solid #000',
                objectFit: 'cover'
              }}
              alt={name}
            />
          ) : (
            <div style={{
              width: 40,
              height: 40,
              backgroundColor: classmate.is_premium ? '#fef3c7' : '#000',
              color: classmate.is_premium ? '#000' : '#fff',
              border: '2px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 900,
            }}>
              {name ? name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              {name}
              {classmate.is_premium && <CrownOutlined style={{ color: '#d97706' }} />}
            </div>
            {classmate.is_premium && <Text style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#d97706' }}>Premium</Text>}
          </div>
        </div>
      ),
    },
    {
      title: 'Yo\'nalish',
      dataIndex: 'direction',
      key: 'direction',
      render: (direction) => (
        <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, backgroundColor: '#fff', color: '#000', textTransform: 'uppercase' }}>
          {direction === 'natural' ? 'Tabiiy' : 'Aniq'}
        </Tag>
      ),
    },
    {
      title: 'Harakat',
      key: 'actions',
      width: 120,
      render: (_, classmate) => (
        <Button
          size="small"
          onClick={() => navigate(`/student/student-profile/${classmate.id}`)}
          style={{
            borderRadius: 0,
            border: '2px solid #000',
            boxShadow: '4px 4px 0px #000',
            backgroundColor: '#fff',
            color: '#000',
            fontWeight: 800,
            textTransform: 'uppercase',
            fontSize: '11px',
            height: '32px'
          }}
          icon={<UserOutlined />}
        >
          Ko'rish
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, fontWeight: 700, textTransform: 'uppercase' }}>Sinfdoshlar yuklanmoqda...</Text>
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
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '60px' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#000',
            color: '#fff',
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '16px'
          }}>
            Sinf {currentUser?.class_group || 'Noma\'lum'}
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
            Sinfdoshlarim
          </Title>
          <div style={{
            width: '80px',
            height: '10px',
            backgroundColor: '#000',
            margin: '24px 0'
          }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Siz bilan birga bilim olayotgan do'stlaringizni toping va ularning yutuqlarini kuzating.
          </Paragraph>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ borderRadius: 0, border: '3px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 600, marginBottom: '40px' }}
          />
        )}

        {!currentUser?.class_group ? (
          <Alert message="Sizning sinfingiz aniqlanmagan" type="warning" showIcon style={{ borderRadius: 0, border: '3px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 700 }} />
        ) : (
          <>
            <div className="animate__animated animate__fadeIn" style={{ marginBottom: '40px' }}>
              <Card style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '10px 10px 0px #000' }}>
                <Row gutter={[24, 16]} align="middle">
                  <Col xs={24} md={18}>
                    <Search
                      placeholder="Sinfdosh ismini qidirish..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ borderRadius: 0, width: '100%' }}
                      size="large"
                    />
                  </Col>
                  <Col xs={24} md={6}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                      <SortAscendingOutlined style={{ fontSize: '20px' }} />
                      <Select value={sortBy} onChange={setSortBy} style={{ width: 160 }} size="large">
                        <Option value="name">Nomi bo'yicha</Option>
                      </Select>
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>

            <div className="animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
              <Table
                columns={columns}
                dataSource={getSortedClassmates().map(c => ({ ...c, key: c.id }))}
                pagination={{
                  pageSize: pageSize,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  onShowSizeChange: (_, size) => setPageSize(size),
                }}
                rowHoverable={false}
                style={{ border: '4px solid #000', boxShadow: '10px 10px 0px #000' }}
                scroll={{ x: 600 }}
              />
            </div>
          </>
        )}
      </div>
    </ConfigProvider>
  );
};

export default Classmates;
