import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  Alert,
  Typography,
  Space,
  Avatar,
  Tag,
  Collapse,
  Tooltip,
  Spin,
} from 'antd';
import 'animate.css';
import {
  SearchOutlined,
  EyeOutlined,
  DownOutlined,
  UpOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const ClassStatistics = () => {
  const [originalClasses, setOriginalClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState({});
  const [sortField, setSortField] = useState('averageScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const navigate = useNavigate();

  useEffect(() => {
    const loadClassStatistics = async () => {
      try {
        setLoading(true);

        // Fetch all necessary data
        const [usersData, attemptsData, testsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts(),
          apiService.getTests()
        ]);

        const users = usersData.results || usersData;
        const attempts = attemptsData.results || attemptsData;
        const tests = testsData.results || testsData;

        const students = users.filter(user => user.role === 'student');
        const teachers = users.filter(user => user.role === 'teacher');

        // Group students by class
        const classGroups = {};
        students.forEach(student => {
          const classGroup = student.class_group || 'Noma\'lum';
          if (!classGroups[classGroup]) {
            classGroups[classGroup] = {
              name: classGroup,
              students: [],
              curator: null
            };
          }
          classGroups[classGroup].students.push(student);
        });

        // Assign curators - match base class name (without suffix like -A, -B)
        Object.keys(classGroups).forEach(className => {
          // Extract base class name (e.g., "9-03-A" -> "9-03")
          const baseClassName = className.split('-').slice(0, 2).join('-');
          const curator = teachers.find(teacher => teacher.curator_class === baseClassName);
          if (curator) {
            classGroups[className].curator = curator;
          }
        });

        // Calculate statistics for each class
        const classStats = Object.values(classGroups).map(classGroup => {
          const classAttempts = attempts.filter(attempt =>
            classGroup.students.some(student => student.id === attempt.student)
          );

          let totalScore = 0;
          let studentsWithAttempts = 0;
          let activeStudents = 0;

          classGroup.students.forEach(student => {
            const studentAttempts = classAttempts.filter(attempt => attempt.student === student.id);
            if (studentAttempts.length > 0) {
              const studentAverage = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
              totalScore += studentAverage;
              studentsWithAttempts++;
            }

            // Active students (has login in last 30 days)
            if (student.last_login && new Date(student.last_login) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
              activeStudents++;
            }
          });

          return {
            ...classGroup,
            statistics: {
              totalStudents: classGroup.students.length,
              totalAttempts: classAttempts.length,
              averageScore: studentsWithAttempts > 0 ? Math.round(totalScore / studentsWithAttempts) : 0,
              activeStudents,
              totalTests: tests.length // This could be refined to show tests taken by class
            }
          };
        });

        setOriginalClasses(classStats);
      } catch (error) {
        console.error('Failed to load class statistics:', error);
        setError('Sinflar statistikasini yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadClassStatistics();
  }, []);

  // Filter classes based on search term
  const filteredClasses = originalClasses.filter(classGroup => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const className = classGroup.name.toLowerCase();
    const curatorName = classGroup.curator ? classGroup.curator.name.toLowerCase() : '';

    return className.includes(searchLower) || curatorName.includes(searchLower);
  });

  // Sort classes based on selected field and direction
  const classes = useMemo(() => {
    if (filteredClasses.length === 0) return [];

    return [...filteredClasses].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'averageScore':
          aValue = a.statistics.averageScore || 0;
          bValue = b.statistics.averageScore || 0;
          break;
        case 'totalAttempts':
          aValue = a.statistics.totalAttempts || 0;
          bValue = b.statistics.totalAttempts || 0;
          break;
        case 'totalStudents':
          aValue = a.statistics.totalStudents || 0;
          bValue = b.statistics.totalStudents || 0;
          break;
        case 'activeStudents':
          aValue = a.statistics.activeStudents || 0;
          bValue = b.statistics.activeStudents || 0;
          break;
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        case 'curator':
          aValue = (a.curator ? a.curator.name : '').toLowerCase();
          bValue = (b.curator ? b.curator.name : '').toLowerCase();
          if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }, [sortField, sortDirection, filteredClasses]);

  const handleViewDetails = (className) => {
    navigate(`/admin/class-details/${encodeURIComponent(className)}`);
  };

  const handleExpandClick = (className) => {
    setExpanded((prev) => ({ ...prev, [className]: !prev[className] }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleTestCountClick = (className) => {
    const classGroup = classes.find(c => c.name === className);
    if (classGroup) {
      alert(`Testlar soni: ${classGroup.statistics.totalAttempts || 0}`);
    }
  };

  const handleAverageScoreClick = (className) => {
    const classGroup = classes.find(c => c.name === className);
    if (classGroup) {
      alert(`O'rtacha ball: ${(classGroup.statistics.averageScore || 0).toFixed(1)}%`);
    }
  };

  const columns = [
    {
      title: '',
      key: 'expand',
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          icon={expanded[record.name] ? <UpOutlined /> : <DownOutlined />}
          onClick={() => handleExpandClick(record.name)}
          style={{ color: '#64748b' }}
        />
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('name')}>
          Sinf
          {sortField === 'name' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      dataIndex: 'name',
      key: 'name',
      render: (text, record, index) => (
        <Space>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#e5e7eb' : index === 2 ? '#cd7f32' : '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            color: index < 3 ? '#ffffff' : '#64748b',
          }}>
            {index + 1}
          </div>
          <div>
            <Text strong style={{ color: '#1e293b' }}>
              {text}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('curator')}>
          Sinf rahbari
          {sortField === 'curator' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      key: 'curator',
      render: (_, record) => {
        if (record.curator) {
          return (
            <Space>
              <Avatar
                src={record.curator.is_premium && record.curator.profile_photo_url ? record.curator.profile_photo_url : undefined}
                style={{
                  backgroundColor: record.curator.is_premium && record.curator.profile_photo_url ? undefined : '#f1f5f9',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {!record.curator.is_premium || !record.curator.profile_photo_url ? record.curator.name?.charAt(0) : undefined}
              </Avatar>
              <Text style={{ color: '#64748b', fontWeight: 600 }}>
                {record.curator.name}
              </Text>
            </Space>
          );
        }
        return (
          <Text style={{ color: '#94a3b8', fontStyle: 'italic' }}>
            Rahbar yo'q
          </Text>
        );
      },
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('totalStudents')}>
          O'quvchilar soni
          {sortField === 'totalStudents' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      dataIndex: ['statistics', 'totalStudents'],
      key: 'totalStudents',
      render: (value) => (
        <Text style={{ fontWeight: 500, color: '#1e293b' }}>
          {value}
        </Text>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('activeStudents')}>
          Faol o'quvchilar
          {sortField === 'activeStudents' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      dataIndex: ['statistics', 'activeStudents'],
      key: 'activeStudents',
      render: (value) => (
        <Text style={{ fontWeight: 500, color: '#059669' }}>
          {value}
        </Text>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('totalAttempts')}>
          Testlar soni
          {sortField === 'totalAttempts' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      dataIndex: ['statistics', 'totalAttempts'],
      key: 'totalAttempts',
      render: (value, record) => (
        <Text
          style={{
            fontWeight: 700,
            color: '#2563eb',
            fontSize: '18px',
            cursor: 'pointer'
          }}
          onClick={() => handleTestCountClick(record.name)}
        >
          {value || 0}
        </Text>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('averageScore')}>
          O'rtacha ball
          {sortField === 'averageScore' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      dataIndex: ['statistics', 'averageScore'],
      key: 'averageScore',
      render: (value, record) => (
        <Text
          style={{
            fontWeight: 700,
            color: '#059669',
            fontSize: '18px',
            cursor: 'pointer'
          }}
          onClick={() => handleAverageScoreClick(record.name)}
        >
          {value?.toFixed(1) || 0}%
        </Text>
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record.name)}
          style={{
            backgroundColor: '#2563eb',
            borderColor: '#2563eb',
            fontWeight: 600,
            transition: 'all 0.3s ease'
          }}
          className="animate__animated"
        >
          Ko'rish
        </Button>
      ),
    },
  ];

  return (
    <div className="animate__animated animate__fadeIn" style={{ padding: '24px 0' }}>
      {/* Header */}
      <div className="animate__animated animate__slideInDown" style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Sinflar reytingi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Sinflarning o'zaro reytingi va statistik ko'rsatkichlari
        </Text>
      </div>

      {/* Alerts */}
      {error && (
        <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '100ms' }}>
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
            closable
            onClose={() => setError('')}
          />
        </div>
      )}

      {/* Search */}
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '200ms', marginBottom: '24px' }}>
        <Input
          placeholder="Sinf yoki rahbar nomini qidirish..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            borderRadius: '8px',
            maxWidth: '100%'
          }}
        />
      </div>

      {/* Table */}
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '300ms' }}>
        <Table
          columns={columns}
          dataSource={classes}
          rowKey="name"
          loading={loading}
          rowClassName={(record, index) => `animate__animated animate__fadeInLeft`}
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
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami ${total} ta sinf`,
          }}
          expandable={{
            expandedRowKeys: Object.keys(expanded).filter(key => expanded[key]),
            onExpandedRowsChange: (keys) => {
              const newExpanded = {};
              keys.forEach(key => newExpanded[key] = true);
              setExpanded(newExpanded);
            },
            expandedRowRender: (record) => (
              <div style={{
                padding: '24px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                margin: '16px 0'
              }}>
                <Title level={4} style={{ marginBottom: '16px', color: '#1e293b' }}>
                  Batafsil ma'lumotlar
                </Title>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                  <div>
                    <Text style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748b',
                      marginBottom: '8px',
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Sinf kodi
                    </Text>
                    <Text style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1e293b',
                      fontFamily: 'monospace'
                    }}>
                      {record.name}
                    </Text>
                  </div>
                  <div>
                    <Text style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748b',
                      marginBottom: '8px',
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Rahbar
                    </Text>
                    <Text style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1e293b'
                    }}>
                      {record.curator ? record.curator.name : 'Yo\'q'}
                    </Text>
                  </div>
                  <div>
                    <Text style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748b',
                      marginBottom: '8px',
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Test muvaffaqiyati
                    </Text>
                    <Text style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1e293b'
                    }}>
                      {record.statistics.totalAttempts > 0 ?
                        `${(record.statistics.averageScore / 100).toFixed(1)}%` :
                        'Testlar yo\'q'
                      }
                    </Text>
                  </div>
                </div>
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetails(record.name)}
                    style={{
                      backgroundColor: '#2563eb',
                      borderColor: '#2563eb',
                      fontWeight: 600,
                      transition: 'all 0.3s ease'
                    }}
                    className="animate__animated animate__pulse"
                  >
                    To'liq ko'rish
                  </Button>
                </div>
              </div>
            ),
          }}
          locale={{
            emptyText: 'Sinflar mavjud emas'
          }}
        />
      </div>
    </div>
  );
};

export default ClassStatistics;