import React, { useState, useEffect } from 'react';
import 'animate.css';
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
  Select,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  PlayCircleOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useServerTest } from '../../context/ServerTestContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

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
  const [sortBy, setSortBy] = useState('name');
  const [pageSize, setPageSize] = useState(10);

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

  // Sort teachers
  const getSortedTeachers = () => {
    const filteredTeachers = getFilteredTeachers();
    
    if (sortBy === 'subjects') {
      return filteredTeachers.sort((a, b) => {
        const subjectA = a.subjects?.[0] || '';
        const subjectB = b.subjects?.[0] || '';
        return subjectA.localeCompare(subjectB);
      });
    } else if (sortBy === 'test_count') {
      return filteredTeachers.sort((a, b) => {
        const testCountA = getTeacherTests(a.id).length;
        const testCountB = getTeacherTests(b.id).length;
        return testCountB - testCountA; // Highest first
      });
    } else if (sortBy === 'active_sessions') {
      return filteredTeachers.sort((a, b) => {
        const sessionsA = getActiveSessionsCountForTeacher(a.id);
        const sessionsB = getActiveSessionsCountForTeacher(b.id);
        return sessionsB - sessionsA; // Highest first
      });
    } else {
      // Default: sort by name
      return filteredTeachers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
  };

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
    <div className="animate__animated animate__fadeIn" style={{ padding: '32px 0', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div className="animate__animated animate__slideInDown" style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        marginTop: '-16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={2} style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '16px'
        }}>
          O'qituvchilarni qidirish
        </Title>
        <Text style={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          O'qituvchilarni qidirish va mavjud testlarni ko'rish
        </Text>
      </div>
      {/* Search section */}
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '200ms', marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <Title level={4} style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: 0
          }}>
            📚 O'qituvchilarni qidirish
          </Title>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SortAscendingOutlined style={{ color: '#64748b' }} />
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{
                minWidth: 120,
              }}
            >
              <Option value="name">Nomi bo'yicha</Option>
              <Option value="subjects">Fan bo'yicha</Option>
              <Option value="test_count">Testlar soni</Option>
              <Option value="active_sessions">Faol seanslar</Option>
            </Select>
          </div>
        </div>

        <Search
          placeholder="O'qituvchi nomi yoki fan bo'yicha qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined style={{ color: '#64748b' }} />}
          style={{
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#2563eb';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
          }}
        />
      </div>

      {/* Teachers section */}
      <div className="animate__animated animate__fadeInUpBig" style={{ animationDelay: '300ms', marginBottom: '32px' }}>
        <Table
          columns={columns}
          dataSource={getSortedTeachers().map(teacher => ({ ...teacher, key: teacher.id }))}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami ${total} ta o'qituvchi`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onShowSizeChange: (current, size) => setPageSize(size),
          }}
          locale={{
            emptyText: 'O\'qituvchilar mavjud emas'
          }}
          onRow={(record, index) => ({
            className: 'animate__animated animate__fadeInLeft',
            style: { 
              animationDelay: `${index * 100}ms`,
              transition: 'all 0.3s ease'
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }
          })}
          scroll={{ x: 800 }}
        />
      </div>

      {/* No results message */}
      {getSortedTeachers().length === 0 && allTests.length === 0 && (
        <div className="animate__animated animate__zoomIn" style={{ animationDelay: '800ms' }}>
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
      </div>
      )}
    </div>
  );
};

export default SearchTeachers;