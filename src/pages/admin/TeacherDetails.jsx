import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Typography,
  Avatar,
  Tag,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const TeacherDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeacherDetails = async () => {
      try {
        const users = await apiService.getUsers();
        const teacherData = users.find(user => user.id === parseInt(id));
        setTeacher(teacherData);

        const allTests = await apiService.getTests();
        const teacherTests = allTests.filter(test => test.teacher === parseInt(id));
        setTests(teacherTests);
      } catch (error) {
        console.error('Failed to load teacher details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherDetails();
  }, [id]);

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div>Yuklanmoqda...</div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Text>O'qituvchi topilmadi</Text>
          <br />
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/teachers')}
            style={{ marginTop: '16px' }}
          >
            Orqaga
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/teachers')}
          style={{
            borderColor: '#2563eb',
            color: '#2563eb'
          }}
        >
          Orqaga
        </Button>
        <Title level={2} style={{ margin: 0, color: '#1e293b' }}>
          {teacher.name} - Batafsil ma'lumotlar
        </Title>
      </div>

      {/* Teacher Info Card */}
      <Card
        style={{
          marginBottom: '24px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <Row gutter={24} align="middle">
          <Col>
            <Avatar
              size={80}
              style={{
                backgroundColor: '#2563eb',
                fontSize: '32px',
                fontWeight: 700
              }}
            >
              {teacher.name.charAt(0).toUpperCase()}
            </Avatar>
          </Col>
          <Col flex="auto">
            <Title level={3} style={{ margin: 0, marginBottom: '8px', color: '#1e293b' }}>
              {teacher.name}
            </Title>
            <Text style={{ color: '#64748b', marginBottom: '16px', display: 'block' }}>
              ID: {teacher.id}
            </Text>
            <Tag color="green" style={{ fontWeight: 600 }}>
              O'qituvchi
            </Tag>
          </Col>
        </Row>

        <Row gutter={24} style={{ marginTop: '24px' }}>
          <Col xs={24} md={12}>
            <Card
              size="small"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Title level={5} style={{ margin: 0, marginBottom: '8px', color: '#1e293b' }}>
                  Oxirgi kirish
                </Title>
                <Text style={{ color: '#64748b' }}>
                  {teacher.last_login ? new Date(teacher.last_login).toLocaleString('uz-UZ') : 'Ma\'lumot yo\'q'}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              size="small"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Title level={5} style={{ margin: 0, marginBottom: '8px', color: '#1e293b' }}>
                  Ro'yxatdan o'tgan sana
                </Title>
                <Text style={{ color: '#64748b' }}>
                  {teacher.registration_date ? new Date(teacher.registration_date).toLocaleString('uz-UZ') : 'Ma\'lumot yo\'q'}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Tests Created */}
      <Card
        title={`Yaratilgan testlar (${tests.length})`}
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
        }}
      >
        {tests.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
            <Text style={{ color: '#64748b', fontSize: '16px' }}>
              Hali testlar yaratilmagan
            </Text>
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {tests.map((test) => (
              <Col xs={24} md={12} key={test.id}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                >
                  <Title level={5} style={{ margin: 0, marginBottom: '16px', color: '#1e293b' }}>
                    {test.title}
                  </Title>
                  <div style={{ marginBottom: '16px' }}>
                    <Tag color="blue" style={{ marginRight: '8px', marginBottom: '4px' }}>
                      {test.subject}
                    </Tag>
                    <Tag color="green" style={{ marginBottom: '4px' }}>
                      {test.total_questions} savol
                    </Tag>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                      <ClockCircleOutlined style={{ marginRight: '8px' }} />
                      Vaqt: {test.time_limit} daqiqa
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                      <TeamOutlined style={{ marginRight: '8px' }} />
                      Urinishlar: {test.attempt_count || 0}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <TrophyOutlined style={{ marginRight: '8px' }} />
                      O'rtacha ball: {(test.average_score || 0).toFixed(1)}%
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
};

export default TeacherDetails;