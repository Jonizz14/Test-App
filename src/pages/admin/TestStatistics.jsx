import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
dayjs.extend(isSameOrAfter);
import 'animate.css';
import {
  Table,
  Card,
  Button,
  Tag,
  Typography,
  Input,
  Select,
  DatePicker,
} from 'antd';
import {
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const TestStatistics = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(null);

  useEffect(() => {
    const loadTests = async () => {
      try {
        const allTestsData = await apiService.getTests();
        const allTests = allTestsData.results || allTestsData;
        setTests(allTests);
      } catch (error) {
        console.error('Failed to load tests:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTests();
  }, []);

  // Filter tests based on all filter criteria
  const displayTests = useMemo(() => {
    const testsArray = Array.isArray(tests) ? tests : [];

    let filteredTests = testsArray;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filteredTests = filteredTests.filter(test => {
        const teacherName = `${test.teacher_name || ''} ${test.teacher_surname || ''}`.toLowerCase();
        const title = test.title ? test.title.toLowerCase() : '';
        const subject = test.subject ? test.subject.toLowerCase() : '';

        return title.includes(searchLower) ||
          teacherName.includes(searchLower) ||
          subject.includes(searchLower);
      });
    }

    // Apply subject filter
    if (subjectFilter && subjectFilter.trim()) {
      const subjectFilterLower = subjectFilter.toLowerCase().trim();
      filteredTests = filteredTests.filter(test =>
        test.subject && test.subject.toLowerCase().includes(subjectFilterLower)
      );
    }

    // Apply teacher filter
    if (teacherFilter && teacherFilter.trim()) {
      const teacherFilterLower = teacherFilter.toLowerCase().trim();
      filteredTests = filteredTests.filter(test => {
        const teacherName = `${test.teacher_name || ''} ${test.teacher_surname || ''}`.toLowerCase();
        return teacherName.includes(teacherFilterLower);
      });
    }

    // Apply status filter
    if (statusFilter !== '') {
      const isActiveFilter = statusFilter === 'active';
      filteredTests = filteredTests.filter(test => test.is_active === isActiveFilter);
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = dayjs(dateFilter).startOf('day');
      filteredTests = filteredTests.filter(test => {
        if (!test.created_at) return false;
        const testDate = dayjs(test.created_at);
        return testDate.isSameOrAfter(filterDate);
      });
    }

    return filteredTests;
  }, [tests, searchTerm, subjectFilter, teacherFilter, statusFilter, dateFilter]);

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
            fontWeight: 600,
            transition: 'all 0.3s ease'
          }}
          className="animate__animated"
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
        <div>Loading...</div>
        <Text style={{ marginTop: '16px', color: '#64748b' }}>
          Tests are loading...
        </Text>
      </div>
    );
  }

  return (
    <div className="animate__animated animate__fadeIn" style={{ padding: '24px 0' }}>
      {/* Header */}
      <div className="animate__animated animate__slideInDown" style={{
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
      <div className="animate__animated animate__fadeInUp" style={{
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
          placeholder="Fan bo'yicha"
          value={subjectFilter}
          onChange={setSubjectFilter}
          style={{
            borderRadius: '8px',
            minWidth: '150px',
            width: '200px'
          }}
          allowClear
        >
          <Select.Option value="Matematika">Matematika</Select.Option>
          <Select.Option value="Fizika">Fizika</Select.Option>
          <Select.Option value="Kimyo">Kimyo</Select.Option>
          <Select.Option value="Biologiya">Biologiya</Select.Option>
          <Select.Option value="Tarix">Tarix</Select.Option>
          <Select.Option value="Geografiya">Geografiya</Select.Option>
          <Select.Option value="Ingliz tili">Ingliz tili</Select.Option>
          <Select.Option value="Ona tili">Ona tili</Select.Option>
          <Select.Option value="Adabiyot">Adabiyot</Select.Option>
        </Select>

        {/* Teacher Filter */}
        <Select
          placeholder="O'qituvchi bo'yicha"
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
          placeholder="Status bo'yicha"
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
          placeholder="Sana bo'yicha"
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
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '300ms' }}>
        <Table
          columns={columns}
          dataSource={displayTests}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami ${total} ta test`,
          }}
          locale={{
            emptyText: searchTerm ? 'Qidiruv natijasi topilmadi' : 'Testlar topilmadi'
          }}
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
        />
      </div>
    </div>
  );
};

export default TestStatistics;