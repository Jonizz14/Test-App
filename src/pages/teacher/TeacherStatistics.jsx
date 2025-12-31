import React, { useState, useEffect } from 'react';
import 'animate.css';
import { Typography, Card, Row, Col, Statistic, Spin } from 'antd';
import {
  BarChartOutlined as AssessmentIcon,
  TeamOutlined as PeopleIcon,
  RiseOutlined as TrendingUpIcon,
  BookOutlined as SchoolIcon,
  FileTextOutlined as QuizIcon,
  UserOutlined as EmojiPeopleIcon,
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

const TeacherStatistics = () => {
  const { currentUser } = useAuth();
  const [myTests, setMyTests] = useState([]);
  const [myTestAttempts, setMyTestAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [currentUser.id]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Load teacher's tests from API
      const testsResponse = await apiService.getTests({ teacher: currentUser.id });
      const teacherTests = testsResponse.results || testsResponse;
      setMyTests(teacherTests);

      // Load all test attempts and filter for teacher's tests
      const attemptsResponse = await apiService.getAttempts();
      const allAttempts = attemptsResponse.results || attemptsResponse;
      const teacherAttempts = allAttempts.filter(attempt =>
        teacherTests.some(test => test.id === attempt.test)
      );
      setMyTestAttempts(teacherAttempts);

      console.log('Teacher statistics loaded:', {
        tests: teacherTests.length,
        attempts: teacherAttempts.length
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate comprehensive statistics
  const totalTestsCreated = myTests.length;
  const activeTests = myTests.filter(test => test.is_active).length;
  const totalAttempts = myTestAttempts.length;
  const uniqueStudents = new Set(myTestAttempts.map(attempt => attempt.student)).size;

  // Calculate score statistics for teacher's tests
  const scores = myTestAttempts.map(attempt => attempt.score || 0);

  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;

  const highestScore = scores.length > 0
    ? Math.round(Math.max(...scores))
    : 0;

  const lowestScore = scores.length > 0
    ? Math.round(Math.min(...scores))
    : 0;

  // Basic activity data
  const subjectStats = {};
  myTestAttempts.forEach(attempt => {
    const test = myTests.find(t => t.id === attempt.test);
    if (test) {
      subjectStats[test.subject] = (subjectStats[test.subject] || 0) + 1;
    }
  });

  // Score distribution data
  const scoreRanges = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  };

  scores.forEach(score => {
    if (score <= 20) scoreRanges['0-20']++;
    else if (score <= 40) scoreRanges['21-40']++;
    else if (score <= 60) scoreRanges['41-60']++;
    else if (score <= 80) scoreRanges['61-80']++;
    else scoreRanges['81-100']++;
  });

  const scoreDistributionData = {
    labels: Object.keys(scoreRanges),
    datasets: [
      {
        label: 'O\'quvchilar soni',
        data: Object.values(scoreRanges),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Subject performance data
  const subjectPerformanceStats = {};
  myTestAttempts.forEach(attempt => {
    const test = myTests.find(t => t.id === attempt.test);
    if (test) {
      const subject = test.subject;
      if (!subjectPerformanceStats[subject]) {
        subjectPerformanceStats[subject] = { total: 0, sum: 0 };
      }
      subjectPerformanceStats[subject].total++;
      subjectPerformanceStats[subject].sum += attempt.score || 0;
    }
  });

  const subjectPerformanceData = {
    labels: Object.keys(subjectPerformanceStats),
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: Object.values(subjectPerformanceStats).map(stat => Math.round(stat.sum / stat.total)),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Test creation timeline
  const testsByMonth = {};
  myTests.forEach(test => {
    const date = new Date(test.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    testsByMonth[monthKey] = (testsByMonth[monthKey] || 0) + 1;
  });

  const testCreationData = {
    labels: Object.keys(testsByMonth).slice(-6), // Last 6 months
    datasets: [
      {
        label: 'Yaratilgan testlar',
        data: Object.values(testsByMonth).slice(-6),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeOutBounce',
      delay: (context) => {
        if (context.type === 'data' && context.mode === 'default') {
          return context.dataIndex * 100;
        }
        return 0;
      },
    },
  };

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
          O'qituvchi statistikasi
        </Typography.Title>
        <Typography.Text
          style={{
            fontSize: '18px',
            color: '#64748b',
            fontWeight: 400
          }}
        >
          Testlaringiz va o'quvchilaringizning batafsil statistikasi
        </Typography.Text>
      </div>

      {/* Main Statistics Cards with Entrance Animations */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <div className="animate__animated animate__zoomIn" style={{ animationDelay: '100ms' }}>
          <StatCard
            title="Jami yaratilgan testlar"
            value={totalTestsCreated}
            icon={<AssessmentIcon />}
            color="#2563eb"
            suffix={` (${activeTests} faol)`}
          />
        </div>
        <div className="animate__animated animate__zoomIn" style={{ animationDelay: '200ms' }}>
          <StatCard
            title="Jami urinishlar"
            value={totalAttempts}
            icon={<EmojiPeopleIcon />}
            color="#16a34a"
            suffix={` (${uniqueStudents} o'quvchi)`}
          />
        </div>
        <div className="animate__animated animate__zoomIn" style={{ animationDelay: '300ms' }}>
          <StatCard
            title="O'rtacha ball"
            value={averageScore}
            suffix="%"
            icon={<TrendingUpIcon />}
            color="#0ea5e9"
          />
        </div>
        <div className="animate__animated animate__zoomIn" style={{ animationDelay: '400ms' }}>
          <StatCard
            title="Eng yuqori ball"
            value={highestScore}
            suffix="%"
            icon={<TrendingUpIcon />}
            color="#059669"
          />
        </div>
        <div className="animate__animated animate__zoomIn" style={{ animationDelay: '500ms' }}>
          <StatCard
            title="Eng past ball"
            value={lowestScore}
            suffix="%"
            icon={<TrendingUpIcon />}
            color="#d97706"
          />
        </div>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Score Distribution Chart */}
        <Col xs={24} md={12}>
          <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '200ms' }}>
            <Card
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                height: '400px',
                padding: '24px'
              }}
            >
              <Typography.Title level={4} style={{ marginBottom: '24px' }}>
                Ballar taqsimoti
              </Typography.Title>
            <Bar 
              data={scoreDistributionData} 
              options={{
                ...chartOptions,
                animation: {
                  ...chartOptions.animation,
                  delay: (context) => {
                    if (context.type === 'data' && context.mode === 'default') {
                      return context.dataIndex * 150;
                    }
                    return 0;
                  },
                },
              }} 
            />
            </Card>
          </div>
        </Col>

        {/* Subject Performance Chart */}
        <Col xs={24} md={12}>
          <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '400ms' }}>
            <Card
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                height: '400px',
                padding: '24px'
              }}
            >
              <Typography.Title level={4} style={{ marginBottom: '24px' }}>
                Fanlar bo'yicha natijalar
              </Typography.Title>
              <Pie
                data={subjectPerformanceData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                  animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2500,
                    easing: 'easeOutElastic(1, .6)',
                  },
                }}
              />
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherStatistics;
