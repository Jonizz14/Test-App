import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Avatar,
  Table,
  Tag,
  Alert,
  Row,
  Col,
  Space,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  TeamOutlined,
  RiseOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

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

const ClassDetails = () => {
  const { classGroup } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClassData = async () => {
      try {
        setLoading(true);
        const [allUsers, allAttempts, allTests] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts(),
          apiService.getTests()
        ]);

        const allStudents = allUsers.filter(user => user.role === 'student');
        const allTeachers = allUsers.filter(user => user.role === 'teacher');

        // Filter students by class
        const classStudents = allStudents.filter(student => student.class_group === classGroup);
        const classTeachers = allTeachers.filter(teacher => teacher.curator_class === classGroup);

        setStudents(classStudents);
        setTeachers(classTeachers);
        setAttempts(allAttempts.results || allAttempts);
        setTests(allTests.results || allTests);
      } catch (error) {
        console.error('Failed to load class data:', error);
        setError('Sinflar ma\'lumotlarini yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadClassData();
  }, [classGroup]);

  const getDirectionLabel = (direction) => {
    return direction === 'natural' ? 'Tabiiy fanlar' : 'Aniq fanlar';
  };

  const getStudentAttemptCount = (studentId) => {
    return attempts.filter(attempt => attempt.student === studentId).length;
  };

  const getStudentAverageScore = (studentId) => {
    const studentAttempts = attempts.filter(attempt => attempt.student === studentId);
    if (studentAttempts.length === 0) return 0;

    const averageScore = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
    return Math.round(averageScore);
  };

  const getClassStatistics = () => {
    if (students.length === 0) return { totalStudents: 0, totalAttempts: 0, averageScore: 0, activeStudents: 0 };

    let totalScore = 0;
    let totalAttempts = 0;
    let studentsWithAttempts = 0;
    let activeStudents = 0;

    students.forEach(student => {
      const studentAttempts = attempts.filter(attempt => attempt.student === student.id);
      totalAttempts += studentAttempts.length;

      if (studentAttempts.length > 0) {
        const studentAverage = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
        totalScore += studentAverage;
        studentsWithAttempts++;
      }

      // Active students (has login in last 30 days)
      if (student.last_login && new Date(student.last_login) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        activeStudents++;
      }
    });

    return {
      totalStudents: students.length,
      totalAttempts,
      averageScore: studentsWithAttempts > 0 ? Math.round(totalScore / studentsWithAttempts) : 0,
      activeStudents
    };
  };

  const getRecentActivity = () => {
    const classAttempts = attempts.filter(attempt =>
      students.some(student => student.id === attempt.student)
    );

    return classAttempts
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
      .slice(0, 10);
  };

  const getClassCurator = () => {
    return teachers.find(teacher => teacher.curator_class === classGroup);
  };

  const statistics = getClassStatistics();
  const recentActivity = getRecentActivity();
  const curator = getClassCurator();

  const columns = [
    {
      title: 'O\'quvchi',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {record.is_premium && record.profile_photo_url ? (
            <Avatar
              src={record.profile_photo_url}
              size={40}
              style={{ border: '2px solid #e2e8f0' }}
            />
          ) : (
            <Avatar
              size={40}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: 600,
                border: '2px solid #e2e8f0'
              }}
            >
              -
            </Avatar>
          )}
          <div>
            <Text strong style={{ color: '#1e293b', fontSize: '14px' }}>
              {text}
            </Text>
            <br />
            <Text style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
              {record.display_id || record.username}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Yo\'nalish',
      dataIndex: 'direction',
      key: 'direction',
      render: (direction) => (
        <Tag
          color={direction === 'natural' ? 'green' : 'blue'}
          style={{ fontWeight: 600 }}
        >
          {getDirectionLabel(direction)}
        </Tag>
      ),
    },
    {
      title: 'Testlar',
      key: 'attempts',
      render: (_, record) => (
        <Text style={{ fontWeight: 700, color: '#2563eb', fontSize: '18px' }}>
          {getStudentAttemptCount(record.id)}
        </Text>
      ),
    },
    {
      title: 'O\'rtacha ball',
      key: 'averageScore',
      render: (_, record) => (
        <Text style={{ fontWeight: 700, color: '#059669', fontSize: '18px' }}>
          {getStudentAverageScore(record.id)}%
        </Text>
      ),
    },
    {
      title: 'Oxirgi faollik',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (lastLogin) => (
        <Text style={{ color: '#64748b', fontSize: '14px' }}>
          {lastLogin ? new Date(lastLogin).toLocaleString('uz-UZ') : '-'}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_banned',
      key: 'status',
      render: (isBanned) => (
        <Tag color={isBanned ? 'red' : 'green'}>
          {isBanned ? 'Bloklangan' : 'Faol'}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div >
          <div style={{
            position: 'relative',
            width: '60px',
            height: '60px'
          }}>
            <div style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              border: '4px solid rgba(226, 232, 240, 0.3)',
              borderTop: '4px solid #2563eb',
              borderRadius: '50%',

            }}></div>
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              width: '40px',
              height: '40px',
              border: '3px solid rgba(37, 99, 235, 0.2)',
              borderBottom: '3px solid #10b981',
              borderRadius: '50%',

            }}></div>
          </div>
        </div>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            color: '#2563eb',
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '8px'
          }}>Yuklanmoqda</div>
          <div style={{
            color: '#64748b',
            fontSize: '14px'
          }}>Iltimos kuting...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate__hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
          }
          .animate__card-entrance {
            animation: cardEntrance 0.6s ease-out forwards;
          }
          @keyframes cardEntrance {
            0% {
              opacity: 0;
              transform: translateY(30px) scale(0.9);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .animate__slide-in-left {
            animation: slideInLeft 0.5s ease-out forwards;
          }
          @keyframes slideInLeft {
            0% {
              opacity: 0;
              transform: translateX(-50px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate__zoom-in:hover {
            animation: zoomIn 0.3s ease-out;
          }
          @keyframes zoomIn {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
            100% {
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
      }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/students')}

          style={{
            borderColor: '#2563eb',
            color: '#2563eb',
            marginRight: '16px',
            transition: 'all 0.3s ease'
          }}
        >
          Orqaga
        </Button>
        <div style={{}}>
          <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '0px' }}>
            {classGroup} sinfi
          </Title>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
          closable
          onClose={() => setError('')}
        />
      )}

      {/* Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <div style={{}}>
            <StatCard
              title="Jami o'quvchi"
              value={statistics.totalStudents}
              icon={<TeamOutlined />}
              color="#2563eb"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div style={{}}>
            <StatCard
              title="Jami testlar"
              value={statistics.totalAttempts}
              icon={<RiseOutlined />}
              color="#16a34a"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div style={{}}>
            <StatCard
              title="O'rtacha ball"
              value={statistics.averageScore}
              suffix="%"
              icon={<TrophyOutlined />}
              color="#059669"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div style={{}}>
            <StatCard
              title="Faol o'quvchi"
              value={statistics.activeStudents}
              icon={<UserOutlined />}
              color="#dc2626"
            />
          </div>
        </Col>
      </Row>

      {/* Class Curator */}
      {curator && (
        <div style={{}}>
          <Card

            style={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px',
              transition: 'all 0.3s ease',

            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Title level={4} style={{ marginBottom: '16px', color: '#1e293b' }}>
              Sinf rahbari
            </Title>
            <Space>
              <Avatar
                src={curator.is_premium && curator.profile_photo_url ? curator.profile_photo_url : undefined}
                size={64}

                style={{
                  border: '3px solid #e2e8f0',
                  backgroundColor: curator.is_premium && curator.profile_photo_url ? undefined : '#f1f5f9',
                  color: '#64748b',
                  fontSize: '24px',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1) rotate(5deg)';
                  e.target.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1) rotate(0deg)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {!curator.is_premium || !curator.profile_photo_url ? (curator.name ? curator.name.charAt(0) : 'R') : undefined}
              </Avatar>
              <div style={{}}>
                <Text strong style={{ fontSize: '18px', color: '#1e293b', display: 'block' }}>
                  {curator.name}
                </Text>
                <Text style={{ color: '#64748b', fontSize: '14px' }}>
                  {curator.display_id || curator.username}
                </Text>
                {curator.bio && (
                  <Text style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic', display: 'block', marginTop: '8px' }}>
                    "{curator.bio}"
                  </Text>
                )}
              </div>
            </Space>
          </Card>
        </div>
      )}

      {/* Students List */}
      <div style={{}}>
        <Card

          title={
            <span >
              {`Barcha o'quvchilar (${students.length} ta)`}
            </span>
          }
          style={{
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease',

          }}
        >
          <Table

            columns={columns}
            dataSource={students}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Jami ${total} ta o'quvchi`,
            }}
            locale={{
              emptyText: 'Bu sinfda hali o\'quvchilar yo\'q'
            }}
            onRow={(record, index) => ({

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
        </Card>
      </div>
    </div>
  );
};

export default ClassDetails;
