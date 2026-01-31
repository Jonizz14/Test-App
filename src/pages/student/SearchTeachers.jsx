import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Typography,
  Input,
  Button,
  Row,
  Col,
  Tag,
  Space,
  Alert,
  Spin,
  Select,
  ConfigProvider,
  Divider,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  UserOutlined,
  PlayCircleOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useServerTest } from '../../context/ServerTestContext';
import apiService from '../../data/apiService';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const SearchTeachers = () => {
  const { currentUser } = useAuth();
  const { checkActiveSession } = useServerTest();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [tests, setTests] = useState([]);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [activeTestSessions, setActiveTestSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, testsData, attemptsData] = await Promise.all([
        apiService.getUsers(),
        apiService.getTests(),
        apiService.getAttempts({ student: currentUser.id })
      ]);

      const users = usersData.results || usersData;
      const tests = testsData.results || testsData;
      const attempts = attemptsData.results || attemptsData;

      const teachersData = users.filter(user => user.role === 'teacher');

      setTeachers(teachersData);
      setTests(tests);
      setStudentAttempts(attempts);

      await checkActiveSessions(tests);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSessions = async (allTests) => {
    if (allTests.length === 0) return;
    const sessionsMap = {};
    for (const test of allTests) {
      try {
        const activeSession = await checkActiveSession(test.id);
        if (activeSession) sessionsMap[test.id] = activeSession;
      } catch (error) {
        console.debug(`No active session for test ${test.id}`);
      }
    }
    setActiveTestSessions(sessionsMap);
  };

  const getTeacherTests = (teacherId) => {
    return tests.filter(test => test.teacher === teacherId);
  };

  const getActiveSessionsCountForTeacher = (teacherId) => {
    const teacherTests = getTeacherTests(teacherId);
    return teacherTests.filter(test => !!activeTestSessions[test.id]).length;
  };

  const getFilteredTeachers = () => {
    return teachers.filter(teacher => {
      const teacherName = teacher.name || '';
      const matchesName = teacherName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = !subjectFilter ||
        teacher.subjects?.some(subject =>
          subject.toLowerCase().includes(subjectFilter.toLowerCase())
        );
      return matchesName && matchesSubject;
    });
  };

  const getSortedTeachers = () => {
    const filteredTeachers = getFilteredTeachers();
    if (sortBy === 'subjects') {
      return filteredTeachers.sort((a, b) => (a.subjects?.[0] || '').localeCompare(b.subjects?.[0] || ''));
    } else if (sortBy === 'test_count') {
      return filteredTeachers.sort((a, b) => getTeacherTests(b.id).length - getTeacherTests(a.id).length);
    } else if (sortBy === 'active_sessions') {
      return filteredTeachers.sort((a, b) => getActiveSessionsCountForTeacher(b.id) - getActiveSessionsCountForTeacher(a.id));
    } else {
      return filteredTeachers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
  };

  const columns = [
    {
      title: 'O\'qituvchi',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#000', color: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
            {name ? name.charAt(0).toUpperCase() : 'T'}
          </div>
          <div>
            <Text style={{ fontWeight: 700, fontSize: '0.9rem' }}>{name || 'Ismi ko\'rsatilmagan'}</Text>
            {record.bio && <div style={{ fontSize: '0.75rem', color: '#666' }}>{record.bio}</div>}
          </div>
        </div>
      ),
    },
    {
      title: 'Fanlar',
      dataIndex: 'subjects',
      key: 'subjects',
      render: (subjects) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {subjects?.map((subject) => (
            <Tag key={subject} style={{ borderRadius: 0, border: '2px solid #000', backgroundColor: '#fff', fontWeight: 700, color: '#000', textTransform: 'uppercase', fontSize: '10px' }}>
              {subject}
            </Tag>
          )) || <Text type="secondary" style={{ fontSize: '12px' }}>Belgilanmagan</Text>}
        </div>
      ),
    },
    {
      title: 'Testlar',
      key: 'testCount',
      width: 100,
      render: (_, record) => (
        <Text style={{ fontWeight: 900, fontSize: '1rem' }}>{getTeacherTests(record.id).length}</Text>
      ),
    },
    {
      title: 'Harakat',
      key: 'actions',
      width: 150,
      render: (_, record) => {
        const hasActive = getActiveSessionsCountForTeacher(record.id) > 0;
        return (
          <Button
            type="primary"
            icon={hasActive ? <PlayCircleOutlined /> : <UserOutlined />}
            onClick={() => navigate(`/student/teacher-details/${record.id}`)}
            style={{
              borderRadius: 0,
              border: '2px solid #000',
              boxShadow: '4px 4px 0px #000',
              backgroundColor: hasActive ? '#000' : '#fff',
              color: hasActive ? '#fff' : '#000',
              fontWeight: 900,
              textTransform: 'uppercase',
              fontSize: '12px',
              height: '36px'
            }}
          >
            {hasActive ? 'Davom ettirish' : 'Ko\'rish'}
          </Button>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, fontWeight: 700, textTransform: 'uppercase' }}>O'qituvchilar yuklanmoqda...</Text>
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
            Hamjamiyat
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
            O'qituvchilarni qidirish
          </Title>
          <div style={{
            width: '80px',
            height: '10px',
            backgroundColor: '#000',
            margin: '24px 0'
          }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Bilim olish uchun tajribali ustozlarni toping va ularning mavjud testlaridan foydalaning.
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

        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '40px' }}>
          <Card style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '10px 10px 0px #000' }}>
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} md={18}>
                <Search
                  placeholder="Ism yoki fan bo'yicha qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: 0, width: '100%' }}
                  size="large"
                />
              </Col>
              <Col xs={24} md={6}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                  <SortAscendingOutlined style={{ fontSize: '20px' }} />
                  <Select value={sortBy} onChange={setSortBy} style={{ width: 180 }} size="large">
                    <Option value="name">Nomi bo'yicha</Option>
                    <Option value="subjects">Fan bo'yicha</Option>
                    <Option value="test_count">Testlar soni</Option>
                    <Option value="active_sessions">Faol seanslar</Option>
                  </Select>
                </div>
              </Col>
            </Row>
          </Card>
        </div>

        <div className="animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
          <Table
            columns={columns}
            dataSource={getSortedTeachers().map(t => ({ ...t, key: t.id }))}
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
        </div>
      </div>
    </ConfigProvider>
  );
};

export default SearchTeachers;