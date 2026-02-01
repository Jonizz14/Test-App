import React, { useState, useEffect } from 'react';
import 'animate.css';
import {
  Row,
  Col,
  Card,
  Typography,
  Alert,
  Spin,
  Table,
  Tag,
  Space,
  Progress,
  ConfigProvider,
  Divider,
} from 'antd';
import {
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
  RiseOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  StarOutlined,
  CrownFilled,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text, Paragraph } = Typography;

const ClassesRating = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myClassRank, setMyClassRank] = useState(null);
  const [myClassData, setMyClassData] = useState(null);

  useEffect(() => {
    const fetchClassesRating = async () => {
      try {
        setLoading(true);

        const [usersData, attemptsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts()
        ]);

        const users = usersData.results || usersData;
        const attempts = attemptsData.results || attemptsData;

        const currentUserClassGroup = currentUser?.class_group;

        // Group students by class
        const classGroups = {};
        const students = users.filter(user => user.role === 'student');

        students.forEach(student => {
          const classGroup = student.class_group || 'Noma\'lum';
          if (!classGroups[classGroup]) {
            classGroups[classGroup] = {
              name: classGroup,
              students: [],
              totalTests: 0,
              totalScore: 0,
              activeStudents: 0,
              attempts: []
            };
          }
          classGroups[classGroup].students.push(student);
          if (!student.is_banned) {
            classGroups[classGroup].activeStudents++;
          }
        });

        // Calculate class statistics
        Object.keys(classGroups).forEach(className => {
          const classGroup = classGroups[className];
          const classStudentIds = classGroup.students.map(s => s.id);

          const classAttempts = attempts.filter(a => classStudentIds.includes(a.student));
          classGroup.attempts = classAttempts;
          classGroup.totalTests = classAttempts.length;

          const scores = classAttempts.map(a => a.score || 0);
          if (scores.length > 0) {
            classGroup.averageScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
            classGroup.highestScore = Math.max(...scores);
          } else {
            classGroup.averageScore = 0;
            classGroup.highestScore = 0;
          }
        });

        // Convert to array and sort by average score
        const classesArray = Object.values(classGroups)
          .filter(cls => cls.students.length > 0)
          .map((cls, index) => ({
            ...cls,
            studentCount: cls.students.length,
            performance: cls.averageScore >= 80 ? 'A\'lo' :
              cls.averageScore >= 60 ? 'Yaxshi' :
                cls.averageScore >= 40 ? 'Qoniqarli' : 'Qoniqarsiz'
          }))
          .sort((a, b) => b.averageScore - a.averageScore)
          .map((cls, index) => ({
            ...cls,
            rank: index + 1
          }));

        setClasses(classesArray);

        // Find current user's class rank
        if (currentUserClassGroup) {
          const myClassIndex = classesArray.findIndex(c => c.name === currentUserClassGroup);
          if (myClassIndex !== -1) {
            setMyClassRank(myClassIndex + 1);
            setMyClassData(classesArray[myClassIndex]);
          }
        }

      } catch (error) {
        console.error('Error fetching classes rating:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchClassesRating();
    }
  }, [currentUser]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <CrownFilled style={{ color: '#f59e0b', fontSize: '32px' }} />;
    if (rank === 2) return <TrophyOutlined style={{ color: '#94a3b8', fontSize: '32px' }} />;
    if (rank === 3) return <TrophyOutlined style={{ color: '#d97706', fontSize: '32px' }} />;
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#f59e0b';
    if (rank === 2) return '#64748b';
    if (rank === 3) return '#d97706';
    return '#000';
  };

  const columns = [
    {
      title: 'O\'rin',
      key: 'rank',
      width: 100,
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          {record.rank <= 3 ? (
            getRankIcon(record.rank)
          ) : (
            <Text style={{ fontWeight: 900, fontSize: '18px', color: '#1e293b' }}>
              #{record.rank}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Sinf',
      key: 'name',
      render: (_, record) => (
        <Space size="large">
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: record.name === currentUser?.class_group ? '#2563eb' : '#fff',
            color: record.name === currentUser?.class_group ? '#fff' : '#1e293b',
            border: '3px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TeamOutlined style={{ fontSize: '24px' }} />
          </div>
          <div>
            <Text style={{ fontWeight: 900, fontSize: '16px', display: 'block', color: '#1e293b' }}>
              {record.name} {record.name === currentUser?.class_group && <Tag style={{ borderRadius: 0, border: '2px solid #2563eb', backgroundColor: '#2563eb', color: '#fff', fontSize: '10px', fontWeight: 900, marginLeft: 8 }}>SIZNING SINF</Tag>}
            </Text>
            <Text style={{ color: '#666', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>
              {record.studentCount} O'QUVCHI
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Faoliyat',
      key: 'activeStudents',
      width: 150,
      render: (_, record) => (
        <Text style={{ fontWeight: 800, fontSize: '14px' }}>
          {record.activeStudents} / {record.studentCount} faol
        </Text>
      ),
    },
    {
      title: 'Testlar',
      key: 'totalTests',
      width: 120,
      render: (_, record) => (
        <Text style={{ fontWeight: 800, fontSize: '16px' }}>
          {record.totalTests}
        </Text>
      ),
    },
    {
      title: 'O\'rtacha ball',
      key: 'averageScore',
      width: 180,
      render: (_, record) => (
        <div style={{
          display: 'inline-block',
          border: '3px solid #000',
          padding: '4px 12px',
          backgroundColor: record.averageScore >= 80 ? '#ecfdf5' : record.averageScore >= 60 ? '#eff6ff' : '#fff',
          boxShadow: '4px 4px 0px #000'
        }}>
          <Text style={{ fontWeight: 900, fontSize: '16px' }}>{record.averageScore}%</Text>
        </div>
      ),
    },
    {
      title: 'Holat',
      key: 'performance',
      width: 150,
      render: (_, record) => {
        const colors = {
          'A\'lo': '#059669',
          'Yaxshi': '#2563eb',
          'Qoniqarli': '#d97706',
          'Qoniqarsiz': '#dc2626'
        };
        return (
          <Text style={{ color: colors[record.performance] || '#000', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px' }}>
            {record.performance}
          </Text>
        );
      },
    },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px', flexDirection: 'column', alignItems: 'center' }}><Spin size="large" /><Text style={{ marginTop: '16px', fontWeight: 900, textTransform: 'uppercase' }}>Yuklanmoqda...</Text></div>;

  return (
    <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
      <div className="animate__animated animate__fadeIn" style={{ padding: '40px 0' }}>
        {/* Header */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ backgroundColor: '#2563eb', color: '#fff', padding: '8px 16px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', display: 'inline-block' }}>
            Jamoaviy Reyting
          </div>
          <Title level={1} style={{ fontWeight: 900, fontSize: '3rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#1e293b', margin: 0 }}>
            Sinflar <span style={{ color: '#2563eb' }}>reytingi</span>
          </Title>
          <div style={{ width: '80px', height: '10px', backgroundColor: '#2563eb', margin: '24px 0' }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#334155', maxWidth: '600px' }}>
            Platformadagi barcha sinflarning umumiy o'zlashtirish va faollik ko'rsatkichlari bo'yicha reyting jadvali.
          </Paragraph>
        </div>

        {/* My Class Info Card */}
        {myClassRank && myClassData && (
          <div className="animate__animated animate__fadeInUp" style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            color: '#fff',
            padding: '32px',
            border: '4px solid #1e293b',
            boxShadow: '10px 10px 0px rgba(30, 41, 59, 0.2)',
            marginBottom: '40px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Row gutter={[32, 32]} align="middle" style={{ position: 'relative', zIndex: 2 }}>
              <Col xs={24} md={8}>
                <Space direction="vertical" size={0}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px' }}>
                    Sizning sinfingiz o'rni
                  </Text>
                  <Title level={1} style={{ color: '#fff', margin: 0, fontWeight: 900, fontSize: '4rem' }}>
                    #{myClassRank}
                  </Title>
                </Space>
              </Col>
              <Col xs={24} md={16}>
                <Row gutter={[24, 24]}>
                  <Col xs={12} sm={6}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, display: 'block', fontSize: '10px' }}>O'RTACHA BALL</Text>
                    <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 900 }}>{myClassData.averageScore}%</Title>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, display: 'block', fontSize: '10px' }}>O'QUVCHILAR</Text>
                    <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 900 }}>{myClassData.studentCount}</Title>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, display: 'block', fontSize: '10px' }}>TESTLAR</Text>
                    <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 900 }}>{myClassData.totalTests}</Title>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, display: 'block', fontSize: '10px' }}>JAMI SINFLAR</Text>
                    <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 900 }}>{classes.length}</Title>
                  </Col>
                </Row>
              </Col>
            </Row>
            <RiseOutlined style={{
              position: 'absolute',
              right: '-20px',
              bottom: '-20px',
              fontSize: '180px',
              color: 'rgba(255,255,255,0.07)'
            }} />
          </div>
        )}

        {/* Top 3 Podium */}
        <Row gutter={[24, 24]} style={{ marginBottom: '60px' }}>
          {classes.slice(0, 3).map((cls, index) => (
            <Col xs={24} sm={8} key={cls.name}>
              <Card
                className="animate__animated animate__fadeInUp"
                style={{
                  border: `4px solid ${getRankColor(cls.rank)}`,
                  borderRadius: 0,
                  boxShadow: `8px 8px 0px ${getRankColor(cls.rank)}20`,
                  backgroundColor: index === 0 ? '#fef3c7' : '#fff',
                  textAlign: 'center',
                  animationDelay: `${index * 0.1}s`,
                  height: '100%'
                }}
              >
                <div style={{ marginBottom: '16px' }}>{getRankIcon(cls.rank)}</div>
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: cls.name === currentUser?.class_group ? '#2563eb' : '#fff',
                  color: cls.name === currentUser?.class_group ? '#fff' : getRankColor(cls.rank),
                  border: `4px solid ${getRankColor(cls.rank)}`,
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TeamOutlined style={{ fontSize: '40px' }} />
                </div>
                <Title level={3} style={{ fontWeight: 900, margin: '0 0 4px 0', textTransform: 'uppercase', fontSize: '1.2rem', color: getRankColor(cls.rank) }}>
                  {cls.name}
                </Title>
                <Text style={{ fontWeight: 800, color: '#666', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>
                  {cls.studentCount} O'QUVCHI
                </Text>
                <Divider style={{ borderColor: getRankColor(cls.rank), margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <div>
                    <Text style={{ fontSize: '10px', fontWeight: 900, color: '#999', display: 'block' }}>BALL</Text>
                    <Text style={{ fontSize: '1.5rem', fontWeight: 900, color: getRankColor(cls.rank) }}>{cls.averageScore}%</Text>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#e2e8f0' }}></div>
                  <div>
                    <Text style={{ fontSize: '10px', fontWeight: 900, color: '#999', display: 'block' }}>TESTS</Text>
                    <Text style={{ fontSize: '1.5rem', fontWeight: 900, color: getRankColor(cls.rank) }}>{cls.totalTests}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Main Table */}
        <Card
          style={{
            border: '4px solid #1e293b',
            boxShadow: '12px 12px 0px rgba(30, 41, 59, 0.15)',
          }}
          title={<Text style={{ fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' }}><BarChartOutlined /> BARCHA SINFLAR REYTINGI</Text>}
        >
          <Table
            columns={columns}
            dataSource={classes}
            rowKey="name"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              className: 'brutalist-pagination'
            }}
          />
        </Card>
      </div>

      <style>{`
        .brutalist-pagination .ant-pagination-item {
          border: 2px solid #1e293b !important;
          border-radius: 0 !important;
          font-weight: 900 !important;
        }
        .brutalist-pagination .ant-pagination-item-active {
          background-color: #2563eb !important;
          border-color: #2563eb !important;
        }
        .brutalist-pagination .ant-pagination-item-active a {
          color: #fff !important;
        }
        .ant-table-thead > tr > th {
          background: #1e293b !important;
          color: #fff !important;
          border-radius: 0 !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 2px solid #f1f5f9 !important;
          color: #1e293b !important;
        }
        .ant-table {
          border: 2px solid #1e293b !important;
        }
      `}</style>
    </ConfigProvider>
  );
};

export default ClassesRating;
