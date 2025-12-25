import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Button,
  Modal,
  Alert,
  Table,
  Tag,
  Space,
  Tooltip,
  Spin,
  Input,
  Select,
} from 'antd';
import {
  BookOutlined as SchoolIcon,
  CheckCircleOutlined as CheckCircleIcon,
  CloseCircleOutlined as UncheckedIcon,
  CheckOutlined as DoneIcon,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const SentLessons = () => {
  const { currentUser } = useAuth();
  const [sentLessons, setSentLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, lesson: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadSentLessons();
  }, [currentUser.id]);

  const loadSentLessons = () => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const teacherLessons = notifications.filter(n =>
        n.type === 'lesson_reminder' && n.teacherId === currentUser.id
      );
      setSentLessons(teacherLessons);
    } catch (error) {
      console.error('Error loading sent lessons:', error);
    } finally {
      setLoading(false);
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

  const markLessonCompleted = (lessonId) => {
    // Remove the notification from localStorage
    const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updatedNotifications = allNotifications.filter(n => n.id !== lessonId);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));

    // Update local state
    setSentLessons(prevLessons => prevLessons.filter(lesson => lesson.id !== lessonId));
  };

  // Filter and sort lessons
  const filteredAndSortedLessons = sentLessons
    .filter(lesson => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const topicMatch = lesson.lessonTopic?.toLowerCase().includes(searchLower);
        const studentMatch = lesson.studentName?.toLowerCase().includes(searchLower);
        const subjectMatch = lesson.subject?.toLowerCase().includes(searchLower);
        if (!topicMatch && !studentMatch && !subjectMatch) return false;
      }

      // Status filter
      if (filterStatus === 'read' && !lesson.isRead) return false;
      if (filterStatus === 'unread' && lesson.isRead) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'lessonDate':
          return new Date(b.lessonDate) - new Date(a.lessonDate);
        case 'studentName':
          return a.studentName?.localeCompare(b.studentName || '');
        case 'subject':
          return a.subject?.localeCompare(b.subject || '');
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div style={{
        padding: '32px 0',
        backgroundColor: '#ffffff',
        textAlign: 'center'
      }}>
        <Spin size="large" />
        <Typography.Text style={{ display: 'block', marginTop: '16px', color: '#64748b' }}>
          Yuklanmoqda...
        </Typography.Text>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      padding: '32px 0',
      backgroundColor: '#ffffff'
    }}>
      <div style={{
        marginBottom: '48px',
        paddingBottom: '32px',
        borderBottom: '1px solid #e2e8f0'
      }}>
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
          Yuborilgan darslar ({filteredAndSortedLessons.length})
        </Typography.Title>
        <Typography.Text
          style={{
            fontSize: '18px',
            color: '#64748b',
            fontWeight: 400
          }}
        >
          O'quvchilarga yuborilgan qo'shimcha darslar ro'yxati
          </Typography.Text>
        </div>
  
        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="Dars mavzusi, o'quvchi yoki fanini qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: '300px', flex: 1 }}
            allowClear
          />
          <Select
            value={sortBy}
            onChange={(value) => setSortBy(value)}
            placeholder="Saralash"
            style={{ minWidth: '140px' }}
          >
            <Select.Option value="createdAt">Yangi avval</Select.Option>
            <Select.Option value="lessonDate">Dars sanasi</Select.Option>
            <Select.Option value="studentName">O'quvchi</Select.Option>
            <Select.Option value="subject">Fan</Select.Option>
          </Select>
          <Select
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
            placeholder="Status"
            style={{ minWidth: '120px' }}
          >
            <Select.Option value="all">Barcha</Select.Option>
            <Select.Option value="read">Ko'rilgan</Select.Option>
            <Select.Option value="unread">Ko'rilmagan</Select.Option>
          </Select>
        </div>
  
        {/* Search Results Info */}
        {searchTerm && (
          <Typography.Text style={{ marginBottom: '16px', color: '#64748b' }}>
            {filteredAndSortedLessons.length} ta dars topildi
          </Typography.Text>
        )}
  
        {sentLessons.length === 0 ? (
          <Card style={{ textAlign: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '32px' }}>
              <SchoolIcon style={{ fontSize: '64px', color: '#94a3b8', marginBottom: '16px' }} />
              <Typography.Title level={4} style={{ marginBottom: '8px' }}>
                Hozircha darsga chaqirish yuborilmagan
              </Typography.Title>
              <Typography.Text style={{ color: '#64748b' }}>
                O'quvchilarga qo'shimcha dars yuborish uchun test natijalarini ko'ring
              </Typography.Text>
            </div>
          </Card>
        ) : (
        <div>
          <Alert
            message={`Siz ${sentLessons.length} ta darsga chaqirish yuborgansiz`}
            type="info"
            style={{ marginBottom: '24px' }}
          />

          <Table
            dataSource={filteredAndSortedLessons}
            rowKey="id"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
            }}
            columns={[
              {
                title: 'Dars mavzusi',
                dataIndex: 'lessonTopic',
                key: 'lessonTopic',
                render: (text, record) => (
                  <div>
                    <Typography.Text strong style={{ color: '#1e293b' }}>
                      {text}
                    </Typography.Text>
                    {record.lessonDescription && (
                      <div style={{ marginTop: '4px' }}>
                        <Typography.Text style={{ fontSize: '12px', color: '#64748b' }}>
                          {record.lessonDescription.length > 50 ? record.lessonDescription.substring(0, 50) + '...' : record.lessonDescription}
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: 'O\'quvchi',
                key: 'student',
                render: (_, record) => (
                  <div>
                    <Typography.Text style={{ color: '#1e293b' }}>
                      {record.studentName || 'O\'quvchi'}
                    </Typography.Text>
                    {record.studentClass && (
                      <div style={{ marginTop: '4px' }}>
                        <Typography.Text style={{ fontSize: '12px', color: '#64748b' }}>
                          {record.studentClass}-sinf
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
                  <Tag style={{ fontWeight: 500 }}>
                    {subject}
                  </Tag>
                ),
              },
              {
                title: 'Sana va vaqt',
                key: 'datetime',
                render: (_, record) => (
                  <div>
                    <Typography.Text style={{ color: '#1e293b' }}>
                      {record.lessonDate}
                    </Typography.Text>
                    <div style={{ marginTop: '4px' }}>
                      <Typography.Text style={{ fontSize: '12px', color: '#64748b' }}>
                        {record.lessonTime}
                      </Typography.Text>
                    </div>
                  </div>
                ),
              },
              {
                title: 'Hona',
                dataIndex: 'room',
                key: 'room',
                render: (room) => (
                  <Typography.Text style={{ color: '#1e293b' }}>
                    {room}
                  </Typography.Text>
                ),
              },
              {
                title: 'Status',
                key: 'status',
                render: (_, record) => (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {record.isRead ? (
                        <CheckCircleIcon style={{ color: '#059669', fontSize: '16px' }} />
                      ) : (
                        <UncheckedIcon style={{ color: '#d97706', fontSize: '16px' }} />
                      )}
                      <Typography.Text style={{ color: record.isRead ? '#059669' : '#d97706' }}>
                        {record.isRead ? 'Ko\'rilgan' : 'Ko\'rilmagan'}
                      </Typography.Text>
                    </div>
                    <Typography.Text style={{ fontSize: '12px', color: '#64748b' }}>
                      {formatDate(record.createdAt)}
                    </Typography.Text>
                  </div>
                ),
              },
              {
                title: 'Harakatlar',
                key: 'actions',
                render: (_, record) => (
                  <Button
                    type="primary"
                    size="small"
                    icon={<DoneIcon />}
                    onClick={() => setConfirmDialog({ open: true, lesson: record })}
                    style={{
                      backgroundColor: '#059669',
                      borderColor: '#059669',
                      fontWeight: 600
                    }}
                  >
                    Dars o'tildi
                  </Button>
                ),
              },
            ]}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Jami ${total} ta dars`,
            }}
          />
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        open={confirmDialog.open}
        onCancel={() => setConfirmDialog({ open: false, lesson: null })}
        title="Darsni tugagan deb belgilash"
        footer={[
          <Button key="cancel" onClick={() => setConfirmDialog({ open: false, lesson: null })}>
            Bekor qilish
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={() => {
              if (confirmDialog.lesson) {
                markLessonCompleted(confirmDialog.lesson.id);
              }
              setConfirmDialog({ open: false, lesson: null });
            }}
            style={{ backgroundColor: '#059669', borderColor: '#059669' }}
          >
            Tasdiqlash
          </Button>
        ]}
      >
        <Typography.Text>
          "{confirmDialog.lesson?.lessonTopic}" mavzusidagi darsni tugagan deb belgilamoqchimisiz?
          Bu amal o'quvchi bildirishnomasini o'chiradi va ortga qaytarib bo'lmaydi.
        </Typography.Text>
      </Modal>
    </div>
  );
};

export default SentLessons;