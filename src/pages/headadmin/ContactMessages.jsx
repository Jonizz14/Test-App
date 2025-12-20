import React, { useState, useEffect } from 'react';
import {
  Typography,
  Table,
  Button,
  Tag,
  Modal,
  Input,
  Space,
  Alert,
  Card,
  Select,
  Row,
  Col,
  Badge,
  Avatar,
  Divider,
} from 'antd';
import {
  EyeOutlined,
  MessageOutlined,
  MailOutlined,
  SearchOutlined,
  FilterOutlined,
  CloseOutlined,
  MailTwoTone,
} from '@ant-design/icons';
import apiService from '../../data/apiService';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { TextArea } = Input;

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch contact messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContactMessages();
      setMessages(Array.isArray(response) ? response : response.data || []);
      console.log('Messages fetched:', response);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Filter messages based on status, subject, and search term
  const filteredMessages = messages.filter(message => {
    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    const matchesSubject = filterSubject === 'all' || message.subject === filterSubject;
    const matchesSearch = searchTerm === '' || 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSubject && matchesSearch;
  });

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'error';
      case 'read': return 'warning';
      case 'replied': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  // Get status text in Uzbek
  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'Yangi';
      case 'read': return 'O\'qilgan';
      case 'replied': return 'Javob berilgan';
      case 'closed': return 'Yopilgan';
      default: return status;
    }
  };

  // Get subject text in Uzbek
  const getSubjectText = (subject) => {
    switch (subject) {
      case 'technical': return 'Texnik yordam';
      case 'billing': return 'To\'lov masalalari';
      case 'feature': return 'Yangi funksiya taklifi';
      case 'partnership': return 'Hamkorlik';
      case 'other': return 'Boshqa';
      default: return subject;
    }
  };

  // Update message status
  const updateMessageStatus = async (messageId, newStatus) => {
    try {
      await apiService.updateContactMessageStatus(messageId, { status: newStatus });
      setSuccessMessage('Xabar holati yangilandi');
      fetchMessages();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update message status:', error);
    }
  };

  // Reply to message
  const replyToMessage = async () => {
    if (!replyText.trim()) return;
    
    try {
      const response = await apiService.replyToContactMessage(selectedMessage.id, { admin_reply: replyText });
      
      // Show success message based on email sending status
      if (response.email_sent) {
        setSuccessMessage('Javob yuborildi va email xabar yuborildi!');
      } else {
        setSuccessMessage('Javob yuborildi (email yuborishda muammo)');
      }
      
      fetchMessages();
      setReplyDialogOpen(false);
      setReplyText('');
      setSelectedMessage(null);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Failed to reply to message:', error);
    }
  };

  // Open message details
  const openMessageDetails = (message) => {
    setSelectedMessage(message);
    // Mark as read if it's new
    if (message.status === 'new') {
      updateMessageStatus(message.id, 'read');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      title: 'Ism',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <Text strong={record.status === 'new'}>{name}</Text>
          {record.status === 'new' && (
            <Badge 
              count="Yangi" 
              style={{ 
                backgroundColor: '#ff4d4f', 
                fontSize: '10px',
                marginLeft: '8px'
              }} 
            />
          )}
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <Text code style={{ fontSize: '12px' }}>{email}</Text>
      ),
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '-',
    },
    {
      title: 'Mavzu',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => getSubjectText(subject),
    },
    {
      title: 'Holati',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Sana',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDate(date),
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => openMessageDetails(record)}
          >
            Ko'rish
          </Button>
          
          {record.status !== 'replied' && (
            <Button
              size="small"
              type="primary"
              icon={<MessageOutlined />}
              onClick={() => {
                setSelectedMessage(record);
                setReplyDialogOpen(true);
              }}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Javob
            </Button>
          )}
          
          {record.status === 'new' && (
            <Button
              size="small"
              icon={<MailTwoTone twoToneColor="#faad14" />}
              onClick={() => updateMessageStatus(record.id, 'read')}
            >
              O'qilgan
            </Button>
          )}
        </Space>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
            Xabarlar
          </Title>
          <Space>
            <MailOutlined style={{ color: '#6366f1', fontSize: '24px' }} />
            <Text style={{ color: '#6366f1', fontSize: '18px', fontWeight: 600 }}>
              {filteredMessages.length} ta xabar
            </Text>
          </Space>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <Alert
          message={successMessage}
          type="success"
          showIcon
          closable
          onClose={() => setSuccessMessage('')}
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Filters and Search */}
      <Card style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilterOutlined style={{ color: '#374151' }} />
            <Text strong style={{ color: '#374151' }}>
              Filtr va Qidiruv
            </Text>
          </div>
          
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<SearchOutlined />}
              />
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Holati"
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: '100%' }}
                allowClear
              >
                <Select.Option value="all">Barchasi</Select.Option>
                <Select.Option value="new">Yangi</Select.Option>
                <Select.Option value="read">O'qilgan</Select.Option>
                <Select.Option value="replied">Javob berilgan</Select.Option>
                <Select.Option value="closed">Yopilgan</Select.Option>
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Mavzu"
                value={filterSubject}
                onChange={setFilterSubject}
                style={{ width: '100%' }}
                allowClear
              >
                <Select.Option value="all">Barchasi</Select.Option>
                <Select.Option value="technical">Texnik yordam</Select.Option>
                <Select.Option value="billing">To'lov masalalari</Select.Option>
                <Select.Option value="feature">Yangi funksiya taklifi</Select.Option>
                <Select.Option value="partnership">Hamkorlik</Select.Option>
                <Select.Option value="other">Boshqa</Select.Option>
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={4}>
              <Button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterSubject('all');
                  setSearchTerm('');
                }}
                style={{ width: '100%' }}
              >
                Tozalash
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Messages Table */}
      <Table
        columns={columns}
        dataSource={filteredMessages}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} xabar`,
        }}
        locale={{
          emptyText: 'Xabarlar topilmadi',
        }}
        rowClassName={(record) => record.status === 'new' ? 'new-message-row' : ''}
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      />

      {/* Message Details Modal */}
      <Modal
        title="Xabar tafsilotlari"
        open={!!selectedMessage && !replyDialogOpen}
        onCancel={() => setSelectedMessage(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedMessage(null)}>
            Yopish
          </Button>,
          selectedMessage?.status !== 'replied' && (
            <Button
              key="reply"
              type="primary"
              icon={<MessageOutlined />}
              onClick={() => setReplyDialogOpen(true)}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Javob berish
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedMessage && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Ism:</Text>
              <br />
              <Text>{selectedMessage.name}</Text>
            </div>
            
            <div>
              <Text strong>Email:</Text>
              <br />
              <Text code>{selectedMessage.email}</Text>
            </div>
            
            {selectedMessage.phone && (
              <div>
                <Text strong>Telefon:</Text>
                <br />
                <Text>{selectedMessage.phone}</Text>
              </div>
            )}
            
            <div>
              <Text strong>Mavzu:</Text>
              <br />
              <Tag>{getSubjectText(selectedMessage.subject)}</Tag>
            </div>
            
            <div>
              <Text strong>Xabar:</Text>
              <div style={{ 
                marginTop: '8px',
                padding: '12px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '6px',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedMessage.message}
              </div>
            </div>
            
            <div>
              <Text strong>Yuborilgan sana:</Text>
              <br />
              <Text>{formatDate(selectedMessage.created_at)}</Text>
            </div>
            
            <div>
              <Text strong>Holati:</Text>
              <br />
              <Tag color={getStatusColor(selectedMessage.status)}>
                {getStatusText(selectedMessage.status)}
              </Tag>
            </div>
            
            {selectedMessage.admin_reply && (
              <>
                <Divider />
                <div>
                  <Text strong>Admin javobi:</Text>
                  <div style={{ 
                    marginTop: '8px',
                    padding: '12px', 
                    backgroundColor: '#e0f2fe', 
                    borderRadius: '6px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedMessage.admin_reply}
                  </div>
                  {selectedMessage.replied_by_name && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Javob bergan: {selectedMessage.replied_by_name} - {selectedMessage.replied_at && formatDate(selectedMessage.replied_at)}
                    </Text>
                  )}
                </div>
              </>
            )}
          </Space>
        )}
      </Modal>

      {/* Reply Modal */}
      <Modal
        title={`${selectedMessage?.name} ga javob berish`}
        open={replyDialogOpen}
        onCancel={() => {
          setReplyDialogOpen(false);
          setReplyText('');
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setReplyDialogOpen(false);
            setReplyText('');
          }}>
            Bekor qilish
          </Button>,
          <Button
            key="send"
            type="primary"
            onClick={replyToMessage}
            disabled={!replyText.trim()}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Javob yuborish
          </Button>,
        ]}
      >
        <TextArea
          rows={4}
          placeholder="Javobingizni yozing..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default ContactMessages;