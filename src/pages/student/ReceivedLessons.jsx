import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Alert } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const ReceivedLessons = () => {
  const { currentUser } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div style={{
      paddingTop: '16px',
      paddingBottom: '16px',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div style={{
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

      {lessons.length === 0 ? (
        <Card style={{ textAlign: 'center', backgroundColor: '#f8f9fa' }}>
          <BookOutlined style={{ fontSize: 64, color: '#94a3b8', marginBottom: 16 }} />
          <Title level={4} style={{ marginBottom: 8, color: '#64748b' }}>
            Hozircha qo'shimcha darslar yo'q
          </Title>
          <Text style={{ color: '#94a3b8' }}>
            O'qituvchingiz test natijalaringizga qarab qo'shimcha dars yuborishi mumkin
          </Text>
        </Card>
      ) : (
        <div>
          <Alert 
            message={`Sizga ${lessons.length} ta qo'shimcha dars yuborilgan. Har bir darsni o'rganib, bilimlaringizni mustahkamlang!`} 
            type="info" 
            style={{ marginBottom: '16px' }}
          />

          <Card>
            <Table
              columns={columns}
              dataSource={lessons.map(lesson => ({ ...lesson, key: lesson.id }))}
              loading={loading}
              pagination={false}
              size="middle"
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReceivedLessons;