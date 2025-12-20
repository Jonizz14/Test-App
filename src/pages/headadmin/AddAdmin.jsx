import React, { useState } from 'react';
import {
  Typography,
  Form,
  Input,
  Button,
  Alert,
  Space,
  Card,
  Spin,
  Divider,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const AddAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get admin ID from URL for editing
  const isEditMode = !!id; // Check if we're in edit mode

  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(isEditMode); // Loading state for edit mode

  // Load admin data for editing
  React.useEffect(() => {
    if (isEditMode) {
      const loadAdminData = async () => {
        try {
          const admin = await apiService.getUser(id);
          if (admin) {
            // Split name into first and last name
            const nameParts = admin.name ? admin.name.split(' ') : ['', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            form.setFieldsValue({
              firstName,
              lastName,
              email: admin.email || '',
              organization: admin.organization || 'Default Organization',
            });
          }
        } catch (error) {
          console.error('Failed to load admin data:', error);
          setError('Admin ma\'lumotlarini yuklashda xatolik yuz berdi');
        } finally {
          setLoading(false);
        }
      };

      loadAdminData();
    }
  }, [id, isEditMode, form]);

  const handleSubmit = async (values) => {
    setError('');
    setSuccess('');

    // Validate required fields
    if (!values.firstName || !values.lastName || !values.email || !values.organization) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }

    // In create mode, password is required
    if (!isEditMode && !values.password) {
      setError('Parol kiritish majburiy');
      return;
    }

    try {
      const adminData = {
        name: `${values.firstName} ${values.lastName}`,
      };

      if (isEditMode) {
        // Update existing admin
        const updateData = {
          first_name: values.firstName,
          last_name: values.lastName,
          name: adminData.name,
          organization: values.organization,
        };

        // Only include password if it's provided
        if (values.password) {
          updateData.password = values.password;
        }

        console.log('Updating admin with data:', updateData);
        await apiService.updateUser(id, updateData);
        setSuccess('Admin ma\'lumotlari muvaffaqiyatli yangilandi!');
      } else {
        // Check if email already exists
        const allUsers = await apiService.getUsers();
        const existingAdmin = allUsers.find(a => a.email === values.email);
        if (existingAdmin) {
          setError('Bu email bilan admin allaqachon mavjud');
          return;
        }

        // Create new admin via API
        console.log('Creating admin with data:', {
          username: values.email,
          email: values.email,
          password: values.password,
          role: 'admin',
          first_name: values.firstName,
          last_name: values.lastName,
          name: adminData.name,
          organization: values.organization,
        });

        const response = await apiService.post('/users/', {
          username: values.email,
          email: values.email,
          password: values.password,
          role: 'admin',
          first_name: values.firstName,
          last_name: values.lastName,
          name: adminData.name,
          organization: values.organization,
        });

        console.log('Admin creation response:', response);

        setSuccess(
          <div>
            <strong>✅ Admin muvaffaqiyatli qo'shildi!</strong><br/>
            <strong>Login ma'lumotlari:</strong><br/>
            Email: {values.email}<br/>
            Parol: {values.password}<br/>
            Tashkilot: {values.organization}
          </div>
        );
        
        // Reset form
        form.resetFields();
      }

    } catch (err) {
      console.error('Failed to save admin:', err);
      setError('Xatolik yuz berdi: ' + (err.message || 'Noma\'lum xatolik'));
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16 }}>Ma'lumotlar yuklanmoqda...</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/headadmin/admins')}
          style={{ marginBottom: 16 }}
        >
          Adminlarni boshqarishga qaytish
        </Button>
        
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          {isEditMode ? 'Admin ma\'lumotlarini tahrirlash' : 'Yangi admin qo\'shish'}
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          {isEditMode ? 'Admin ma\'lumotlarini yangilang' : 'Yangi admin ma\'lumotlarini kiriting'}
        </Text>
      </div>

      {/* Success Message */}
      {success && (
        <Alert
          message={success}
          type="success"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Error Message */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Form */}
      <Card
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            organization: 'Default Organization',
          }}
        >
          <Form.Item
            name="firstName"
            label="Ism"
            rules={[{ required: true, message: 'Ism kiritish majburiy!' }]}
          >
            <Input
              size="large"
              placeholder="Ism kiriting"
            />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Familiya"
            rules={[{ required: true, message: 'Familiya kiritish majburiy!' }]}
          >
            <Input
              size="large"
              placeholder="Familiya kiriting"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email manzil"
            rules={[
              { required: true, message: 'Email kiritish majburiy!' },
              { type: 'email', message: 'To\'g\'ri email manzili kiriting!' }
            ]}
          >
            <Input
              size="large"
              placeholder="admin@example.com"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={isEditMode ? "Yangi parol (ixtiyoriy)" : "Parol"}
            rules={[
              !isEditMode && { required: true, message: 'Parol kiritish majburiy!' },
              { min: 6, message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak!' }
            ].filter(Boolean)}
          >
            <Input.Password
              size="large"
              placeholder={isEditMode ? "O'zgartirish uchun yangi parol kiriting" : "Xavfsiz parol kiriting"}
            />
          </Form.Item>

          <Form.Item
            name="organization"
            label="Tashkilot"
            rules={[{ required: true, message: 'Tashkilot nomini kiritish majburiy!' }]}
          >
            <Input
              size="large"
              placeholder="Qaysi tashkilotda ishlaydi"
            />
          </Form.Item>

          <Divider />

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button
              size="large"
              onClick={() => navigate('/headadmin/admins')}
            >
              Bekor qilish
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              style={{
                backgroundColor: '#dc2626',
                borderColor: '#dc2626',
                fontWeight: 600
              }}
            >
              {isEditMode ? 'Admin ma\'lumotlarini saqlash' : 'Admin qo\'shish'}
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default AddAdmin;