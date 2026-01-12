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
  Select,
  Row,
  Col,
  Badge,
  ConfigProvider,
} from 'antd';
import {
  EyeOutlined,
  MessageOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import apiService from '../../data/apiService';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;
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

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContactMessages();
      setMessages(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filteredMessages = messages.filter(message => {
    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    const matchesSubject = filterSubject === 'all' || message.subject === filterSubject;
    const matchesSearch = searchTerm === '' || 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSubject && matchesSearch;
  });

  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'Yangi';
      case 'read': return 'O\'qilgan';
      case 'replied': return 'Javob berilgan';
      case 'closed': return 'Yopilgan';
      default: return status;
    }
  };

  const getSubjectText = (subject) => {
    switch (subject) {
      case 'technical': return 'Texnik yordam';
      case 'billing': return 'To\'lov masalalari';
      case 'feature': return 'Funksiya taklifi';
      case 'partnership': return 'Hamkorlik';
      case 'other': return 'Boshqa';
      default: return subject;
    }
  };

  const updateMessageStatus = async (messageId, newStatus) => {
    try {
      await apiService.updateContactMessageStatus(messageId, { status: newStatus });
      setSuccessMessage('XABAR HOLATI YANGILANDI');
      fetchMessages();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update message status:', error);
    }
  };

  const replyToMessage = async () => {
    if (!replyText.trim()) return;
    try {
      const response = await apiService.replyToContactMessage(selectedMessage.id, { admin_reply: replyText });
      setSuccessMessage(response.email_sent ? 'JAVOB YUBORILDI!' : 'JAVOB YUBORILDI (EMAIL XATOSI)');
      fetchMessages();
      setReplyDialogOpen(false);
      setReplyText('');
      setSelectedMessage(null);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Failed to reply to message:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const columns = [
    {
      title: 'ISM',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>{name}</Text>
          {record.status === 'new' && <Badge status="error" />}
        </Space>
      ),
    },
    {
      title: 'MAVZU',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => <Text style={{ fontWeight: 700 }}>{getSubjectText(subject).toUpperCase()}</Text>,
    },
    {
      title: 'HOLAT',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag style={{ 
          borderRadius: 0, 
          border: '2px solid #000', 
          fontWeight: 900, 
          backgroundColor: status === 'new' ? '#ff4d4f' : (status === 'replied' ? '#000' : '#fff'),
          color: status === 'new' || status === 'replied' ? '#fff' : '#000'
        }}>
          {getStatusText(status).toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'SANA',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => <Text style={{ fontSize: '12px', fontWeight: 600 }}>{formatDate(date)}</Text>,
    },
    {
      title: 'AMALLAR',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedMessage(record);
              if (record.status === 'new') updateMessageStatus(record.id, 'read');
            }}
            style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800 }}
          >KO'RISH</Button>
          {record.status !== 'replied' && (
            <Button
              size="small"
              icon={<MessageOutlined />}
              onClick={() => {
                setSelectedMessage(record);
                setReplyDialogOpen(true);
              }}
              style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800, backgroundColor: '#000', color: '#fff' }}
            >JAVOB</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 0,
          colorPrimary: '#000',
        },
      }}
    >
      <div style={{ padding: '40px 0' }}>
        {/* Brutalist Header */}
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '60px' }}>
          <div style={{ 
            display: 'inline-block', 
            backgroundColor: '#000', 
            color: '#fff', 
            padding: '8px 16px', 
            fontWeight: 900, 
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '16px'
          }}>
            Xabarlar
          </div>
          <Title level={1} style={{ 
            margin: 0, 
            fontWeight: 900, 
            fontSize: '2.5rem', 
            lineHeight: 0.9, 
            textTransform: 'uppercase',
            letterSpacing: '-0.05em',
            color: '#000'
          }}>
            Foydalanuvchi Murojaatlari
          </Title>
          <div style={{ 
            width: '80px', 
            height: '10px', 
            backgroundColor: '#000', 
            margin: '24px 0' 
          }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Kontakt formasi orqali kelgan barcha savol va takliflarni boshqarish markazi.
          </Paragraph>
        </div>

        {successMessage && (
          <Alert
            message={successMessage}
            type="success"
            showIcon
            style={{ borderRadius: 0, border: '3px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 900, marginBottom: '24px' }}
          />
        )}

        {/* Filter Section */}
        <div className="animate__animated animate__fadeIn" style={{ 
          marginBottom: '32px', 
          padding: '24px', 
          border: '4px solid #000', 
          backgroundColor: '#eee',
          boxShadow: '8px 8px 0px #000' 
        }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={10}>
              <Input
                placeholder="QIDIRISH..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: 0, border: '2px solid #000', height: '45px', fontWeight: 700 }}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={12} md={7}>
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: '100%', height: '45px' }}
                className="brutalist-select"
              >
                <Select.Option value="all">BARCHA HOLATLAR</Select.Option>
                <Select.Option value="new">YANGI</Select.Option>
                <Select.Option value="read">O'QILGAN</Select.Option>
                <Select.Option value="replied">JAVOB BERILGAN</Select.Option>
              </Select>
            </Col>
            <Col xs={12} md={7}>
              <Select
                value={filterSubject}
                onChange={setFilterSubject}
                style={{ width: '100%', height: '45px' }}
              >
                <Select.Option value="all">BARCHA MAVZULAR</Select.Option>
                <Select.Option value="technical">TEXNIK YORDAM</Select.Option>
                <Select.Option value="billing">TO'LOV</Select.Option>
                <Select.Option value="feature">TAKLIFLAR</Select.Option>
              </Select>
            </Col>
          </Row>
        </div>

        {/* Table Section */}
        <div className="animate__animated animate__fadeIn" style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000', backgroundColor: '#fff' }}>
          <Table
            columns={columns}
            dataSource={filteredMessages}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
          />
        </div>

        {/* Details Modal */}
        <Modal
          title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>Xabar Tafsilotlari</Text>}
          open={!!selectedMessage && !replyDialogOpen}
          onCancel={() => setSelectedMessage(null)}
          footer={[
            <Button key="close" onClick={() => setSelectedMessage(null)} style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800 }}>YOPISH</Button>
          ]}
          width={700}
          styles={{
            content: {
              border: '6px solid #000',
              borderRadius: 0,
              boxShadow: '15px 15px 0px #000',
            }
          }}
        >
          {selectedMessage && (
            <div style={{ padding: '20px 0' }}>
              <Paragraph><strong>ISM:</strong> {selectedMessage.name.toUpperCase()}</Paragraph>
              <Paragraph><strong>EMAIL:</strong> {selectedMessage.email}</Paragraph>
              <Paragraph><strong>MAVZU:</strong> {getSubjectText(selectedMessage.subject).toUpperCase()}</Paragraph>
              <div style={{ padding: '20px', border: '2px solid #000', backgroundColor: '#f9f9f9', marginBottom: '20px' }}>
                <Text style={{ fontWeight: 600 }}>{selectedMessage.message}</Text>
              </div>
              {selectedMessage.admin_reply && (
                <div style={{ padding: '20px', border: '2px solid #000', backgroundColor: '#000', color: '#fff' }}>
                  <Text style={{ fontWeight: 900, color: '#fff', display: 'block', marginBottom: '10px' }}>ADMIN JAVOBI:</Text>
                  <Text style={{ fontWeight: 500, color: '#fff' }}>{selectedMessage.admin_reply}</Text>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Reply Modal */}
        <Modal
          title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>Javob Berish</Text>}
          open={replyDialogOpen}
          onCancel={() => setReplyDialogOpen(false)}
          footer={[
            <Button key="send" onClick={replyToMessage} style={{ borderRadius: 0, border: '2px solid #000', backgroundColor: '#000', color: '#fff', fontWeight: 900 }}>YUBORISH</Button>
          ]}
          styles={{
            content: {
              border: '6px solid #000',
              borderRadius: 0,
              boxShadow: '15px 15px 0px #000',
            }
          }}
        >
          <TextArea
            rows={6}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            style={{ borderRadius: 0, border: '2px solid #000', marginTop: '20px' }}
            placeholder="JAVOBINGIZNI YOZING..."
          />
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default ContactMessages;