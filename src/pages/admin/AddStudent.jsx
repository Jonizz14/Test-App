import React, { useState } from 'react';
import { Form, Input, Select, Button, Alert, Spin, Typography, Card, DatePicker } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../data/apiService';
import dayjs from 'dayjs';

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
        setSuccess('O\'quvchi ma\'lumotlari muvaffaqiyatli yangilandi!');
      } else {
        const response = await apiService.post('/users/', {
          ...studentData,
          first_name: values.firstName,
          last_name: values.lastName,
          role: 'student',
        });
        setSuccess(
          <div>
            <strong>O'quvchi muvaffaqiyatli qo'shildi!</strong><br />
            <strong>ID:</strong> {response.display_id || response.username}
          </div>
        );
        form.resetFields();
      }
    } catch (err) {
      setError('Xatolik yuz berdi: ' + (err.message || 'Noma\'lum xatolik'));
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <Spin size="large" />
        <Typography.Text style={{ marginLeft: 16 }}>
          Ma'lumotlar yuklanmoqda...
        </Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Button
          type="default"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/students')}
          style={{ marginRight: '12px', marginBottom: '8px' }}
        >
          O'quvchilarni boshqarishga qaytish
        </Button>
        <Typography.Title level={1} style={{ color: '#1e293b', marginBottom: '8px' }}>
          {isEditMode ? 'O\'quvchi ma\'lumotlarini tahrirlash' : 'Yangi o\'quvchi qo\'shish'}
        </Typography.Title>
        <Typography.Text style={{ fontSize: '18px', color: '#64748b' }}>
          {isEditMode ? 'O\'quvchi ma\'lumotlarini yangilang' : 'Yangi o\'quvchi ma\'lumotlarini kiriting'}
        </Typography.Text>
      </div>

      {/* Success Message */}
      {success && (
        <Alert
          message="Muvaffaqiyat"
          description={success}
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Error Message */}
      {error && (
        <Alert
          message="Xatolik"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Form */}
      <Card style={{
        padding: '24px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="Ism"
            name="firstName"
            rules={[{ required: true, message: 'Ismni kiriting' }]}
            style={{ marginBottom: '16px' }}
          >
            <Input
              autoFocus
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </Form.Item>

          <Form.Item
            label="Familiya"
            name="lastName"
            rules={[{ required: true, message: 'Familiyani kiriting' }]}
            style={{ marginBottom: '16px' }}
          >
            <Input
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </Form.Item>

          <Form.Item
            label="Sinf"
            name="classGroup"
            rules={[{ required: true, message: 'Sinfni tanlang' }]}
            style={{ marginBottom: '16px' }}
          >
            <Select
              placeholder="Sinfni tanlang"
              onChange={(value) => {
                const direction = value.endsWith('A') ? 'exact' : 'natural';
                setFormData({ ...formData, classGroup: value, direction });
              }}
            >
              {[5,6,7,8,9,10,11].flatMap(grade =>
                [1,2,3,4,5,6].map(num => {
                  const classGroup = `${grade}-${String(num).padStart(2,'0')}`;
                  return ['A', 'T'].map(suffix => {
                    const fullClass = `${classGroup}-${suffix}`;
                    return <Select.Option key={fullClass} value={fullClass}>{fullClass}</Select.Option>;
                  });
                })
              )}
            </Select>
          </Form.Item>

          <Form.Item
            label="Ro'yxatdan o'tgan sana"
            style={{ marginBottom: '16px' }}
          >
            <DatePicker
              value={formData.registrationDate}
              onChange={(date) => setFormData({ ...formData, registrationDate: date })}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{ padding: '12px', fontWeight: 600 }}
            >
              {isEditMode ? 'O\'quvchi ma\'lumotlarini saqlash' : 'O\'quvchi qo\'shish'}
            </Button>
            <Button
              block
              onClick={() => navigate('/admin/students')}
              style={{ padding: '12px' }}
            >
              Bekor qilish
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AddStudent;
