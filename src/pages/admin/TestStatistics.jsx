import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Card,
  Button,
  Select,
  Tag,
  Typography,
  Space,
  Row,
  Col,
} from 'antd';
import {
  EyeOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

const TestStatistics = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubGrade, setSelectedSubGrade] = useState('');
  const [subGrades, setSubGrades] = useState({});
  const [scoreOrder, setScoreOrder] = useState('');
  const [attemptOrder, setAttemptOrder] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTests = async () => {
      try {
        const allTestsData = await apiService.getTests();
        const allTests = allTestsData.results || allTestsData;
        setTests(allTests);

        const uniqueTeachers = [...new Set(allTests.map(test => test.teacher_name).filter(Boolean))];
        setTeachers(uniqueTeachers);
        const uniqueSubjects = [...new Set(allTests.map(test => test.subject).filter(Boolean))];
        setSubjects(uniqueSubjects);

        const subGradesMap = {};
        allTests.forEach(test => {
          if (test.target_grades && Array.isArray(test.target_grades)) {
            test.target_grades.forEach(grade => {
              if (grade && grade.includes('-')) {
                const [main, sub] = grade.split('-');
                if (!subGradesMap[main]) subGradesMap[main] = new Set();
                subGradesMap[main].add(sub);
              }
            });
          }
        });
        const subGradesObj = {};
        Object.keys(subGradesMap).forEach(main => {
          subGradesObj[main] = Array.from(subGradesMap[main]).sort();
        });
        setSubGrades(subGradesObj);
      } catch (error) {
        console.error('Failed to load tests:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTests();
  }, []);

  // Calculate filtered and sorted tests
  const filteredTests = useMemo(() => {
    const testsArray = Array.isArray(tests) ? tests : [];
    return testsArray.filter(test => {
      // Skip filtering if no filters are selected
      if (!selectedTeacher && !selectedSubject && !selectedGrade) return true;

      // Teacher filter
      if (selectedTeacher && test.teacher_name !== selectedTeacher) return false;

      // Subject filter
      if (selectedSubject && test.subject !== selectedSubject) return false;

      // Grade filter
      if (selectedGrade) {
        const targetGrades = test.target_grades || [];
        if (selectedSubGrade) {
          if (!targetGrades.includes(`${selectedGrade}-${selectedSubGrade}`)) return false;
        } else {
          if (!targetGrades.some(grade => grade === selectedGrade || grade.startsWith(`${selectedGrade}-`))) return false;
        }
      }

      return true;
    });
  }, [tests, selectedTeacher, selectedSubject, selectedGrade, selectedSubGrade]);

  const sortedTests = useMemo(() => {
    return [...filteredTests].sort((a, b) => {
      if (scoreOrder) {
        const aScore = a.average_score || 0;
        const bScore = b.average_score || 0;
        return scoreOrder === 'asc' ? aScore - bScore : bScore - aScore;
      }
      if (attemptOrder) {
        const aAttempts = a.attempt_count || 0;
        const bAttempts = b.attempt_count || 0;
        return attemptOrder === 'asc' ? aAttempts - bAttempts : bAttempts - aAttempts;
      }
      // Default: no sorting, keep original order
      return 0;
    });
  }, [filteredTests, scoreOrder, attemptOrder]);

  const columns = [
    {
      title: 'Test nomi',
      dataIndex: 'title',
      key: 'title',
      render: (text) => (
        <Text strong style={{ color: '#1e293b' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'O\'qituvchi',
      dataIndex: 'teacher_name',
      key: 'teacher_name',
      render: (text, record) => (
        <Text style={{ color: '#64748b' }}>
          {text || ''} {record.teacher_surname || ''}
        </Text>
      ),
    },
    {
      title: 'Fan',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => (
        <Tag color="blue" style={{ fontWeight: 500 }}>
          {subject}
        </Tag>
      ),
    },
    {
      title: 'Savollar',
      dataIndex: 'total_questions',
      key: 'total_questions',
      render: (value) => (
        <Text style={{ fontWeight: 700, color: '#2563eb' }}>
          {value}
        </Text>
      ),
    },
    {
      title: 'Vaqt (daqiqa)',
      dataIndex: 'time_limit',
      key: 'time_limit',
      render: (value) => (
        <Text style={{ fontWeight: 700, color: '#059669' }}>
          {value}
        </Text>
      ),
    },
    {
      title: 'Urinishlar',
      dataIndex: 'attempt_count',
      key: 'attempt_count',
      render: (value) => (
        <Text style={{ fontWeight: 700, color: '#2563eb' }}>
          {value || 0}
        </Text>
      ),
    },
    {
      title: 'O\'rtacha ball',
      dataIndex: 'average_score',
      key: 'average_score',
      render: (value) => (
        <Text style={{ fontWeight: 700, color: '#059669' }}>
          {(value || 0).toFixed(1)}%
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Faol' : 'Nofaol'}
        </Tag>
      ),
    },
    {
      title: 'Harakatlar',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/admin/test-details/${record.id}`)}
          style={{
            backgroundColor: '#059669',
            borderColor: '#059669',
            fontWeight: 600
          }}
        >
          Batafsil
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column'
      }}>
        <div>Yuklanmoqda...</div>
        <Text style={{ marginTop: '16px', color: '#64748b' }}>
          Testlar yuklanmoqda...
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Testlar reytingi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Barcha testlarning batafsil statistikasi va natijalari
        </Text>
      </div>

      {/* Filters */}
      <Card
        style={{
          marginBottom: '24px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text style={{ fontWeight: 600, color: '#1e293b' }}>Ustoz</Text>
            </div>
            <Select
              value={selectedTeacher}
              onChange={(value) => setSelectedTeacher(value)}
              style={{ width: '100%' }}
              placeholder="Barcha"
            >
              <Option value="">Barcha</Option>
              {teachers.map(teacher => (
                <Option key={teacher} value={teacher}>{teacher}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text style={{ fontWeight: 600, color: '#1e293b' }}>Fan</Text>
            </div>
            <Select
              value={selectedSubject}
              onChange={(value) => setSelectedSubject(value)}
              style={{ width: '100%' }}
              placeholder="Barcha"
            >
              <Option value="">Barcha</Option>
              {subjects.map(subject => (
                <Option key={subject} value={subject}>{subject}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text style={{ fontWeight: 600, color: '#1e293b' }}>Sinf</Text>
            </div>
            <Select
              value={selectedGrade}
              onChange={(value) => {
                setSelectedGrade(value);
                setSelectedSubGrade('');
              }}
              style={{ width: '100%' }}
              placeholder="Barcha sinflar"
            >
              <Option value="">Barcha sinflar</Option>
              {[5,6,7,8,9,10,11].map(grade => (
                <Option key={grade} value={grade.toString()}>{grade}-sinf</Option>
              ))}
            </Select>
          </Col>

          {selectedGrade && subGrades[selectedGrade] && (
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: '8px' }}>
                <Text style={{ fontWeight: 600, color: '#1e293b' }}>Yo'nalish</Text>
              </div>
              <Select
                value={selectedSubGrade}
                onChange={(value) => setSelectedSubGrade(value)}
                style={{ width: '100%' }}
                placeholder="Barcha yo'nalishlar"
              >
                <Option value="">Barcha yo'nalishlar</Option>
                {subGrades[selectedGrade].map(sub => (
                  <Option key={sub} value={sub}>{selectedGrade}-{sub}</Option>
                ))}
              </Select>
            </Col>
          )}

          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text style={{ fontWeight: 600, color: '#1e293b' }}>Ball bo'yicha tartiblash</Text>
            </div>
            <Select
              value={scoreOrder}
              onChange={(value) => setScoreOrder(value)}
              style={{ width: '100%' }}
              placeholder="Tartiblanmagan"
            >
              <Option value="">Tartiblanmagan</Option>
              <Option value="desc">Eng baland ball</Option>
              <Option value="asc">Eng past ball</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text style={{ fontWeight: 600, color: '#1e293b' }}>Urinishlar soni bo'yicha</Text>
            </div>
            <Select
              value={attemptOrder}
              onChange={(value) => setAttemptOrder(value)}
              style={{ width: '100%' }}
              placeholder="Tartiblanmagan"
            >
              <Option value="">Tartiblanmagan</Option>
              <Option value="asc">Eng kam ishlangan</Option>
              <Option value="desc">Eng ko'p ishlangan</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Table */}
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
          dataSource={sortedTests}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami ${total} ta test`,
          }}
          locale={{
            emptyText: 'Testlar topilmadi'
          }}
        />
      </Card>
    </div>
  );
};

export default TestStatistics;