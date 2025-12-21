import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Tag,
  Switch,
  Alert,
  Modal,
  Typography,
  Space,
  Popconfirm,
  Input,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const ManageTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const allTests = await apiService.getTests();
      setTests(allTests.results || allTests);
    } catch (error) {
      console.error('Failed to load tests:', error);
      setError('Testlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (testId) => {
    try {
      const test = tests.find(t => t.id === testId);
      if (test) {
        await apiService.updateTest(testId, { is_active: !test.is_active });
        await loadTests();
        setSuccess(`Test ${!test.is_active ? 'faollashtirildi' : 'nofaollashtirildi'}`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Failed to toggle test status:', error);
      setError('Test holatini o\'zgartirishda xatolik yuz berdi');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteClick = (test) => {
    setTestToDelete(test);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!testToDelete) return;

    try {
      await apiService.deleteTest(testToDelete.id);
      await loadTests();
      setSuccess('Test muvaffaqiyatli o\'chirildi!');
      setDeleteModalVisible(false);
      setTestToDelete(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to delete test:', error);
      setError('Testni o\'chirishda xatolik yuz berdi');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusTag = (isActive) => (
    <Tag color={isActive !== false ? 'green' : 'default'}>
      {isActive !== false ? 'Faol' : 'Nofaol'}
    </Tag>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter tests based on search term
  const filteredTests = tests.filter(test => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      test.title?.toLowerCase().includes(searchLower) ||
      test.subject?.toLowerCase().includes(searchLower) ||
      test.teacher_name?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: 'Sarlavha',
      dataIndex: 'title',
      key: 'title',
      render: (text) => (
        <Text strong style={{ color: '#1e293b' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Fan',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => (
        <Tag
          color={subject === 'Ingliz tili' ? 'blue' : 'geekblue'}
          style={{
            backgroundColor: subject === 'Ingliz tili' ? '#3b82f6' : '#eff6ff',
            color: subject === 'Ingliz tili' ? '#ffffff' : '#2563eb',
            fontWeight: 500,
            borderRadius: '6px',
            border: subject === 'Ingliz tili' ? '1px solid #3b82f6' : 'none'
          }}
        >
          {subject}
        </Tag>
      ),
    },
    {
      title: 'O\'qituvchi',
      dataIndex: 'teacher_name',
      key: 'teacher_name',
      render: (text) => (
        <Text style={{ color: '#64748b' }}>
          {text || 'Noma\'lum'}
        </Text>
      ),
    },
    {
      title: 'Savollar',
      dataIndex: 'total_questions',
      key: 'total_questions',
      align: 'center',
      render: (count) => (
        <Text strong style={{ color: '#059669', fontSize: '18px' }}>
          {count}
        </Text>
      ),
    },
    {
      title: 'Vaqt (daq)',
      dataIndex: 'time_limit',
      key: 'time_limit',
      align: 'center',
      render: (time) => (
        <Text strong style={{ color: '#1e293b' }}>
          {time}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center',
      render: (isActive, record) => (
        <Space direction="vertical" size="small">
          {getStatusTag(isActive !== false)}
          <Switch
            size="small"
            checked={isActive !== false}
            onChange={() => handleToggleActive(record.id)}
          />
        </Space>
      ),
    },
    {
      title: 'Yaratilgan',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (
        <Text style={{ color: '#64748b', fontSize: '12px' }}>
          {formatDate(date)}
        </Text>
      ),
    },
    {
      title: 'Harakatlar',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              console.log('Edit test:', record.id);
            }}
            style={{ color: '#2563eb' }}
          />
          <Popconfirm
            title="Testni o'chirishni tasdiqlang"
            description="Haqiqatan ham ushbu testni o'chirishni xohlaysizmi?"
            onConfirm={handleDelete}
            okText="Ha"
            cancelText="Yo'q"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteClick(record)}
              style={{ color: '#dc2626' }}
            />
          </Popconfirm>
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
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Testlarni boshqarish
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Testlarni ko'rish, tahrirlash va boshqarish
        </Text>
      </div>

      {/* Alerts */}
      {success && (
        <Alert
          message={success}
          type="success"
          showIcon
          style={{ marginBottom: '16px' }}
          closable
          onClose={() => setSuccess('')}
        />
      )}

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

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <Input
          placeholder="Test nomi, fan yoki o'qituvchi bo'yicha qidirish..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '300px',
            borderRadius: '8px'
          }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            console.log('Add new test');
          }}
          style={{
            backgroundColor: '#2563eb',
            borderColor: '#2563eb',
            fontWeight: 600
          }}
        >
          Test qo'shish
        </Button>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <Text style={{ marginBottom: '16px', color: '#64748b' }}>
          {filteredTests.length} ta test topildi
        </Text>
      )}

      {/* Table */}
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
          dataSource={filteredTests}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami ${total} ta test`,
          }}
          locale={{
            emptyText: 'Hech qanday test topilmadi'
          }}
        />
      </Card>

      {/* Empty State */}
      {filteredTests.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Text style={{ fontSize: '16px', color: '#64748b' }}>
            {searchTerm ? 'Qidiruv bo\'yicha testlar topilmadi' : 'Hech qanday test mavjud emas'}
          </Text>
          <br />
          {!searchTerm && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                console.log('Add new test');
              }}
              style={{ marginTop: '16px' }}
            >
              Birinchi testni yaratish
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        title="Testni o'chirishni tasdiqlang"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="O'chirish"
        cancelText="Bekor qilish"
        okButtonProps={{ danger: true }}
      >
        <div>
          <Text>Haqiqatan ham ushbu testni o'chirishni xohlaysizmi?</Text>
          {testToDelete && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px'
            }}>
              <Text strong>{testToDelete.title}</Text>
              <br />
              <Text type="secondary">Fan: {testToDelete.subject}</Text>
            </div>
          )}
          <Alert
            message="E'tibor"
            description="Bu amal qaytarib bo'lmaydi. Test va uning barcha ma'lumotlari o'chiriladi."
            type="warning"
            showIcon
            style={{ marginTop: '16px' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ManageTests;