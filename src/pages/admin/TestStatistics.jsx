import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
dayjs.extend(isSameOrAfter);
import {
  Table,
  Button,
  Tag,
  Typography,
  Input,
  Select,
  DatePicker,
  Space,
} from 'antd';
import {
  EyeOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const TestStatistics = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState(undefined);
  const [teacherFilter, setTeacherFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [dateFilter, setDateFilter] = useState(undefined);
  const [sortField, setSortField] = useState('average_score');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const loadTests = async () => {
      try {
        setLoading(true);
        const [testsData, usersData] = await Promise.all([
          apiService.getTests(),
          apiService.getUsers()
        ]);

        const allTests = testsData.results || testsData;
        const allUsers = usersData.results || usersData;
        const teachers = allUsers.filter(u => u.role === 'teacher' || u.role === 'content_manager' || u.role === 'admin');

        // Map teacher names to tests if they aren't already populated correctly
        const enrichedTests = allTests.map(test => {
          const teacher = teachers.find(t => t.id === test.teacher || t.username === test.teacher);
          if (teacher) {
            return {
              ...test,
              teacher_name: teacher.name || teacher.first_name || teacher.username,
              teacher_surname: teacher.surname || teacher.last_name || ''
            };
          }
          return test;
        });

        setTests(enrichedTests);
      } catch (error) {
        console.error('Failed to load tests:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTests();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter tests based on all filter criteria
  const filteredTests = useMemo(() => {
    const testsArray = Array.isArray(tests) ? tests : [];

    let result = testsArray;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(test => {
        const teacherName = `${test.teacher_name || ''} ${test.teacher_surname || ''}`.toLowerCase();
        const title = test.title ? test.title.toLowerCase() : '';
        const subject = test.subject ? test.subject.toLowerCase() : '';

        return title.includes(searchLower) ||
          teacherName.includes(searchLower) ||
          subject.includes(searchLower);
      });
    }

    // Apply subject filter
    if (subjectFilter) {
      const subjectFilterLower = subjectFilter.toLowerCase().trim();
      result = result.filter(test =>
        test.subject && test.subject.toLowerCase().includes(subjectFilterLower)
      );
    }

    // Apply teacher filter
    if (teacherFilter) {
      const teacherFilterLower = teacherFilter.toLowerCase().trim();
      result = result.filter(test => {
        const teacherName = `${test.teacher_name || ''} ${test.teacher_surname || ''}`.toLowerCase();
        return teacherName.includes(teacherFilterLower);
      });
    }

    // Apply status filter
    if (statusFilter === 'active' || statusFilter === 'inactive') {
      const isActiveFilter = statusFilter === 'active';
      result = result.filter(test => test.is_active === isActiveFilter);
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = dayjs(dateFilter).startOf('day');
      result = result.filter(test => {
        if (!test.created_at) return false;
        const testDate = dayjs(test.created_at);
        return testDate.isSameOrAfter(filterDate);
      });
    }

    return result;
  }, [tests, searchTerm, subjectFilter, teacherFilter, statusFilter, dateFilter]);

  const sortedTests = useMemo(() => {
    return [...filteredTests].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'average_score':
          aValue = a.average_score || 0;
          bValue = b.average_score || 0;
          break;
        case 'attempt_count':
          aValue = a.attempt_count || 0;
          bValue = b.attempt_count || 0;
          break;
        case 'title':
          aValue = (a.title || '').toLowerCase();
          bValue = (b.title || '').toLowerCase();
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        case 'total_questions':
          aValue = a.total_questions || 0;
          bValue = b.total_questions || 0;
          break;
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        default:
          return 0;
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [filteredTests, sortField, sortDirection]);

  // Extract unique subjects for filter
  const uniqueSubjects = useMemo(() => {
    const subjects = tests.map(t => t.subject).filter(Boolean);
    return [...new Set(subjects)].sort();
  }, [tests]);

  const columns = [
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('title')}>
          Test nomi
          {sortField === 'title' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      key: 'title',
      render: (_, record, index) => (
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
          <Text strong style={{ color: '#1e293b' }}>
            {record.title}
          </Text>
        </Space>
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
        <Tag color="blue" style={{ borderRadius: '6px', fontWeight: 600 }}>
          {subject}
        </Tag>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('total_questions')}>
          Savollar
          {sortField === 'total_questions' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      dataIndex: 'total_questions',
      key: 'total_questions',
      render: (value) => (
        <Text style={{ fontWeight: 700, color: '#2563eb' }}>
          {value}
        </Text>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('attempt_count')}>
          Urinishlar
          {sortField === 'attempt_count' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      dataIndex: 'attempt_count',
      key: 'attempt_count',
      render: (value) => (
        <Text style={{ fontWeight: 700, color: '#2563eb', fontSize: '18px' }}>
          {value || 0}
        </Text>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('average_score')}>
          O'rtacha ball
          {sortField === 'average_score' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      dataIndex: 'average_score',
      key: 'average_score',
      render: (value) => (
        <Text style={{ fontWeight: 700, color: '#059669', fontSize: '18px' }}>
          {(value || 0).toFixed(1)}%
        </Text>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
          Yaratilgan sana
          {sortField === 'created_at' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (
        <Text style={{ color: '#64748b' }}>
          {date ? dayjs(date).format('DD.MM.YYYY') : '-'}
        </Text>
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
            backgroundColor: '#2563eb',
            borderColor: '#2563eb',
            fontWeight: 600,
            transition: 'all 0.3s ease'
          }}
        >
          Batafsil
        </Button>
      ),
    },
  ];


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

      {/* Search and Filters Row */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search Input */}
        <Input
          placeholder="Test nomi, o'qituvchi yoki fan nomi bo'yicha qidirish..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            borderRadius: '8px',
            minWidth: '300px',
            flex: '1'
          }}
        />

        {/* Subject Filter */}
        <Select
          placeholder="Fan"
          value={subjectFilter}
          onChange={setSubjectFilter}
          style={{
            borderRadius: '8px',
            minWidth: '150px',
            width: '200px'
          }}
          allowClear
          showSearch
        >
          {uniqueSubjects.map(subject => (
            <Select.Option key={subject} value={subject}>
              {subject}
            </Select.Option>
          ))}
        </Select>

        {/* Teacher Filter */}
        <Select
          placeholder="O'qituvchi"
          value={teacherFilter}
          onChange={setTeacherFilter}
          style={{
            borderRadius: '8px',
            minWidth: '180px',
            width: '220px'
          }}
          allowClear
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {Array.from(new Set(tests.map(test =>
            `${test.teacher_name || ''} ${test.teacher_surname || ''}`.trim()
          ).filter(name => name))).map(teacherName => (
            <Select.Option key={teacherName} value={teacherName}>
              {teacherName}
            </Select.Option>
          ))}
        </Select>

        {/* Status Filter */}
        <Select
          placeholder="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          style={{
            borderRadius: '8px',
            minWidth: '120px',
            width: '150px'
          }}
          allowClear
        >
          <Select.Option value="active">Faol</Select.Option>
          <Select.Option value="inactive">Nofaol</Select.Option>
        </Select>

        {/* Date Filter */}
        <DatePicker
          placeholder="Sana"
          value={dateFilter}
          onChange={setDateFilter}
          style={{
            borderRadius: '8px',
            minWidth: '140px',
            width: '160px'
          }}
        />
      </div>

      {/* Table */}
      <div style={{}}>
        <Table
          columns={columns}
          dataSource={sortedTests}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami ${total} ta test`,
          }}
          locale={{
            emptyText: searchTerm ? 'Qidiruv natijasi topilmadi' : 'Testlar topilmadi'
          }}
          rowClassName={() => ""}
          onRow={(record, index) => ({
            style: {
              animationDelay: `${index * 50}ms`,
              transition: 'all 0.3s ease'
            }
          })}
        />
      </div>
    </div>
  );
};

export default TestStatistics;