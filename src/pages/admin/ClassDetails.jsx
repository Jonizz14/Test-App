import React, { useState, useEffect } from 'react';
import 'animate.css';
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
      <div className="animate__animated animate__fadeIn" style={{
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div className="animate__animated animate__pulse">
          <div style={{
            position: 'relative',
            width: '60px',
            height: '60px'
          }}>
            <div className="animate__animated animate__spin animate__infinite" style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              border: '4px solid rgba(226, 232, 240, 0.3)',
              borderTop: '4px solid #2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div className="animate__animated animate__spin animate__reverse animate__infinite" style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              width: '40px',
              height: '40px',
              border: '3px solid rgba(37, 99, 235, 0.2)',
              borderBottom: '3px solid #10b981',
              borderRadius: '50%',
              animation: 'spin 1.5s linear infinite'
            }}></div>
          </div>
        </div>
        <div className="animate__animated animate__fadeInUp" style={{
          textAlign: 'center'
        }}>
          <div className="animate__animated animate__pulse animate__infinite" style={{
            color: '#2563eb',
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '8px'
          }}>Yuklanmoqda</div>
          <div className="animate__animated animate__flash animate__infinite" style={{
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
    <div className="animate__animated animate__fadeIn" style={{ padding: '24px 0' }}>
      {/* Header */}
      <div className="animate__animated animate__fadeInDown" style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/students')}
          className="animate__animated animate__hover-lift"
          style={{
            borderColor: '#2563eb',
            color: '#2563eb',
            marginRight: '16px',
            transition: 'all 0.3s ease'
          }}
        >
          Orqaga
        </Button>
        <div className="animate__animated animate__fadeInRight" style={{ animationDelay: '0.2s' }}>
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
      <Row gutter={24} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
            <Card
              className="animate__animated animate__zoomIn"
              style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <TeamOutlined style={{ color: '#0ea5e9', fontSize: '32px', marginRight: '16px' }} />
                <Title level={2} style={{ margin: 0, color: '#0ea5e9', fontWeight: 700 }}>
                  {statistics.totalStudents}
                </Title>
              </div>
              <Text style={{ color: '#0c4a6e', fontWeight: 600 }}>
                Jami o'quvchi
              </Text>
            </Card>
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
            <Card
              className="animate__animated animate__zoomIn"
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #22c55e',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <RiseOutlined style={{ color: '#22c55e', fontSize: '32px', marginRight: '16px' }} />
                <Title level={2} style={{ margin: 0, color: '#22c55e', fontWeight: 700 }}>
                  {statistics.totalAttempts}
                </Title>
              </div>
              <Text style={{ color: '#166534', fontWeight: 600 }}>
                Jami testlar
              </Text>
            </Card>
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
            <Card
              className="animate__animated animate__zoomIn"
              style={{
                backgroundColor: '#fefce8',
                border: '1px solid #eab308',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <TrophyOutlined style={{ color: '#eab308', fontSize: '32px', marginRight: '16px' }} />
                <Title level={2} style={{ margin: 0, color: '#eab308', fontWeight: 700 }}>
                  {statistics.averageScore}%
                </Title>
              </div>
              <Text style={{ color: '#713f12', fontWeight: 600 }}>
                O'rtacha ball
              </Text>
            </Card>
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
            <Card
              className="animate__animated animate__zoomIn"
              style={{
                backgroundColor: '#fdf2f8',
                border: '1px solid #ec4899',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <UserOutlined style={{ color: '#ec4899', fontSize: '32px', marginRight: '16px' }} />
                <Title level={2} style={{ margin: 0, color: '#ec4899', fontWeight: 700 }}>
                  {statistics.activeStudents}
                </Title>
              </div>
              <Text style={{ color: '#831843', fontWeight: 600 }}>
                Faol o'quvchi
              </Text>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Class Curator */}
      {curator && (
        <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.5s' }}>
          <Card
            className="animate__animated animate__card-entrance"
            style={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              animationDelay: '0.6s'
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
                className="animate__animated animate__zoomIn"
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
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.7s' }}>
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
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.8s' }}>
        <Card
          className="animate__animated animate__card-entrance"
          title={
            <span className="animate__animated animate__slideInRight">
              {`Barcha o'quvchilar (${students.length} ta)`}
            </span>
          }
          style={{
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            animationDelay: '0.9s'
          }}
        >
          <Table
            className="animate__animated animate__fadeInUp"
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
              className: 'animate__animated animate__fadeInUp',
              style: { 
                animationDelay: `${0.1 + index * 0.05}s`,
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.backgroundColor = '#f0f9ff';
                e.currentTarget.style.transform = 'scale(1.01)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            })}
          />
        </Card>
      </div>
    </div>
  );
};

export default ClassDetails;