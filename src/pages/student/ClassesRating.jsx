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
} from 'antd';
import {
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
  RiseOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

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

        const [usersData, attemptsData, testsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts(),
          apiService.getTests()
        ]);

        const users = usersData.results || usersData;
        const attempts = attemptsData.results || attemptsData;
        const tests = testsData.results || testsData;

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
            rank: index + 1,
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

  const getRankColor = (rank) => {
    if (rank === 1) return '#f59e0b';
    if (rank === 2) return '#94a3b8';
    if (rank === 3) return '#dc2626';
    return '#64748b';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const columns = [
    {
      title: 'O\'rin',
      key: 'rank',
      width: 80,
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          {getRankIcon(record.rank) ? (
            <span style={{ fontSize: '20px' }}>{getRankIcon(record.rank)}</span>
          ) : (
            <Text strong style={{ color: getRankColor(record.rank), fontSize: '16px' }}>
              {record.rank}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Sinf',
      key: 'name',
      render: (_, record) => (
        <Space>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: record.name === currentUser?.class_group ? '#2563eb20' : '#f1f5f9',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TeamOutlined style={{ 
              color: record.name === currentUser?.class_group ? '#2563eb' : '#64748b', 
              fontSize: '20px' 
            }} />
          </div>
          <div>
            <Text strong style={{ color: '#1e293b', fontSize: '14px' }}>
              {record.name}
            </Text>
            <br />
            <Text style={{ color: '#94a3b8', fontSize: '12px' }}>
              {record.studentCount} o'quvchi
            </Text>
          </div>
          {record.name === currentUser?.class_group && (
            <Tag color="blue" style={{ marginLeft: 8 }}>Sizning sinfingiz</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Faol o\'quvchilar',
      key: 'activeStudents',
      width: 120,
      render: (_, record) => (
        <Text style={{ color: '#16a34a', fontWeight: 600 }}>
          {record.activeStudents} / {record.studentCount}
        </Text>
      ),
    },
    {
      title: 'Testlar soni',
      key: 'totalTests',
      width: 100,
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.totalTests}
        </Text>
      ),
    },
    {
      title: 'O\'rtacha ball',
      key: 'averageScore',
      width: 150,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Progress
            percent={record.averageScore}
            size="small"
            strokeColor={record.averageScore >= 80 ? '#16a34a' : record.averageScore >= 60 ? '#f59e0b' : '#dc2626'}
            style={{ width: '80px' }}
          />
          <Tag
            color={record.averageScore >= 80 ? 'green' : record.averageScore >= 60 ? 'orange' : 'red'}
            style={{ fontWeight: 600 }}
          >
            {record.averageScore}%
          </Tag>
        </div>
      ),
    },
    {
      title: 'Eng yuqori',
      key: 'highestScore',
      width: 100,
      render: (_, record) => (
        <Text strong style={{ color: '#f59e0b', fontSize: '14px' }}>
          {record.highestScore}%
        </Text>
      ),
    },
    {
      title: 'Holat',
      key: 'performance',
      width: 120,
      render: (_, record) => {
        const colors = {
          'A\'lo': '#16a34a',
          'Yaxshi': '#2563eb',
          'Qoniqarli': '#f59e0b',
          'Qoniqarsiz': '#dc2626'
        };
        return (
          <Text style={{ color: colors[record.performance], fontWeight: 600 }}>
            {record.performance}
          </Text>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
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
      </div>
    );
  }

  return (
    <div className="animate__animated animate__fadeIn" style={{ padding: '24px 0' }}>
      {/* Header */}
      <div className="animate__animated animate__fadeInDown" style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Sinflar reytingi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Barcha sinflar reytingi va natijalari
        </Text>
      </div>

      {/* My Class Rank Card */}
      {myClassRank && myClassData && (
        <div className="animate__animated animate__fadeInUp" style={{ marginBottom: '24px' }}>
          <Card
            style={{
              background: myClassRank <= 3 
                ? 'linear-gradient(135deg, #16a34a 0%, #059669 100%)'
                : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: '16px',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} md={8}>
                <Space direction="vertical" size={0}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                    Sizning sinfingiz - {currentUser?.class_group}
                  </Text>
                  <Title level={2} style={{ margin: 0, color: '#ffffff', fontSize: '48px' }}>
                    {myClassRank <= 3 ? getRankIcon(myClassRank) : ''} #{myClassRank}
                  </Title>
                </Space>
              </Col>
              <Col xs={24} md={16}>
                <Row gutter={[24, 16]}>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>O'rtacha ball</Text>
                      <Title level={3} style={{ margin: 0, color: '#ffffff' }}>
                        {myClassData.averageScore}%
                      </Title>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>O'quvchilar</Text>
                      <Title level={3} style={{ margin: 0, color: '#ffffff' }}>
                        {myClassData.studentCount}
                      </Title>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Testlar</Text>
                      <Title level={3} style={{ margin: 0, color: '#ffffff' }}>
                        {myClassData.totalTests}
                      </Title>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Jami sinflar</Text>
                      <Title level={3} style={{ margin: 0, color: '#ffffff' }}>
                        {classes.length}
                      </Title>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        </div>
      )}

      {/* Top 3 Classes */}
      <div className="animate__animated animate__fadeInUp" style={{ marginBottom: '24px' }}>
        <Row gutter={[24, 24]}>
          {classes.slice(0, 3).map((cls, index) => (
            <Col xs={24} sm={8} key={cls.name}>
              <Card
                className="animate__animated animate__zoomIn"
                style={{
                  backgroundColor: index === 0 ? '#fef3c7' : index === 1 ? '#f3f4f6' : '#fed7aa',
                  border: 'none',
                  borderRadius: '16px',
                  textAlign: 'center',
                  animationDelay: `${index * 100}ms`
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <TeamOutlined style={{ fontSize: '28px', color: '#2563eb' }} />
                </div>
                <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                  {cls.name}
                </Title>
                <Text style={{ color: '#64748b', fontSize: '12px' }}>
                  {cls.studentCount} o'quvchi
                </Text>
                <div style={{ marginTop: '12px' }}>
                  <Tag color={cls.averageScore >= 80 ? 'green' : 'orange'} style={{ fontWeight: 600 }}>
                    {cls.averageScore}%
                  </Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Classes Table */}
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '400ms' }}>
        <Card
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
          }}
        >
          <Title level={3} style={{ marginBottom: '16px', color: '#1e293b' }}>
            <BarChartOutlined style={{ marginRight: 8 }} />
            Barcha sinflar
          </Title>
          <Table
            columns={columns}
            dataSource={classes}
            rowKey="name"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Jami ${total} ta sinf`,
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default ClassesRating;
