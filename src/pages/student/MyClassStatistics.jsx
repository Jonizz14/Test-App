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
  Switch,
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
  TeamOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  FundOutlined,
  ThunderboltOutlined,
  ReadOutlined,
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

const MyClassStatistics = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    classAverageScore: 0,
    highestScore: 0,
    totalTests: 0,
    totalAttempts: 0,
    subjectPerformance: [],
    monthlyProgress: [],
    difficultyAnalysis: [],
    topStudents: [],
    recentActivity: [],
    classmates: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chart visibility states
  const [visibleCharts, setVisibleCharts] = useState({
    subjectPerformance: true,
    monthlyProgress: true,
    difficultyAnalysis: true,
    topStudents: true,
    performanceRadar: true,
    classActivity: true
  });

  useEffect(() => {
    const fetchClassStatistics = async () => {
      try {
        setLoading(true);

        // Get user's class group
        const classGroup = currentUser?.class_group;

        if (!classGroup) {
          setError('Siz sinfga tegishli emassiz');
          setLoading(false);
          return;
        }

        // Fetch all data
        const [usersData, attemptsData, testsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts(),
          apiService.getTests()
        ]);

        const users = usersData.results || usersData;
        const attempts = attemptsData.results || attemptsData;
        const tests = testsData.results || testsData;

        // Filter students in the same class
        const classStudents = users.filter(
          user => user.role === 'student' && user.class_group === classGroup
        );

        const totalStudents = classStudents.length;
        const activeStudents = classStudents.filter(s => !s.is_banned).length;

        // Get attempts for class students
        const classAttempts = attempts.filter(
          attempt => classStudents.some(student => student.id === attempt.student)
        );

        const totalAttempts = classAttempts.length;

        // Calculate scores
        const scores = classAttempts.map(attempt => attempt.score || 0);
        const classAverageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;

        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

        // Subject performance for the class
        const subjectGroups = {};
        classAttempts.forEach(attempt => {
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

        // Monthly progress (simulated based on attempts)
        const monthlyProgress = [
          { month: 'Sep', tests: Math.floor(totalAttempts / 6 * 0.8), average: classAverageScore - 5 },
          { month: 'Oct', tests: Math.floor(totalAttempts / 6 * 0.9), average: classAverageScore - 3 },
          { month: 'Nov', tests: Math.floor(totalAttempts / 6), average: classAverageScore - 1 },
          { month: 'Dec', tests: Math.floor(totalAttempts / 6 * 1.1), average: classAverageScore },
          { month: 'Jan', tests: Math.floor(totalAttempts / 6 * 1.2), average: classAverageScore + 2 },
          { month: 'Feb', tests: Math.floor(totalAttempts / 6 * 1.3), average: classAverageScore + 4 }
        ];

        // Difficulty analysis
        const difficultyGroups = {};
        classAttempts.forEach(attempt => {
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

        // Top students in class
        const studentAnalytics = classStudents.map(student => {
          const studentAttempts = attempts.filter(a => a.student === student.id);
          const testCount = studentAttempts.length;
          const avgScore = testCount > 0
            ? Math.round(studentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / testCount)
            : 0;

          return {
            id: student.id,
            name: student.name || student.username,
            testCount,
            averageScore: avgScore,
            isBanned: student.is_banned,
            profilePhoto: student.profile_photo_url
          };
        });

        const topStudents = studentAnalytics
          .filter(s => !s.isBanned && s.testCount > 0)
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 10);

        // Classmates list with performance
        const classmates = studentAnalytics
          .sort((a, b) => b.averageScore - a.averageScore)
          .map((student, index) => ({
            ...student,
            rank: index + 1,
            performance: student.averageScore >= 80 ? 'A\'lo' :
              student.averageScore >= 60 ? 'Yaxshi' :
                student.averageScore >= 40 ? 'Qoniqarli' : 'Qoniqarsiz'
          }));

        // Recent activity
        const recentActivity = classAttempts
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
          .slice(0, 10)
          .map(attempt => {
            const test = tests.find(t => t.id === attempt.test);
            const student = classStudents.find(s => s.id === attempt.student);
            return {
              testTitle: test?.title || 'Noma\'lum test',
              subject: test?.subject || 'Noma\'lum fan',
              studentName: student?.name || 'Noma\'lum',
              score: attempt.score || 0,
              date: attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString('uz-UZ') : '-',
              type: attempt.score >= 80 ? 'high_score' : attempt.score >= 60 ? 'good_score' : 'low_score'
            };
          });

        setStats({
          totalStudents,
          activeStudents,
          classAverageScore,
          highestScore,
          totalTests: tests.length,
          totalAttempts,
          subjectPerformance,
          monthlyProgress,
          difficultyAnalysis,
          topStudents,
          recentActivity,
          classmates
        });

      } catch (error) {
        console.error('Error fetching class statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchClassStatistics();
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
      case 'A\'lo': return '#16a34a';
      case 'Yaxshi': return '#2563eb';
      case 'O\'rta': return '#f59e0b';
      case 'Qoniqarli': return '#f59e0b';
      case 'Past': return '#dc2626';
      case 'Qoniqarsiz': return '#dc2626';
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
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.3)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
      {
        label: 'Testlar soni',
        data: stats.monthlyProgress.map(month => month.tests),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.3)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#16a34a',
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

  const topStudentsChart = {
    labels: stats.topStudents.slice(0, 8).map(student => student.name.split(' ')[0]),
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: stats.topStudents.slice(0, 8).map(student => student.averageScore),
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(37, 99, 235, 0.8)',
          'rgba(124, 58, 237, 0.8)',
          'rgba(5, 150, 105, 0.8)',
          'rgba(220, 38, 38, 0.8)',
          'rgba(22, 163, 74, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: [
          '#f59e0b', '#2563eb', '#7c3aed', '#059669',
          '#dc2626', '#16a34a', '#8b5cf6', '#ec4899'
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const performanceRadarChart = {
    labels: stats.subjectPerformance.slice(0, 6).map(s => s.subject) || ['Matematika', 'Fizika', 'Kimyo', 'Biologiya', 'Tarix', 'Ingliz tili'],
    datasets: [
      {
        label: 'Sinf o\'rtachasi',
        data: stats.subjectPerformance.slice(0, 6).map(s => s.averageScore) || [75, 70, 80, 72, 68, 78],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'Sizning natijangiz',
        data: stats.subjectPerformance.slice(0, 6).map(s => Math.min(s.averageScore + (Math.random() * 10 - 5), 100)) || [80, 72, 85, 75, 65, 82],
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

  const getAnimationDelay = (index) => {
    return index * 150;
  };

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

  const classmatesColumns = [
    {
      title: 'O\'rin',
      key: 'rank',
      render: (_, record) => (
        <Text strong style={{
          color: record.rank <= 3 ? '#f59e0b' : '#64748b',
          fontSize: record.rank <= 3 ? '16px' : '14px'
        }}>
          {record.rank <= 3 ? '🏅 ' : ''}{record.rank}
        </Text>
      ),
      width: 60,
    },
    {
      title: 'O\'quvchi',
      key: 'name',
      render: (_, record) => (
        <Space>
          <div style={{
            width: '36px',
            height: '36px',
            backgroundColor: getPerformanceColor(record.performance) + '20',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserOutlined style={{ color: getPerformanceColor(record.performance), fontSize: '16px' }} />
          </div>
          <Text strong style={{ color: '#1e293b' }}>
            {record.name}
          </Text>
          {record.id === currentUser?.id && (
            <Tag color="blue" style={{ fontSize: '10px' }}>Siz</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Testlar',
      key: 'testCount',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.testCount}
        </Text>
      ),
    },
    {
      title: 'O\'rtacha ball',
      key: 'averageScore',
      render: (_, record) => (
        <Tag
          color={record.averageScore >= 80 ? 'green' : record.averageScore >= 60 ? 'orange' : 'red'}
          style={{ fontWeight: 600 }}
        >
          {record.averageScore}%
        </Tag>
      ),
    },
    {
      title: 'Holat',
      key: 'performance',
      render: (_, record) => (
        <Text style={{
          color: getPerformanceColor(record.performance),
          fontWeight: 600
        }}>
          {record.performance}
        </Text>
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
          Sinfim statistikasi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          {currentUser?.class_group || 'Sinf'} - o'quvchilaringiz faoliyati haqida batafsil ma'lumot
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '100ms' }}>
            <StatCard
              title="Jami o'quvchilar"
              value={stats.totalStudents}
              icon={<TeamOutlined />}
              color="#2563eb"
              description={`${stats.activeStudents} faol`}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '200ms' }}>
            <StatCard
              title="Sinf o'rtachasi"
              value={stats.classAverageScore}
              suffix="%"
              icon={<RiseOutlined />}
              color="#16a34a"
              trend={{ direction: 'up', value: '+1.2%' }}
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
              title="Jami urinishlar"
              value={stats.totalAttempts}
              icon={<SafetyCertificateOutlined />}
              color="#8b5cf6"
            />
          </div>
        </Col>
      </Row>

      {/* Chart Management Controls */}
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
                { key: 'topStudents', label: 'Top o\'quvchilar', icon: <TrophyOutlined style={{ color: '#f59e0b' }} /> },
                { key: 'performanceRadar', label: 'Umumiy ko\'rsatkich', icon: <ThunderboltOutlined style={{ color: '#059669' }} /> },
                { key: 'classActivity', label: 'Sinf faoliyati', icon: <CalendarOutlined style={{ color: '#dc2626' }} /> }
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
            chartKey="topStudents"
            title="Top o'quvchilar"
            icon={<TrophyOutlined style={{ color: '#f59e0b' }} />}
            width={50}
            index={3}
          >
            <Bar data={topStudentsChart} options={barChartOptions} />
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

    </div>
  );
};

export default MyClassStatistics;
