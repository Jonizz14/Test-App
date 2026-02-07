import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Typography,
  Tag,
  Input,
  Space,
  Avatar,
  Alert,
  Select,
} from 'antd';
import {
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
} from '@ant-design/icons';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const StudentRatings = () => {
  const [originalStudents, setOriginalStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('average_score');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const [usersData, attemptsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts()
        ]);

        const allUsers = usersData.results || usersData;
        const studentUsers = allUsers.filter((user) => user.role === 'student');
        const teachers = allUsers.filter((user) => user.role === 'teacher');
        const allAttempts = attemptsData.results || attemptsData;

        // Calculate test statistics for each student
        const studentsWithStats = studentUsers.map(student => {
          const studentAttempts = allAttempts.filter(attempt => attempt.student === student.id);
          const testCount = studentAttempts.length;
          const averageScore = testCount > 0
            ? studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / testCount
            : 0;

          // Find curator for this student's class
          let curatorName = '';
          if (student.class_group) {
            const baseClass = student.class_group.split('-').slice(0, 2).join('-');
            const curator = teachers.find(t =>
              t.curator_class === student.class_group ||
              t.curator_class === baseClass
            );
            if (curator) {
              curatorName = `${curator.name || ''} ${curator.surname || ''}`.trim() || curator.username;
            }
          }

          return {
            ...student,
            total_tests_taken: testCount,
            average_score: averageScore,
            curator_name: curatorName
          };
        });

        setOriginalStudents(studentsWithStats);
      } catch (error) {
        console.error('Failed to load students:', error);
        setError('O\'quvchilar reytingini yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  const [classFilter, setClassFilter] = useState(undefined);
  const [directionFilter, setDirectionFilter] = useState(undefined);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredStudents = useMemo(() => {
    let result = [...originalStudents];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(student =>
        (student.class_group && student.class_group.toLowerCase().includes(term)) ||
        (student.name && student.name.toLowerCase().includes(term)) ||
        (student.username && student.username.toLowerCase().includes(term)) ||
        (student.curator_name && student.curator_name.toLowerCase().includes(term))
      );
    }

    // Apply class filter
    if (classFilter) {
      result = result.filter(student => student.class_group === classFilter);
    }

    // Apply direction filter
    if (directionFilter) {
      result = result.filter(student => student.direction === directionFilter);
    }

    return result;
  }, [originalStudents, searchTerm, classFilter, directionFilter]);

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'average_score':
          aValue = a.average_score || 0;
          bValue = b.average_score || 0;
          break;
        case 'total_tests_taken':
          aValue = a.total_tests_taken || 0;
          bValue = b.total_tests_taken || 0;
          break;
        case 'name':
          aValue = (a.name || a.username || '').toLowerCase();
          bValue = (b.name || b.username || '').toLowerCase();
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        case 'class_group':
          aValue = (a.class_group || '').toLowerCase();
          bValue = (b.class_group || '').toLowerCase();
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        default:
          return 0;
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [filteredStudents, sortField, sortDirection]);

  // Extract unique classes for filter
  const uniqueClasses = useMemo(() => {
    const classes = originalStudents.map(s => s.class_group).filter(Boolean);
    return [...new Set(classes)].sort();
  }, [originalStudents]);

  const columns = [
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('name')}>
          O'quvchi
          {sortField === 'name' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      key: 'name',
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
          <Space>
            <Avatar
              icon={<UserOutlined />}
              src={record.profile_photo_url}
              style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
            />
            <div>
              <Text strong style={{ color: '#1e293b', display: 'block' }}>
                {record.name || record.username}
              </Text>
            </div>
          </Space>
        </Space>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('class_group')}>
          Sinf
          {sortField === 'class_group' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      dataIndex: 'class_group',
      key: 'class_group',
      render: (text) => (
        <Tag color="blue" style={{ borderRadius: '6px', fontWeight: 600 }}>
          {text || 'Sinf yo\'q'}
        </Tag>
      ),
    },
    {
      title: 'Sinf rahbari',
      dataIndex: 'curator_name',
      key: 'curator_name',
      render: (text) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {text || <Text style={{ color: '#94a3b8', fontStyle: 'italic' }}>Rahbar yo'q</Text>}
        </Text>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('total_tests_taken')}>
          Testlar soni
          {sortField === 'total_tests_taken' && (
            sortDirection === 'asc' ? <ArrowUpOutlined style={{ marginLeft: 8, fontSize: 12 }} /> : <ArrowDownOutlined style={{ marginLeft: 8, fontSize: 12 }} />
          )}
        </div>
      ),
      dataIndex: 'total_tests_taken',
      key: 'total_tests_taken',
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
      title: 'Yo\'nalish',
      dataIndex: 'direction',
      key: 'direction',
      render: (direction) => (
        direction ? (
          <Tag color={direction === 'natural' ? 'green' : 'cyan'}>
            {direction === 'natural' ? 'Tabiiy fanlar' : 'Aniq fanlar'}
          </Tag>
        ) : (
          <Text type="secondary" italic>To'ldirilmagan</Text>
        )
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
          O'quvchilar reytingi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Sinf va yo'nalish bo'yicha o'quvchilarni ularning test natijalari asosida reytinglash
        </Text>
      </div>

      {/* Alerts */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
          closable
          onClose={() => setError('')}
        />
      )}

      {/* Search and Filters */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <Input
          placeholder="O'quvchi, sinf yoki rahbar nomi bo'yicha qidirish..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            borderRadius: '8px',
            minWidth: '300px',
            flex: '1'
          }}
          allowClear
        />

        <Select
          placeholder="Sinf"
          value={classFilter}
          onChange={setClassFilter}
          style={{
            borderRadius: '8px',
            minWidth: '150px',
            width: '200px'
          }}
          allowClear
          showSearch
        >
          {uniqueClasses.map(className => (
            <Select.Option key={className} value={className}>
              {className}
            </Select.Option>
          ))}
        </Select>

        <Select
          placeholder="Yo'nalish"
          value={directionFilter}
          onChange={setDirectionFilter}
          style={{
            borderRadius: '8px',
            minWidth: '150px',
            width: '180px'
          }}
          allowClear
        >
          <Select.Option value="natural">Tabiiy fanlar</Select.Option>
          <Select.Option value="exact">Aniq fanlar</Select.Option>
        </Select>
      </div>

      {/* Table */}
      <div style={{}}>
        <Table
          dataSource={sortedStudents}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami ${total} ta o'quvchi`,
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

export default StudentRatings;
