import React, { useState, useEffect } from 'react';
import { Typography, Box, Paper, Grid, Card, CardContent } from '@mui/material';
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

  const StatCard = ({ title, value, color, subtitle }) => (
    <Card sx={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '10px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }}>
      <CardContent sx={{ p: 4 }}>
        <Typography sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: '#1F2937',
          mb: 1
        }}>
          {title}
        </Typography>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 600,
          color: '#0A1F44',
          lineHeight: 1.2,
          mb: 1
        }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography sx={{
            fontSize: '0.875rem',
            color: '#1F2937',
            fontWeight: 400
          }}>
            {subtitle}
          </Typography>
        )}
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
      p: 4,
      backgroundColor: '#ffffff'
    }}>
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #D1D5DB'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 600,
          color: '#1F2937',
          mb: 2
        }}>
          O'qituvchi statistikasi
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#1F2937',
          fontWeight: 400
        }}>
          Testlaringiz va o'quvchilaringizning batafsil statistikasi
        </Typography>
      </Box>

      {/* Main Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Jami yaratilgan testlar"
            value={totalTestsCreated}
            color="primary.main"
            subtitle={`${activeTests} ta faol`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Jami urinishlar"
            value={totalAttempts}
            color="secondary.main"
            subtitle={`${uniqueStudents} ta o'quvchi`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="O'rtacha ball"
            value={`${averageScore}%`}
            color="success.main"
            subtitle="O'quvchilar tomonidan"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Eng yuqori ball"
            value={`${highestScore}%`}
            color="success.main"
            subtitle="O'quvchilar tomonidan"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Eng past ball"
            value={`${lowestScore}%`}
            color="warning.main"
            subtitle="O'quvchilar tomonidan"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Score Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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

        {/* Performance Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            p: 3
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#1e293b',
              fontSize: '1.25rem',
              mb: 3
            }}>
              Natija umumlashtiruvi
            </Typography>
            <Box sx={{ p: 2 }}>
              <Typography sx={{ fontSize: '0.875rem', color: '#1e293b', mb: 1 }}>
                <strong>Jami testlar:</strong> {totalTestsCreated}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#1e293b', mb: 1 }}>
                <strong>Faol testlar:</strong> {activeTests}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#1e293b', mb: 1 }}>
                <strong>Jami urinishlar:</strong> {totalAttempts}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#1e293b', mb: 1 }}>
                <strong>O'quvchilar soni:</strong> {uniqueStudents}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#1e293b', mb: 1 }}>
                <strong>O'rtacha ball:</strong> {averageScore}%
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#1e293b', mb: 1 }}>
                <strong>Eng yuqori ball:</strong> {highestScore}%
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#1e293b', mb: 1 }}>
                <strong>Eng past ball:</strong> {lowestScore}%
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#64748b', mt: 2 }}>
                {averageScore >= 80 ? 'Ajoyib natijalar! O\'quvchilaringiz yaxshi o\'rganmoqda.' :
                 averageScore >= 60 ? 'Yaxshi natijalar! Davom eting va qo\'llab-quvvatlang.' :
                 'O\'quvchilarga qo\'shimcha yordam kerak bo\'lishi mumkin.'}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            p: 3
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#1e293b',
              fontSize: '1.25rem',
              mb: 3
            }}>
              So'nggi faoliyat
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {myTestAttempts
                .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
                .slice(0, 10)
                .map((attempt, index) => {
                  const test = myTests.find(t => t.id === attempt.test);
                  return (
                    <Box key={attempt.id} sx={{ mb: 2, pb: 1, borderBottom: '1px solid #e2e8f0' }}>
                      <Typography sx={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: 500 }}>
                        {test?.title || 'Noma\'lum test'} - {attempt.score || 0}%
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(attempt.submitted_at).toLocaleDateString('uz-UZ')}
                      </Typography>
                    </Box>
                  );
                })}
              {myTestAttempts.length === 0 && (
                <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Hali test topshirilmagan
                </Typography>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Detailed Test Statistics */}
        <Grid item xs={12}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            p: 3
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#1e293b',
              fontSize: '1.25rem',
              mb: 3
            }}>
              Testlar bo'yicha batafsil statistika
            </Typography>
            <Grid container spacing={2}>
              {myTests.map(test => {
                const testAttempts = myTestAttempts.filter(attempt => attempt.test === test.id);
                const testAverage = testAttempts.length > 0
                  ? Math.round(testAttempts.reduce((sum, a) => sum + a.score, 0) / testAttempts.length)
                  : 0;

                return (
                  <Grid item xs={12} sm={6} md={4} key={test.id}>
                    <Card sx={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
                      }
                    }}>
                      <CardContent>
                        <Typography sx={{ 
                          fontSize: '1.125rem', 
                          fontWeight: 600, 
                          color: '#1e293b',
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {test.title}
                        </Typography>
                        <Typography sx={{ fontSize: '0.875rem', color: '#64748b', mb: 2 }}>
                          {test.subject}
                        </Typography>
                        <Typography sx={{ fontSize: '0.875rem', color: '#1e293b', mb: 0.5 }}>
                          Urinishlar: {testAttempts.length}
                        </Typography>
                        <Typography sx={{ fontSize: '0.875rem', color: '#1e293b', mb: 1 }}>
                          O'rtacha ball: {testAverage}%
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Yaratilgan: {new Date(test.created_at).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherStatistics;