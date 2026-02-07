import React, { useState, useEffect, useRef } from 'react';
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
  Timeline,
  Divider,
  Tooltip,
  Switch,
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  RiseOutlined,
  TrophyOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  PlusOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
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

const TeacherStatistics = () => {
  const { currentUser } = useAuth();
  const _navigate = useNavigate();
  const _chartRefs = useRef({});
  const [stats, setStats] = useState({
    // Overview stats
    totalTests: 0,
    activeTests: 0,
    totalAttempts: 0,
    uniqueStudents: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    mySubject: '',

    // Growth metrics
    testGrowth: 0,
    attemptGrowth: 0,
    scoreGrowth: 0,

    // Detailed analytics
    classPerformance: [],
    topStudents: [],
    popularTests: [],
    monthlyPerformance: [],
    studentScoreDistribution: [],
    scoreRanges: {},

    // Recent insights
    recentActivities: [],
    insights: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Card toggle states
  const [visibleCards, setVisibleCards] = useState({
    totalTests: true,
    activeTests: true,
    totalAttempts: true,
    averageScore: true,
    // Individual chart toggles
    monthlyPerformance: true,
    classPerformance: true,
    scoreDistribution: true,
    studentAvgScore: true,
    testDifficulty: true
  });

  // Toggle functions for cards
  const toggleCard = (cardKey) => {
    setVisibleCards(prev => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  // Fetch comprehensive statistics
  useEffect(() => {
    const fetchComprehensiveStatistics = async () => {
      try {
        setLoading(true);

        const [testsData, attemptsData, usersData] = await Promise.all([
          apiService.getTests({ teacher: currentUser.id }),
          apiService.getAttempts(),
          apiService.getUsers()
        ]);

        const tests = (testsData.results || testsData).filter(t => t.teacher === currentUser.id);
        const allAttempts = attemptsData.results || attemptsData;
        const users = usersData.results || usersData;
        const students = users.filter(u => u.role === 'student');

        // Filter attempts for teacher's tests
        const testIds = tests.map(t => t.id);
        const attempts = allAttempts.filter(a => testIds.includes(a.test));

        // Get teacher's subject (from first test)
        const mySubject = tests.length > 0 ? tests[0].subject : "Noma'lum";

        // Calculate basic metrics
        const totalTests = tests.length;
        const activeTests = tests.filter(test => test.is_active).length;
        const totalAttempts = attempts.length;
        const uniqueStudents = new Set(attempts.map(a => a.student)).size;

        const scores = attempts.map(attempt => attempt.score || 0);
        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

        // Monthly performance for my subject (last 6 months)
        const monthlyData = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' });
          monthlyData[monthKey] = { attempts: 0, totalScore: 0 };
        }

        attempts.forEach(attempt => {
          const date = new Date(attempt.submitted_at);
          const monthKey = date.toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' });
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].attempts++;
            monthlyData[monthKey].totalScore += attempt.score || 0;
          }
        });

        const monthlyPerformance = Object.entries(monthlyData).map(([month, data]) => ({
          month,
          attempts: data.attempts,
          averageScore: data.attempts > 0 ? Math.round(data.totalScore / data.attempts) : 0
        }));

        // Class performance analysis
        const classGroups = {};
        attempts.forEach(attempt => {
          const student = students.find(s => s.id === attempt.student);
          if (student) {
            const classGroup = student.class_group || "Noma'lum";
            if (!classGroups[classGroup]) {
              classGroups[classGroup] = {
                name: classGroup,
                students: new Set(),
                totalAttempts: 0,
                totalScore: 0,
              };
            }
            classGroups[classGroup].students.add(student.id);
            classGroups[classGroup].totalAttempts++;
            classGroups[classGroup].totalScore += attempt.score || 0;
          }
        });

        const classPerformance = Object.values(classGroups).map(cls => ({
          name: cls.name,
          studentCount: cls.students.size,
          attemptCount: cls.totalAttempts,
          averageScore: cls.totalAttempts > 0 ? Math.round(cls.totalScore / cls.totalAttempts) : 0
        })).sort((a, b) => b.averageScore - a.averageScore);

        // Top students analysis with average scores
        const studentStats = {};
        attempts.forEach(attempt => {
          const student = students.find(s => s.id === attempt.student);
          if (student) {
            if (!studentStats[student.id]) {
              studentStats[student.id] = {
                id: student.id,
                name: student.name || student.username || `${student.first_name} ${student.last_name}`,
                classGroup: student.class_group || "Noma'lum",
                testCount: 0,
                totalScore: 0
              };
            }
            studentStats[student.id].testCount++;
            studentStats[student.id].totalScore += attempt.score || 0;
          }
        });

        const topStudents = Object.values(studentStats)
          .map(s => ({
            ...s,
            averageScore: s.testCount > 0 ? Math.round(s.totalScore / s.testCount) : 0
          }))
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 10);

        // Student score distribution (for bar chart)
        const studentScoreDistribution = topStudents.slice(0, 8).map(s => ({
          name: s.name.split(' ')[0], // First name only
          score: s.averageScore
        }));

        // Popular tests analysis
        const testStats = tests.map(test => {
          const testAttempts = attempts.filter(a => a.test === test.id);
          const avgScore = testAttempts.length > 0
            ? Math.round(testAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / testAttempts.length)
            : 0;
          return {
            id: test.id,
            title: test.title,
            subject: test.subject,
            attemptCount: testAttempts.length,
            averageScore: avgScore,
            isActive: test.is_active
          };
        }).sort((a, b) => b.attemptCount - a.attemptCount);

        // Score distribution
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

        // Generate insights
        const insights = [
          {
            type: 'positive',
            title: "A'lo natijalar",
            description: `${topStudents.filter(s => s.averageScore >= 80).length} ta o'quvchi 80% dan yuqori ball oldi`,
            impact: 'high'
          },
          {
            type: 'info',
            title: 'Faol testlar',
            description: `${activeTests} ta test faol holatda`,
            impact: 'medium'
          },
          {
            type: 'warning',
            title: "Past natijalar",
            description: `${topStudents.filter(s => s.averageScore < 50).length} ta o'quvchi 50% dan past ball oldi`,
            impact: 'low'
          }
        ];

        // Recent activities
        const recentActivities = attempts
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
          .slice(0, 5)
          .map(attempt => {
            const student = students.find(s => s.id === attempt.student);
            const test = tests.find(t => t.id === attempt.test);
            return {
              type: 'test_completion',
              title: `${student?.name || 'O\'quvchi'} test yakunladi`,
              description: `${test?.title || 'Test'} - ${attempt.score}%`,
              time: new Date(attempt.submitted_at).toLocaleDateString('uz-UZ'),
              icon: <TrophyOutlined style={{ color: attempt.score >= 70 ? '#16a34a' : '#f59e0b' }} />
            };
          });

        setStats({
          totalTests,
          activeTests,
          totalAttempts,
          uniqueStudents,
          averageScore,
          highestScore,
          lowestScore,
          mySubject,
          testGrowth: 8.3,
          attemptGrowth: 15.7,
          scoreGrowth: 3.2,
          classPerformance,
          topStudents,
          popularTests: testStats,
          monthlyPerformance,
          studentScoreDistribution,
          scoreRanges,
          recentActivities,
          insights,
          alerts: []
        });

      } catch (error) {
        console.error('Error fetching comprehensive statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchComprehensiveStatistics();
  }, [currentUser.id]);

  // Chart Configuration and Data
  const createGradient = (ctx, color1, color2) => {
    if (!ctx || !ctx.createLinearGradient) return color1;
    try {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      return gradient;
    } catch (_error) {
      return color1;
    }
  };

  // Monthly performance chart for my subject
  const monthlyPerformanceChart = {
    labels: stats.monthlyPerformance.map(item => item.month),
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: stats.monthlyPerformance.map(item => item.averageScore),
        borderColor: '#8b5cf6',
        backgroundColor: (context) => {
          try {
            const chart = context?.chart;
            const { ctx, chartArea } = chart || {};
            if (!chartArea || !ctx) return 'rgba(139, 92, 246, 0.4)';
            return createGradient(ctx, 'rgba(139, 92, 246, 0.4)', 'rgba(139, 92, 246, 0.1)');
          } catch (_error) {
            return 'rgba(139, 92, 246, 0.4)';
          }
        },
        borderWidth: 4,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 10,
      },
      {
        label: 'Urinishlar soni',
        data: stats.monthlyPerformance.map(item => item.attempts),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y1',
      },
    ],
  };

  const scoreDistributionChart = {
    labels: stats.scoreRanges ? Object.keys(stats.scoreRanges) : [],
    datasets: [
      {
        label: 'O\'quvchilar soni',
        data: stats.scoreRanges ? Object.values(stats.scoreRanges) : [],
        backgroundColor: [
          'rgba(220, 38, 38, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(5, 150, 105, 0.8)',
        ],
        borderColor: ['#dc2626', '#f59e0b', '#fbbf24', '#10b981', '#059669'],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const classPerformanceBarChart = {
    labels: stats.classPerformance.slice(0, 8).map(item => item.name),
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: stats.classPerformance.slice(0, 8).map(item => item.averageScore),
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',
          'rgba(124, 58, 237, 0.8)',
          'rgba(5, 150, 105, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(220, 38, 38, 0.8)',
          'rgba(22, 163, 74, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: ['#2563eb', '#7c3aed', '#059669', '#f59e0b', '#dc2626', '#16a34a', '#8b5cf6', '#ec4899'],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  // Student average score chart
  const studentAvgScoreChart = {
    labels: stats.studentScoreDistribution.map(item => item.name),
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: stats.studentScoreDistribution.map(item => item.score),
        backgroundColor: stats.studentScoreDistribution.map(item =>
          item.score >= 80 ? 'rgba(5, 150, 105, 0.8)' :
            item.score >= 60 ? 'rgba(245, 158, 11, 0.8)' :
              'rgba(220, 38, 38, 0.8)'
        ),
        borderColor: stats.studentScoreDistribution.map(item =>
          item.score >= 80 ? '#059669' :
            item.score >= 60 ? '#f59e0b' :
              '#dc2626'
        ),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  // Test difficulty chart (3 levels only - no "Juda qiyin")
  const testDifficultyChart = {
    labels: ['Oson (80%+)', 'O\'rta (50-79%)', 'Qiyin (<50%)'],
    datasets: [
      {
        data: [
          stats.popularTests.filter(test => test.averageScore >= 80).length,
          stats.popularTests.filter(test => test.averageScore >= 50 && test.averageScore < 80).length,
          stats.popularTests.filter(test => test.averageScore < 50).length
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 3,
        hoverOffset: 15,
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
        mode: 'index',
        intersect: false,
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
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const monthlyChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        position: 'left',
        title: { display: true, text: 'O\'rtacha ball (%)', color: '#8b5cf6' },
      },
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#2563eb', font: { size: 11, weight: 500 } },
        title: { display: true, text: 'Urinishlar', color: '#2563eb' },
        beginAtZero: true,
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: { ...chartOptions.plugins, legend: { ...chartOptions.plugins.legend, display: false } },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, pointStyle: 'circle', font: { size: 12, weight: 600 }, color: '#374151', padding: 20 },
      },
      tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: '#ffffff', bodyColor: '#ffffff', cornerRadius: 8, padding: 12 },
    },
  };

  const StatCard = ({ title, value, icon, color, suffix, trend }) => (
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
            <Text style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', display: 'block', marginBottom: '8px' }}>
              {title}
            </Text>
            <Statistic value={value} suffix={suffix} styles={{ content: { fontSize: '32px', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 } }} />
          </div>
          <div style={{ backgroundColor: color, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '16px' }}>
            {React.cloneElement(icon, { style: { fontSize: '28px', color: '#ffffff' } })}
          </div>
        </div>
      </Card>
      {trend && (
        <Card style={{ backgroundColor: trend.direction === 'up' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${trend.direction === 'up' ? '#bbf7d0' : '#fecaca'}`, borderRadius: '8px' }} bodyStyle={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {trend.direction === 'up' ? <ArrowUpOutlined style={{ color: '#16a34a', fontSize: '14px', marginRight: '6px' }} /> : <ArrowDownOutlined style={{ color: '#dc2626', fontSize: '14px', marginRight: '6px' }} />}
            <Text style={{ fontSize: '13px', fontWeight: 600, color: trend.direction === 'up' ? '#16a34a' : '#dc2626' }}>{trend.value} o'tgan oyga nisbatan</Text>
          </div>
        </Card>
      )}
    </div>
  );

  const ResizableChart = ({ chartKey, title, icon, children, width, index = 0 }) => {
    const isVisible = visibleCards[chartKey];
    if (!isVisible) return null;

    return (
      <div style={{ width: `${width || 50}%`, padding: '0 8px' }}>
        <Card
          style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', height: '400px' }}
          bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}
          hoverable
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            {icon}
            <Title level={3} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0 8px' }}>{title}</Title>
          </div>
          <div style={{ flex: 1, height: '320px' }}>{children}</div>
        </Card>
      </div>
    );
  };

  const columns = {
    students: [
      { title: 'O\'quvchi', dataIndex: 'name', key: 'name', render: (text, record) => <Space><Text strong style={{ color: '#1e293b' }}>{text}</Text><Text style={{ color: '#64748b', fontSize: '12px' }}>({record.classGroup})</Text></Space> },
      { title: 'Testlar', dataIndex: 'testCount', key: 'testCount', render: (count) => <Text style={{ color: '#2563eb', fontWeight: 600 }}>{count}</Text> },
      { title: 'O\'rtacha ball', dataIndex: 'averageScore', key: 'averageScore', render: (score) => <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red'}>{score}%</Tag> },
    ],
    tests: [
      { title: 'Test', dataIndex: 'title', key: 'title', render: (text, record) => <Space direction="vertical" size="small"><Text strong style={{ color: '#1e293b' }}>{text}</Text><Text style={{ color: '#64748b', fontSize: '12px' }}>{record.subject}</Text></Space> },
      { title: 'Urinishlar', dataIndex: 'attemptCount', key: 'attemptCount', render: (count) => <Text style={{ color: '#7c3aed', fontWeight: 600 }}>{count}</Text> },
      { title: 'O\'rtacha ball', dataIndex: 'averageScore', key: 'averageScore', render: (score) => <Text style={{ color: '#059669', fontWeight: 600 }}>{score}%</Text> },
    ],
    classes: [
      { title: 'Sinf', dataIndex: 'name', key: 'name', render: (text) => <Text strong style={{ color: '#1e293b' }}>{text}</Text> },
      { title: 'O\'quvchilar', dataIndex: 'studentCount', key: 'studentCount', render: (count) => <Text style={{ color: '#64748b' }}>{count} ta</Text> },
      { title: 'O\'rtacha ball', dataIndex: 'averageScore', key: 'averageScore', render: (score) => <Text style={{ color: score >= 70 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#dc2626', fontWeight: 600 }}>{score}%</Text> },
    ]
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16 }}>Ma'lumotlar yuklanmoqda...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert message={error} type="error" showIcon style={{ marginBottom: '16px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>O'qituvchi statistikasi</Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          {stats.mySubject ? `${stats.mySubject} fani bo'yicha` : ''} testlaringiz va o'quvchilaringizning to'liq analitikasi
        </Text>
      </div>

      {/* Overview Statistics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Jami testlar" value={stats.totalTests} icon={<FileTextOutlined />} color="#2563eb" trend={{ direction: 'up', value: `+${stats.testGrowth}%` }} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Faol testlar" value={stats.activeTests} icon={<BookOutlined />} color="#16a34a" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Jami urinishlar" value={stats.totalAttempts} icon={<TrophyOutlined />} color="#7c3aed" trend={{ direction: 'up', value: `+${stats.attemptGrowth}%` }} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="O'rtacha ball" value={stats.averageScore} suffix="%" icon={<RiseOutlined />} color="#f59e0b" trend={{ direction: 'up', value: `+${stats.scoreGrowth}%` }} />
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Noyob o'quvchilar" value={stats.uniqueStudents} icon={<UserOutlined />} color="#059669" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Eng yuqori ball" value={stats.highestScore} suffix="%" icon={<TrophyOutlined />} color="#10b981" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="Eng past ball" value={stats.lowestScore} suffix="%" icon={<ArrowDownOutlined />} color="#dc2626" />
        </Col>
      </Row>

      {/* Chart Controls */}
      <div style={{ marginBottom: '16px' }}>
        <Card style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0' }}>
          <Title level={3} style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChartOutlined style={{ color: '#2563eb' }} /> Statistik ma'lumotlar va tahlillar
          </Title>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
            <Text style={{ fontSize: '14px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '12px' }}>Diagrammalar boshqaruvi</Text>
            <Row gutter={[16, 12]}>
              {[
                { key: 'monthlyPerformance', label: 'Oylik ko\'rsatkich', icon: <LineChartOutlined style={{ color: '#8b5cf6' }} /> },
                { key: 'classPerformance', label: 'Sinf natijalari', icon: <BarChartOutlined style={{ color: '#059669' }} /> },
                { key: 'scoreDistribution', label: 'Ballar taqsimoti', icon: <PieChartOutlined style={{ color: '#f59e0b' }} /> },
                { key: 'studentAvgScore', label: 'O\'quvchilar o\'rtacha balli', icon: <UserOutlined style={{ color: '#2563eb' }} /> },
                { key: 'testDifficulty', label: 'Test qiyinligi', icon: <BookOutlined style={{ color: '#7c3aed' }} /> }
              ].map(chart => (
                <Col xs={24} sm={12} md={8} key={chart.key}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <Text style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{chart.label}</Text>
                    <Switch size="small" checked={visibleCards[chart.key]} onChange={() => toggleCard(chart.key)} style={{ backgroundColor: visibleCards[chart.key] ? '#2563eb' : '#d1d5db' }} />
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
          <ResizableChart chartKey="monthlyPerformance" title={`${stats.mySubject || 'Fanimning'} oylik ko'rsatkichi`} icon={<LineChartOutlined style={{ color: '#8b5cf6' }} />} width={100} index={0}>
            <Line data={monthlyPerformanceChart} options={monthlyChartOptions} />
          </ResizableChart>
        </Row>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart chartKey="classPerformance" title="Sinf natijalari" icon={<BarChartOutlined style={{ color: '#059669' }} />} width={50} index={1}>
            <Bar data={classPerformanceBarChart} options={barChartOptions} />
          </ResizableChart>
          <ResizableChart chartKey="scoreDistribution" title="Ballar taqsimoti" icon={<PieChartOutlined style={{ color: '#f59e0b' }} />} width={50} index={2}>
            <Bar data={scoreDistributionChart} options={barChartOptions} />
          </ResizableChart>
        </Row>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart chartKey="studentAvgScore" title="O'quvchilar o'rtacha balli" icon={<UserOutlined style={{ color: '#2563eb' }} />} width={50} index={3}>
            <Bar data={studentAvgScoreChart} options={barChartOptions} />
          </ResizableChart>
          <ResizableChart chartKey="testDifficulty" title="Test qiyinligi" icon={<BookOutlined style={{ color: '#7c3aed' }} />} width={50} index={4}>
            <Pie data={testDifficultyChart} options={pieChartOptions} />
          </ResizableChart>
        </Row>
      </div>

      {/* Tables Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <Title level={3} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TeamOutlined style={{ color: '#16a34a' }} /> Top sinflar
            </Title>
            <Table dataSource={stats.classPerformance.slice(0, 5)} columns={columns.classes} pagination={false} size="small" rowKey="name" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <Title level={3} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StarOutlined style={{ color: '#f59e0b' }} /> Top o'quvchilar
            </Title>
            <Table dataSource={stats.topStudents.slice(0, 5)} columns={columns.students} pagination={false} size="small" rowKey="id" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <Title level={3} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOutlined style={{ color: '#7c3aed' }} /> Mening testlarim
            </Title>
            <Table dataSource={stats.popularTests.slice(0, 5)} columns={columns.tests} pagination={false} size="small" rowKey="id" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherStatistics;
