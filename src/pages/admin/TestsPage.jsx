import React, { useState, useEffect } from 'react';
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
  StopOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
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
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const TestsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTests: 0,
    activeTests: 0,
    inactiveTests: 0,
    totalAttempts: 0,
    averageScore: 0,
    popularTests: [],
    testStatistics: [],
    recentActivity: [],
    subjectDistribution: [],
    difficultyDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart visibility states
  const [visibleCharts, setVisibleCharts] = useState({
    subjectDistribution: true,
    difficultyAnalysis: true,
    monthlyCreation: true,
    performanceTrend: true,
    testPopularity: true,
    teacherActivity: true
  });
  
  // Chart width control states
  const [chartWidths, setChartWidths] = useState({
    subjectDistribution: 50,
    difficultyAnalysis: 50,
    monthlyCreation: 50,
    performanceTrend: 100,
    testPopularity: 50,
    teacherActivity: 50
  });
  
  // Toggle functions for charts
  const toggleChart = (chartKey) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartKey]: !prev[chartKey]
    }));
  };

  // Fetch test statistics
  useEffect(() => {
    const fetchTestStatistics = async () => {
      try {
        setLoading(true);
        
        const [testsData, attemptsData, usersData] = await Promise.all([
          apiService.getTests(),
          apiService.getAttempts(),
          apiService.getUsers()
        ]);

        const tests = testsData.results || testsData;
        const attempts = attemptsData.results || attemptsData;
        const users = usersData.results || usersData;

        // Calculate test performance and statistics
        const testStatistics = tests.map(test => {
          const testAttempts = attempts.filter(attempt => attempt.test === test.id);
          const attemptCount = testAttempts.length;
          const averageScore = attemptCount > 0 
            ? testAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / attemptCount
            : 0;

          // Get teacher name
          const teacher = users.find(user => user.id === test.teacher);
          const teacherName = teacher ? teacher.name || teacher.username : 'Noma\'lum';

          return {
            id: test.id,
            title: test.title,
            subject: test.subject,
            teacherName,
            totalQuestions: test.total_questions || 0,
            timeLimit: test.time_limit || 0,
            difficulty: test.difficulty || 'O\'rta',
            isActive: test.is_active !== false,
            attemptCount,
            averageScore: Math.round(averageScore),
            createdAt: test.created_at,
            performance: averageScore >= 80 ? 'Yuqori' : averageScore >= 60 ? 'O\'rta' : 'Past'
          };
        });

        // Calculate overall statistics
        const totalTests = tests.length;
        const activeTests = tests.filter(test => test.is_active !== false).length;
        const inactiveTests = totalTests - activeTests;
        const totalAttempts = attempts.length;
        const averageScore = testStatistics.length > 0 
          ? Math.round(testStatistics.reduce((sum, test) => sum + test.averageScore, 0) / testStatistics.length)
          : 0;

        // Get popular tests (top 10 by attempt count)
        const popularTests = testStatistics
          .sort((a, b) => b.attemptCount - a.attemptCount)
          .slice(0, 10);

        // Subject distribution
        const subjectGroups = {};
        testStatistics.forEach(test => {
          const subject = test.subject || 'Noma\'lum';
          if (!subjectGroups[subject]) {
            subjectGroups[subject] = { total: 0, active: 0, totalAttempts: 0 };
          }
          subjectGroups[subject].total++;
          if (test.isActive) {
            subjectGroups[subject].active++;
          }
          subjectGroups[subject].totalAttempts += test.attemptCount;
        });

        const subjectDistribution = Object.entries(subjectGroups).map(([subject, data]) => ({
          subject,
          ...data
        })).sort((a, b) => b.totalAttempts - a.totalAttempts);

        // Difficulty distribution
        const difficultyGroups = {};
        testStatistics.forEach(test => {
          const difficulty = test.difficulty || 'O\'rta';
          if (!difficultyGroups[difficulty]) {
            difficultyGroups[difficulty] = { total: 0, active: 0, totalAttempts: 0 };
          }
          difficultyGroups[difficulty].total++;
          if (test.isActive) {
            difficultyGroups[difficulty].active++;
          }
          difficultyGroups[difficulty].totalAttempts += test.attemptCount;
        });

        const difficultyDistribution = Object.entries(difficultyGroups).map(([difficulty, data]) => ({
          difficulty,
          ...data
        }));

        // Recent activity (simulated based on test creation dates)
        const recentTestCreations = tests
          .filter(test => test.created_at)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(test => {
            const teacher = users.find(user => user.id === test.teacher);
            return {
              testTitle: test.title,
              subject: test.subject,
              teacher: teacher ? teacher.name || teacher.username : 'Noma\'lum',
              action: 'Test yaratildi',
              time: new Date(test.created_at).toLocaleDateString('uz-UZ'),
              type: 'test_creation'
            };
          });

        setStats({
          totalTests,
          activeTests,
          inactiveTests,
          totalAttempts,
          averageScore,
          popularTests,
          testStatistics,
          recentActivity: recentTestCreations,
          subjectDistribution,
          difficultyDistribution
        });

      } catch (error) {
        console.error('Error fetching test statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchTestStatistics();
  }, []);

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
  const subjectDistributionChart = {
    labels: stats.subjectDistribution.slice(0, 8).map(subject => subject.subject),
    datasets: [
      {
        label: 'Jami testlar',
        data: stats.subjectDistribution.slice(0, 8).map(subject => subject.total),
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
        borderColor: [
          '#2563eb', '#7c3aed', '#059669', '#f59e0b', 
          '#dc2626', '#16a34a', '#8b5cf6', '#ec4899'
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const difficultyAnalysisChart = {
    labels: stats.difficultyDistribution.map(diff => diff.difficulty),
    datasets: [
      {
        data: stats.difficultyDistribution.map(diff => diff.total),
        backgroundColor: ['#059669', '#f59e0b', '#dc2626'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 3,
        hoverOffset: 15,
      },
    ],
  };

  const monthlyCreationChart = {
    labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    datasets: [
      {
        label: 'Yaratilgan testlar',
        data: [12, 19, 8, 15, 25, 18],
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
    ],
  };

  const performanceTrendChart = {
    labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: [74, 76, 72, 78, 75, 79],
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
    ],
  };

  const testPopularityChart = {
    labels: ['Matematika', 'Fizika', 'Kimyo', 'Biologiya', 'Tarix'],
    datasets: [
      {
        label: 'Urinishlar soni',
        data: [156, 142, 98, 87, 76],
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: '#f59e0b',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const teacherActivityChart = {
    labels: ['Faol', 'Nofaol'],
    datasets: [
      {
        data: [stats.activeTests, stats.inactiveTests],
        backgroundColor: ['#16a34a', '#dc2626'],
        borderColor: ['#ffffff', '#ffffff'],
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
    scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, beginAtZero: true } }
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

  // Animation delay helper
  const getAnimationDelay = (index) => {
    return index * 150; // 150ms delay between each chart
  };

  // Resizable Chart Component with entrance animations
  const ResizableChart = ({ chartKey, title, icon, children, width, index = 0 }) => {
    const chartWidth = chartWidths[chartKey] || width || 50;
    const isVisible = visibleCharts[chartKey];
    
    if (!isVisible) return null;
    
    return (
      <div 
        
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
      title: 'O\'qituvchi',
      key: 'teacher',
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ color: '#64748b' }} />
          <Text style={{ color: '#64748b', fontWeight: 600 }}>
            {record.teacherName}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Savollar',
      key: 'questions',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.totalQuestions}
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
            {record.timeLimit}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Urinishlar',
      key: 'attempts',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.attemptCount}
        </Text>
      ),
    },
    {
      title: 'O\'rtacha ball',
      key: 'average',
      render: (_, record) => (
        <div>
          <Progress
            percent={record.averageScore}
            size="small"
            strokeColor={getPerformanceColor(record.performance)}
            showInfo={false}
            style={{ marginBottom: '4px' }}
          />
          <Text style={{ color: '#64748b', fontWeight: 600 }}>
            {record.averageScore}%
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
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'default'} icon={record.isActive ? <CheckCircleOutlined /> : <StopOutlined />}>
          {record.isActive ? 'Faol' : 'Nofaol'}
        </Tag>
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => navigate(`/admin/test-details/${record.id}`)}
          style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
        >
          Batafsil
        </Button>
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
    <div  style={{ padding: '24px 0' }}>
      {/* Header */}
      <div  style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Testlar statistikasi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Barcha testlarning umumiy ko'rsatkichlari va faoliyati
        </Text>
      </div>

      {/* Statistics Cards with Entrance Animations */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <div  style={{ }}>
            <StatCard
              title="Jami testlar"
              value={stats.totalTests}
              icon={<BookOutlined />}
              color="#2563eb"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div  style={{ }}>
            <StatCard
              title="Faol testlar"
              value={stats.activeTests}
              icon={<PlayCircleOutlined />}
              color="#16a34a"
              trend={{ direction: 'up', value: '+5.2%' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div  style={{ }}>
            <StatCard
              title="Jami urinishlar"
              value={stats.totalAttempts}
              icon={<TrophyOutlined />}
              color="#7c3aed"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div  style={{ }}>
            <StatCard
              title="O'rtacha ball"
              value={stats.averageScore}
              suffix="%"
              icon={<RiseOutlined />}
              color="#f59e0b"
            />
          </div>
        </Col>
      </Row>

      <div  style={{ marginBottom: '16px' }}>
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
            <BarChartOutlined style={{ color: '#2563eb' }} />
            Statistik ma'lumotlar va tahlillar
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
                { key: 'subjectDistribution', label: 'Fanlar taqsimoti', icon: <BarChartOutlined style={{ color: '#2563eb' }} /> },
                { key: 'difficultyAnalysis', label: 'Qiyinchilik tahlili', icon: <PieChartOutlined style={{ color: '#f59e0b' }} /> },
                { key: 'monthlyCreation', label: 'Oylik yaratish', icon: <LineChartOutlined style={{ color: '#16a34a' }} /> },
                { key: 'performanceTrend', label: 'Natijalar trendi', icon: <LineChartOutlined style={{ color: '#059669' }} /> },
                { key: 'testPopularity', label: 'Test mashhurligi', icon: <BarChartOutlined style={{ color: '#dc2626' }} /> },
                { key: 'teacherActivity', label: 'O\'qituvchi faoliyati', icon: <PieChartOutlined style={{ color: '#8b5cf6' }} /> }
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
                      onChange={(checked) => toggleChart(chart.key)}
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
            chartKey="subjectDistribution"
            title="Fanlar bo'yicha taqsimot"
            icon={<BarChartOutlined style={{ color: '#2563eb' }} />}
            width={50}
            index={0}
          >
            <Bar data={subjectDistributionChart} options={barChartOptions} />
          </ResizableChart>

          <ResizableChart
            chartKey="difficultyAnalysis"
            title="Qiyinchilik tahlili"
            icon={<PieChartOutlined style={{ color: '#f59e0b' }} />}
            width={50}
            index={1}
          >
            <Pie data={difficultyAnalysisChart} options={pieChartOptions} />
          </ResizableChart>
        </Row>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="monthlyCreation"
            title="Oylik test yaratish"
            icon={<LineChartOutlined style={{ color: '#16a34a' }} />}
            width={50}
            index={2}
          >
            <Line data={monthlyCreationChart} options={chartOptions} />
          </ResizableChart>

          <ResizableChart
            chartKey="performanceTrend"
            title="Test natijalari trendi"
            icon={<LineChartOutlined style={{ color: '#059669' }} />}
            width={50}
            index={3}
          >
            <Line data={performanceTrendChart} options={chartOptions} />
          </ResizableChart>
        </Row>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="testPopularity"
            title="Test mashhurligi"
            icon={<BarChartOutlined style={{ color: '#dc2626' }} />}
            width={50}
            index={4}
          >
            <Bar data={testPopularityChart} options={barChartOptions} />
          </ResizableChart>

          <ResizableChart
            chartKey="teacherActivity"
            title="O'qituvchi faoliyati"
            icon={<PieChartOutlined style={{ color: '#8b5cf6' }} />}
            width={50}
            index={5}
          >
            <Pie data={teacherActivityChart} options={pieChartOptions} />
          </ResizableChart>
        </Row>
      </div>

      {/* Popular Tests and Subject Distribution */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Popular Tests */}
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
              <TrophyOutlined style={{ color: '#f59e0b' }} />
              Mashhur testlar
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {stats.popularTests.map((test, index) => (
                <div key={test.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <Space>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: index < 3 ? '#f59e0b' : '#e2e8f0',
                      color: index < 3 ? '#ffffff' : '#64748b',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <Text strong style={{ color: '#1e293b' }}>
                        {test.title}
                      </Text>
                      <br />
                      <Text style={{ color: '#64748b', fontSize: '12px' }}>
                        {test.subject} • {test.teacherName}
                      </Text>
                    </div>
                  </Space>
                  <Space direction="vertical" align="end">
                    <Text strong style={{ color: '#2563eb', fontSize: '16px' }}>
                      {test.attemptCount} urinish
                    </Text>
                    <Text style={{ color: '#059669', fontSize: '12px' }}>
                      {test.averageScore}% o'rtacha
                    </Text>
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Subject Distribution */}
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
              Fan bo'yicha taqsimot
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {stats.subjectDistribution.slice(0, 8).map((subject) => (
                <div key={subject.subject} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f1f5f9'
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
                    <Tag color="blue">{subject.active} faol</Tag>
                    <Text style={{ color: '#64748b', fontWeight: 600 }}>
                      {subject.totalAttempts} urinish
                    </Text>
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
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
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CalendarOutlined style={{ color: '#2563eb' }} />
          So'nggi faoliyat
        </Title>
        <Row gutter={[16, 16]}>
          {stats.recentActivity.map((activity, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <Text strong style={{ color: '#1e293b' }}>
                  {activity.testTitle}
                </Text>
                <br />
                <Text style={{ color: '#64748b', fontSize: '14px' }}>
                  {activity.action}
                </Text>
                <br />
                <Text style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {activity.teacher} • {activity.time}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Tests Table */}
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
          marginBottom: '24px'
        }}>
          Testlar ro'yxati
        </Title>
        <Table
          columns={columns}
          dataSource={stats.testStatistics}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami ${total} ta test`,
          }}
          locale={{
            emptyText: 'Testlar mavjud emas'
          }}
        />
      </Card>
    </div>
  );
};

export default TestsPage;