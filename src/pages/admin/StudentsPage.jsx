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
  Avatar,
  Tag,
  Space,
  Button,
  Tooltip,
  Switch,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  TrophyOutlined,
  BookOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
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

const StudentsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    bannedStudents: 0,
    averageScore: 0,
    totalTests: 0,
    topPerformers: [],
    studentStatistics: [],
    recentActivity: [],
    classDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart visibility states
  const [visibleCharts, setVisibleCharts] = useState({
    performanceDistribution: true,
    classAnalysis: true,
    monthlyGrowth: true,
    subjectPerformance: true,
    directionDistribution: true,
    activityTrend: true
  });
  
  // Chart width control states
  const [chartWidths, setChartWidths] = useState({
    performanceDistribution: 50,
    classAnalysis: 50,
    monthlyGrowth: 50,
    subjectPerformance: 100,
    directionDistribution: 50,
    activityTrend: 50
  });
  
  // Toggle functions for charts
  const toggleChart = (chartKey) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartKey]: !prev[chartKey]
    }));
  };

  // Fetch student statistics
  useEffect(() => {
    const fetchStudentStatistics = async () => {
      try {
        setLoading(true);
        
        const [usersData, attemptsData, testsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts(),
          apiService.getTests()
        ]);

        const users = usersData.results || usersData;
        const attempts = attemptsData.results || attemptsData;
        const tests = testsData.results || testsData;

        // Filter students
        const students = users.filter(user => user.role === 'student');
        const bannedStudents = students.filter(student => student.is_banned);
        const activeStudents = students.filter(student => !student.is_banned);

        // Calculate student performance
        const studentStatistics = students.map(student => {
          const studentAttempts = attempts.filter(attempt => attempt.student === student.id);
          const testCount = studentAttempts.length;
          const averageScore = testCount > 0 
            ? studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / testCount
            : 0;

          return {
            id: student.id,
            name: student.name || student.username,
            displayId: student.display_id || student.username,
            classGroup: student.class_group || 'Noma\'lum',
            direction: student.direction,
            testCount,
            averageScore: Math.round(averageScore),
            isBanned: student.is_banned,
            registrationDate: student.registration_date,
            lastActivity: testCount > 0 ? studentAttempts.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0].submitted_at : null,
            performance: averageScore >= 80 ? 'Yuqori' : averageScore >= 60 ? 'O\'rta' : 'Past'
          };
        });

        // Calculate overall statistics
        const totalTests = attempts.length;
        const averageScore = studentStatistics.length > 0 
          ? Math.round(studentStatistics.reduce((sum, student) => sum + student.averageScore, 0) / studentStatistics.length)
          : 0;

        // Get top performers (top 10)
        const topPerformers = studentStatistics
          .filter(student => !student.isBanned && student.testCount > 0)
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 10);

        // Class distribution
        const classGroups = {};
        students.forEach(student => {
          const classGroup = student.class_group || 'Noma\'lum';
          if (!classGroups[classGroup]) {
            classGroups[classGroup] = { total: 0, active: 0, banned: 0 };
          }
          classGroups[classGroup].total++;
          if (student.is_banned) {
            classGroups[classGroup].banned++;
          } else {
            classGroups[classGroup].active++;
          }
        });

        const classDistribution = Object.entries(classGroups).map(([classGroup, data]) => ({
          classGroup,
          ...data
        })).sort((a, b) => b.total - a.total);

        // Recent activity (simulated based on registration dates)
        const recentRegistrations = students
          .filter(student => student.registration_date)
          .sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date))
          .slice(0, 5)
          .map(student => ({
            studentName: student.name || student.username,
            classGroup: student.class_group || 'Noma\'lum',
            action: 'Ro\'yxatdan o\'tdi',
            time: new Date(student.registration_date).toLocaleDateString('uz-UZ'),
            type: 'registration'
          }));

        setStats({
          totalStudents: students.length,
          activeStudents: activeStudents.length,
          bannedStudents: bannedStudents.length,
          averageScore,
          totalTests,
          topPerformers,
          studentStatistics,
          recentActivity: recentRegistrations,
          classDistribution
        });

      } catch (error) {
        console.error('Error fetching student statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentStatistics();
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

  const getDirectionColor = (direction) => {
    return direction === 'natural' ? '#059669' : '#2563eb';
  };

  // Chart Data Configuration
  const performanceDistributionChart = {
    labels: ['Yuqori (80%+)', 'O\'rta (60-79%)', 'Past (<60%)'],
    datasets: [
      {
        data: [
          stats.studentStatistics.filter(s => s.averageScore >= 80).length,
          stats.studentStatistics.filter(s => s.averageScore >= 60 && s.averageScore < 80).length,
          stats.studentStatistics.filter(s => s.averageScore < 60).length
        ],
        backgroundColor: ['#16a34a', '#f59e0b', '#dc2626'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 3,
        hoverOffset: 15,
      },
    ],
  };

  const classAnalysisChart = {
    labels: stats.classDistribution.slice(0, 8).map(cls => cls.classGroup),
    datasets: [
      {
        label: 'O\'quvchilar soni',
        data: stats.classDistribution.slice(0, 8).map(cls => cls.total),
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

  const monthlyGrowthChart = {
    labels: ['Yan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Ro\'yxatdan o\'tgan o\'quvchilar',
        data: [45, 52, 38, 65, 42, 58],
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

  const subjectPerformanceChart = {
    labels: ['Matematika', 'Fizika', 'Kimyo', 'Biologiya', 'Tarix'],
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: [78, 72, 85, 69, 76],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.4)',
        borderWidth: 4,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 8,
      },
    ],
  };

  const directionDistributionChart = {
    labels: ['Tabiiy fanlar', 'Aniq fanlar'],
    datasets: [
      {
        data: [
          stats.studentStatistics.filter(s => s.direction === 'natural').length,
          stats.studentStatistics.filter(s => s.direction === 'exact').length
        ],
        backgroundColor: ['#059669', '#2563eb'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 3,
        hoverOffset: 15,
      },
    ],
  };

  const activityTrendChart = {
    labels: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'],
    datasets: [
      {
        label: 'Aktiv o\'quvchilar',
        data: [120, 135, 98, 142, 156, 89, 67],
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
    animation: { 
      duration: 2000, 
      easing: 'easeInOutQuart',
      animateRotate: true,
      animateScale: true,
    },
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
    animation: { 
      duration: 2000, 
      easing: 'easeInOutQuart',
      animateRotate: true,
      animateScale: true,
    },
  };

  // Animation delay helper
  const getAnimationDelay = (index) => {
    return index * 200; // 200ms delay between each chart
  };

  // Resizable Chart Component with entrance animations
  const ResizableChart = ({ chartKey, title, icon, children, width, index = 0 }) => {
    const chartWidth = chartWidths[chartKey] || width || 50;
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
      title: 'O\'quvchi',
      key: 'student',
      render: (_, record) => (
        <Space>
          <Avatar
            style={{
              backgroundColor: record.isBanned ? '#fca5a5' : '#f0f0f0',
              color: record.isBanned ? '#dc2626' : '#666',
              fontWeight: 600,
            }}
          >
            {record.name ? record.name.charAt(0) : 'S'}
          </Avatar>
          <div>
            <Text strong style={{ color: record.isBanned ? '#dc2626' : '#1e293b' }}>
              {record.name}
            </Text>
            <br />
            <Text style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
              {record.displayId}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Sinf',
      key: 'class',
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ color: '#64748b' }} />
          <Text strong style={{ color: '#1e293b' }}>
            {record.classGroup}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Yo\'nalish',
      key: 'direction',
      render: (_, record) => (
        <Tag
          style={{
            backgroundColor: `${getDirectionColor(record.direction)}20`,
            color: getDirectionColor(record.direction),
            fontWeight: 600
          }}
        >
          {record.direction === 'natural' ? 'Tabiiy fanlar' : 'Aniq fanlar'}
        </Tag>
      ),
    },
    {
      title: 'Testlar',
      key: 'tests',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.testCount}
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
      title: 'Ko\'rsatkich',
      key: 'performance',
      render: (_, record) => (
        <Tag
          color={getPerformanceColor(record.performance)}
          style={{
            backgroundColor: `${getPerformanceColor(record.performance)}20`,
            color: getPerformanceColor(record.performance),
            fontWeight: 600
          }}
        >
          {record.performance}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isBanned ? 'red' : 'green'}>
          {record.isBanned ? 'Bloklangan' : 'Faol'}
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
          onClick={() => navigate(`/admin/student-details/${record.id}`)}
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
    <div className="animate__animated animate__fadeIn" style={{ padding: '24px 0' }}>
      {/* Header */}
      <div className='animate__animated animate__slideInDown' style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          O'quvchilar statistikasi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Barcha o'quvchilarning umumiy ko'rsatkichlari va faoliyati
        </Text>
      </div>

      {/* Statistics Cards with Entrance Animations */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '100ms' }}>
            <StatCard
              title="Jami o'quvchilar"
              value={stats.totalStudents}
              icon={<UserOutlined />}
              color="#2563eb"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '200ms' }}>
            <StatCard
              title="Faol o'quvchilar"
              value={stats.activeStudents}
              icon={<SafetyCertificateOutlined />}
              color="#16a34a"
              trend={{ direction: 'up', value: '+8.3%' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '300ms' }}>
            <StatCard
              title="Bloklangan"
              value={stats.bannedStudents}
              icon={<UserOutlined />}
              color="#dc2626"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '400ms' }}>
            <StatCard
              title="O'rtacha ball"
              value={stats.averageScore}
              suffix="%"
              icon={<TrophyOutlined />}
              color="#f59e0b"
            />
          </div>
        </Col>
      </Row>

      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '500ms', marginBottom: '16px' }}>
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
                { key: 'performanceDistribution', label: 'Natijalar taqsimoti', icon: <PieChartOutlined style={{ color: '#8b5cf6' }} /> },
                { key: 'classAnalysis', label: 'Sinf tahlili', icon: <BarChartOutlined style={{ color: '#2563eb' }} /> },
                { key: 'monthlyGrowth', label: 'Oylik o\'sish', icon: <LineChartOutlined style={{ color: '#16a34a' }} /> },
                { key: 'subjectPerformance', label: 'Fanlar natijasi', icon: <BarChartOutlined style={{ color: '#f59e0b' }} /> },
                { key: 'directionDistribution', label: 'Yo\'nalish taqsimoti', icon: <PieChartOutlined style={{ color: '#059669' }} /> },
                { key: 'activityTrend', label: 'Faoliyat trendi', icon: <LineChartOutlined style={{ color: '#dc2626' }} /> }
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
            chartKey="performanceDistribution"
            title="Natijalar taqsimoti"
            icon={<PieChartOutlined style={{ color: '#8b5cf6' }} />}
            width={50}
            index={0}
          >
            <Pie data={performanceDistributionChart} options={pieChartOptions} />
          </ResizableChart>

          <ResizableChart
            chartKey="classAnalysis"
            title="Sinf tahlili"
            icon={<BarChartOutlined style={{ color: '#2563eb' }} />}
            width={50}
            index={1}
          >
            <Bar data={classAnalysisChart} options={barChartOptions} />
          </ResizableChart>
        </Row>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="monthlyGrowth"
            title="Oylik o'sish"
            icon={<LineChartOutlined style={{ color: '#16a34a' }} />}
            width={50}
            index={2}
          >
            <Line data={monthlyGrowthChart} options={chartOptions} />
          </ResizableChart>

          <ResizableChart
            chartKey="subjectPerformance"
            title="Fanlar bo'yicha natijalar"
            icon={<BarChartOutlined style={{ color: '#f59e0b' }} />}
            width={50}
            index={3}
          >
            <Line data={subjectPerformanceChart} options={chartOptions} />
          </ResizableChart>
        </Row>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="directionDistribution"
            title="Yo'nalish taqsimoti"
            icon={<PieChartOutlined style={{ color: '#059669' }} />}
            width={50}
            index={4}
          >
            <Pie data={directionDistributionChart} options={pieChartOptions} />
          </ResizableChart>

          <ResizableChart
            chartKey="activityTrend"
            title="Faoliyat trendi"
            icon={<LineChartOutlined style={{ color: '#dc2626' }} />}
            width={50}
            index={5}
          >
            <Line data={activityTrendChart} options={chartOptions} />
          </ResizableChart>
        </Row>
      </div>

      {/* Top Performers and Class Distribution */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Top Performers */}
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
              Eng yaxshi o'quvchilar
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {stats.topPerformers.map((student, index) => (
                <div key={student.id} style={{
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
                        {student.name}
                      </Text>
                      <br />
                      <Text style={{ color: '#64748b', fontSize: '12px' }}>
                        {student.classGroup}
                      </Text>
                    </div>
                  </Space>
                  <Text strong style={{ color: '#059669', fontSize: '16px' }}>
                    {student.averageScore}%
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Class Distribution */}
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
              <TeamOutlined style={{ color: '#2563eb' }} />
              Sinf bo'yicha taqsimot
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {stats.classDistribution.slice(0, 8).map((cls) => (
                <div key={cls.classGroup} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <Text strong style={{ color: '#1e293b' }}>
                    {cls.classGroup}
                  </Text>
                  <Space>
                    <Tag color="blue">{cls.active} faol</Tag>
                    {cls.banned > 0 && <Tag color="red">{cls.banned} bloklangan</Tag>}
                    <Text style={{ color: '#64748b', fontWeight: 600 }}>
                      Jami: {cls.total}
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
                  {activity.studentName}
                </Text>
                <br />
                <Text style={{ color: '#64748b', fontSize: '14px' }}>
                  {activity.action}
                </Text>
                <br />
                <Text style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {activity.time}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Students Table */}
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
          O'quvchilar ro'yxati
        </Title>
        <Table
          columns={columns}
          dataSource={stats.studentStatistics}
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
      </Card>
    </div>
  );
};

export default StudentsPage;