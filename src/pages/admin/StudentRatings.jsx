import React, { useState, useEffect, useMemo } from 'react';
import 'animate.css';
import {
  Table,
  Card,
  Typography,
  Tag,
  Input,
} from 'antd';
import {
  SearchOutlined,
} from '@ant-design/icons';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const StudentRatings = () => {
  const [originalStudents, setOriginalStudents] = useState([]);
  const [attempts, setAttempts] = useState([]);

  const [sortField, setSortField] = useState('average_score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const allUsers = await apiService.getUsers();
        const studentUsers = allUsers.filter((user) => user.role === 'student');

        const allAttempts = await apiService.getAttempts();
        setAttempts(allAttempts);

        // Calculate test statistics for each student
        const studentsWithStats = studentUsers.map(student => {
          const studentAttempts = allAttempts.filter(attempt => attempt.student === student.id);
          const testCount = studentAttempts.length;
          const averageScore = testCount > 0
            ? studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / testCount
            : 0;

          return {
            ...student,
            total_tests_taken: testCount,
            average_score: averageScore
          };
        });

        setOriginalStudents(studentsWithStats);
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    };
    loadStudents();
  }, []);

  const students = useMemo(() => {
    if (originalStudents.length === 0) return [];

    let filteredStudents = [...originalStudents];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredStudents = filteredStudents.filter(student =>
        (student.class_group && student.class_group.toLowerCase().includes(term)) ||
        (student.name && student.name.toLowerCase().includes(term)) ||
        (student.username && student.username.toLowerCase().includes(term))
      );
    }

    return filteredStudents.sort((a, b) => {
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
          if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        case 'class_group':
          aValue = (a.class_group || '').toLowerCase();
          bValue = (b.class_group || '').toLowerCase();
          if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        case 'direction':
          aValue = (a.direction || '').toLowerCase();
          bValue = (b.direction || '').toLowerCase();
          if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        case 'registration_date':
          aValue = a.registration_date ? new Date(a.registration_date).getTime() : 0;
          bValue = b.registration_date ? new Date(b.registration_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }, [sortField, sortDirection, originalStudents, searchTerm]);



  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleTestCountClick = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      alert(`Testlar soni: ${student.total_tests_taken || 0}`);
    }
  };

  const handleAverageScoreClick = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      alert(`O'rtacha ball: ${(student.average_score || 0).toFixed(1)}%`);
    }
  };

  const columns = [
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('name')}>
          Ism
        </div>
      ),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Text strong style={{ color: '#1e293b' }}>
          {text || record.username}
        </Text>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('class_group')}>
          Sinflar
        </div>
      ),
      dataIndex: 'class_group',
      key: 'class_group',
      render: (text) => (
        <Text style={{ color: '#1e293b', fontWeight: 500 }}>
          {text}
        </Text>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('total_tests_taken')}>
          Testlar soni
        </div>
      ),
      dataIndex: 'total_tests_taken',
      key: 'total_tests_taken',
      render: (value, record) => (
        <Text
          style={{
            fontWeight: 700,
            color: '#2563eb',
            fontSize: '18px',
            cursor: 'pointer'
          }}
          onClick={() => handleTestCountClick(record.id)}
        >
          {value || 0}
        </Text>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('average_score')}>
          O'rtacha ball
        </div>
      ),
      dataIndex: 'average_score',
      key: 'average_score',
      render: (value, record) => (
        <Text
          style={{
            fontWeight: 700,
            color: '#059669',
            fontSize: '18px',
            cursor: 'pointer'
          }}
          onClick={() => handleAverageScoreClick(record.id)}
        >
          {(value || 0).toFixed(1)}%
        </Text>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('direction')}>
          Yo'nalish
        </div>
      ),
      dataIndex: 'direction',
      key: 'direction',
      render: (direction) => {
        if (direction) {
          return (
            <Tag
              color={direction === 'natural' ? 'green' : 'blue'}
              style={{ fontWeight: 600 }}
            >
              {direction === 'natural' ? 'Tabiiy fanlar' : 'Aniq fanlar'}
            </Tag>
          );
        }
        return (
          <Text style={{ color: '#64748b', fontStyle: 'italic' }}>
            To'ldirilmagan
          </Text>
        );
      },
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('registration_date')}>
          Ro'yxatdan o'tgan sana
        </div>
      ),
      dataIndex: 'registration_date',
      key: 'registration_date',
      render: (date) => (
        <Text style={{
          fontWeight: 500,
          color: date ? '#1e293b' : '#64748b'
        }}>
          {date ? new Date(date).toLocaleDateString() : 'To\'ldirilmagan'}
        </Text>
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
          O'quvchilar reytingi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Sinf va yo'nalish bo'yicha o'quvchilarni ularning test natijalari asosida reytinglash
        </Text>
      </div>

      {/* Search Input */}
      <div className="animate__animated animate__fadeInUp" style={{ marginBottom: '24px' }}>
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

      {/* Students Table */}
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '300ms' }}>
        <Table
          dataSource={students}
          columns={columns}
          rowKey="id"
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami ${total} ta o'quvchi`,
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

export default StudentRatings;
