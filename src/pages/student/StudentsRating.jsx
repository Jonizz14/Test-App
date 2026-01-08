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
  Input,
  Avatar,
} from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const StudentsRating = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    const fetchStudentsRating = async () => {
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

        // Calculate student statistics
        const studentAnalytics = users
          .filter(user => user.role === 'student')
          .map(student => {
            const studentAttempts = attempts.filter(a => a.student === student.id);
            const testCount = studentAttempts.length;
            const scores = studentAttempts.map(a => a.score || 0);
            const averageScore = scores.length > 0
              ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
              : 0;
            const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

            return {
              id: student.id,
              name: student.name || student.username,
              classGroup: student.class_group || 'Noma\'lum',
              testCount,
              averageScore,
              highestScore,
              isBanned: student.is_banned,
              profilePhoto: student.profile_photo_url,
              registrationDate: student.registration_date
            };
          })
          .filter(student => student.testCount > 0 && !student.isBanned)
          .sort((a, b) => {
            // Sort by average score first, then by test count
            if (b.averageScore !== a.averageScore) {
              return b.averageScore - a.averageScore;
            }
            return b.testCount - a.testCount;
          });

        // Add rankings
        const rankedStudents = studentAnalytics.map((student, index) => ({
          ...student,
          rank: index + 1
        }));

        setStudents(rankedStudents);
        setFilteredStudents(rankedStudents);

        // Find current user's rank
        const currentUserRank = rankedStudents.findIndex(s => s.id === currentUser?.id);
        if (currentUserRank !== -1) {
          setMyRank(currentUserRank + 1);
        }

      } catch (error) {
        console.error('Error fetching students rating:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchStudentsRating();
    }
  }, [currentUser]);

  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(value.toLowerCase()) ||
      student.classGroup.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#f59e0b';
    if (rank === 2) return '#94a3b8';
    if (rank === 3) return '#dc2626';
    return '#64748b';
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
      title: 'O\'quvchi',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar
            size={40}
            src={record.profilePhoto}
            style={{
              backgroundColor: record.id === currentUser?.id ? '#2563eb' : '#f1f5f9',
              color: record.id === currentUser?.id ? '#ffffff' : '#64748b',
              border: record.id === currentUser?.id ? '2px solid #2563eb' : '2px solid transparent'
            }}
          >
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ color: '#1e293b', fontSize: '14px' }}>
              {record.name}
            </Text>
            <br />
            <Text style={{ color: '#94a3b8', fontSize: '12px' }}>
              {record.classGroup}
            </Text>
          </div>
          {record.id === currentUser?.id && (
            <Tag color="blue" style={{ marginLeft: 8 }}>Siz</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Testlar',
      key: 'testCount',
      width: 100,
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.testCount}
        </Text>
      ),
    },
    {
      title: 'O\'rtacha ball',
      key: 'averageScore',
      width: 120,
      render: (_, record) => (
        <Tag
          color={record.averageScore >= 80 ? 'green' : record.averageScore >= 60 ? 'orange' : 'red'}
          style={{ fontWeight: 600, fontSize: '14px', padding: '4px 12px' }}
        >
          {record.averageScore}%
        </Tag>
      ),
    },
    {
      title: 'Eng yuqori',
      key: 'highestScore',
      width: 100,
      render: (_, record) => (
        <Text strong style={{ color: '#16a34a', fontSize: '14px' }}>
          {record.highestScore}%
        </Text>
      ),
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
          O'quvchilar reytingi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Barcha o'quvchilar reytingi va natijalari
        </Text>
      </div>

      {/* My Rank Card */}
      {myRank && (
        <div className="animate__animated animate__fadeInUp" style={{ marginBottom: '24px' }}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              borderRadius: '16px',
              border: 'none',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Space direction="vertical" size={0}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                    Sizning reytingingiz
                  </Text>
                  <Title level={2} style={{ margin: 0, color: '#ffffff', fontSize: '48px' }}>
                    #{myRank}
                  </Title>
                </Space>
              </Col>
              <Col>
                <Space direction="vertical" size={0} align="end">
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                    Jami o'quvchilar
                  </Text>
                  <Text style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700 }}>
                    {students.length}
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </div>
      )}

      {/* Top 3 Students */}
      <div className="animate__animated animate__fadeInUp" style={{ marginBottom: '24px' }}>
        <Row gutter={[24, 24]}>
          {students.slice(0, 3).map((student, index) => (
            <Col xs={24} sm={8} key={student.id}>
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
                <Avatar
                  size={64}
                  src={student.profilePhoto}
                  style={{ backgroundColor: '#ffffff', marginBottom: '12px' }}
                >
                  {student.name.charAt(0).toUpperCase()}
                </Avatar>
                <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                  {student.name}
                </Title>
                <Text style={{ color: '#64748b', fontSize: '12px' }}>
                  {student.classGroup}
                </Text>
                <div style={{ marginTop: '12px' }}>
                  <Tag color={student.averageScore >= 80 ? 'green' : 'orange'} style={{ fontWeight: 600 }}>
                    {student.averageScore}%
                  </Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Search and Table */}
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '400ms' }}>
        <Card
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <Input
              placeholder="O'quvchi yoki sinf bo'yicha qidirish..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                maxWidth: '100%',
                borderRadius: '8px',
              }}
              allowClear
            />
          </div>
          <Table
            columns={columns}
            dataSource={filteredStudents}
            rowKey="id"
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Jami ${total} ta o'quvchi`,
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default StudentsRating;
