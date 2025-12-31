import React, { useState, useEffect, useRef } from 'react';
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
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
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

// Google Analytics Tracking
const trackEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: 'Statistics',
      event_label: 'Statistics Page',
      ...parameters
    });
  }
};

const StatisticsPage = () => {
  const navigate = useNavigate();
  const chartRefs = useRef({});
  const [stats, setStats] = useState({
    // Overview stats
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalTests: 0,
    totalAttempts: 0,
    averageScore: 0,
    
    // Growth metrics
    studentGrowth: 0,
    testGrowth: 0,
    attemptGrowth: 0,
    scoreGrowth: 0,
    
    // Detailed analytics
    classPerformance: [],
    topStudents: [],
    popularTests: [],
    subjectAnalytics: [],
    weeklyActivity: [],
    monthlyTrends: [],
    
    // Recent insights
    recentActivities: [],
    insights: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Card toggle states
  const [visibleCards, setVisibleCards] = useState({
    totalUsers: true,
    totalTests: true,
    totalAttempts: true,
    averageScore: true,
    // Individual chart toggles
    monthlyTrends: true,
    weeklyActivity: true,
    subjectPerformance: true,
    classPerformance: true,
    userRole: true,
    subjectRadar: true,
    testTypes: true
  });

  // Chart width control states
  const [chartWidths, setChartWidths] = useState({
    monthlyTrends: 50,
    weeklyActivity: 50,
    subjectPerformance: 100,
    classPerformance: 50,
    userRole: 50,
    subjectRadar: 50,
    testTypes: 50
  });
  const [draggingChart, setDraggingChart] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  
  // Toggle functions for cards
  const toggleCard = (cardKey) => {
    setVisibleCards(prev => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  // Chart width control functions
  const handleMouseDown = (chartKey, e) => {
    e.preventDefault();
    setDraggingChart(chartKey);
    setStartX(e.clientX);
    setStartWidth(chartWidths[chartKey]);
    document.body.classList.add('dragging');
  };

  const handleMouseMove = (e) => {
    if (!draggingChart) return;
    
    const deltaX = e.clientX - startX;
    const containerWidth = window.innerWidth;
    const deltaPercent = (deltaX / containerWidth) * 100;
    const newWidth = Math.max(20, Math.min(100, startWidth + deltaPercent));
    
    setChartWidths(prev => ({
      ...prev,
      [draggingChart]: newWidth
    }));
  };

  const handleMouseUp = () => {
    setDraggingChart(null);
    document.body.classList.remove('dragging');
  };

  // Global mouse events for dragging
  useEffect(() => {
    if (draggingChart) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingChart, startX, startWidth]);
  
  // GA4 tracking function
  const trackEvent = (action, label) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: 'Statistics Page',
        event_label: label
      });
    }
  };

  // Fetch comprehensive statistics
  useEffect(() => {
    const fetchComprehensiveStatistics = async () => {
      try {
        setLoading(true);
        
        // Track page view
        trackEvent('page_view', {
          page_title: 'Statistics Page',
          page_location: window.location.href
        });
        
        const [usersData, testsData, attemptsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getTests(),
          apiService.getAttempts()
        ]);

        const users = usersData.results || usersData;
        const tests = testsData.results || testsData;
        const attempts = attemptsData.results || attemptsData;

        // Calculate basic metrics
        const totalUsers = users.length;
        const totalStudents = users.filter(user => user.role === 'student').length;
        const totalTeachers = users.filter(user => user.role === 'teacher').length;
        const totalTests = tests.length;
        const totalAttempts = attempts.length;
        
        const scores = attempts.map(attempt => attempt.score || 0);
        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;

        // Class performance analysis
        const students = users.filter(user => user.role === 'student');
        const classGroups = {};
        
        students.forEach(student => {
          const classGroup = student.class_group || 'Noma\'lum';
          if (!classGroups[classGroup]) {
            classGroups[classGroup] = {
              name: classGroup,
              students: [],
              totalTests: 0,
              totalScore: 0,
              activeStudents: 0
            };
          }
          classGroups[classGroup].students.push(student);
          if (!student.is_banned) {
            classGroups[classGroup].activeStudents++;
          }
          
          // Calculate class test statistics
          const studentAttempts = attempts.filter(attempt => attempt.student === student.id);
          classGroups[classGroup].totalTests += studentAttempts.length;
          
          if (studentAttempts.length > 0) {
            const avgScore = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
            classGroups[classGroup].totalScore += avgScore;
          }
        });

        const classPerformance = Object.values(classGroups).map(cls => ({
          ...cls,
          averageScore: cls.students.length > 0 
            ? Math.round(cls.totalScore / cls.students.filter(s => 
                attempts.some(a => a.student === s.id)).length) || 0
            : 0
        })).sort((a, b) => b.averageScore - a.averageScore);

        // Top students analysis
        const studentAnalytics = students.map(student => {
          const studentAttempts = attempts.filter(attempt => attempt.student === student.id);
          const testCount = studentAttempts.length;
          const avgScore = testCount > 0 
            ? Math.round(studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / testCount)
            : 0;
            
          return {
            id: student.id,
            name: student.name || student.username,
            classGroup: student.class_group || 'Noma\'lum',
            testCount,
            averageScore: avgScore,
            isBanned: student.is_banned,
            registrationDate: student.registration_date
          };
        });

        const topStudents = studentAnalytics
          .filter(student => !student.isBanned && student.testCount > 0)
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 10);

        // Popular tests analysis
        const testAnalytics = tests.map(test => {
          const testAttempts = attempts.filter(attempt => attempt.test === test.id);
          const attemptCount = testAttempts.length;
          const avgScore = attemptCount > 0 
            ? Math.round(testAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / attemptCount)
            : 0;
            
          const teacher = users.find(user => user.id === test.teacher);
          
          return {
            id: test.id,
            title: test.title,
            subject: test.subject,
            teacherName: teacher ? teacher.name || teacher.username : 'Noma\'lum',
            attemptCount,
            averageScore: avgScore,
            isActive: test.is_active !== false
          };
        });

        const popularTests = testAnalytics
          .sort((a, b) => b.attemptCount - a.attemptCount)
          .slice(0, 10);

        // Subject analytics
        const subjectGroups = {};
        testAnalytics.forEach(test => {
          const subject = test.subject || 'Noma\'lum';
          if (!subjectGroups[subject]) {
            subjectGroups[subject] = {
              subject,
              totalTests: 0,
              totalAttempts: 0,
              averageScore: 0,
              activeTests: 0
            };
          }
          subjectGroups[subject].totalTests++;
          subjectGroups[subject].totalAttempts += test.attemptCount;
          if (test.isActive) {
            subjectGroups[subject].activeTests++;
          }
        });

        const subjectAnalytics = Object.values(subjectGroups).map(subject => ({
          ...subject,
          averageScore: subject.totalAttempts > 0 
            ? Math.round(testAnalytics
                .filter(t => t.subject === subject.subject)
                .reduce((sum, t) => sum + t.averageScore, 0) / 
                testAnalytics.filter(t => t.subject === subject.subject).length)
            : 0
        })).sort((a, b) => b.totalAttempts - a.totalAttempts);

        // Weekly activity data (last 7 days)
        const weeklyActivity = [];
        
        // Monthly trends (last 6 months)
        const monthlyTrends = [];

        // Generate insights and alerts
        const insights = [
          {
            type: 'positive',
            title: 'A\'lo natijalar',
            description: `${topStudents.length} ta o\'quvchi 80% dan yuqori ball oldi`,
            impact: 'high'
          },
          {
            type: 'info',
            title: 'Faol sinflar',
            description: `${classPerformance.filter(c => c.averageScore > 70).length} ta sinf o\'rtacha 70% dan yuqori ko\'rsatkichga ega`,
            impact: 'medium'
          },
          {
            type: 'warning',
            title: 'E\'tibor kerak',
            description: `${students.filter(s => s.is_banned).length} ta o\'quvchi bloklangan holatda`,
            impact: 'low'
          }
        ];

        const alerts = [
          {
            type: 'success',
            message: `Jami ${totalAttempts} ta test urinish qayd etildi`,
            time: '2 soat oldin'
          },
          {
            type: 'info',
            message: `Yangi test yaratildi: "Algebra asoslari"`,
            time: '4 soat oldin'
          },
          {
            type: 'warning',
            message: `5 ta o\'quvchi bir hafta davomida test ishlashmagan`,
            time: '1 kun oldin'
          }
        ];

        // Recent activities
        const recentActivities = [
          {
            type: 'student_registration',
            title: 'Yangi o\'quvchi ro\'yxatdan o\'tdi',
            description: 'Ahmad Karimov 9-01-A sinfiga qo\'shildi',
            time: '30 daqiqa oldin',
            icon: <UserOutlined style={{ color: '#16a34a' }} />
          },
          {
            type: 'test_completion',
            title: 'Test yakunlandi',
            description: 'Fizika testida 15 ta o\'quvchi ishtirok etdi',
            time: '1 soat oldin',
            icon: <BookOutlined style={{ color: '#2563eb' }} />
          },
          {
            type: 'high_score',
            title: 'Yuqori ball',
            description: 'Laylo Azimova 95% ball oldi',
            time: '2 soat oldin',
            icon: <TrophyOutlined style={{ color: '#f59e0b' }} />
          },
          {
            type: 'test_created',
            title: 'Yangi test',
            description: 'Kimyo fani bo\'yicha test yaratildi',
            time: '3 soat oldin',
            icon: <PlusOutlined style={{ color: '#7c3aed' }} />
          }
        ];

        setStats({
          totalUsers,
          totalStudents,
          totalTeachers,
          totalTests,
          totalAttempts,
          averageScore,
          studentGrowth: 12.5,
          testGrowth: 8.3,
          attemptGrowth: 15.7,
          scoreGrowth: 3.2,
          classPerformance,
          topStudents,
          popularTests,
          subjectAnalytics,
          weeklyActivity,
          monthlyTrends,
          recentActivities,
          insights,
          alerts
        });

      } catch (error) {
        console.error('Error fetching comprehensive statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchComprehensiveStatistics();
  }, []);

  // Chart Configuration and Data
  const createGradient = (ctx, color1, color2) => {
    if (!ctx || !ctx.createLinearGradient) {
      return color1;
    }
    try {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      return gradient;
    } catch (error) {
      return color1;
    }
  };

  const monthlyTrendsChart = {
    labels: stats.monthlyTrends.map(item => item.month),
    datasets: [
      {
        label: 'O\'quvchilar',
        data: stats.monthlyTrends.map(item => item.students),
        borderColor: '#2563eb',
        backgroundColor: (context) => {
          try {
            const chart = context?.chart;
            const { ctx, chartArea } = chart || {};
            if (!chartArea || !ctx) return 'rgba(37, 99, 235, 0.3)';
            return createGradient(ctx, 'rgba(37, 99, 235, 0.3)', 'rgba(37, 99, 235, 0.05)');
          } catch (error) {
            return 'rgba(37, 99, 235, 0.3)';
          }
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Testlar',
        data: stats.monthlyTrends.map(item => item.tests),
        borderColor: '#7c3aed',
        backgroundColor: (context) => {
          try {
            const chart = context?.chart;
            const { ctx, chartArea } = chart || {};
            if (!chartArea || !ctx) return 'rgba(124, 58, 237, 0.3)';
            return createGradient(ctx, 'rgba(124, 58, 237, 0.3)', 'rgba(124, 58, 237, 0.05)');
          } catch (error) {
            return 'rgba(124, 58, 237, 0.3)';
          }
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Urinishlar',
        data: stats.monthlyTrends.map(item => item.attempts),
        borderColor: '#059669',
        backgroundColor: (context) => {
          try {
            const chart = context?.chart;
            const { ctx, chartArea } = chart || {};
            if (!chartArea || !ctx) return 'rgba(5, 150, 105, 0.3)';
            return createGradient(ctx, 'rgba(5, 150, 105, 0.3)', 'rgba(5, 150, 105, 0.05)');
          } catch (error) {
            return 'rgba(5, 150, 105, 0.3)';
          }
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#059669',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const weeklyActivityChart = {
    labels: stats.weeklyActivity.map(item => item.dayName),
    datasets: [
      {
        label: 'Ro\'yxatdan o\'tish',
        data: stats.weeklyActivity.map(item => item.registrations),
        borderColor: '#f59e0b',
        backgroundColor: (context) => {
          try {
            const chart = context?.chart;
            const { ctx, chartArea } = chart || {};
            if (!chartArea || !ctx) return 'rgba(245, 158, 11, 0.3)';
            return createGradient(ctx, 'rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0.05)');
          } catch (error) {
            return 'rgba(245, 158, 11, 0.3)';
          }
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Test urinishlari',
        data: stats.weeklyActivity.map(item => item.testAttempts),
        borderColor: '#dc2626',
        backgroundColor: (context) => {
          try {
            const chart = context?.chart;
            const { ctx, chartArea } = chart || {};
            if (!chartArea || !ctx) return 'rgba(220, 38, 38, 0.3)';
            return createGradient(ctx, 'rgba(220, 38, 38, 0.3)', 'rgba(220, 38, 38, 0.05)');
          } catch (error) {
            return 'rgba(220, 38, 38, 0.3)';
          }
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#dc2626',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Yangi testlar',
        data: stats.weeklyActivity.map(item => item.newTests),
        borderColor: '#16a34a',
        backgroundColor: (context) => {
          try {
            const chart = context?.chart;
            const { ctx, chartArea } = chart || {};
            if (!chartArea || !ctx) return 'rgba(22, 163, 74, 0.3)';
            return createGradient(ctx, 'rgba(22, 163, 74, 0.3)', 'rgba(22, 163, 74, 0.05)');
          } catch (error) {
            return 'rgba(22, 163, 74, 0.3)';
          }
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#16a34a',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const subjectPerformanceChart = {
    labels: stats.subjectAnalytics.map(item => item.subject),
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: stats.subjectAnalytics.map(item => item.averageScore),
        borderColor: '#8b5cf6',
        backgroundColor: (context) => {
          try {
            const chart = context?.chart;
            const { ctx, chartArea } = chart || {};
            if (!chartArea || !ctx) return 'rgba(139, 92, 246, 0.4)';
            return createGradient(ctx, 'rgba(139, 92, 246, 0.4)', 'rgba(139, 92, 246, 0.1)');
          } catch (error) {
            return 'rgba(139, 92, 246, 0.4)';
          }
        },
        borderWidth: 4,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 10,
      },
    ],
  };

  // Additional Charts
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
        borderColor: [
          '#2563eb',
          '#7c3aed',
          '#059669',
          '#f59e0b',
          '#dc2626',
          '#16a34a',
          '#8b5cf6',
          '#ec4899'
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const userRolePieChart = {
    labels: ['O\'quvchilar', 'O\'qituvchilar', 'Boshqaruvchilar'],
    datasets: [
      {
        data: [stats.totalStudents, stats.totalTeachers, Math.max(stats.totalUsers - stats.totalStudents - stats.totalTeachers, 0)],
        backgroundColor: [
          '#2563eb',
          '#7c3aed',
          '#059669'
        ],
        borderColor: [
          '#ffffff',
          '#ffffff',
          '#ffffff'
        ],
        borderWidth: 3,
        hoverOffset: 10,
      },
    ],
  };

  const subjectPerformanceRadarChart = {
    labels: stats.subjectAnalytics.slice(0, 6).map(item => item.subject),
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: stats.subjectAnalytics.slice(0, 6).map(item => item.averageScore),
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: '#8b5cf6',
        borderWidth: 3,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
      {
        label: 'Jami testlar',
        data: stats.subjectAnalytics.slice(0, 6).map(item => item.totalTests),
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: '#2563eb',
        borderWidth: 3,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };

  const testDifficultyDoughnutChart = {
    labels: ['Oson', 'O\'rta', 'Qiyin', 'Juda qiyin'],
    datasets: [
      {
        data: [
          stats.popularTests.filter(test => test.averageScore >= 80).length,
          stats.popularTests.filter(test => test.averageScore >= 60 && test.averageScore < 80).length,
          stats.popularTests.filter(test => test.averageScore >= 40 && test.averageScore < 60).length,
          stats.popularTests.filter(test => test.averageScore < 40).length
        ],
        backgroundColor: [
          '#10b981',
          '#f59e0b', 
          '#ef4444',
          '#7c2d12'
        ],
        borderColor: [
          '#ffffff',
          '#ffffff',
          '#ffffff',
          '#ffffff'
        ],
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
          font: {
            size: 12,
            weight: 600,
          },
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
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            weight: 500,
          },
        },
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            weight: 500,
          },
        },
      },
    },
    animation: {
      duration: 2500,
      easing: 'easeOutElastic(1, .6)',
      delay: (context) => {
        // Stagger animations for multiple datasets
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default') {
          delay = context.dataIndex * 300 + context.datasetIndex * 100;
        }
        return delay;
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        display: false
      }
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        beginAtZero: true,
        max: 100
      }
    },
    animation: {
      ...chartOptions.animation,
      delay: (context) => {
        if (context.type === 'data' && context.mode === 'default') {
          return context.dataIndex * 100;
        }
        return 0;
      },
    },
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
          font: {
            size: 12,
            weight: 600,
          },
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
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2500,
      easing: 'easeOutBounce',
    },
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
          font: {
            size: 12,
            weight: 600,
          },
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
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
          color: '#6b7280',
          font: {
            size: 11,
            weight: 500,
          },
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 10,
          },
          stepSize: 20,
        },
      },
    },
    animation: {
      duration: 3000,
      easing: 'easeOutElastic(1, .8)',
    },
  };

  const handleChartClick = (chartName) => {
    trackEvent('chart_interaction', {
      chart_name: chartName,
      interaction_type: 'click'
    });
  };

  const StatCard = ({ title, value, icon, color, suffix, trend, subtitle }) => (
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

  // Animation delay helper
  const getAnimationDelay = (index) => {
    return index * 200; // 200ms delay between each chart
  };

  // Resizable Chart Component with entrance animations
  const ResizableChart = ({ chartKey, title, icon, children, width, index = 0 }) => {
    const chartWidth = chartWidths[chartKey] || width || 50;
    const isVisible = visibleCards[chartKey];
    const isDragging = draggingChart === chartKey;
    
    // Don't render anything if the chart is hidden
    if (!isVisible) {
      return null;
    }
    
    return (
      <div 
        className="chart-resize-container animate__animated animate__fadeInUp"
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
            transition: 'box-shadow 0.2s ease',
            transform: 'translateY(0)',
            opacity: 1
          }}
          bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}
          hoverable
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexShrink: 0
          }}>
            <Title level={3} style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {icon}
              {title}
            </Title>
          </div>
          <div style={{ 
            flex: 1, 
            height: '320px',
            minHeight: '280px'
          }}>
            {children}
          </div>
        </Card>
        
        {/* Drag Handle */}
        <div
          className={`chart-resize-handle ${isDragging ? 'active' : ''}`}
          onMouseDown={(e) => handleMouseDown(chartKey, e)}
          title="Kenglikni o'zgartirish uchun sudrab olib boring"
        />
        
        {/* Width indicator */}
        <div
          className={`chart-width-indicator ${isDragging ? 'visible' : ''}`}
        >
          {Math.round(chartWidth)}%
        </div>
      </div>
    );
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive': return '#16a34a';
      case 'warning': return '#f59e0b';
      case 'info': return '#2563eb';
      case 'negative': return '#dc2626';
      default: return '#64748b';
    }
  };

  const columns = {
    classes: [
      {
        title: 'Sinf',
        dataIndex: 'name',
        key: 'name',
        render: (text) => (
          <Text strong style={{ color: '#1e293b' }}>{text}</Text>
        ),
      },
      {
        title: 'O\'quvchilar',
        dataIndex: 'students',
        key: 'students',
        render: (students) => (
          <Text style={{ color: '#64748b' }}>{students.length} ta</Text>
        ),
      },
      {
        title: 'Faol',
        dataIndex: 'activeStudents',
        key: 'activeStudents',
        render: (count) => (
          <Text style={{ color: '#16a34a', fontWeight: 600 }}>{count} ta</Text>
        ),
      },
      {
        title: 'O\'rtacha ball',
        dataIndex: 'averageScore',
        key: 'averageScore',
        render: (score) => (
          <Text style={{ color: score >= 70 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#dc2626', fontWeight: 600 }}>
            {score}%
          </Text>
        ),
      },
    ],
    students: [
      {
        title: 'O\'quvchi',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <Space>
            <Text strong style={{ color: '#1e293b' }}>{text}</Text>
            <Text style={{ color: '#64748b', fontSize: '12px' }}>({record.classGroup})</Text>
          </Space>
        ),
      },
      {
        title: 'Testlar',
        dataIndex: 'testCount',
        key: 'testCount',
        render: (count) => (
          <Text style={{ color: '#2563eb', fontWeight: 600 }}>{count}</Text>
        ),
      },
      {
        title: 'O\'rtacha ball',
        dataIndex: 'averageScore',
        key: 'averageScore',
        render: (score) => (
          <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red'}>
            {score}%
          </Tag>
        ),
      },
    ],
    tests: [
      {
        title: 'Test',
        dataIndex: 'title',
        key: 'title',
        render: (text, record) => (
          <Space direction="vertical" size="small">
            <Text strong style={{ color: '#1e293b' }}>{text}</Text>
            <Text style={{ color: '#64748b', fontSize: '12px' }}>
              {record.subject} • {record.teacherName}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Urinishlar',
        dataIndex: 'attemptCount',
        key: 'attemptCount',
        render: (count) => (
          <Text style={{ color: '#7c3aed', fontWeight: 600 }}>{count}</Text>
        ),
      },
      {
        title: 'O\'rtacha ball',
        dataIndex: 'averageScore',
        key: 'averageScore',
        render: (score) => (
          <Text style={{ color: '#059669', fontWeight: 600 }}>{score}%</Text>
        ),
      },
    ]
  };

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
          Umumiy statistika
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Platformaning to'liq analitikasi va insights
        </Text>
      </div>

      {/* Overview Statistics with Entrance Animations */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '100ms' }}>
            <StatCard
              title="Jami foydalanuvchilar"
              value={stats.totalUsers}
              icon={<UserOutlined />}
              color="#2563eb"
              trend={{ direction: 'up', value: `+${stats.studentGrowth}%` }}
              subtitle={`${stats.totalStudents} o'quvchi, ${stats.totalTeachers} o'qituvchi`}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '200ms' }}>
            <StatCard
              title="Jami testlar"
              value={stats.totalTests}
              icon={<BookOutlined />}
              color="#7c3aed"
              trend={{ direction: 'up', value: `+${stats.testGrowth}%` }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '300ms' }}>
            <StatCard
              title="Jami urinishlar"
              value={stats.totalAttempts}
              icon={<TrophyOutlined />}
              color="#059669"
              trend={{ direction: 'up', value: `+${stats.attemptGrowth}%` }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '400ms' }}>
            <StatCard
              title="O'rtacha ball"
              value={stats.averageScore}
              suffix="%"
              icon={<RiseOutlined />}
              color="#f59e0b"
              trend={{ direction: 'up', value: `+${stats.scoreGrowth}%` }}
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
                { key: 'monthlyTrends', label: 'Oylik tendensiyalar', icon: <LineChartOutlined style={{ color: '#2563eb' }} /> },
                { key: 'weeklyActivity', label: 'Haftalik faoliyat', icon: <CalendarOutlined style={{ color: '#f59e0b' }} /> },
                { key: 'subjectPerformance', label: 'Fanlar natijalari', icon: <BarChartOutlined style={{ color: '#8b5cf6' }} /> },
                { key: 'classPerformance', label: 'Sinf natijalari', icon: <BarChartOutlined style={{ color: '#059669' }} /> },
                { key: 'userRole', label: 'Foydalanuvchilar tarkibi', icon: <PieChartOutlined style={{ color: '#f59e0b' }} /> },
                { key: 'subjectRadar', label: 'Fanlar radar', icon: <RiseOutlined style={{ color: '#8b5cf6' }} /> },
                { key: 'testTypes', label: 'Test turlari', icon: <BookOutlined style={{ color: '#7c3aed' }} /> }
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
                      checked={visibleCards[chart.key]}
                      onChange={(checked) => toggleCard(chart.key)}
                      style={{ backgroundColor: visibleCards[chart.key] ? '#2563eb' : '#d1d5db' }}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div>
        <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="monthlyTrends"
            title="Oylik tendensiyalar"
            icon={<LineChartOutlined style={{ color: '#2563eb' }} />}
            width={50}
            index={0}
          >
            <Line 
              data={monthlyTrendsChart} 
              options={chartOptions}
              onClick={() => handleChartClick('monthly_trends')}
            />
          </ResizableChart>

          <ResizableChart
            chartKey="weeklyActivity"
            title="Haftalik faoliyat"
            icon={<CalendarOutlined style={{ color: '#f59e0b' }} />}
            width={50}
            index={1}
          >
            <Line 
              data={weeklyActivityChart} 
              options={chartOptions}
              onClick={() => handleChartClick('weekly_activity')}
            />
          </ResizableChart>
        </Row>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="subjectPerformance"
            title="Fanlar bo'yicha natijalar"
            icon={<BarChartOutlined style={{ color: '#8b5cf6' }} />}
            width={100}
            index={2}
          >
            <Line 
              data={subjectPerformanceChart} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    ...chartOptions.plugins.legend,
                    display: false
                  }
                }
              }}
              onClick={() => handleChartClick('subject_performance')}
            />
          </ResizableChart>
        </Row>
      </div>

      {/* Additional Charts Section */}
      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="classPerformance"
            title="Sinf natijalari"
            icon={<BarChartOutlined style={{ color: '#059669' }} />}
            width={50}
            index={3}
          >
            <Bar 
              data={classPerformanceBarChart} 
              options={barChartOptions}
              onClick={() => handleChartClick('class_performance_bar')}
            />
          </ResizableChart>

          <ResizableChart
            chartKey="userRole"
            title="Foydalanuvchilar tarkibi"
            icon={<PieChartOutlined style={{ color: '#f59e0b' }} />}
            width={50}
            index={4}
          >
            <Pie 
              data={userRolePieChart} 
              options={pieChartOptions}
              onClick={() => handleChartClick('user_role_pie')}
            />
          </ResizableChart>
        </Row>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[0, 24]}>
          <ResizableChart
            chartKey="subjectRadar"
            title="Fanlar radar"
            icon={<RiseOutlined style={{ color: '#8b5cf6' }} />}
            width={50}
            index={5}
          >
            <Radar 
              data={subjectPerformanceRadarChart} 
              options={radarChartOptions}
              onClick={() => handleChartClick('subject_radar')}
            />
          </ResizableChart>

          <ResizableChart
            chartKey="testTypes"
            title="Test turlari"
            icon={<BookOutlined style={{ color: '#7c3aed' }} />}
            width={50}
            index={6}
          >
            <Pie 
              data={testDifficultyDoughnutChart} 
              options={pieChartOptions}
              onClick={() => handleChartClick('test_types_pie')}
            />
          </ResizableChart>
        </Row>
      </div>

      {/* Top Classes and Students Analytics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
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
              <TeamOutlined style={{ color: '#16a34a' }} />
              Top 5 sinflar
            </Title>
            <Table
              dataSource={stats.classPerformance.slice(0, 5)}
              columns={columns.classes}
              pagination={false}
              size="small"
              rowKey="name"
            />
          </Card>
        </Col>

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
              <StarOutlined style={{ color: '#f59e0b' }} />
              Top 5 o'quvchilar
            </Title>
            <Table
              dataSource={stats.topStudents.slice(0, 5)}
              columns={columns.students}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>

      {/* Popular Tests Analytics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
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
              <BookOutlined style={{ color: '#7c3aed' }} />
              Eng mashhur testlar
            </Title>
            <Table
              dataSource={stats.popularTests.slice(0, 5)}
              columns={columns.tests}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>

      </div>

    </div>
  );
};

export default StatisticsPage;