import React, { useState } from 'react';
import { Form, Input, Select, Button, Alert, Spin, Typography, Card, Checkbox } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../data/apiService';
import { SUBJECTS } from '../../data/subjects';

const AddTeacher = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get teacher ID from URL for editing
  const isEditMode = !!id; // Check if we're in edit mode
  const [form] = Form.useForm();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    subjects: [],
    isCurator: false,
    curatorClass: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(isEditMode); // Loading state for edit mode

  // Load teacher data for editing
  React.useEffect(() => {
    if (isEditMode) {
      const loadTeacherData = async () => {
        try {
          const teacher = await apiService.getUser(id);
          if (teacher) {
            // Use first_name and last_name if available, otherwise split name
            let firstName = teacher.first_name || '';
            let lastName = teacher.last_name || '';

            if (!firstName && !lastName && teacher.name) {
              // Fallback to splitting name field
              const nameParts = teacher.name.split(' ');
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            }

            const data = {
              firstName,
              lastName,
              subjects: teacher.subjects || [],
              isCurator: teacher.is_curator || false,
              curatorClass: teacher.curator_class || '',
            };
            setFormData(data);
            form.setFieldsValue(data);
          }
        } catch (error) {
          console.error('Failed to load teacher data:', error);
          setError('O\'qituvchi ma\'lumotlarini yuklashda xatolik yuz berdi');
        } finally {
          setLoading(false);
        }
      };

      loadTeacherData();
    }
  }, [id, isEditMode, form]);

  // ID generation is now handled by backend with admin-specific isolation

  const handleSubmit = async (values) => {
    setError('');
    setSuccess('');

    try {
      const teacherData = {
        name: `${formData.firstName} ${formData.lastName}`,
        subjects: values.subjects, // Directly use the array from Select
        is_curator: formData.isCurator,
        curator_class: formData.isCurator ? formData.curatorClass : null,
      };

      if (isEditMode) {
        // Update existing teacher
        await apiService.updateUser(id, teacherData);
        setSuccess('O\'qituvchi ma\'lumotlari muvaffaqiyatli yangilandi!');
      } else {
        // Create new teacher via API (ID generation handled by backend)
        const newTeacherData = {
          ...teacherData,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'teacher',
        };

        const response = await apiService.post('/users/', newTeacherData);
        const createdTeacher = response;

        setSuccess(
          <div>
            <strong>✅ O'qituvchi muvaffaqiyatli qo'shildi!</strong><br />
            <strong>ID:</strong> {createdTeacher.display_id || createdTeacher.username}<br />
            <strong>Parol:</strong> {createdTeacher.generated_password}
          </div>
        );
        setFormData({
          firstName: '',
          lastName: '',
          subjects: '',
          isCurator: false,
          curatorClass: ''
        });
      }

    } catch (err) {
      console.error('Failed to save teacher:', err);
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
        borderBottom: '1px solid #e2e8f0',

        animationFillMode: 'both'
      }}>
        <Button

          type="default"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/teachers')}
          style={{ marginRight: '12px', marginBottom: '8px', animationFillMode: 'both' }}
        >
          O'qituvchilarni boshqarishga qaytish
        </Button>
        <Typography.Title level={1} style={{ color: '#1e293b', marginBottom: '8px', animationFillMode: 'both' }}>
          {isEditMode ? 'O\'qituvchi ma\'lumotlarini tahrirlash' : 'Yangi o\'qituvchi qo\'shish'}
        </Typography.Title>
        <Typography.Text style={{ fontSize: '18px', color: '#64748b', animationFillMode: 'both' }}>
          {isEditMode ? 'O\'qituvchi ma\'lumotlarini yangilang' : 'Yangi o\'qituvchi ma\'lumotlarini kiriting'}
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
        margin: '0 auto',

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
            label="Fanlar"
            name="subjects"
            rules={[{ required: true, message: 'Fanlarni tanlang' }]}
            style={{ marginBottom: '16px' }}
          >
            <Select
              mode="multiple"
              placeholder="Fanlarni tanlang"
              allowClear
              showSearch
            >
              {SUBJECTS.filter(s => s !== 'Boshqa').map(subject => (
                <Select.Option key={subject} value={subject}>{subject}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Kurator"
            style={{ marginBottom: '16px' }}
          >
            <Checkbox
              checked={formData.isCurator}
              onChange={(e) => setFormData({
                ...formData,
                isCurator: e.target.checked,
                curatorClass: e.target.checked ? formData.curatorClass : ''
              })}
            >
              Kurator
            </Checkbox>
          </Form.Item>

          {formData.isCurator && (
            <Form.Item
              label="Kurator sinfi"
              name="curatorClass"
              rules={[{ required: true, message: 'Kurator sinfini tanlang' }]}
              style={{ marginBottom: '16px' }}
            >
              <Select
                value={formData.curatorClass}
                onChange={(value) => setFormData({ ...formData, curatorClass: value })}
                placeholder="Sinf tanlang"
              >
                {[5, 6, 7, 8, 9, 10, 11].flatMap(grade =>
                  [1, 2, 3, 4, 5, 6].map(num => {
                    const classGroup = `${grade}-${String(num).padStart(2, '0')}`;
                    return (
                      <Select.Option key={classGroup} value={classGroup}>
                        {classGroup}
                      </Select.Option>
                    );
                  })
                )}
              </Select>
            </Form.Item>
          )}

          {formData.firstName && formData.lastName && formData.subjects && (
            <Alert
              message="Ma'lumot"
              description={
                <>
                  <strong>ID va parol:</strong> Backend tomonidan admin-specific tarzda generatsiya qilinadi
                  <br />
                  <strong>ID format:</strong> ADM[AdminID]_[IsmFamiliya]...USTOZ...@test
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
              {isEditMode ? 'O\'qituvchi ma\'lumotlarini saqlash' : 'O\'qituvchi qo\'shish'}
            </Button>
            <Button
              block
              onClick={() => navigate('/admin/teachers')}
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

export default AddTeacher;