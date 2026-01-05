import React, { useState } from 'react';
import 'animate.css';
import { Form, Input, Select, Button, Alert, Spin, Typography, Card, DatePicker } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../data/apiService';
import dayjs from 'dayjs';

const AddStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get student ID from URL for editing
  const isEditMode = !!id; // Check if we're in edit mode
  const [form] = Form.useForm();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    classGroup: '',
    direction: 'natural', // Will be auto-set based on class suffix
    registrationDate: dayjs(), // Default to today
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(isEditMode); // Loading state for edit mode

  // Load student data for editing
  React.useEffect(() => {
    if (isEditMode) {
      const loadStudentData = async () => {
        try {
          const student = await apiService.getUser(id);
          if (student) {
            // Split name into first and last name
            const nameParts = student.name ? student.name.split(' ') : ['', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const data = {
              firstName,
              lastName,
              classGroup: student.class_group || '',
              direction: student.direction || 'natural',
              registrationDate: student.registration_date ? dayjs(student.registration_date.split('T')[0]) : dayjs(),
            };
            setFormData(data);
            form.setFieldsValue(data);
          }
        } catch (error) {
          console.error('Failed to load student data:', error);
          setError('O\'quvchi ma\'lumotlarini yuklashda xatolik yuz berdi');
        } finally {
          setLoading(false);
        }
      };

      loadStudentData();
    }
  }, [id, isEditMode, form]);

  // ID generation is now handled by backend with admin-specific isolation

  const handleSubmit = async (values) => {
    setError('');
    setSuccess('');

    try {
      const studentData = {
        name: `${formData.firstName} ${formData.lastName}`,
        class_group: formData.classGroup,
        direction: formData.direction,
        registration_date: formData.registrationDate.format('YYYY-MM-DD'),
      };

      if (isEditMode) {
        // Update existing student
        await apiService.updateUser(id, studentData);
        setSuccess('O\'quvchi ma\'lumotlari muvaffaqiyatli yangilandi!');
      } else {
        // Create new student via API (ID generation handled by backend)
        const newStudentData = {
          ...studentData,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'student',
        };

        const response = await apiService.post('/users/', newStudentData);
        const createdStudent = response;

        setSuccess(
          <div>
            <strong>✅ O'quvchi muvaffaqiyatli qo'shildi!</strong><br/>
            <strong>ID:</strong> {createdStudent.display_id || createdStudent.username}<br/>
            <strong>Parol:</strong> {createdStudent.generated_password}
          </div>
        );
        setFormData({
          firstName: '',
          lastName: '',
          classGroup: '',
          direction: 'natural', // Will be auto-set based on class suffix
          registrationDate: dayjs(),
        });
      }

    } catch (err) {
      console.error('Failed to save student:', err);
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
    <div className="animate__animated animate__fadeIn" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div className="animate__animated animate__slideInDown" style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0',
        animationDelay: '0.1s',
        animationFillMode: 'both'
      }}>
        <Button
          className="animate__animated animate__fadeInLeft"
          type="default"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/students')}
          style={{ marginRight: '12px', marginBottom: '8px', animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          O'quvchilarni boshqarishga qaytish
        </Button>
        <Typography.Title level={1} className="animate__animated animate__fadeInUp" style={{ color: '#1e293b', marginBottom: '8px', animationDelay: '0.3s', animationFillMode: 'both' }}>
          {isEditMode ? 'O\'quvchi ma\'lumotlarini tahrirlash' : 'Yangi o\'quvchi qo\'shish'}
        </Typography.Title>
        <Typography.Text className="animate__animated animate__fadeInUp" style={{ fontSize: '18px', color: '#64748b', animationDelay: '0.4s', animationFillMode: 'both' }}>
          {isEditMode ? 'O\'quvchi ma\'lumotlarini yangilang' : 'Yangi o\'quvchi ma\'lumotlarini kiriting'}
        </Typography.Text>
      </div>

      {/* Success Message */}
      {success && (
        <Alert
          className="animate__animated animate__bounceIn"
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
          className="animate__animated animate__shakeX"
          message="Xatolik"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Form */}
      <Card className="animate__animated animate__fadeInUp" style={{
        padding: '24px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        maxWidth: '600px',
        margin: '0 auto',
        animationDelay: '0.5s',
        animationFillMode: 'both'
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
              value={formData.classGroup}
              onChange={(value) => {
                const direction = value.endsWith('-A') ? 'exact' : value.endsWith('-T') ? 'natural' : 'natural';
                setFormData({ ...formData, classGroup: value, direction });
              }}
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

          <Form.Item label="Ro'yxatdan o'tgan sana" style={{ marginBottom: '16px' }}>
            <DatePicker
              value={formData.registrationDate}
              onChange={(date) => setFormData({ ...formData, registrationDate: date })}
              style={{ width: '100%' }}
            />
          </Form.Item>

          {formData.firstName && formData.lastName && formData.classGroup && (
            <Alert
              message="Ma'lumot"
              description={
                <>
                  <strong>Yo'nalish:</strong> {formData.direction === 'exact' ? 'Aniq fanlar' : 'Tabiiy fanlar'}
                  <br />
                  <strong>ID va parol:</strong> Backend tomonidan admin-specific tarzda generatsiya qilinadi
                  <br />
                  <strong>ID format:</strong> ADM[AdminID]_[IsmFamiliya]...@test
                  <br />
                  <strong>Parol:</strong> 12 ta belgidan iborat tasodifiy parol
                </>
              }
              type="info"
              showIcon
              style={{ marginTop: '16px', marginBottom: '16px' }}
            />
          )}

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