import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Button,
  Row,
  Col,
  Tag,
  Modal,
  Alert,
  Table,
  Select,
  Space,
  Avatar,
  Tooltip,
  Divider,
  Spin,
  Input,
} from 'antd';
import {
  PlusOutlined as AddIcon,
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  BarChartOutlined as AssessmentIcon,
  ReloadOutlined as RefreshIcon,
  EyeOutlined as ViewIcon,
  // TeamOutlined as PeopleIcon,
  // BookOutlined as SchoolIcon,
  // UserOutlined as PersonIcon,
  // BookOutlined as BookmarkIcon,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import SendLessonModal from '../../components/SendLessonModal';
import TodoList from '../../components/TodoList';

const MyTests = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [testAttempts, setTestAttempts] = useState({});
  const [students, setStudents] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [studentDetailDialogOpen, setStudentDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [_selectedAttempt, _setSelectedAttempt] = useState(null);
  const [testDetailsModalOpen, setTestDetailsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGrade, setFilterGrade] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [todoTasks, setTodoTasks] = useState([]);

  useEffect(() => {
    loadData();
    // Load saved todo tasks from localStorage
    const savedTasks = localStorage.getItem('teacher-todo-tasks');
    if (savedTasks) {
      setTodoTasks(JSON.parse(savedTasks));
    }
  }, [loadData]);

  const handleOpenTestDetails = (test) => {
    setSelectedTest(test);
    setTestDetailsModalOpen(true);
  };

  const handleCloseTestDetails = () => {
    setTestDetailsModalOpen(false);
    setSelectedTest(null);
  };

  const loadData = React.useCallback(async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) setRefreshing(true);
      else setLoading(true);

      // Load tests from API
      const response = await apiService.getTests({ teacher: currentUser.id });
      const teacherTests = response.results || response;
      const teacherTestsFiltered = teacherTests.filter(test =>
        test.teacher === currentUser.id
      ).map(test => {
        let parsedGrades = [];
        if (Array.isArray(test.target_grades)) {
          parsedGrades = test.target_grades;
        } else if (typeof test.target_grades === 'string') {
          try {
            parsedGrades = JSON.parse(test.target_grades);
            if (!Array.isArray(parsedGrades)) {
              parsedGrades = [parsedGrades];
            }
          } catch {
            // If not JSON, treat as comma separated
            parsedGrades = test.target_grades.split(',').map(g => g.trim()).filter(g => g);
          }
        }
        return {
          ...test,
          target_grades: parsedGrades
        };
      });
      setTests(teacherTestsFiltered);

      // Load all users to get student information
      const usersResponse = await apiService.getUsers();
      const allUsers = usersResponse.results || usersResponse;
      const studentUsers = allUsers.filter(user => user.role === 'student');
      setStudents(studentUsers);

      // Load all attempts to calculate statistics
      const attemptsResponse = await apiService.getAttempts();
      const allAttempts = attemptsResponse.results || attemptsResponse;

      // Group attempts by test for quick lookup
      const attemptsByTest = {};
      allAttempts.forEach(attempt => {
        if (!attemptsByTest[attempt.test]) {
          attemptsByTest[attempt.test] = [];
        }
        attemptsByTest[attempt.test].push(attempt);
      });
      setTestAttempts(attemptsByTest);

      console.log('Loaded data:', {
        tests: teacherTestsFiltered.length,
        students: studentUsers.length,
        attempts: allAttempts.length
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      setSnackbar({
        open: true,
        message: 'Ma\'lumotlarni yuklashda xatolik yuz berdi',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser.id]);

  const getTestStats = (testId) => {
    const attempts = testAttempts[testId] || [];
    const uniqueStudents = new Set(attempts.map(a => a.student)).size;
    const averageScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
      : 0;
    const maxScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0;

    return {
      totalAttempts: attempts.length,
      uniqueStudents,
      averageScore,
      maxScore,
      completionRate: Math.round((uniqueStudents / students.length) * 100) || 0
    };
  };

  const getStudentDetails = (testId) => {
    const attempts = testAttempts[testId] || [];
    return attempts.map(attempt => {
      const student = students.find(s => s.id === attempt.student);
      return {
        ...attempt,
        studentName: student?.name || 'Noma\'lum o\'quvchi',
        studentId: student?.display_id || student?.username || 'N/A'
      };
    }).sort((a, b) => b.score - a.score); // Sort by score descending
  };

  const handleDeleteTest = (test) => {
    setSelectedTest(test);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTest) return;

    try {
      setLoading(true);

      await apiService.updateTest(selectedTest.id, { is_active: false });
      await apiService.deleteTest(selectedTest.id);

      setTests(prevTests => prevTests.filter(test => test.id !== selectedTest.id));

      setSnackbar({
        open: true,
        message: `"${selectedTest.title}" testi muvaffaqiyatli o'chirildi`,
        severity: 'success'
      });

      setDeleteDialogOpen(false);
      setSelectedTest(null);

      setTimeout(() => loadData(), 500);

    } catch (error) {
      console.error('Failed to delete test:', error);
      setSnackbar({
        open: true,
        message: 'Testni o\'chirishda xatolik yuz berdi',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTestStatus = async (testId) => {
    try {
      setLoading(true);

      const test = tests.find(t => t.id === testId);
      if (test) {
        const newStatus = !test.is_active;

        await apiService.updateTest(testId, { is_active: newStatus });

        setTests(prevTests =>
          prevTests.map(t =>
            t.id === testId ? { ...t, is_active: newStatus } : t
          )
        );

        setSnackbar({
          open: true,
          message: `Test ${newStatus ? 'faollashtirildi' : 'nofaollashtirildi'}`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Failed to toggle test status:', error);
      setSnackbar({
        open: true,
        message: 'Test holatini o\'zgartirishda xatolik yuz berdi',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentDetails = (test) => {
    setSelectedTest(test);
    setStudentDetailDialogOpen(true);
  };

  /* Unused functions prefixed with underscore
  const _getStudentDetails = (testId) => { ... }
  */
  // Prefixed unused method handlers
  const _handleOpenLessonModal = (student, attempt, test) => {
    setSelectedStudent(student);
    _setSelectedAttempt({
      ...attempt,
      test: test
    });
    setSelectedTest(test);
    setLessonModalOpen(true);
  };

  const _handleCloseLessonModal = () => {
    setLessonModalOpen(false);
    setSelectedStudent(null);
    _setSelectedAttempt(null);
  };

  const _getSubjectColor = (subject) => {
    const colors = {
      'Matematika': 'primary',
      'Fizika': 'secondary',
      'Kimyo': 'success',
      'Biologiya': 'info',
      'Tarix': 'warning',
      'Geografiya': 'error',
      'O\'zbek tili': 'primary',
      'Ingliz tili': 'secondary',
      'Adabiyot': 'success',
      'Informatika': 'info',
    };
    return colors[subject] || 'default';
  };

  const _getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const handleTodoTasksChange = (tasks) => {
    setTodoTasks(tasks);
    localStorage.setItem('teacher-todo-tasks', JSON.stringify(tasks));
  };

  // Generate test-related todo suggestions
  const generateTestSuggestions = () => {
    const suggestions = [];

    tests.forEach(test => {
      const stats = getTestStats(test.id);
      if (stats.averageScore < 60) {
        suggestions.push({
          id: `suggestion-${test.id}-1`,
          text: `"${test.title}" testi uchun o'quvchilarga qo'shimcha dars tashkil qiling`,
          completed: false,
          priority: 'high',
          createdAt: new Date().toISOString(),
          type: 'suggestion'
        });
      }
      if (stats.completionRate < 50) {
        suggestions.push({
          id: `suggestion-${test.id}-2`,
          text: `"${test.title}" testini ko'proq o'quvchilarga tarqating`,
          completed: false,
          priority: 'medium',
          createdAt: new Date().toISOString(),
          type: 'suggestion'
        });
      }
      if (!test.is_active) {
        suggestions.push({
          id: `suggestion-${test.id}-3`,
          text: `"${test.title}" testini qayta faollashtiring yoki o'chiring`,
          completed: false,
          priority: 'low',
          createdAt: new Date().toISOString(),
          type: 'suggestion'
        });
      }
    });

    return suggestions;
  };

  const _addTestSuggestions = () => {
    const suggestions = generateTestSuggestions();
    const existingIds = todoTasks.map(task => task.id);
    const newSuggestions = suggestions.filter(suggestion => !existingIds.includes(suggestion.id));

    if (newSuggestions.length > 0) {
      const updatedTasks = [...todoTasks, ...newSuggestions];
      setTodoTasks(updatedTasks);
      localStorage.setItem('teacher-todo-tasks', JSON.stringify(updatedTasks));
    }
  };

  // Compute filtered and sorted tests
  const uniqueSubjects = [...new Set(tests.map(test => test.subject))];
  const filteredTests = tests.filter(test => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = test.title?.toLowerCase().includes(searchLower);
      const descriptionMatch = test.description?.toLowerCase().includes(searchLower);
      const subjectMatch = test.subject?.toLowerCase().includes(searchLower);
      if (!titleMatch && !descriptionMatch && !subjectMatch) return false;
    }

    if (filterSubject && test.subject !== filterSubject) return false;
    if (filterStatus === 'active' && !test.is_active) return false;
    if (filterStatus === 'inactive' && test.is_active) return false;

    // Class filter - check if test is for the selected grade
    if (filterGrade) {
      // If test has no target grades, it should be included (available to all grades)
      if (!test.target_grades || test.target_grades.length === 0) return true;

      // Check if any of the test's target grades match the selected grade
      const hasMatchingGrade = test.target_grades.some(grade => {
        // Handle different grade formats: "9", "9-A", "9-01", etc.
        const gradeStr = String(grade).trim();
        const filterNum = filterGrade;

        // Debug logging (remove in production)
        console.log(`Checking test "${test.title}": grade "${gradeStr}" against filter "${filterNum}"`);

        return gradeStr === filterNum ||
          gradeStr.startsWith(filterNum + '-') ||
          gradeStr.startsWith(filterNum + ' ') ||
          gradeStr.split('-')[0] === filterNum ||
          gradeStr.split(' ')[0] === filterNum;
      });

      console.log(`Test "${test.title}" with grades ${JSON.stringify(test.target_grades)}: ${hasMatchingGrade ? 'INCLUDED' : 'FILTERED OUT'}`);

      if (!hasMatchingGrade) return false;
    }

    return true;
  });
  const sortedTests = [...filteredTests].sort((a, b) => {
    switch (sortBy) {
      case 'created_at':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'subject':
        return a.subject.localeCompare(b.subject);
      case 'class':
        // Sort by the minimum target grade number ascending, then by title
        const aMinGrade = a.target_grades.length > 0 ? Math.min(...a.target_grades.map(g => parseInt(g.split('-')[0]))) : 0;
        const bMinGrade = b.target_grades.length > 0 ? Math.min(...b.target_grades.map(g => parseInt(g.split('-')[0]))) : 0;
        if (aMinGrade !== bMinGrade) {
          return aMinGrade - bMinGrade;
        }
        return a.title.localeCompare(b.title);
      case 'average_score':
        return getTestStats(b.id).averageScore - getTestStats(a.id).averageScore;
      case 'attempts':
        return getTestStats(b.id).totalAttempts - getTestStats(a.id).totalAttempts;
      default:
        return 0;
    }
  });

  return (
    <div style={{
      width: '100%',
      padding: '32px 0',
      backgroundColor: '#ffffff'
    }}>
      <div style={{
        marginBottom: '48px',
        paddingBottom: '32px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <Typography.Title
            level={1}
            style={{
              fontSize: '40px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '16px',
              margin: 0
            }}
          >
            Mening testlarim ({sortedTests.length})
          </Typography.Title>
          <Typography.Text
            style={{
              fontSize: '18px',
              color: '#64748b',
              fontWeight: 400
            }}
          >
            Barcha testlaringizni boshqaring, o'quvchilarning natijalarini kuzating
          </Typography.Text>
        </div>
        <Space>
          <Tooltip title="Yangilash">
            <Button
              type="text"
              icon={<RefreshIcon />}
              onClick={() => loadData(true)}
              disabled={refreshing}
              style={{
                color: '#64748b'
              }}
            />
          </Tooltip>
          <Button
            type="primary"
            icon={<AddIcon />}
            onClick={() => navigate('/teacher/create-test')}
            style={{
              backgroundColor: '#2563eb',
              borderColor: '#2563eb',
              fontWeight: 600,
              minWidth: '200px'
            }}
          >
            Yangi test yaratish
          </Button>
        </Space>
      </div>

      {/* Filters and Sort */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="Test nomini, tavsifini yoki fanini qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ minWidth: '250px', flex: 1 }}
          allowClear
        />
        <Select
          value={sortBy}
          onChange={(value) => setSortBy(value)}
          placeholder="Sort qilish"
          style={{ minWidth: '140px' }}
        >
          <Select.Option value="created_at">Yangi avval</Select.Option>
          <Select.Option value="title">Sarlavha</Select.Option>
          <Select.Option value="subject">Fan</Select.Option>
          <Select.Option value="class">Sinf</Select.Option>
          <Select.Option value="average_score">O'rtacha ball</Select.Option>
          <Select.Option value="attempts">Urinishlar</Select.Option>
        </Select>

        <Select
          value={filterSubject}
          onChange={(value) => setFilterSubject(value)}
          placeholder="Fan"
          style={{ minWidth: '120px' }}
        >
          <Select.Option value="">Barcha</Select.Option>
          {uniqueSubjects.map(sub => <Select.Option key={sub} value={sub}>{sub}</Select.Option>)}
        </Select>

        <Select
          value={filterStatus}
          onChange={(value) => setFilterStatus(value)}
          placeholder="Status"
          style={{ minWidth: '120px' }}
        >
          <Select.Option value="all">Barcha</Select.Option>
          <Select.Option value="active">Faol</Select.Option>
          <Select.Option value="inactive">Nofaol</Select.Option>
        </Select>

        <Select
          value={filterGrade}
          onChange={(value) => setFilterGrade(value)}
          placeholder="Sinf"
          style={{ minWidth: '120px' }}
        >
          <Select.Option value="">Barcha</Select.Option>
          {Array.from({ length: 7 }, (_, i) => i + 5).map(g => (
            <Select.Option key={g} value={g}>{g}-sinf</Select.Option>
          ))}
        </Select>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <Typography.Text style={{ marginBottom: '16px', color: '#64748b' }}>
          {filteredTests.length} ta test topildi
        </Typography.Text>
      )}

      {loading && sortedTests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Spin size="large" />
          <Typography.Text style={{ display: 'block', marginTop: '16px', color: '#64748b' }}>
            Testlar yuklanmoqda...
          </Typography.Text>
        </div>
      ) : sortedTests.length === 0 ? (
        <Card style={{ textAlign: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '32px' }}>
            <AssessmentIcon style={{ fontSize: '64px', color: '#94a3b8', marginBottom: '16px' }} />
            <Typography.Title level={4} style={{ marginBottom: '8px' }}>
              {tests.length === 0 ? 'Siz hali test yaratmagansiz' : 'Testlar topilmadi'}
            </Typography.Title>
            <Typography.Text style={{ color: '#64748b' }}>
              {tests.length === 0 ? '"Yangi test yaratish" tugmasini bosib boshlang' : 'Testlar mavjud emas'}
            </Typography.Text>
          </div>
        </Card>
      ) : (
        <div>
          <Alert
            message={`Siz ${sortedTests.length} ta test yaratgansiz`}
            type="info"
            style={{ marginBottom: '24px' }}
          />
          <Table
            dataSource={sortedTests}
            rowKey="id"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
            }}
            columns={[
              {
                title: 'Sarlavha',
                dataIndex: 'title',
                key: 'title',
                render: (text, record) => (
                  <div>
                    <Typography.Text strong style={{ color: '#1e293b' }}>
                      {text}
                    </Typography.Text>
                    {record.description && (
                      <div style={{ marginTop: '4px' }}>
                        <Typography.Text style={{ fontSize: '12px', color: '#64748b' }}>
                          {record.description.length > 50 ? record.description.substring(0, 50) + '...' : record.description}
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: 'Fan',
                dataIndex: 'subject',
                key: 'subject',
                render: (subject) => (
                  <Tag
                    style={{
                      backgroundColor: subject === 'Ingliz tili' ? '#3b82f6' : undefined,
                      color: subject === 'Ingliz tili' ? '#ffffff' : undefined,
                      borderColor: subject === 'Ingliz tili' ? '#3b82f6' : undefined,
                    }}
                  >
                    {subject}
                  </Tag>
                ),
              },
              {
                title: 'Sinflar',
                dataIndex: 'target_grades',
                key: 'target_grades',
                render: (grades) => {
                  if (!grades || grades.length === 0) {
                    return <Tag color="green">Barcha</Tag>;
                  }
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {grades.slice(0, 3).map((grade) => (
                        <Tag key={grade} color="blue" size="small">
                          {grade}
                        </Tag>
                      ))}
                      {grades.length > 3 && (
                        <Tag size="small" style={{ backgroundColor: '#e2e8f0' }}>
                          +{grades.length - 3}
                        </Tag>
                      )}
                    </div>
                  );
                },
              },
              {
                title: 'Savollar',
                dataIndex: 'total_questions',
                key: 'total_questions',
                render: (value) => (
                  <Typography.Text strong style={{ color: '#2563eb' }}>
                    {value || 0}
                  </Typography.Text>
                ),
              },
              {
                title: 'Vaqt',
                dataIndex: 'time_limit',
                key: 'time_limit',
                render: (value) => (
                  <Typography.Text style={{ color: '#1e293b' }}>
                    {value} daq
                  </Typography.Text>
                ),
              },
              {
                title: 'O\'quvchilar',
                key: 'students',
                render: (_, record) => {
                  const stats = getTestStats(record.id);
                  return (
                    <Typography.Text strong style={{ color: '#059669' }}>
                      {stats.uniqueStudents}
                    </Typography.Text>
                  );
                },
              },
              {
                title: 'O\'rtacha ball',
                key: 'average_score',
                render: (_, record) => {
                  const stats = getTestStats(record.id);
                  return (
                    <Typography.Text strong style={{ color: stats.averageScore >= 60 ? '#059669' : '#dc2626' }}>
                      {stats.averageScore}%
                    </Typography.Text>
                  );
                },
              },
              {
                title: 'Status',
                dataIndex: 'is_active',
                key: 'status',
                render: (isActive) => (
                  <Tag
                    color={isActive ? 'green' : 'default'}
                    style={{
                      backgroundColor: isActive ? '#ecfdf5' : '#f1f5f9',
                      color: isActive ? '#059669' : '#64748b',
                      fontWeight: 600,
                      borderRadius: '6px',
                    }}
                  >
                    {isActive ? 'Faol' : 'Nofaol'}
                  </Tag>
                ),
              },
              {
                title: 'Harakatlar',
                key: 'actions',
                render: (_, record) => (
                  <Space>
                    <Tooltip title="Batafsil ko'rish">
                      <Button
                        type="text"
                        icon={<ViewIcon />}
                        onClick={() => navigate(`/teacher/test-details/${record.id}`)}
                        style={{ color: '#2563eb' }}
                      />
                    </Tooltip>
                    <Tooltip title="Tahrirlash">
                      <Button
                        type="text"
                        icon={<EditIcon />}
                        onClick={() => navigate(`/teacher/edit-test/${record.id}`)}
                        style={{ color: '#f59e0b' }}
                      />
                    </Tooltip>
                    <Tooltip title={record.is_active ? 'Nofaollashtirish' : 'Faollashtirish'}>
                      <Button
                        type="text"
                        icon={<AssessmentIcon />}
                        onClick={() => toggleTestStatus(record.id)}
                        disabled={loading}
                        style={{ color: record.is_active ? '#64748b' : '#059669' }}
                      />
                    </Tooltip>
                    <Tooltip title="O'chirish">
                      <Button
                        type="text"
                        icon={<DeleteIcon />}
                        onClick={() => handleDeleteTest(record)}
                        style={{ color: '#dc2626' }}
                      />
                    </Tooltip>
                  </Space>
                ),
              },
            ]}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Jami ${total} ta test`,
            }}
          />
        </div>
      )}

      {/* Student Details Modal */}
      <Modal
        open={studentDetailDialogOpen}
        onCancel={() => setStudentDetailDialogOpen(false)}
        title={`${selectedTest?.title} - O'quvchi natijalari`}
        width={800}
        footer={null}
      >
        <List>
          {selectedTest && getStudentDetails(selectedTest.id).map((attempt, index) => {
            const student = students.find(s => s.id === attempt.student);
            return (
              <List.Item key={`${attempt.student}-${attempt.id}`}>
                <List.Item.Meta
                  avatar={
                    <Badge count={index + 1}>
                      <Avatar>{attempt.studentName.charAt(0).toUpperCase()}</Avatar>
                    </Badge>
                  }
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography.Text>{attempt.studentName}</Typography.Text>
                      <Tag color={attempt.score >= 80 ? 'green' : attempt.score >= 60 ? 'orange' : 'red'}>
                        {attempt.score}%
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Typography.Text type="secondary">ID: {attempt.studentId}</Typography.Text>
                      <br />
                      <Typography.Text type="secondary">
                        Topshirilgan: {new Date(attempt.submitted_at).toLocaleString('uz-UZ')}
                      </Typography.Text>
                    </div>
                  }
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Button
                    size="small"
                    onClick={() => navigate(`/teacher/test-details/${selectedTest.id}`)}
                  >
                    Batafsil
                  </Button>
                  {attempt.score < 60 && student && (
                    <Button
                      size="small"
                      type="primary"
                      danger
                      onClick={() => handleOpenLessonModal(student, attempt, selectedTest)}
                    >
                      Dars chaqirish
                    </Button>
                  )}
                </div>
              </List.Item>
            );
          })}
        </List>
        {selectedTest && getStudentDetails(selectedTest.id).length === 0 && (
          <Typography.Text type="secondary" style={{ textAlign: 'center', display: 'block', padding: '24px' }}>
            Hali hech kim bu testni topshirmagan
          </Typography.Text>
        )}
      </Modal>

      {/* Test Details Modal */}
      <Modal
        open={testDetailsModalOpen}
        onCancel={handleCloseTestDetails}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Text>{selectedTest?.title} - To'liq ma'lumotlar</Typography.Text>
            <Tag color={selectedTest?.is_active ? 'green' : 'default'}>
              {selectedTest?.is_active ? 'Faol' : 'Nofaol'}
            </Tag>
          </div>
        }
        width={1000}
        footer={null}
      >
        {selectedTest && (
          <Box>
            {/* Basic Test Information */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Test ma'lumotlari
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedTest.description || 'Tavsif mavjud emas'}
              </Typography>

              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <Chip
                  label={selectedTest.subject}
                  color={getSubjectColor(selectedTest.subject)}
                  variant="outlined"
                />
                <Chip
                  label={`${selectedTest.total_questions} savol`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`${selectedTest.time_limit} daqiqa`}
                  color="secondary"
                  variant="outlined"
                />
              </Box>

              {/* Target Grades */}
              {selectedTest.target_grades && selectedTest.target_grades.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Maqsadli sinflar:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {selectedTest.target_grades.map((grade) => (
                      <Chip
                        key={grade}
                        label={`${grade.replace(/^\[|"|\]$/g, '')}-sinf`}
                        size="small"
                        color="info"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* All Grades Available */}
              {(!selectedTest.target_grades || selectedTest.target_grades.length === 0) && (
                <Box mb={2}>
                  <Chip
                    label="Barcha sinflar uchun"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
              )}

              <Typography variant="body2" color="textSecondary" paragraph>
                Yaratilgan: {new Date(selectedTest.created_at).toLocaleString('uz-UZ')}
              </Typography>

              {selectedTest.updated_at && selectedTest.updated_at !== selectedTest.created_at && (
                <Typography variant="body2" color="textSecondary">
                  Yangilangan: {new Date(selectedTest.updated_at).toLocaleString('uz-UZ')}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Statistics */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                O'quvchi statistikasi
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, textAlign: 'center' }}>
                    <PeopleIcon fontSize="large" color="primary" />
                    <Typography variant="h4" color="primary">
                      {getTestStats(selectedTest.id).uniqueStudents}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      O'quvchi
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, textAlign: 'center' }}>
                    <AssessmentIcon fontSize="large" color="success" />
                    <Typography variant="h4" color="success">
                      {getTestStats(selectedTest.id).averageScore}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      O'rtacha ball
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, textAlign: 'center' }}>
                    <BookmarkIcon fontSize="large" color="warning" />
                    <Typography variant="h4" color="warning">
                      {getTestStats(selectedTest.id).completionRate}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Tugallangan
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, textAlign: 'center' }}>
                    <SchoolIcon fontSize="large" color="info" />
                    <Typography variant="h4" color="info">
                      {getTestStats(selectedTest.id).totalAttempts}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Urinish
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Action Buttons */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Amallar
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<ViewIcon />}
                  onClick={() => navigate(`/teacher/test-details/${selectedTest.id}`)}
                >
                  To'liq ko'rish
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/teacher/edit-test/${selectedTest.id}`)}
                >
                  Tahrirlash
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PeopleIcon />}
                  onClick={() => {
                    handleStudentDetails(selectedTest);
                    handleCloseTestDetails();
                  }}
                  color="primary"
                >
                  O'quvchilar natijalari
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => toggleTestStatus(selectedTest.id)}
                  color={selectedTest.is_active ? 'warning' : 'success'}
                  disabled={loading}
                >
                  {selectedTest.is_active ? 'Nofaollashtirish' : 'Faollashtirish'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteTest(selectedTest)}
                >
                  O'chirish
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Modal>

      {/* Lesson Modal */}
      <SendLessonModal
        open={lessonModalOpen}
        onClose={handleCloseLessonModal}
        student={selectedStudent}
        testResult={selectedAttempt}
        teacherInfo={currentUser}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        title="Testni o'chirish"
        footer={[
          <Button key="cancel" onClick={() => setDeleteDialogOpen(false)}>
            Bekor qilish
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={loading}
            onClick={confirmDelete}
          >
            {loading ? 'O\'chirilmoqda...' : 'O\'chirish'}
          </Button>
        ]}
      >
        <Typography.Text>
          "{selectedTest?.title}" testini o'chirishni xohlaysizmi?
          Bu amalni ortga qaytarib bo'lmaydi.
        </Typography.Text>
        <Alert
          message="O'chirilgan test o'quvchilar tomonidan ko'rinmaydi va barcha ma'lumotlar o'chiriladi."
          type="warning"
          style={{ marginTop: '16px' }}
        />
      </Modal>
    </div>
  );
};

export default MyTests;
