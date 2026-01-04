import React, { useState, useEffect } from 'react';
import 'animate.css';
import { Card, Typography, Table, Tag, Alert, Input, Select } from 'antd';
import { BookOutlined, SearchOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const ReceivedLessons = () => {
  const { currentUser } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [sortBy, setSortBy] = useState('topic');
  const [pageSize, setPageSize] = useState(10);
  const { Search } = Input;
  const { Option } = Select;

  useEffect(() => {
    loadLessons();
  }, [currentUser.id]);

  const loadLessons = () => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const lessonNotifications = notifications.filter(n =>
        n.studentId === currentUser.id && n.type === 'lesson_reminder'
      );

      const studentLessons = lessonNotifications.map(notification => ({
        id: notification.id,
        topic: notification.lessonTopic,
        subject: notification.subject,
        description: notification.lessonDescription,
        room: notification.room,
        lessonDate: notification.lessonDate,
        lessonTime: notification.lessonTime,
        teacherName: notification.teacherName,
        sentAt: notification.createdAt,
        difficulty: notification.difficulty || 'medium',
        estimatedTime: notification.estimatedTime || 60,
        resources: null,
      }));
      setLessons(studentLessons);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter lessons based on search term and subject filter
  const getFilteredLessons = () => {
    if (!lessons || !Array.isArray(lessons)) return [];
    return lessons.filter(lesson => {
      const matchesSearch = !searchTerm || 
        lesson?.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson?.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson?.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = !subjectFilter || lesson?.subject === subjectFilter;
      
      return matchesSearch && matchesSubject;
    });
  };

  // Sort lessons
  const getSortedLessons = () => {
    const filteredLessons = getFilteredLessons();
    
    if (!filteredLessons || filteredLessons.length === 0) return [];
    
    const sortedLessons = [...filteredLessons];
    
    if (sortBy === 'subject') {
      return sortedLessons.sort((a, b) => (a?.subject || '').localeCompare(b?.subject || ''));
    } else if (sortBy === 'date') {
      return sortedLessons.sort((a, b) => {
        const dateA = a?.lessonDate ? new Date(a.lessonDate) : new Date(0);
        const dateB = b?.lessonDate ? new Date(b.lessonDate) : new Date(0);
        return dateB - dateA;
      });
    } else if (sortBy === 'teacher') {
      return sortedLessons.sort((a, b) => (a?.teacherName || '').localeCompare(b?.teacherName || ''));
    } else if (sortBy === 'sentDate') {
      return sortedLessons.sort((a, b) => {
        const dateA = a?.sentAt ? new Date(a.sentAt) : new Date(0);
        const dateB = b?.sentAt ? new Date(b.sentAt) : new Date(0);
        return dateB - dateA;
      });
    } else {
      // Default: sort by topic
      return sortedLessons.sort((a, b) => (a?.topic || '').localeCompare(b?.topic || ''));
    }
  };

  // Get all unique subjects for filtering
  const allSubjects = lessons && lessons.length > 0 ? [...new Set(lessons.map(lesson => lesson.subject).filter(Boolean))] : [];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'default';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Oson';
      case 'medium': return 'O\'rtacha';
      case 'hard': return 'Qiyin';
      default: return difficulty;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ 
        paddingTop: '16px',
        paddingBottom: '16px',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <Title level={2} style={{ 
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            Olingan darslar
          </Title>
          <Text style={{
            fontSize: '1.125rem',
            color: '#64748b',
            fontWeight: 400
          }}>
            Sizga yuborilgan dars materiallari va topshiriqlar
          </Text>
        </div>
        <Text style={{ color: '#64748b' }}>Yuklanmoqda...</Text>
      </div>
    );
  }

  const columns = [
    {
      title: 'Dars mavzusi',
      dataIndex: 'topic',
      key: 'topic',
      render: (topic, record) => (
        <div>
          <Text strong style={{
            fontWeight: 600,
            color: '#1e293b',
            fontSize: '0.875rem'
          }}>
            {topic}
          </Text>
          {record.description && (
            <Text style={{
              fontSize: '0.75rem',
              color: '#64748b',
              display: 'block',
              marginTop: '4px'
            }}>
              {record.description.length > 50 ? record.description.substring(0, 50) + '...' : record.description}
            </Text>
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
            fontWeight: 500,
            fontSize: '0.75rem'
          }}
        >
          {subject}
        </Tag>
      ),
    },
    {
      title: 'Sana va vaqt',
      key: 'datetime',
      render: (_, record) => (
        <div>
          <Text style={{
            fontWeight: 500,
            color: '#1e293b',
            fontSize: '0.875rem'
          }}>
            {record.lessonDate}
          </Text>
          <br />
          <Text style={{
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            {record.lessonTime}
          </Text>
        </div>
      ),
    },
    {
      title: 'Hona',
      dataIndex: 'room',
      key: 'room',
      render: (room) => (
        <Text style={{
          fontWeight: 500,
          color: '#1e293b',
          fontSize: '0.875rem'
        }}>
          {room}
        </Text>
      ),
    },
    {
      title: 'O\'qituvchi',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (teacherName) => (
        <Text style={{
          fontWeight: 500,
          color: '#1e293b',
          fontSize: '0.875rem'
        }}>
          {teacherName}
        </Text>
      ),
    },
    {
      title: 'Yuborilgan sana',
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: (sentAt) => formatDate(sentAt),
    },
  ];

  return (
    <div className="animate__animated animate__fadeIn" style={{
      paddingTop: '16px',
      paddingBottom: '16px',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div className="animate__animated animate__slideInDown" style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {/* Title */}
        <div style={{
          marginBottom: '16px'
        }}>
          <Title level={2} style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            Olingan darslar
          </Title>
        </div>
        
        {/* Description */}
        <Text style={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Sizga yuborilgan dars materiallari va topshiriqlar
        </Text>
      </div>

      {/* Search and Filter Section - Always Visible */}
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
            📚 Qoshimcha darslarim
          </Title>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SortAscendingOutlined style={{ color: '#64748b' }} />
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{
                minWidth: 140,
              }}
            >
              <Option value="topic">Mavzu bo'yicha</Option>
              <Option value="subject">Fan bo'yicha</Option>
              <Option value="date">Sana bo'yicha</Option>
              <Option value="teacher">O'qituvchi bo'yicha</Option>
              <Option value="sentDate">Yuborilgan sana</Option>
            </Select>
          </div>
        </div>

        <Search
          placeholder="Dars mavzusi, o'qituvchi yoki fan bo'yicha qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined style={{ color: '#64748b' }} />}
          style={{
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#2563eb';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
          }}
        />

        {/* Subject filter tags */}
        {allSubjects.length > 0 && (
          <div>
            <Text style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem', display: 'block', marginBottom: '8px' }}>
              Fanlar bo'yicha filtr:
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <Tag
                style={{
                  cursor: 'pointer',
                  backgroundColor: !subjectFilter ? '#2563eb' : 'transparent',
                  color: !subjectFilter ? '#ffffff' : '#374151',
                  borderColor: !subjectFilter ? '#2563eb' : '#e2e8f0',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  borderRadius: '6px'
                }}
                onClick={() => setSubjectFilter('')}
              >
                Barchasi
              </Tag>
              {allSubjects.map((subject) => (
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
        )}
      </div>

      {/* Results Count */}
      {lessons.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <Text style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {getSortedLessons().length} ta dars topildi
          </Text>
        </div>
      )}

      {/* No Lessons Message - Shows when no lessons exist */}
      {lessons.length === 0 && (
        <div className="animate__animated animate__fadeInUpBig" style={{ animationDelay: '300ms' }}>
          <Card style={{ textAlign: 'center', backgroundColor: '#f8f9fa' }}>
            <BookOutlined style={{ fontSize: 64, color: '#94a3b8', marginBottom: 16 }} />
            <Title level={4} style={{ marginBottom: 8, color: '#64748b' }}>
              Hozircha qo'shimcha darslar yo'q
            </Title>
            <Text style={{ color: '#94a3b8' }}>
              O'qituvchingiz test natijalaringizga qarab qo'shimcha dars yuborishi mumkin
            </Text>
          </Card>
        </div>
      )}

      {/* Lessons Table */}
      {lessons.length > 0 && (
        <div className="animate__animated animate__fadeInUpBig" style={{ animationDelay: '300ms' }}>
          <Alert 
            message={`Sizga ${lessons.length} ta qo'shimcha dars yuborilgan. Har bir darsni o'rganib, bilimlaringizni mustahkamlang!`} 
            type="info" 
            style={{ marginBottom: '16px' }}
          />

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
              dataSource={getSortedLessons().map(lesson => ({ ...lesson, key: lesson.id }))}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: pageSize,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Jami ${total} ta dars`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onShowSizeChange: (current, size) => setPageSize(size),
              }}
              locale={{
                emptyText: 'Darslar mavjud emas'
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
              size="middle"
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReceivedLessons;