import React, { useState } from 'react';
import { Form, Input, Select, Button, Alert, Spin, Typography, Space, DatePicker, ConfigProvider, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../data/apiService';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const AddStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [form] = Form.useForm();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    classGroup: '',
    direction: 'natural',
    registrationDate: dayjs(),
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(isEditMode);

  React.useEffect(() => {
    if (isEditMode) {
      const loadStudentData = async () => {
        try {
          const student = await apiService.getUser(id);
          if (student) {
            const nameParts = student.name ? student.name.split(' ') : ['', ''];
            const data = {
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              classGroup: student.class_group || '',
              direction: student.direction || 'natural',
              registrationDate: student.registration_date ? dayjs(student.registration_date.split('T')[0]) : dayjs(),
            };
            setFormData(data);
            form.setFieldsValue(data);
          }
        } catch (error) {
          setError('O\'quvchi ma\'lumotlarini yuklashda xatolik yuz berdi');
        } finally {
          setLoading(false);
        }
      };
      loadStudentData();
    }
  }, [id, isEditMode, form]);

  const handleSubmit = async (values) => {
    setError('');
    setSuccess('');
    try {
      const studentData = {
        name: `${values.firstName} ${values.lastName}`,
        class_group: values.classGroup,
        direction: formData.direction,
        registration_date: formData.registrationDate.format('YYYY-MM-DD'),
      };

      if (isEditMode) {
        await apiService.updateUser(id, studentData);
        setSuccess('O\'QUVCHI MA\'LUMOTLARI YANGILANDI!');
      } else {
        const response = await apiService.post('/users/', {
          ...studentData,
          first_name: values.firstName,
          last_name: values.lastName,
          role: 'student',
        });
        setSuccess('YANGI O\'QUVCHI MUVAFFAQIYATLI QO\'SHILDI!');
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
      <div  style={{ padding: '40px 0' }}>
        {/* Brutalist Header */}
        <div style={{ marginBottom: '60px' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/students')}
            style={{ marginBottom: 24, fontWeight: 800, textTransform: 'uppercase', padding: 0 }}
          >
            ORTGA QAYTISH
          </Button>
          
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
            {isEditMode ? 'Tahrirlash' : 'Qo\'shish'}
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
            {isEditMode ? 'Profilni Tahrirlash' : 'Yangi O\'quvchi Qo\'shish'}
          </Title>
          <div style={{ 
            width: '80px', 
            height: '10px', 
            backgroundColor: '#000', 
            margin: '24px 0' 
          }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            O'quvchi ma'lumotlarini aniq va to'g'ri kiriting.
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

        <div  style={{ 
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

              <Form.Item name="classGroup" label={<Text style={{ fontWeight: 900 }}>SINF</Text>} rules={[{ required: true }]}>
                <Select
                  onChange={(value) => {
                    const direction = value.endsWith('-A') ? 'exact' : 'natural';
                    setFormData({ ...formData, classGroup: value, direction });
                  }}
                  style={{ borderRadius: 0, height: '50px' }}
                >
                  {[5,6,7,8,9,10,11].flatMap(grade =>
                    [1,2,3,4].flatMap(num => {
                      const baseClass = `${grade}-${String(num).padStart(2,'0')}`;
                      return ['A', 'T'].map(suffix => {
                        const classGroup = `${baseClass}-${suffix}`;
                        return <Select.Option key={classGroup} value={classGroup}>{classGroup}</Select.Option>;
                      });
                    })
                  )}
                </Select>
              </Form.Item>

              <Form.Item label={<Text style={{ fontWeight: 900 }}>RO'YXATDAN O'TGAN SANA</Text>}>
                <DatePicker
                  value={formData.registrationDate}
                  onChange={(date) => setFormData({ ...formData, registrationDate: date })}
                  style={{ width: '100%', borderRadius: 0, border: '3px solid #000', height: '50px' }}
                />
              </Form.Item>

              <Divider style={{ borderTop: '4px solid #000', margin: '20px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <Button 
                  onClick={() => navigate('/admin/students')}
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

export default AddStudent;