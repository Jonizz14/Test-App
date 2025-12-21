import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Typography,
  Avatar,
  Table,
  Tag,
  Space,
} from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  WarningOutlined,
  StopOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const TestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [studentDetails, setStudentDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestDetails = async () => {
      try {
        // Get all tests to find the specific test
        const allTests = await apiService.getTests();
        const testData = allTests.find(t => t.id === parseInt(id));
        setTest(testData);

        if (testData) {
          // Get test attempts with student details
          const attempts = await apiService.getAttempts({ test: testData.id });

          // Get warning logs for ban calculations
          const warnings = await apiService.getWarnings();

          // Process student data
          const studentData = attempts.map(attempt => {
            // Calculate bans based on warnings (every 3 warnings = 1 ban)
            const studentWarnings = warnings.filter(w => w.student === attempt.student).length;
            const banCount = Math.floor(studentWarnings / 3);

            return {
              id: attempt.student,
              name: attempt.student_name,
              score: attempt.score,
              submittedAt: attempt.submitted_at,
              timeTaken: attempt.time_taken,
              warningCount: studentWarnings,
              banCount: banCount,
              // Mock data for additional lessons (you may need to implement this based on your backend)
              hasExtraLessons: Math.random() > 0.7, // Placeholder - replace with actual data
            };
          });

          setStudentDetails(studentData);
        }
      } catch (error) {
        console.error('Failed to load test details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTestDetails();
  }, [id]);

  const columns = [
    {
      title: 'O\'quvchi',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <Avatar
            style={{
              backgroundColor: '#059669',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            {text.charAt(0).toUpperCase()}
          </Avatar>
          <Text style={{ fontWeight: 500, color: '#1e293b' }}>
            {text}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Ball',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <Tag
          color={score >= 70 ? 'green' : score >= 50 ? 'orange' : 'red'}
          style={{ fontWeight: 600 }}
        >
          {score?.toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: 'Topshirgan sana',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => (
        <Text style={{ color: '#64748b' }}>
          {new Date(date).toLocaleString('uz-UZ')}
        </Text>
      ),
    },
    {
      title: 'Sarflangan vaqt',
      dataIndex: 'timeTaken',
      key: 'timeTaken',
      render: (time) => (
        <Text style={{ color: '#64748b' }}>
          {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
        </Text>
      ),
    },
    {
      title: 'Q\'oshimcha dars',
      key: 'extraLessons',
      render: (_, record) => (
        record.hasExtraLessons ? (
          <Space>
            <TeamOutlined style={{ color: '#059669' }} />
            <Text style={{ color: '#059669', fontWeight: 500 }}>
              Oldi
            </Text>
          </Space>
        ) : (
          <Text style={{ color: '#64748b' }}>
            Olmadi
          </Text>
        )
      ),
    },
    {
      title: 'Ogohlantirishlar',
      dataIndex: 'warningCount',
      key: 'warningCount',
      render: (count) => (
        <Space>
          <WarningOutlined style={{ color: count > 0 ? '#d97706' : '#64748b' }} />
          <Text style={{ color: count > 0 ? '#d97706' : '#64748b', fontWeight: 500 }}>
            {count}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Banlar soni',
      dataIndex: 'banCount',
      key: 'banCount',
      render: (count) => (
        <Space>
          <StopOutlined style={{ color: count > 0 ? '#dc2626' : '#64748b' }} />
          <Text style={{ color: count > 0 ? '#dc2626' : '#64748b', fontWeight: 500 }}>
            {count}
          </Text>
        </Space>
      ),
    },
  ];

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

  if (!test) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Text>Test topilmadi</Text>
          <br />
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/test-stats')}
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
          onClick={() => navigate('/admin/test-stats')}
          style={{
            borderColor: '#2563eb',
            color: '#2563eb'
          }}
        >
          Orqaga
        </Button>
        <Title level={2} style={{ margin: 0, color: '#1e293b' }}>
          {test.title} - Batafsil natijalar
        </Title>
      </div>

      {/* Test Info Card */}
      <Card
        style={{
          marginBottom: '24px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <Space size="large" style={{ width: '100%', marginBottom: '24px' }}>
          <Avatar
            size={80}
            style={{
              backgroundColor: '#2563eb',
              fontSize: '32px',
              fontWeight: 700
            }}
          >
            <FileTextOutlined />
          </Avatar>
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0, marginBottom: '8px', color: '#1e293b' }}>
              {test.title}
            </Title>
            <Text style={{ color: '#64748b', marginBottom: '16px', display: 'block' }}>
              O'qituvchi: {test.teacher_name || ''} {test.teacher_surname || ''}
            </Text>
            <Space wrap>
              <Tag
                color={test.subject === 'Ingliz tili' ? 'blue' : 'green'}
                style={{ fontWeight: 600 }}
              >
                {test.subject}
              </Tag>
              <Tag color="blue" style={{ fontWeight: 600 }}>
                {test.total_questions} savol
              </Tag>
              <Tag color="orange" style={{ fontWeight: 600 }}>
                {test.time_limit} daqiqa
              </Tag>
            </Space>
          </div>
        </Space>

        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <Title level={5} style={{ margin: 0, marginBottom: '8px', color: '#1e293b' }}>
              Urinishlar soni
            </Title>
            <Text style={{ color: '#64748b', fontSize: '24px', fontWeight: 700 }}>
              {test.attempt_count || 0}
            </Text>
          </div>
          <div>
            <Title level={5} style={{ margin: 0, marginBottom: '8px', color: '#1e293b' }}>
              O'rtacha ball
            </Title>
            <Text style={{ color: '#64748b', fontSize: '24px', fontWeight: 700 }}>
              {(test.average_score || 0).toFixed(1)}%
            </Text>
          </div>
          <div>
            <Title level={5} style={{ margin: 0, marginBottom: '8px', color: '#1e293b' }}>
              Status
            </Title>
            <Tag
              color={test.is_active ? 'green' : 'default'}
              style={{ fontWeight: 600, fontSize: '14px' }}
            >
              {test.is_active ? 'Faol' : 'Nofaol'}
            </Tag>
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card
        title={`Test topshirgan o'quvchilar (${studentDetails.length})`}
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
        }}
      >
        {studentDetails.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
            <Text style={{ color: '#64748b', fontSize: '16px' }}>
              Bu testni hali hech kim topshirmagan
            </Text>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={studentDetails}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Jami ${total} ta o'quvchi`,
            }}
            locale={{
              emptyText: 'O\'quvchilar mavjud emas'
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default TestDetails;