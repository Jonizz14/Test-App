import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useServerTest } from '../../context/ServerTestContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;
const { Search } = Input;

// SearchTeachers Component - Student interface for finding and taking tests
// Allows students to search teachers, filter by subjects, and access available tests
const SearchTeachers = () => {
  // Authentication context and navigation
  const { currentUser } = useAuth();
  const { checkActiveSession } = useServerTest();
  const navigate = useNavigate();

  // Component state management
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [tests, setTests] = useState([]);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [activeTestSessions, setActiveTestSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherTests, setTeacherTests] = useState([]);

  // Load initial data from API on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load teachers, tests, and student attempts data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch teachers, tests, and student's attempts from API
      const [usersData, testsData, attemptsData] = await Promise.all([
        apiService.getUsers(),
        apiService.getTests(),
        apiService.getAttempts({ student: currentUser.id })
      ]);

      // Extract results from API responses
      const users = usersData.results || usersData;
      const tests = testsData.results || testsData;
      const attempts = attemptsData.results || attemptsData;

      // Filter teachers from all users
      const teachersData = users.filter(user => user.role === 'teacher');
      
      setTeachers(teachersData);
      setTests(tests);
      setStudentAttempts(attempts);
      
      // Check for active sessions for all tests
      await checkActiveSessions(tests);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Check for active sessions for all tests
  const checkActiveSessions = async (allTests) => {
    if (allTests.length === 0) return;

    const sessionsMap = {};
    
    for (const test of allTests) {
      try {
        const activeSession = await checkActiveSession(test.id);
        if (activeSession) {
          sessionsMap[test.id] = activeSession;
        }
      } catch (error) {
        // Silently handle errors for each test
        console.debug(`No active session for test ${test.id}`);
      }
    }
    
    setActiveTestSessions(sessionsMap);
  };

  // Get tests for a specific teacher that match student's grade level
  const getTeacherTests = (teacherId) => {
    return tests.filter(test => {
      // Check if test is for this teacher (temporarily removed all other filters)
      const isForTeacher = test.teacher === teacherId;
      
      return isForTeacher;
    });
  };

  // Get test completion status and attempt history for a specific test
  const getTestCompletionStatus = (testId) => {
    const attempts = studentAttempts.filter(attempt => attempt.test === testId);
    return {
      hasCompleted: attempts.length > 0,
      attempts: attempts,
      lastScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0,
      attemptCount: attempts.length
    };
  };

  // Check if teacher has any active test sessions
  const hasActiveSessionsForTeacher = (teacherId) => {
    const teacherTests = getTeacherTests(teacherId);
    return teacherTests.some(test => !!activeTestSessions[test.id]);
  };

  // Get count of active sessions for teacher
  const getActiveSessionsCountForTeacher = (teacherId) => {
    const teacherTests = getTeacherTests(teacherId);
    return teacherTests.filter(test => !!activeTestSessions[test.id]).length;
  };

  // Handle teacher selection to show their tests
  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher);
    const testsForTeacher = getTeacherTests(teacher.id);
    setTeacherTests(testsForTeacher);
  };

  // Handle back to teachers list
  const handleBackToTeachers = () => {
    setSelectedTeacher(null);
    setTeacherTests([]);
  };

  // Handle start test
  const handleStartTest = (testId) => {
    navigate(`/student/take-test?testId=${testId}`);
  };

  // Filter teachers based on search term and subject filter
  const filteredTeachers = teachers.filter(teacher => {
    const teacherName = teacher.name || '';
    const matchesName = teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !subjectFilter ||
      teacher.subjects?.some(subject =>
        subject.toLowerCase().includes(subjectFilter.toLowerCase())
      );
    return matchesName && matchesSubject;
  });

  // Collect all tests from all teachers with teacher information
  const allTests = [];
  teachers.forEach(teacher => {
    const teacherTests = getTeacherTests(teacher.id);
    console.log(`Teacher ${teacher.name} (ID: ${teacher.id}) has ${teacherTests.length} tests:`, teacherTests);
    teacherTests.forEach(test => {
      allTests.push({
        ...test,
        teacherName: teacher.name,
        teacherId: teacher.id
      });
    });
  });
  
  console.log('Total allTests collected:', allTests.length, allTests);

  // Get all unique subjects for filtering
  const allSubjects = [...new Set(teachers.flatMap(teacher => teacher.subjects || []))];

  // Loading state display
  if (loading) {
    return (
      <div style={{ padding: '32px 0', backgroundColor: '#ffffff' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Title level={2} style={{ color: '#1e293b' }}>
            O'qituvchilarni qidirish
          </Title>
          <Text style={{ color: '#64748b' }}>Yuklanmoqda...</Text>
        </div>
      </div>
    );
  }

  // Error state display
  if (error) {
    return (
      <div style={{ padding: '32px 0', backgroundColor: '#ffffff' }}>
        <Title level={2} style={{ color: '#1e293b' }}>
          O'qituvchilarni qidirish
        </Title>
        <Alert
          message={error}
          type="error"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b'
          }}
        />
      </div>
    );
  }

  const columns = [
    {
      title: 'O\'qituvchi ismi',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text style={{ fontSize: '1.25rem', marginRight: '16px' }}>👨‍🏫</Text>
          <div>
            <Text style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
              {name || 'Ismi ko\'rsatilmagan'}
            </Text>
            {record.bio && (
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                {record.bio}
              </div>
            )}
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
          {subjects?.slice(0, 3).map((subject) => (
            <Tag
              key={subject}
              style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontWeight: 500,
                borderRadius: '6px',
                fontSize: '0.75rem',
                height: '24px',
                lineHeight: '24px',
                margin: 0
              }}
            >
              {subject}
            </Tag>
          )) || (
            <Text style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              Fanlar ko'rsatilmagan
            </Text>
          )}
          {subjects && subjects.length > 3 && (
            <Tag
              style={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontWeight: 500,
                borderRadius: '6px',
                fontSize: '0.75rem',
                height: '24px',
                lineHeight: '24px',
                margin: 0
              }}
            >
              +{subjects.length - 3}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Testlar soni',
      key: 'testCount',
      render: (_, record) => {
        const teacherTests = getTeacherTests(record.id);
        return (
          <Text style={{ fontWeight: 600, color: '#059669', fontSize: '0.875rem' }}>
            {teacherTests.length}
          </Text>
        );
      },
    },
    {
      title: 'Faol seanslar',
      key: 'activeSessions',
      render: (_, record) => {
        const activeSessionsCount = getActiveSessionsCountForTeacher(record.id);
        const hasActiveSessions = activeSessionsCount > 0;
        
        return hasActiveSessions ? (
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
            {activeSessionsCount} ta
          </Tag>
        ) : (
          <Tag
            style={{
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              fontWeight: 600,
              borderRadius: '6px',
              fontSize: '0.75rem',
              margin: 0
            }}
          >
            Yo'q
          </Tag>
        );
      },
    },
    {
      title: 'Harakatlar',
      key: 'actions',
      render: (_, record) => {
        const activeSessionsCount = getActiveSessionsCountForTeacher(record.id);
        const hasActiveSessions = activeSessionsCount > 0;
        
        return (
          <Button
            type="primary"
            icon={hasActiveSessions ? <PlayCircleOutlined /> : <UserOutlined />}
            onClick={() => navigate(`/student/teacher-details/${record.id}`)}
            style={{
              fontSize: '0.75rem',
              padding: '4px 8px',
              height: 'auto',
              backgroundColor: hasActiveSessions ? '#059669' : '#2563eb',
              borderColor: hasActiveSessions ? '#059669' : '#2563eb'
            }}
          >
            {hasActiveSessions ? 'Davom ettirish' : 'Ko\'rish'}
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '32px 0', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={2} style={{ color: '#1e293b', marginBottom: '8px' }}>
          O'qituvchilarni qidirish
        </Title>
        <Text style={{ fontSize: '1.125rem', color: '#64748b', fontWeight: 400 }}>
          O'qituvchilarni toping va ularning testlarini ko'ring
        </Text>
      </div>

      {/* Search and filter section */}
      <div style={{ marginBottom: '32px' }}>
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          {/* Teacher name search */}
          <Col xs={24} md={12}>
            <div>
              <Text style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem', display: 'block', marginBottom: '8px' }}>
                O'qituvchi ismi bo'yicha qidirish
              </Text>
              <Search
                placeholder="O'qituvchi nomini kiriting..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%' }}
                prefix={<SearchOutlined style={{ color: '#64748b' }} />}
              />
            </div>
          </Col>

          {/* Subject filter */}
          <Col xs={24} md={12}>
            <div>
              <Text style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem', display: 'block', marginBottom: '8px' }}>
                Fan bo'yicha filtr
              </Text>
              <Input
                placeholder="masalan: Matematika, Fizika"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              />
            </div>
          </Col>
        </Row>

        {/* Popular subjects quick filters */}
        <div>
          <Text style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem', display: 'block', marginBottom: '16px' }}>
            Mashhur fanlar:
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {allSubjects.slice(0, 8).map((subject) => (
              <Tag
                key={subject}
                style={{
                  cursor: 'pointer',
                  backgroundColor: subjectFilter === subject ? '#2563eb' : 'transparent',
                  color: subjectFilter === subject ? '#ffffff' : '#374151',
                  borderColor: subjectFilter === subject ? '#2563eb' : '#e2e8f0',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  borderRadius: '6px'
                }}
                onClick={() => setSubjectFilter(subjectFilter === subject ? '' : subject)}
              >
                {subject}
              </Tag>
            ))}
          </div>
        </div>
      </div>

      {/* Teachers section */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={4} style={{ color: '#1e293b', marginBottom: '24px' }}>
          📚 {filteredTeachers.length} ta o'qituvchi topildi
        </Title>

        <Card
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        >
          <Table
            columns={columns}
            dataSource={filteredTeachers.map(teacher => ({ ...teacher, key: teacher.id }))}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} ta`,
            }}
            scroll={{ x: 800 }}
          />
        </Card>
      </div>

      {/* No results message */}
      {filteredTeachers.length === 0 && allTests.length === 0 && (
        <Card
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            padding: '48px'
          }}
        >
          <Title level={4} style={{ color: '#64748b', fontWeight: 600, marginBottom: '16px' }}>
            Sizning kriteriyalaringizga mos o'qituvchi topilmadi
          </Title>
          <Text style={{ color: '#94a3b8' }}>
            Qidiruv so'zlarini yoki fan filtrlarini o'zgartirib ko'ring
          </Text>
        </Card>
      )}
    </div>
  );
};

export default SearchTeachers;