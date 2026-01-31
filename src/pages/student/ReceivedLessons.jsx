import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Table,
  Tag,
  Alert,
  Input,
  Select,
  Row,
  Col,
  ConfigProvider,
  Spin,
  Space,
} from 'antd';
import {
  BookOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const ReceivedLessons = () => {
  const { currentUser } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [sortBy, setSortBy] = useState('topic');
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (currentUser?.id) {
      loadLessons();
    }
  }, [currentUser?.id]);

  const loadLessons = () => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const lessonNotifications = notifications.filter(n =>
        n.studentId === currentUser.id && n.type === 'lesson_reminder'
      );

      const studentLessons = lessonNotifications.map(notification => ({
        id: notification.id,
        topic: notification.lessonTopic,
        subject: notification.subject,
        description: notification.lessonDescription,
        room: notification.room,
        lessonDate: notification.lessonDate,
        lessonTime: notification.lessonTime,
        teacherName: notification.teacherName,
        sentAt: notification.createdAt,
        difficulty: notification.difficulty || 'medium',
      }));
      setLessons(studentLessons);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLessons = () => {
    if (!lessons) return [];
    return lessons.filter(lesson => {
      const matchesSearch = !searchTerm ||
        lesson?.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson?.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson?.subject?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSubject = !subjectFilter || lesson?.subject === subjectFilter;

      return matchesSearch && matchesSubject;
    });
  };

  const getSortedLessons = () => {
    const filteredLessons = getFilteredLessons();
    const sorted = [...filteredLessons];

    if (sortBy === 'subject') return sorted.sort((a, b) => (a?.subject || '').localeCompare(b?.subject || ''));
    if (sortBy === 'date') return sorted.sort((a, b) => new Date(b.lessonDate) - new Date(a.lessonDate));
    if (sortBy === 'teacher') return sorted.sort((a, b) => (a?.teacherName || '').localeCompare(b?.teacherName || ''));
    if (sortBy === 'sentDate') return sorted.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    return sorted.sort((a, b) => (a?.topic || '').localeCompare(b?.topic || ''));
  };

  const allSubjects = [...new Set(lessons.map(lesson => lesson.subject).filter(Boolean))];

  const columns = [
    {
      title: 'Mavzu',
      dataIndex: 'topic',
      key: 'topic',
      render: (topic, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#000', color: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>L</div>
          <div>
            <Text style={{ fontWeight: 800, color: '#000', display: 'block' }}>{topic}</Text>
            {record.description && (
              <Text style={{ fontSize: '11px', color: '#666' }}>
                {record.description.length > 60 ? record.description.substring(0, 60) + '...' : record.description}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Fan',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => (
        <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800, backgroundColor: '#fff', color: '#000', textTransform: 'uppercase', fontSize: '10px' }}>
          {subject}
        </Tag>
      ),
    },
    {
      title: 'Vaqt / Joy',
      key: 'datetime',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12px' }}>
            <CalendarOutlined /> {record.lessonDate}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12px' }}>
            <ClockCircleOutlined /> {record.lessonTime}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '11px', color: '#666' }}>
            <EnvironmentOutlined /> {record.room}
          </div>
        </div>
      ),
    },
    {
      title: 'O\'qituvchi',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (name) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined />
          <Text style={{ fontWeight: 700, fontSize: '12px' }}>{name}</Text>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, fontWeight: 700, textTransform: 'uppercase' }}>Darslar yuklanmoqda...</Text>
      </div>
    );
  }

  return (
    <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
      <div style={{ padding: '40px 0' }}>
        {/* Header */}
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '60px' }}>
          <div style={{ backgroundColor: '#000', color: '#fff', padding: '8px 16px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', display: 'inline-block' }}>
            Darslar
          </div>
          <Title level={1} style={{ fontWeight: 900, fontSize: '2.5rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#000' }}>
            Qo'shimcha darslar
          </Title>
          <div style={{ width: '80px', height: '10px', backgroundColor: '#000', margin: '24px 0' }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            O'qituvchilaringiz tomonidan yuborilgan dars materiallari va qo'shimcha mashg'ulotlar.
          </Paragraph>
        </div>

        {/* Filter Card */}
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '40px' }}>
          <Card style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '10px 10px 0px #000' }}>
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} md={14}>
                <Search
                  placeholder="Dars mavzusi yoki o'qituvchini qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: 0, width: '100%' }}
                  size="large"
                />
              </Col>
              <Col xs={24} md={10}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                  <SortAscendingOutlined style={{ fontSize: '20px' }} />
                  <Select value={sortBy} onChange={setSortBy} style={{ minWidth: '160px', flex: 1 }} size="large">
                    <Option value="topic">Mavzu</Option>
                    <Option value="subject">Fan</Option>
                    <Option value="date">Dars sanasi</Option>
                    <Option value="teacher">O'qituvchi</Option>
                    <Option value="sentDate">Yuborilgan vaqt</Option>
                  </Select>
                </div>
              </Col>
            </Row>

            {allSubjects.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <Text style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', display: 'block', marginBottom: '8px' }}>Fanlar bo'yicha saralash:</Text>
                <Space wrap>
                  <Tag
                    style={{
                      cursor: 'pointer',
                      borderRadius: 0,
                      border: '2px solid #000',
                      backgroundColor: !subjectFilter ? '#000' : '#fff',
                      color: !subjectFilter ? '#fff' : '#000',
                      fontWeight: 700,
                      padding: '4px 12px'
                    }}
                    onClick={() => setSubjectFilter('')}
                  >
                    BARCHASI
                  </Tag>
                  {allSubjects.map(subject => (
                    <Tag
                      key={subject}
                      style={{
                        cursor: 'pointer',
                        borderRadius: 0,
                        border: '2px solid #000',
                        backgroundColor: subjectFilter === subject ? '#000' : '#fff',
                        color: subjectFilter === subject ? '#fff' : '#000',
                        fontWeight: 700,
                        padding: '4px 12px'
                      }}
                      onClick={() => setSubjectFilter(subjectFilter === subject ? '' : subject)}
                    >
                      {subject.toUpperCase()}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </Card>
        </div>

        {/* Table/Content */}
        <div className="animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
          {lessons.length === 0 ? (
            <Card style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '10px 10px 0px #000', textAlign: 'center', padding: '60px' }}>
              <BookOutlined style={{ fontSize: '64px', color: '#ccc', marginBottom: '24px' }} />
              <Title level={4} style={{ fontWeight: 800 }}>Hozircha qo'shimcha darslar yo'q</Title>
              <Paragraph style={{ color: '#666' }}>O'qituvchingiz dars yuborganida bu yerda paydo bo'ladi.</Paragraph>
            </Card>
          ) : (
            <>
              {getFilteredLessons().length > 0 && (
                <div style={{ backgroundColor: '#000', color: '#fff', padding: '12px 20px', fontWeight: 800, marginBottom: '20px', border: '4px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Sizga {lessons.length} ta dars tayinlangan</span>
                  <BookOutlined />
                </div>
              )}

              <Table
                columns={columns}
                dataSource={getSortedLessons().map(l => ({ ...l, key: l.id }))}
                pagination={{
                  pageSize: pageSize,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  onShowSizeChange: (_, size) => setPageSize(size),
                }}
                rowHoverable={false}
                style={{ border: '4px solid #000', boxShadow: '10px 10px 0px #000' }}
                scroll={{ x: 800 }}
              />
            </>
          )}
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ReceivedLessons;