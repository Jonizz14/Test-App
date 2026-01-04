import React, { useState, useEffect } from 'react';
import 'animate.css';
import {
  Row,
  Col,
  Card,
  Typography,
  Alert,
  Spin,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  Tooltip,
  Switch,
  Rate,
  Timeline,
} from 'antd';
import {
  BookOutlined,
  UserOutlined,
  RiseOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ReadOutlined,
  FundOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  ChartTitle,
  ChartTooltip,
  Legend,
  Filler
);

const { Title, Text } = Typography;

const StudentStatistics = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalTests: 0,
    completedTests: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    totalAttempts: 0,
    stars: 0,
    premiumStatus: false,
    recentActivity: [],
    subjectPerformance: [],
    monthlyProgress: [],
    difficultyAnalysis: [],
    recentTests: [],
    teacherStats: [],
    achievements: [],
    improvementTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart visibility states
  const [visibleCharts, setVisibleCharts] = useState({
    subjectPerformance: true,
    monthlyProgress: true,
    difficultyAnalysis: true,
    improvementTrend: true,
    performanceRadar: true,
    testHistory: true
  });

  // Fetch student statistics
  useEffect(() => {
    const fetchStudentStatistics = async () => {
      try {
        setLoading(true);
        
        const [attemptsData, testsData, userData] = await Promise.all([
          apiService.getAttempts({ student: currentUser.id }),
          apiService.getTests(),
          apiService.getUser(currentUser.id)
        ]);

        const attempts = attemptsData.results || attemptsData;
        const tests = testsData.results || testsData;
        const user = userData;

        // Calculate test statistics
        const totalAttempts = attempts.length;
        const completedTests = attempts.filter(attempt => attempt.submitted_at).length;
        const scores = attempts.map(attempt => attempt.score || 0);
        
        const averageScore = scores.length > 0 
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;
        
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

        // Subject performance analysis
        const subjectGroups = {};
        attempts.forEach(attempt => {
          const test = tests.find(t => t.id === attempt.test);
          const subject = test?.subject || 'Noma\'lum fan';
          
          if (!subjectGroups[subject]) {
            subjectGroups[subject] = { total: 0, scores: [], attempts: 0 };
          }
          
          subjectGroups[subject].total++;
          subjectGroups[subject].scores.push(attempt.score || 0);
          subjectGroups[subject].attempts++;
        });

        const subjectPerformance = Object.entries(subjectGroups).map(([subject, data]) => ({
          subject,
          averageScore: data.scores.length > 0 
            ? Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length)
            : 0,
          attempts: data.attempts,
          performance: data.scores.length > 0 
            ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length >= 80 
              ? 'Yuqori' 
              : data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length >= 60 
                ? 'O\'rta' 
                : 'Past'
            : 'Past'
        })).sort((a, b) => b.averageScore - a.averageScore);

        // Monthly progress (simulated data)
        const monthlyProgress = [
          { month: 'Sep', tests: 3, average: 72 },
          { month: 'Oct', tests: 5, average: 75 },
          { month: 'Nov', tests: 4, average: 78 },
          { month: 'Dec', tests: 6, average: 76 },
          { month: 'Jan', tests: 8, average: 82 },
          { month: 'Feb', tests: 5, average: 85 }
        ];

        // Difficulty analysis
        const difficultyGroups = {};
        attempts.forEach(attempt => {
          const test = tests.find(t => t.id === attempt.test);
          const difficulty = test?.difficulty || 'O\'rta';
          
          if (!difficultyGroups[difficulty]) {
            difficultyGroups[difficulty] = { count: 0, totalScore: 0 };
          }
          
          difficultyGroups[difficulty].count++;
          difficultyGroups[difficulty].totalScore += attempt.score || 0;
        });

        const difficultyAnalysis = Object.entries(difficultyGroups).map(([difficulty, data]) => ({
          difficulty,
          count: data.count,
          averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
          performance: data.count > 0 && data.totalScore / data.count >= 80 ? 'Yuqori' : 
                      data.count > 0 && data.totalScore / data.count >= 60 ? 'O\'rta' : 'Past'
        }));

        // Recent tests with detailed information
        const recentTests = attempts
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
          .slice(0, 10)
          .map(attempt => {
            const test = tests.find(t => t.id === attempt.test);
            return {
              id: attempt.id,
              title: test?.title || 'Noma\'lum test',
              subject: test?.subject || 'Noma\'lum fan',
              score: attempt.score || 0,
              difficulty: test?.difficulty || 'O\'rta',
              date: new Date(attempt.submitted_at).toLocaleDateString('uz-UZ'),
              timeSpent: Math.floor(Math.random() * 30) + 10, // Simulated
              performance: attempt.score >= 80 ? 'A\'lo' : 
                          attempt.score >= 60 ? 'Yaxshi' : 
                          attempt.score >= 40 ? 'Qoniqarli' : 'Qoniqarsiz'
            };
          });

        // Improvement trend (last 6 tests)
        const improvementTrend = recentTests.slice(-6).map((test, index) => ({
          test: index + 1,
          score: test.score,
          subject: test.subject
        }));



        // Recent activity timeline
        const recentActivity = recentTests.slice(0, 5).map(test => ({
          test: test.title,
          score: test.score,
          subject: test.subject,
          time: test.date,
          type: 'test_completed'
        }));

        setStats({
          totalTests: tests.length,
          completedTests,
          averageScore,
          highestScore,
          lowestScore,
          totalAttempts,
          stars: user.stars || 0,
          premiumStatus: user.premium_info?.is_premium || false,
          subjectPerformance,
          monthlyProgress,
          difficultyAnalysis,
          recentTests,
          improvementTrend,

          recentActivity,
          teacherStats: [], // Could be populated with teacher performance data
        });

      } catch (error) {
        console.error('Error fetching student statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchStudentStatistics();
    }
  }, [currentUser]);

  const StatCard = ({ title, value, icon, color, suffix, trend, description }) => (
    <div>
      <Card
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          marginBottom: '12px'
        }}
        styles={{ body: { padding: '24px' } }}
        hoverable
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <Text
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
            </Text>
            <Statistic
              value={value}
              suffix={suffix}
              styles={{
                content: {
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#1e293b',
                  lineHeight: 1.2
                }
              }}
            />
            {description && (
              <Text style={{
                fontSize: '12px',
                color: '#64748b',
                marginTop: '4px',
                display: 'block'
              }}>
                {description}
              </Text>
            )}
          </div>
          <div
            style={{
              backgroundColor: color,
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '16px'
            }}
          >
            {React.cloneElement(icon, {
              style: {
                fontSize: '28px',
                color: '#ffffff'
              }
            })}
          </div>
        </div>
      </Card>
      {trend && (
        <Card
          style={{
            backgroundColor: trend.direction === 'up' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${trend.direction === 'up' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '12px 16px'
          }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {trend.direction === 'up' ? (
              <ArrowUpOutlined style={{ color: '#16a34a', fontSize: '14px', marginRight: '6px' }} />
            ) : (
              <ArrowDownOutlined style={{ color: '#dc2626', fontSize: '14px', marginRight: '6px' }} />
            )}
            <Text style={{ 
              fontSize: '13px', 
              fontWeight: 600,
              color: trend.direction === 'up' ? '#16a34a' : '#dc2626'
            }}>
              {trend.value} o'tgan oyga nisbatan
            </Text>
          </div>
        </Card>
      )}
    </div>
  );

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Yuqori': return '#16a34a';
      case 'O\'rta': return '#f59e0b';
      case 'Past': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Oson': return '#059669';
      case 'O\'rta': return '#f59e0b';
      case 'Qiyin': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'Matematika': '#2563eb',
      'Fizika': '#7c3aed',
      'Kimyo': '#059669',
      'Biologiya': '#16a34a',
      'Tarix': '#dc2626',
      'Geografiya': '#0ea5e9',
      'Ingliz tili': '#f59e0b',
      'Ona tili': '#8b5cf6',
      'Adabiyot': '#ec4899',
    };
    return colors[subject] || '#64748b';
  };

  // Chart Data Configuration
  const subjectPerformanceChart = {
    labels: stats.subjectPerformance.slice(0, 6).map(subject => subject.subject),
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: stats.subjectPerformance.slice(0, 6).map(subject => subject.averageScore),
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',
          'rgba(124, 58, 237, 0.8)',
          'rgba(5, 150, 105, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(220, 38, 38, 0.8)',
          'rgba(22, 163, 74, 0.8)'
        ],
        borderColor: [
          '#2563eb', '#7c3aed', '#059669', '#f59e0b', 
          '#dc2626', '#16a34a'
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const monthlyProgressChart = {
    labels: stats.monthlyProgress.map(month => month.month),
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: stats.monthlyProgress.map(month => month.average),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.3)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#16a34a',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
      {
        label: 'Testlar soni',
        data: stats.monthlyProgress.map(month => month.tests),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.3)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };

  const difficultyAnalysisChart = {
    labels: stats.difficultyAnalysis.map(diff => diff.difficulty),
    datasets: [
      {
        data: stats.difficultyAnalysis.map(diff => diff.averageScore),
        backgroundColor: ['#059669', '#f59e0b', '#dc2626'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 3,
        hoverOffset: 15,
      },
    ],
  };

  const improvementTrendChart = {
    labels: stats.improvementTrend.map(item => `Test ${item.test}`),
    datasets: [
      {
        label: 'Ball',
        data: stats.improvementTrend.map(item => item.score),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };

  const performanceRadarChart = {
    labels: ['Matematika', 'Fizika', 'Kimyo', 'Biologiya', 'Tarix', 'Ingliz tili'],
    datasets: [
      {
        label: 'Joriy ko\'rsatkich',
        data: [85, 72, 90, 78, 65, 88],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'Maqsad',
        data: [90, 85, 95, 85, 80, 90],
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#16a34a',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        borderDash: [5, 5],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: 600 },
          color: '#374151',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        display: true,
        grid: { display: true, color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#6b7280', font: { size: 11, weight: 500 } },
      },
      y: {
        display: true,
        grid: { display: true, color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#6b7280', font: { size: 11, weight: 500 } },
      },
    },
    animation: { duration: 2000, easing: 'easeInOutQuart' },
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: { ...chartOptions.plugins, legend: { ...chartOptions.plugins.legend, display: false } },
    scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, beginAtZero: true, max: 100 } }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: 600 },
          color: '#374151',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    animation: { duration: 2000, easing: 'easeInOutQuart' },
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: 600 },
          color: '#374151',
          padding: 20,
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          color: '#6b7280',
          font: { size: 10 }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          color: '#374151',
          font: { size: 12, weight: 600 }
        }
      }
    },
    animation: { duration: 2000, easing: 'easeInOutQuart' },
  };

  // Animation delay helper
  const getAnimationDelay = (index) => {
    return index * 150; // 150ms delay between each chart
  };

  // Resizable Chart Component with entrance animations
  const ResizableChart = ({ chartKey, title, icon, children, width, index = 0 }) => {
    const chartWidth = width || 50;
    const isVisible = visibleCharts[chartKey];
    
    if (!isVisible) return null;
    
    return (
      <div 
        className="animate__animated animate__fadeInUp"
        style={{ 
          width: `${chartWidth}%`, 
          padding: '0 8px',
          animationDelay: `${getAnimationDelay(index)}ms`,
          animationDuration: '0.8s',
          animationFillMode: 'both'
        }}
      >
        <Card
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            height: '400px',
          }}
          bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}
          hoverable
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            {icon}
            <Title level={3} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0 8px' }}>
              {title}
            </Title>
          </div>
          <div style={{ flex: 1, height: '320px' }}>
            {children}
          </div>
        </Card>
      </div>
    );
  };

  const columns = [
    {
      title: 'Test nomi',
      key: 'test',
      render: (_, record) => (
        <Space>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: getSubjectColor(record.subject) + '20',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOutlined style={{ color: getSubjectColor(record.subject), fontSize: '18px' }} />
          </div>
          <div>
            <Text strong style={{ color: '#1e293b' }}>
              {record.title}
            </Text>
            <br />
            <Text style={{ color: '#64748b', fontSize: '12px' }}>
              {record.subject}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Ball',
      key: 'score',
      render: (_, record) => (
        <div>
          <Text strong style={{ 
            color: record.score >= 80 ? '#16a34a' : record.score >= 60 ? '#f59e0b' : '#dc2626',
            fontSize: '16px'
          }}>
            {record.score}%
          </Text>
          <br />
          <Text style={{ color: '#64748b', fontSize: '12px' }}>
            {record.performance}
          </Text>
        </div>
      ),
    },
    {
      title: 'Qiyinchilik',
      key: 'difficulty',
      render: (_, record) => (
        <Tag
          color={getDifficultyColor(record.difficulty)}
          style={{
            backgroundColor: `${getDifficultyColor(record.difficulty)}20`,
            color: getDifficultyColor(record.difficulty),
            fontWeight: 600
          }}
        >
          {record.difficulty}
        </Tag>
      ),
    },
    {
      title: 'Sana',
      key: 'date',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.date}
        </Text>
      ),
    },
    {
      title: 'Vaqt (daq)',
      key: 'time',
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#64748b' }} />
          <Text style={{ color: '#64748b', fontWeight: 600 }}>
            {record.timeSpent}
          </Text>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16 }}>Ma'lumotlar yuklanmoqda...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      </div>
    );
  }

  return (
    <div className="animate__animated animate__fadeIn" style={{ padding: '24px 0' }}>
      {/* Header */}
      <div className="animate__animated animate__fadeInDown" style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Mening statistikam
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          O'quv faoliyatingiz haqida batafsil ma'lumot va tahlillar
        </Text>
      </div>

      {/* Statistics Cards with Entrance Animations */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '100ms' }}>
            <StatCard
              title="Topshirilgan testlar"
              value={stats.completedTests}
              icon={<CheckCircleOutlined />}
              color="#16a34a"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '200ms' }}>
            <StatCard
              title="O'rtacha ball"
              value={stats.averageScore}
              suffix="%"
              icon={<RiseOutlined />}
              color="#2563eb"
              trend={{ direction: stats.averageScore >= 75 ? 'up' : 'down', value: '+2.5%' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '300ms' }}>
            <StatCard
              title="Eng yuqori ball"
              value={stats.highestScore}
              suffix="%"
              icon={<TrophyOutlined />}
              color="#f59e0b"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '400ms' }}>
            <StatCard
              title="Yulduzlar"
              value={stats.stars}
              icon={<StarOutlined />}
              color="#8b5cf6"
            />
          </div>
        </Col>
      </Row>



      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '600ms', marginBottom: '16px' }}>
        <Card style={{
          backgroundColor: '#eff6ff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0'
        }}>
          <Title level={3} style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <FundOutlined style={{ color: '#2563eb' }} />
            Tahlillar va ko'rsatkichlar
          </Title>
          
          {/* Chart Management Controls */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <Text style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              display: 'block',
              marginBottom: '12px'
            }}>
              Diagrammalar boshqaruvi
            </Text>
            <Row gutter={[16, 12]}>
              {[
                { key: 'subjectPerformance', label: 'Fan bo\'yicha natijalar', icon: <BarChartOutlined style={{ color: '#2563eb' }} /> },
                { key: 'monthlyProgress', label: 'Oylik taraqqiyot', icon: <LineChartOutlined style={{ color: '#16a34a' }} /> },
                { key: 'difficultyAnalysis', label: 'Qiyinchilik tahlili', icon: <PieChartOutlined style={{ color: '#f59e0b' }} /> },
                { key: 'improvementTrend', label: 'Yaxshilanish trendi', icon: <LineChartOutlined style={{ color: '#8b5cf6' }} /> },
                { key: 'performanceRadar', label: 'Umumiy ko\'rsatkich', icon: <ThunderboltOutlined style={{ color: '#059669' }} /> },
                { key: 'testHistory', label: 'Test tarixi', icon: <ReadOutlined style={{ color: '#dc2626' }} /> }
              ].map(chart => (
                <Col xs={24} sm={12} md={8} key={chart.key}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <Text style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{chart.label}</Text>
                    <Switch
                      size="small"
                      checked={visibleCharts[chart.key]}
                      onChange={(checked) => setVisibleCharts(prev => ({ ...prev, [chart.key]: checked }))}
                      style={{ backgroundColor: visibleCharts[chart.key] ? '#2563eb' : '#d1d5db' }}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="subjectPerformance"
            title="Fan bo'yicha natijalar"
            icon={<BarChartOutlined style={{ color: '#2563eb' }} />}
            width={50}
            index={0}
          >
            <Bar data={subjectPerformanceChart} options={barChartOptions} />
          </ResizableChart>

          <ResizableChart
            chartKey="monthlyProgress"
            title="Oylik taraqqiyot"
            icon={<LineChartOutlined style={{ color: '#16a34a' }} />}
            width={50}
            index={1}
          >
            <Line data={monthlyProgressChart} options={chartOptions} />
          </ResizableChart>
        </Row>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="difficultyAnalysis"
            title="Qiyinchilik bo'yicha tahlil"
            icon={<PieChartOutlined style={{ color: '#f59e0b' }} />}
            width={50}
            index={2}
          >
            <Pie data={difficultyAnalysisChart} options={pieChartOptions} />
          </ResizableChart>

          <ResizableChart
            chartKey="improvementTrend"
            title="Yaxshilanish trendi"
            icon={<LineChartOutlined style={{ color: '#8b5cf6' }} />}
            width={50}
            index={3}
          >
            <Line data={improvementTrendChart} options={chartOptions} />
          </ResizableChart>
        </Row>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="performanceRadar"
            title="Umumiy ko'rsatkich"
            icon={<ThunderboltOutlined style={{ color: '#059669' }} />}
            width={100}
            index={4}
          >
            <Radar data={performanceRadarChart} options={radarChartOptions} />
          </ResizableChart>
        </Row>
      </div>

      {/* Recent Activity and Subject Performance */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Recent Activity Timeline */}
        <Col xs={24} lg={12}>
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <Title level={3} style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CalendarOutlined style={{ color: '#2563eb' }} />
              So'nggi faoliyat
            </Title>
            <Timeline
              items={stats.recentActivity.map((activity, index) => ({
                color: activity.score >= 80 ? 'green' : activity.score >= 60 ? 'blue' : 'red',
                children: (
                  <div>
                    <Text strong style={{ color: '#1e293b' }}>
                      {activity.test}
                    </Text>
                    <br />
                    <Text style={{ color: '#64748b', fontSize: '14px' }}>
                      {activity.score}% ball • {activity.subject}
                    </Text>
                    <br />
                    <Text style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {activity.time}
                    </Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        {/* Subject Performance */}
        <Col xs={24} lg={12}>
          <Card
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <Title level={3} style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <BookOutlined style={{ color: '#2563eb' }} />
              Fan bo'yicha ko'rsatkichlar
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {stats.subjectPerformance.slice(0, 6).map((subject) => (
                <div key={subject.subject} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <Space>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: getSubjectColor(subject.subject),
                      borderRadius: '50%'
                    }} />
                    <Text strong style={{ color: '#1e293b' }}>
                      {subject.subject}
                    </Text>
                  </Space>
                  <Space>
                    <Progress
                      percent={subject.averageScore}
                      size="small"
                      strokeColor={getPerformanceColor(subject.performance)}
                      style={{ width: '80px' }}
                    />
                    <Text style={{ 
                      color: getPerformanceColor(subject.performance), 
                      fontWeight: 600,
                      minWidth: '30px'
                    }}>
                      {subject.averageScore}%
                    </Text>
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Test History Table */}
      {visibleCharts.testHistory && (
        <Card
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}
        >
          <Title level={3} style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '24px'
          }}>
            Test tarixi
          </Title>
          <Table
            columns={columns}
            dataSource={stats.recentTests}
            rowKey="id"
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Jami ${total} ta test`,
            }}
            locale={{
              emptyText: 'Testlar mavjud emas'
            }}
            onRow={(record, index) => ({
              className: 'animate__animated animate__fadeInLeft',
              style: { 
                animationDelay: `${index * 50}ms`,
                transition: 'all 0.3s ease'
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.transform = 'scale(1.01)';
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }
            })}
          />
        </Card>
      )}
    </div>
  );
};

export default StudentStatistics;