import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Row, Col, Statistic, Spin, Alert, Button, List } from 'antd';
import {
  BookOutlined,
  TrophyOutlined,
  BarChartOutlined,
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const TeacherOverview = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTests: 0,
    activeTests: 0,
    totalAttempts: 0,
    uniqueStudents: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    curatorClass: '',
    curatorClassStudents: 0,
    curatorClassAverageScore: 0,
    recentActivity: [],
    allRecentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real statistics from the database
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);

        // Load teacher's tests from API
        const testsResponse = await apiService.getTests({ teacher: currentUser.id });
        const teacherTests = testsResponse.results || testsResponse;

        // Load all test attempts and filter for teacher's tests
        const attemptsResponse = await apiService.getAttempts();
        const allAttempts = attemptsResponse.results || attemptsResponse;
        const teacherAttempts = allAttempts.filter(attempt =>
          teacherTests.some(test => test.id === attempt.test)
        );

        // Load all users to get student information
        const usersResponse = await apiService.getUsers();
        const allUsers = usersResponse.results || usersResponse;
        const studentUsers = allUsers.filter(user => user.role === 'student');

        // Calculate statistics
        const totalTests = teacherTests.length;
        const activeTests = teacherTests.filter(test => test.is_active !== false).length;
        const totalAttempts = teacherAttempts.length;
        const uniqueStudents = new Set(teacherAttempts.map(attempt => attempt.student)).size;

        // Calculate score statistics
        const scores = teacherAttempts.map(attempt => attempt.score || 0);
        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;
        const highestScore = scores.length > 0
          ? Math.round(Math.max(...scores))
          : 0;
        const lowestScore = scores.length > 0
          ? Math.round(Math.min(...scores))
          : 0;

        // Get curator class information
        const curatorClass = currentUser.curator_class || '';
        let curatorClassStudents = 0;
        let curatorClassAverageScore = 0;

        if (curatorClass) {
          // Find students in curator class
          const curatorStudents = studentUsers.filter(student =>
            student.class_group && student.class_group.startsWith(curatorClass.split('-').slice(0, 2).join('-'))
          );
          curatorClassStudents = curatorStudents.length;

          // Calculate average score for curator class students
          if (curatorStudents.length > 0) {
            const curatorStudentIds = curatorStudents.map(s => s.id);
            const curatorAttempts = teacherAttempts.filter(attempt =>
              curatorStudentIds.includes(attempt.student)
            );
            const curatorScores = curatorAttempts.map(attempt => attempt.score || 0);
            curatorClassAverageScore = curatorScores.length > 0
              ? Math.round(curatorScores.reduce((sum, score) => sum + score, 0) / curatorScores.length)
              : 0;
          }
        }

        // Get recent activity (last 10 attempts for modal, 3 for overview)
        const allRecentActivity = teacherAttempts
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
          .slice(0, 10)
          .map(attempt => {
            const student = studentUsers.find(s => s.id === attempt.student);
            const test = teacherTests.find(t => t.id === attempt.test);
            return {
              id: attempt.id,
              action: `Test yakunlandi: ${test?.title || 'Noma\'lum test'}`,
              user: student?.name || 'Noma\'lum o\'quvchi',
              time: new Date(attempt.submitted_at).toLocaleDateString('uz-UZ'),
              score: attempt.score
            };
          });

        const recentActivity = allRecentActivity.slice(0, 3);

        setStats({
          totalTests,
          activeTests,
          totalAttempts,
          uniqueStudents,
          averageScore,
          highestScore,
          lowestScore,
          curatorClass,
          curatorClassStudents,
          curatorClassAverageScore,
          recentActivity,
          allRecentActivity
        });

      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [currentUser]);


  const StatCard = ({ title, value, icon, color, suffix }) => (
    <Col xs={24} sm={12} md={6}>
      <Card
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
        hoverable
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <Typography.Text
              style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#64748b',
                display: 'block',
                marginBottom: '8px'
              }}
            >
              {title}
            </Typography.Text>
            <Statistic
              value={value}
              suffix={suffix}
              valueStyle={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#1e293b',
                lineHeight: 1.2
              }}
            />
          </div>
          <div
            style={{
              backgroundColor: color,
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '16px'
            }}
          >
            {React.cloneElement(icon, {
              style: {
                fontSize: '24px',
                color: '#ffffff'
              }
            })}
          </div>
        </div>
      </Card>
    </Col>
  );

  if (loading) {
    return (
      <div style={{
        padding: '32px 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Spin size="large" />
        <Typography.Text style={{ marginLeft: '16px' }}>
          Ma'lumotlar yuklanmoqda...
        </Typography.Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px' }}>
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      padding: '32px 0',
      backgroundColor: '#ffffff'
    }}>
      <div style={{
        marginBottom: '48px',
        paddingBottom: '32px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Typography.Title
          level={1}
          style={{
            fontSize: '40px',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '16px',
            margin: 0
          }}
        >
          O'qituvchi umumiy ko'rinishi
        </Typography.Title>
        <Typography.Text
          style={{
            fontSize: '18px',
            color: '#64748b',
            fontWeight: 400
          }}
        >
          Testlaringiz va o'quvchilar faoliyati statistikasi
        </Typography.Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <StatCard
          title="Jami testlar"
          value={stats.totalTests}
          icon={<BookOutlined />}
          color="#2563eb"
        />
        <StatCard
          title="Faol testlar"
          value={stats.activeTests}
          icon={<CheckCircleOutlined />}
          color="#16a34a"
        />
        <StatCard
          title="Jami urinishlar"
          value={stats.totalAttempts}
          icon={<ClockCircleOutlined />}
          color="#7c3aed"
        />
        <StatCard
          title="Faol o'quvchilar"
          value={stats.uniqueStudents}
          icon={<TeamOutlined />}
          color="#d97706"
        />
        <StatCard
          title="O'rtacha ball"
          value={stats.averageScore}
          suffix="%"
          icon={<RiseOutlined />}
          color="#059669"
        />
        <StatCard
          title="Eng yuqori ball"
          value={stats.highestScore}
          suffix="%"
          icon={<TrophyOutlined />}
          color="#dc2626"
        />
        {stats.curatorClass && (
          <StatCard
            title="Kurator sinf"
            value={stats.curatorClass}
            icon={<UserOutlined />}
            color="#8b5cf6"
          />
        )}
        {stats.curatorClass && (
          <StatCard
            title="Sinf o'quvchilari"
            value={stats.curatorClassStudents}
            icon={<TeamOutlined />}
            color="#06b6d4"
          />
        )}
        {stats.curatorClass && stats.curatorClassStudents > 0 && (
          <StatCard
            title="Sinf o'rtacha ball"
            value={stats.curatorClassAverageScore}
            suffix="%"
            icon={<BarChartOutlined />}
            color="#f59e0b"
          />
        )}
        <StatCard
          title="Eng past ball"
          value={stats.lowestScore}
          suffix="%"
          icon={<RiseOutlined />}
          color="#ef4444"
        />
        <StatCard
          title="Test muvaffaqiyati"
          value={stats.totalAttempts > 0 ? Math.round((stats.uniqueStudents / Math.max(stats.totalAttempts, 1)) * 100) : 0}
          suffix="%"
          icon={<CheckCircleOutlined />}
          color="#10b981"
        />
        <StatCard
          title="Faol test foizi"
          value={stats.totalTests > 0 ? Math.round((stats.activeTests / stats.totalTests) * 100) : 0}
          suffix="%"
          icon={<BarChartOutlined />}
          color="#3b82f6"
        />
      </Row>

      {/* Recent Activity Card */}
      {stats.allRecentActivity.length > 0 && (
        <Card
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}
        >
          <Typography.Title level={4} style={{ marginBottom: '16px' }}>Oxirgi faoliyat</Typography.Title>
          <List
            dataSource={stats.allRecentActivity.slice(0, 5)}
            renderItem={(activity) => (
              <List.Item>
                <List.Item.Meta
                  title={activity.action}
                  description={`${activity.user} • ${activity.time}`}
                />
                <div style={{ fontWeight: 'bold', color: activity.score >= 70 ? '#16a34a' : '#dc2626' }}>
                  {activity.score}%
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default TeacherOverview;