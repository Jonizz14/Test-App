import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Space,
  Alert,
  Card,
  Row,
  Col,
  message,
} from 'antd';
import {
  SendOutlined,
  BankOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SendLessonModal = ({ open, onClose, student, testResult, teacherInfo }) => {
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const subjects = [
    'Matematika',
    'Algebra',
    'Geometriya',
    'SI',
    'Robototexnika',
    'Fizika',
    'Kimyo',
    'Biologiya',
    'Tarix',
    'Geografiya',
    'O\'zbek tili',
    'Ingliz tili',
    'Adabiyot',
    'Informatika',
  ];

  const initialValues = {
    subject: testResult?.test?.subject || '',
    room: '',
    lessonDate: '',
    lessonTime: '',
    topic: '',
    description: '',
    difficulty: 'medium',
    estimatedTime: 60,
  };

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      
      if (!values.room || !values.lessonDate || !values.lessonTime || !values.topic || !values.description) {
        return;
      }

      setSending(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create notification for student
      const notification = {
        id: `lesson-${Date.now()}`,
        studentId: student.id,
        studentName: student?.name || student?.fullName || student?.display_name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'O\'quvchi',
        studentClass: student?.class_group || student?.class || student?.grade || '',
        teacherId: teacherInfo?.id || 'current-teacher-id',
        teacherName: teacherInfo?.fullName || teacherInfo?.name || "O'qituvchi",
        type: 'lesson_reminder',
        title: "Qo'shimcha dars belgilandi",
        message: `${teacherInfo?.fullName || teacherInfo?.name || "O'qituvchi"} sizni ${values.lessonDate} kuni ${values.lessonTime}da "${values.topic}" mavzusida qo'shimcha darsga taklif qiladi.\n\nFan: ${values.subject}\nQiyinlik: ${values.difficulty === 'easy' ? 'Oson' : values.difficulty === 'medium' ? "O'rtacha" : 'Qiyin'}\nDavomiyligi: ${values.estimatedTime} daqiqa\nHona: ${values.room}\nTafsilot: ${values.description}`,
        testId: testResult?.test?.id,
        testTitle: testResult?.test?.title,
        subject: values.subject,
        room: values.room,
        lessonDate: values.lessonDate,
        lessonTime: values.lessonTime,
        lessonTopic: values.topic,
        lessonDescription: values.description,
        difficulty: values.difficulty,
        estimatedTime: values.estimatedTime,
        createdAt: new Date().toISOString(),
        isRead: false
      };

      // Save notification to database
      const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      existingNotifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(existingNotifications));

      setSuccess(true);
      message.success('Dars muvaffaqiyatli yuborildi! Talaba bildirishnoma oladi.');
      
      setTimeout(() => {
        setSuccess(false);
        onClose();
        form.resetFields();
      }, 2000);

    } catch (error) {
      console.error('Error sending lesson:', error);
      message.error('Dars yuborishda xatolik yuz berdi');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <BankOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
          <Title level={4} style={{ margin: 0 }}>
            Qo'shimcha dars yuborish
          </Title>
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Bekor qilish
        </Button>,
        <Button
          key="send"
          type="primary"
          icon={<SendOutlined />}
          loading={sending}
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? 'Yuborilmoqda...' : 'Darsni yuborish'}
        </Button>,
      ]}
      style={{ top: 20 }}
      styles={{ body: { padding: '24px' } }}
    >
      <div style={{ marginBottom: '16px' }}>
        <Text type="secondary">
          {student?.name || student?.fullName || `${student?.first_name || ''} ${student?.last_name || ''}`.trim()} uchun individual dars
        </Text>
      </div>

      {testResult && (
        <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f5f5f5' }}>
          <Text strong>Test natijasi asosida:</Text>
          <div style={{ marginTop: '8px' }}>
            <Space>
              <span style={{
                padding: '4px 8px',
                backgroundColor: testResult.score >= 70 ? '#f6ffed' : '#fff2e8',
                border: `1px solid ${testResult.score >= 70 ? '#b7eb8f' : '#ffd591'}`,
                borderRadius: '4px',
                color: testResult.score >= 70 ? '#389e0d' : '#d46b08',
                fontWeight: 'bold'
              }}>
                {testResult.score}%
              </span>
              <Text type="secondary">{testResult.test?.title}</Text>
            </Space>
          </div>
        </Card>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="subject"
              label="Fan"
              rules={[{ required: true, message: 'Fan tanlang!' }]}
            >
              <Select placeholder="Fanni tanlang">
                {subjects.map(subject => (
                  <Option key={subject} value={subject}>{subject}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="room"
              label="Hona"
              rules={[{ required: true, message: 'Hona raqamini kiriting!' }]}
            >
              <Input placeholder="Masalan: 101, V-5" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="lessonDate"
              label="Dars sanasi"
              rules={[{ required: true, message: 'Dars sanasini tanlang!' }]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="lessonTime"
              label="Dars vaqti"
              rules={[{ required: true, message: 'Dars vaqtini tanlang!' }]}
            >
              <Input type="time" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="difficulty"
              label="Qiyinlik darajasi"
              rules={[{ required: true, message: 'Qiyinlik darajasini tanlang!' }]}
            >
              <Select>
                <Option value="easy">Oson</Option>
                <Option value="medium">O'rtacha</Option>
                <Option value="hard">Qiyin</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="estimatedTime"
              label="Dars davomiyligi (daqiqa)"
              rules={[{ required: true, message: 'Davomiylikni kiriting!' }]}
            >
              <Input type="number" placeholder="Masalan: 60" min="15" max="180" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="topic"
              label="Mavzu"
              rules={[{ required: true, message: 'Mavzuni kiriting!' }]}
            >
              <Input placeholder="Masalan: Algebra asoslari, Newton qonunlari" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="description"
              label="Tafsilot"
              rules={[{ required: true, message: 'Tafsilotni kiriting!' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Darsning mazmuni, o'rganiladigan tushunchalar, amaliy mashqlar haqida batafsil yozing..."
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Alert
        message="💡 Maslahat"
        description="Darsni talabaning test natijalariga qarab, uning zaif tomonlariga e'tibor qaratib tuzing."
        type="info"
        showIcon
        style={{ marginTop: '16px' }}
      />
    </Modal>
  );
};

export default SendLessonModal;