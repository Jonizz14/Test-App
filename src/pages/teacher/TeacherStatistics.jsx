import React, { useState, useEffect } from 'react';
import { Typography, Box, Paper, Grid, Card, CardContent } from '@mui/material';
import {
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  EmojiPeople as EmojiPeopleIcon,
} from '@mui/icons-material';
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
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'none',
      '&:hover': {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    }}>
      <CardContent sx={{ 
        p: 4,
        '&:last-child': { pb: 4 }
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#64748b',
                mb: 1
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#1e293b',
                lineHeight: 1.2,
                mb: 1
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  fontWeight: 500
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color === 'primary.main' ? '#eff6ff' : 
                               color === 'secondary.main' ? '#f0fdf4' :
                               color === 'success.main' ? '#ecfdf5' :
                               color === 'warning.main' ? '#fffbeb' :
                               color === 'info.main' ? '#f0f9ff' :
                               '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ml: 2
            }}
          >
            {React.cloneElement(icon, {
              sx: { 
                fontSize: '2rem', 
                color: color === 'primary.main' ? '#2563eb' : 
                       color === 'secondary.main' ? '#16a34a' :
                       color === 'success.main' ? '#059669' :
                       color === 'warning.main' ? '#d97706' :
                       color === 'info.main' ? '#0ea5e9' :
                       '#64748b'
              }
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ 
        pl: { xs: 0, md: 35 }, 
        pr: 4,
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          O'qituvchi statistikasi
        </Typography>
        <Typography sx={{ color: '#64748b', mt: 2 }}>Yuklanmoqda...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      py: 4,
      backgroundColor: '#ffffff'
    }}>
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 2
        }}>
          O'qituvchi statistikasi
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Testlaringiz va o'quvchilaringizning batafsil statistikasi
        </Typography>
      </Box>

      {/* Main Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <div>
            <StatCard
              title="Jami yaratilgan testlar"
              value={totalTestsCreated}
              icon={<AssessmentIcon />}
              color="primary.main"
              subtitle={`${activeTests} ta faol`}
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <div>
            <StatCard
              title="Jami urinishlar"
              value={totalAttempts}
              icon={<EmojiPeopleIcon />}
              color="secondary.main"
              subtitle={`${uniqueStudents} ta o'quvchi`}
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <div>
            <StatCard
              title="O'rtacha ball"
              value={`${averageScore}%`}
              icon={<TrendingUpIcon />}
              color="info.main"
              subtitle="O'quvchilar natijasi"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <div>
            <StatCard
              title="Eng yuqori ball"
              value={`${highestScore}%`}
              icon={<TrendingUpIcon />}
              color="success.main"
              subtitle="O'quvchilar natijasi"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <div>
            <StatCard
              title="Eng past ball"
              value={`${lowestScore}%`}
              icon={<TrendingUpIcon />}
              color="warning.main"
              subtitle="O'quvchilar natijasi"
            />
          </div>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Score Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            height: '400px',
            p: 3
          }}>
            <Typography sx={{
              fontWeight: 600,
              color: '#1F2937',
              fontSize: '1.25rem',
              mb: 3
            }}>
              Ballar taqsimoti
            </Typography>
            <Bar data={scoreDistributionData} options={chartOptions} />
          </Card>
        </Grid>

        {/* Subject Performance Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            height: '400px',
            p: 3
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#1e293b',
              fontSize: '1.25rem',
              mb: 3
            }}>
              Fanlar bo'yicha natijalar
            </Typography>
            <Pie
              data={subjectPerformanceData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </Card>
        </Grid>

        {/* Test Creation Timeline */}
        <Grid item xs={12}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            height: '400px',
            p: 3
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#1e293b',
              fontSize: '1.25rem',
              mb: 3
            }}>
              Test yaratish dinamikasi (oxirgi 6 oy)
            </Typography>
            <Line data={testCreationData} options={chartOptions} />
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default TeacherStatistics;
