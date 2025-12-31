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
  Avatar,
  Tag,
  Space,
  Button,
  Tooltip,
  Switch,
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  RiseOutlined,
  TrophyOutlined,
  BookOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
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

const ClassesPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    averageStudentsPerClass: 0,
    topPerformingClass: null,
    classStatistics: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart visibility states
  const [visibleCharts, setVisibleCharts] = useState({
    classSizeDistribution: true,
    performanceComparison: true,
    monthlyActivity: true,
    averageScoreTrend: true,
    studentEngagement: true,
    classRankings: true
  });
  
  // Chart width control states
  const [chartWidths, setChartWidths] = useState({
    classSizeDistribution: 50,
    performanceComparison: 50,
    monthlyActivity: 50,
    averageScoreTrend: 100,
    studentEngagement: 50,
    classRankings: 50
  });
  
  // Toggle functions for charts
  const toggleChart = (chartKey) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartKey]: !prev[chartKey]
    }));
  };

  // Fetch class statistics
  useEffect(() => {
    const fetchClassStatistics = async () => {
      try {
        setLoading(true);
        
        const [usersData, attemptsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts()
        ]);

        const users = usersData.results || usersData;
        const attempts = attemptsData.results || attemptsData;

        // Filter students and group by class
        const students = users.filter(user => user.role === 'student');
        const classGroups = {};

        students.forEach(student => {
          const classGroup = student.class_group || 'Noma\'lum';
          if (!classGroups[classGroup]) {
            classGroups[classGroup] = [];
          }
          classGroups[classGroup].push(student);
        });

        // Calculate class statistics
        const classStatistics = Object.entries(classGroups).map(([classGroup, classStudents]) => {
          let totalScore = 0;
          let studentsWithAttempts = 0;
          let totalAttempts = 0;

          classStudents.forEach(student => {
            const studentAttempts = attempts.filter(attempt => attempt.student === student.id);
            totalAttempts += studentAttempts.length;

            if (studentAttempts.length > 0) {
              const studentAverage = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
              totalScore += studentAverage;
              studentsWithAttempts++;
            }
          });

          const averageScore = studentsWithAttempts > 0 ? Math.round(totalScore / studentsWithAttempts) : 0;

          return {
            classGroup,
            totalStudents: classStudents.length,
            averageScore,
            totalAttempts,
            students: classStudents,
            performance: averageScore >= 80 ? 'Yuqori' : averageScore >= 60 ? 'O\'rta' : 'Past'
          };
        });

        // Sort by total students
        classStatistics.sort((a, b) => b.totalStudents - a.totalStudents);

        // Find top performing class
        const topPerformingClass = classStatistics.reduce((top, current) => 
          current.averageScore > top.averageScore ? current : top, 
          { averageScore: 0 }
        );

        // Get recent class activity (simulated)
        const recentActivity = classStatistics.slice(0, 5).map(cls => ({
          classGroup: cls.classGroup,
          action: `${cls.totalStudents} ta o'quvchi qo'shildi`,
          time: 'Oxirgi 24 soatda',
          type: 'student_addition'
        }));

        setStats({
          totalClasses: Object.keys(classGroups).length,
          totalStudents: students.length,
          averageStudentsPerClass: Math.round(students.length / Object.keys(classGroups).length),
          topPerformingClass,
          classStatistics,
          recentActivity
        });

      } catch (error) {
        console.error('Error fetching class statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchClassStatistics();
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

  // Chart Data Configuration
  const classSizeDistributionChart = {
    labels: stats.classStatistics.slice(0, 8).map(cls => cls.classGroup),
    datasets: [
      {
        label: 'O\'quvchilar soni',
        data: stats.classStatistics.slice(0, 8).map(cls => cls.totalStudents),
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

  const performanceComparisonChart = {
    labels: stats.classStatistics.slice(0, 8).map(cls => cls.classGroup),
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: stats.classStatistics.slice(0, 8).map(cls => cls.averageScore),
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

  const monthlyActivityChart = {
    labels: ['Yan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Yangi sinflar',
        data: [3, 2, 4, 1, 3, 2],
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

  const averageScoreTrendChart = {
    labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    datasets: [
      {
        label: 'Barcha sinflar o\'rtacha',
        data: [72, 75, 78, 74, 76, 79],
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

  const studentEngagementChart = {
    labels: ['Yuqori', 'O\'rta', 'Past'],
    datasets: [
      {
        data: [
          stats.classStatistics.filter(c => c.performance === 'Yuqori').length,
          stats.classStatistics.filter(c => c.performance === 'O\'rta').length,
          stats.classStatistics.filter(c => c.performance === 'Past').length
        ],
        backgroundColor: ['#16a34a', '#f59e0b', '#dc2626'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 3,
        hoverOffset: 15,
      },
    ],
  };

  const classRankingsChart = {
    labels: stats.classStatistics.slice(0, 6).map(cls => cls.classGroup),
    datasets: [
      {
        label: 'Reyting balli',
        data: stats.classStatistics.slice(0, 6).map(cls => cls.averageScore),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: '#f59e0b',
        borderWidth: 2,
        borderRadius: 8,
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

  // Resizable Chart Component
  const ResizableChart = ({ chartKey, title, icon, children, width }) => {
    const chartWidth = chartWidths[chartKey] || width || 50;
    const isVisible = visibleCharts[chartKey];
    
    if (!isVisible) return null;
    
    return (
      <div style={{ width: `${chartWidth}%`, padding: '0 8px' }}>
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
      title: 'O\'quvchilar',
      key: 'students',
      render: (_, record) => (
        <Space>
          <Avatar.Group maxCount={3} size="small">
            {record.students.slice(0, 3).map((student, index) => (
              <Avatar
                key={student.id}
                style={{
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  fontWeight: 600,
                }}
              >
                {student.name ? student.name.charAt(0) : 'S'}
              </Avatar>
            ))}
          </Avatar.Group>
          <Text style={{ color: '#64748b', fontWeight: 600 }}>
            {record.totalStudents} ta
          </Text>
        </Space>
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
      title: 'Jami testlar',
      key: 'attempts',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.totalAttempts}
        </Text>
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
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => navigate(`/admin/class-details/${record.classGroup}`)}
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
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Sinflar statistikasi
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Barcha sinflarning umumiy ko'rsatkichlari va faoliyati
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Jami sinflar"
            value={stats.totalClasses}
            icon={<TeamOutlined />}
            color="#2563eb"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Jami o'quvchilar"
            value={stats.totalStudents}
            icon={<UserOutlined />}
            color="#16a34a"
            trend={{ direction: 'up', value: '+12.5%' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="O'rtacha o'quvchi/sinf"
            value={stats.averageStudentsPerClass}
            icon={<BookOutlined />}
            color="#7c3aed"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Eng yaxshi sinf"
            value={stats.topPerformingClass?.classGroup || 'N/A'}
            icon={<TrophyOutlined />}
            color="#f59e0b"
            suffix={`${stats.topPerformingClass?.averageScore || 0}%`}
          />
        </Col>
      </Row>

      {/* Charts Control Header */}
      <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px'
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <Title level={3} style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#1e293b',
                margin: 0
              }}>
                Diagrammalar boshqaruvi
              </Title>
              <Text style={{
                fontSize: '14px',
                color: '#64748b'
              }}>
                Har bir diagrammni alohida boshqarish
              </Text>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {[
                { key: 'classSizeDistribution', label: 'Sinf hajmi taqsimoti', icon: <BarChartOutlined style={{ color: '#2563eb' }} /> },
                { key: 'performanceComparison', label: 'Natijalar solishtiruvi', icon: <LineChartOutlined style={{ color: '#8b5cf6' }} /> },
                { key: 'monthlyActivity', label: 'Oylik faoliyat', icon: <LineChartOutlined style={{ color: '#16a34a' }} /> },
                { key: 'averageScoreTrend', label: 'O\'rtacha ball trendi', icon: <LineChartOutlined style={{ color: '#f59e0b' }} /> },
                { key: 'studentEngagement', label: 'O\'quvchi ishtiroki', icon: <PieChartOutlined style={{ color: '#dc2626' }} /> },
                { key: 'classRankings', label: 'Sinf reytinglari', icon: <BarChartOutlined style={{ color: '#059669' }} /> }
              ].map(chart => (
                <div
                  key={chart.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: 1
                  }}>
                    {chart.icon}
                    <Text style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1e293b'
                    }}>
                      {chart.label}
                    </Text>
                  </div>
                  <Switch
                    checked={visibleCharts[chart.key]}
                    onChange={(checked) => toggleChart(chart.key)}
                    size="small"
                    style={{
                      backgroundColor: visibleCharts[chart.key] ? '#2563eb' : '#d1d5db'
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="classSizeDistribution"
            title="Sinf hajmi taqsimoti"
            icon={<BarChartOutlined style={{ color: '#2563eb' }} />}
            width={50}
          >
            <Bar data={classSizeDistributionChart} options={barChartOptions} />
          </ResizableChart>

          <ResizableChart
            chartKey="performanceComparison"
            title="Natijalar solishtiruvi"
            icon={<LineChartOutlined style={{ color: '#8b5cf6' }} />}
            width={50}
          >
            <Line data={performanceComparisonChart} options={chartOptions} />
          </ResizableChart>
        </Row>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="monthlyActivity"
            title="Oylik faoliyat"
            icon={<LineChartOutlined style={{ color: '#16a34a' }} />}
            width={50}
          >
            <Line data={monthlyActivityChart} options={chartOptions} />
          </ResizableChart>

          <ResizableChart
            chartKey="averageScoreTrend"
            title="O'rtacha ball trendi"
            icon={<LineChartOutlined style={{ color: '#f59e0b' }} />}
            width={50}
          >
            <Line data={averageScoreTrendChart} options={chartOptions} />
          </ResizableChart>
        </Row>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="studentEngagement"
            title="O'quvchi ishtiroki"
            icon={<PieChartOutlined style={{ color: '#dc2626' }} />}
            width={50}
          >
            <Pie data={studentEngagementChart} options={pieChartOptions} />
          </ResizableChart>

          <ResizableChart
            chartKey="classRankings"
            title="Sinf reytinglari"
            icon={<BarChartOutlined style={{ color: '#059669' }} />}
            width={50}
          >
            <Bar data={classRankingsChart} options={barChartOptions} />
          </ResizableChart>
        </Row>
      </div>

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
                  {activity.classGroup}
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

      {/* Classes Table */}
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
          Sinf ko'rsatkichlari
        </Title>
        <Table
          columns={columns}
          dataSource={stats.classStatistics}
          rowKey="classGroup"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami ${total} ta sinf`,
          }}
          locale={{
            emptyText: 'Sinflar mavjud emas'
          }}
        />
      </Card>
    </div>
  );
};

export default ClassesPage;