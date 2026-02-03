import React, { useState } from 'react';
import {
  Typography,
  Form,
  Input,
  Button,
  Space,
  Spin,
  Divider,
  ConfigProvider,
  notification,
} from 'antd';
import { ArrowLeftOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../data/apiService';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;

const AddAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(isEditMode);

  React.useEffect(() => {
    if (isEditMode) {
      const loadAdminData = async () => {
        try {
          const admin = await apiService.getUser(id);
          if (admin) {
            const nameParts = admin.name ? admin.name.split(' ') : ['', ''];
            form.setFieldsValue({
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: admin.email || '',
              organization: admin.organization || 'Default Organization',
            });
          }
        } catch (error) {
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
    try {
      const adminData = { name: `${values.firstName} ${values.lastName}` };
      if (isEditMode) {
        const updateData = {
          first_name: values.firstName,
          last_name: values.lastName,
          name: adminData.name,
          organization: values.organization,
        };
        if (values.password) updateData.password = values.password;
        await apiService.updateUser(id, updateData);
        notification.open({
          message: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '14px' }}>ADMINISTRATOR</span>
              <span style={{ color: '#666', fontSize: '14px' }}>yangilandi</span>
            </div>
          ),
          icon: <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: '20px' }} />,
          style: {
            backgroundColor: '#000',
            borderRadius: '12px',
            border: '1px solid #222',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            padding: '12px 20px',
          },
          closeIcon: null,
        });
      } else {
        await apiService.post('/users/', {
          username: values.email,
          email: values.email,
          password: values.password,
          role: 'admin',
          first_name: values.firstName,
          last_name: values.lastName,
          name: adminData.name,
          organization: values.organization,
        });
        notification.open({
          message: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '14px' }}>ADMINISTRATOR</span>
              <span style={{ color: '#666', fontSize: '14px' }}>saqlandi</span>
            </div>
          ),
          icon: <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: '20px' }} />,
          style: {
            backgroundColor: '#000',
            borderRadius: '12px',
            border: '1px solid #222',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            padding: '12px 20px',
          },
          closeIcon: null,
        });
        form.resetFields();
      }
    } catch (err) {
      setError('Xatolik yuz berdi: ' + (err.message || 'Noma\'lum xatolik'));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, fontWeight: 800 }}>YUKLANMOQDA...</Text>
      </div>
    );
  }

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
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/headadmin/admins')}
            style={{ marginBottom: 24, fontWeight: 800, textTransform: 'uppercase', padding: 0 }}
          >
            ORTGA QAYTISH
          </Button>
          <Title level={1} style={{ 
            margin: 0, 
            fontWeight: 900, 
            fontSize: '2.5rem', 
            lineHeight: 0.9, 
            textTransform: 'uppercase',
            letterSpacing: '-0.05em',
            color: '#000'
          }}>
            {isEditMode ? 'Profilni Tahrirlash' : 'Yangi Admin Qo\'shish'}
          </Title>
          <div style={{ 
            width: '80px', 
            height: '10px', 
            backgroundColor: '#000', 
            margin: '24px 0' 
          }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Administrator ma'lumotlarini aniq va to'g'ri kiriting.
          </Paragraph>
        </div>

        {success && (
          <Alert
            message={success}
            type="success"
            showIcon
            style={{ borderRadius: 0, border: '3px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 900, marginBottom: '24px', maxWidth: '800px' }}
          />
        )}

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ borderRadius: 0, border: '3px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 900, marginBottom: '24px', maxWidth: '800px' }}
          />
        )}

        <div className="animate__animated animate__fadeIn" style={{ 
          maxWidth: '800px',
          padding: '40px',
          border: '4px solid #000',
          boxShadow: '15px 15px 0px #000',
          backgroundColor: '#fff',
          margin: '0 auto'
        }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
          >
            <Space style={{ width: '100%' }} size="large" direction="vertical">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <Form.Item name="firstName" label={<Text style={{ fontWeight: 900 }}>ISM</Text>} rules={[{ required: true }]}>
                  <Input style={{ borderRadius: 0, border: '3px solid #000' }} />
                </Form.Item>
                <Form.Item name="lastName" label={<Text style={{ fontWeight: 900 }}>FAMILIYA</Text>} rules={[{ required: true }]}>
                  <Input style={{ borderRadius: 0, border: '3px solid #000' }} />
                </Form.Item>
              </div>

              <Form.Item name="email" label={<Text style={{ fontWeight: 900 }}>EMAIL MANZIL</Text>} rules={[{ required: true, type: 'email' }]}>
                <Input disabled={isEditMode} style={{ borderRadius: 0, border: '3px solid #000' }} />
              </Form.Item>

              <Form.Item name="password" label={<Text style={{ fontWeight: 900 }}>{isEditMode ? "YANGI PAROL (IXTIYORIY)" : "PAROL"}</Text>} rules={[{ required: !isEditMode, min: 6 }]}>
                <Input.Password style={{ borderRadius: 0, border: '3px solid #000' }} />
              </Form.Item>

              <Form.Item name="organization" label={<Text style={{ fontWeight: 900 }}>TASHKILOT</Text>} rules={[{ required: true }]}>
                <Input style={{ borderRadius: 0, border: '3px solid #000' }} />
              </Form.Item>

              <Divider style={{ borderTop: '4px solid #000', margin: '20px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <Button 
                  onClick={() => navigate('/headadmin/admins')}
                  style={{ borderRadius: 0, border: '3px solid #000', height: '50px', fontWeight: 900, padding: '0 30px' }}
                >BEKOR QILISH</Button>
                <Button 
                  type="primary"
                  htmlType="submit"
                  style={{ borderRadius: 0, border: '3px solid #000', height: '50px', fontWeight: 900, padding: '0 30px', backgroundColor: '#000', color: '#fff' }}
                >{isEditMode ? 'SAQLASH' : 'QO\'SHISH'}</Button>
              </div>
            </Space>
          </Form>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AddAdmin;