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
  ConfigProvider,
  Divider,
} from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  StarOutlined,
  FireOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  CrownFilled,
  StarFilled,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text, Paragraph } = Typography;

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

        const [usersData, attemptsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts()
        ]);

        const users = usersData.results || usersData;
        const attempts = attemptsData.results || attemptsData;

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
              stars: student.stars || 0
            };
          })
          .filter(student => !student.isBanned)
          .sort((a, b) => {
            if (b.averageScore !== a.averageScore) {
              return b.averageScore - a.averageScore;
            }
            return b.testCount - a.testCount;
          });

        const rankedStudents = studentAnalytics.map((student, index) => ({
          ...student,
          rank: index + 1
        }));

        setStudents(rankedStudents);
        setFilteredStudents(rankedStudents);

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
    if (rank === 1) return <CrownFilled style={{ color: '#f59e0b', fontSize: '32px' }} />;
    if (rank === 2) return <TrophyOutlined style={{ color: '#94a3b8', fontSize: '32px' }} />;
    if (rank === 3) return <TrophyOutlined style={{ color: '#d97706', fontSize: '32px' }} />;
    return null;
  };

  const getCardBg = (rank) => {
    if (rank === 1) return '#fffbeb';
    if (rank === 2) return '#f8fafc';
    if (rank === 3) return '#fff7ed';
    return '#fff';
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
            <Text style={{ fontWeight: 900, fontSize: '18px', color: '#000' }}>
              #{record.rank}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'O\'quvchi',
      key: 'name',
      render: (_, record) => (
        <Space size="large">
          <Avatar
            size={48}
            src={record.profilePhoto}
            style={{
              border: '3px solid #1e293b',
              borderRadius: 0,
              backgroundColor: record.id === currentUser?.id ? '#2563eb' : '#fff',
              color: record.id === currentUser?.id ? '#fff' : '#1e293b',
            }}
          >
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text style={{ fontWeight: 900, fontSize: '16px', display: 'block', color: '#000' }}>
              {record.name} {record.id === currentUser?.id && <Tag style={{ borderRadius: 0, border: '2px solid #000', backgroundColor: '#000', color: '#fff', fontSize: '10px', fontWeight: 900, marginLeft: 8 }}>SIZ</Tag>}
            </Text>
            <Text style={{ color: '#666', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>
              {record.classGroup}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Testlar',
      key: 'testCount',
      width: 120,
      render: (_, record) => (
        <Text style={{ fontWeight: 800, fontSize: '16px' }}>
          {record.testCount}
        </Text>
      ),
    },
    {
      title: 'O\'rtacha ball',
      key: 'averageScore',
      width: 150,
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
      title: 'Eng yuqori',
      key: 'highestScore',
      width: 120,
      render: (_, record) => (
        <Text style={{ fontWeight: 800, color: '#059669', fontSize: '16px' }}>
          {record.highestScore}%
        </Text>
      ),
    },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px', flexDirection: 'column', alignItems: 'center' }}><Spin size="large" /><Text style={{ marginTop: '16px', fontWeight: 900, textTransform: 'uppercase' }}>Yuklanmoqda...</Text></div>;

  return (
    <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
      <div className="animate__animated animate__fadeIn" style={{ padding: '40px 0' }}>
        {/* Header */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ backgroundColor: '#2563eb', color: '#fff', padding: '8px 16px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', display: 'inline-block' }}>
            Reyting
          </div>
          <Title level={1} style={{ fontWeight: 900, fontSize: '3rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#1e293b', margin: 0 }}>
            O'quvchilar <span style={{ color: '#2563eb' }}>reytingi</span>
          </Title>
          <div style={{ width: '80px', height: '10px', backgroundColor: '#2563eb', margin: '24px 0' }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Platformadagi barcha o'quvchilarning o'zlashtirish ko'rsatkichlari va umumiy natijalari bo'yicha reyting jadvali.
          </Paragraph>
        </div>

        {/* My Rank Card */}
        {myRank && (
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
            <Row align="middle" justify="space-between" style={{ position: 'relative', zIndex: 2 }}>
              <Col>
                <Space direction="vertical" size={0}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px' }}>
                    Sizning o'rningiz
                  </Text>
                  <Title level={1} style={{ color: '#fff', margin: 0, fontWeight: 900, fontSize: '4rem' }}>
                    #{myRank}
                  </Title>
                </Space>
              </Col>
              <Col style={{ textAlign: 'right' }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px' }}>
                  Jami o'quvchilar
                </Text>
                <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 900 }}>
                  {students.length}
                </Title>
              </Col>
            </Row>
            <TrophyOutlined style={{
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
          {students.slice(0, 3).map((student, index) => (
            <Col xs={24} sm={8} key={student.id}>
              <Card
                className="animate__animated animate__fadeInUp"
                style={{
                  border: `4px solid ${getRankColor(student.rank)}`,
                  borderRadius: 0,
                  boxShadow: `8px 8px 0px ${getRankColor(student.rank)}20`,
                  backgroundColor: index === 0 ? '#fef3c7' : '#fff',
                  textAlign: 'center',
                  animationDelay: `${index * 0.1}s`,
                  height: '100%'
                }}
              >
                <div style={{ marginBottom: '16px' }}>{getRankIcon(student.rank)}</div>
                <Avatar
                  size={80}
                  src={student.profilePhoto}
                  style={{ border: `4px solid ${getRankColor(student.rank)}`, borderRadius: 0, marginBottom: '16px' }}
                >
                  {student.name.charAt(0).toUpperCase()}
                </Avatar>
                <Title level={3} style={{ fontWeight: 900, margin: '0 0 4px 0', textTransform: 'uppercase', fontSize: '1.2rem', color: getRankColor(student.rank) }}>
                  {student.name}
                </Title>
                <Text style={{ fontWeight: 800, color: '#666', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>
                  {student.classGroup}
                </Text>
                <Divider style={{ borderColor: getRankColor(student.rank), margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <div>
                    <Text style={{ fontSize: '10px', fontWeight: 900, color: '#999', display: 'block' }}>BALL</Text>
                    <Text style={{ fontSize: '1.5rem', fontWeight: 900, color: getRankColor(student.rank) }}>{student.averageScore}%</Text>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#e2e8f0' }}></div>
                  <div>
                    <Text style={{ fontSize: '10px', fontWeight: 900, color: '#999', display: 'block' }}>TESTLAR</Text>
                    <Text style={{ fontSize: '1.5rem', fontWeight: 900, color: getRankColor(student.rank) }}>{student.testCount}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Search and Main Table */}
        <Card
          style={{
            border: '4px solid #1e293b',
            boxShadow: '12px 12px 0px rgba(30, 41, 59, 0.15)',
          }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <Text style={{ fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' }}><TeamOutlined /> BARCHA O'QUVCHILAR</Text>
              <Input
                placeholder="QIDIRISH..."
                prefix={<SearchOutlined style={{ color: '#64748b' }} />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '250px',
                  border: '3px solid #1e293b',
                  fontWeight: 700,
                  borderRadius: 0,
                  color: '#1e293b'
                }}
                allowClear
              />
            </div>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredStudents}
            rowKey="id"
            pagination={{
              pageSize: 15,
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
        .brutalist-pagination .ant-pagination-prev .ant-pagination-item-link,
        .brutalist-pagination .ant-pagination-next .ant-pagination-item-link {
          border: 2px solid #1e293b !important;
          border-radius: 0 !important;
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

export default StudentsRating;
