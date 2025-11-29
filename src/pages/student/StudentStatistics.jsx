import React, { useState, useEffect } from 'react';
import { Typography, Box, Paper, Grid, Card, CardContent, Alert } from '@mui/material';
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

const StudentStatistics = () => {
  const { currentUser } = useAuth();
  const [myAttempts, setMyAttempts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warningCount, setWarningCount] = useState(0);

  useEffect(() => {
    loadStatistics();
  }, [currentUser.id]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');

      // Load student's attempts, all tests, and warnings from API
      const [attemptsResponse, testsResponse, warningsResponse] = await Promise.all([
        apiService.getAttempts({ student: currentUser.id }),
        apiService.getTests(),
        apiService.getWarnings({ student: currentUser.id })
      ]);

      const studentAttempts = attemptsResponse.results || attemptsResponse;
      const allTests = testsResponse.results || testsResponse;
      const warnings = warningsResponse.results || warningsResponse;

      setMyAttempts(studentAttempts);
      setTests(allTests);
      setWarningCount(Array.isArray(warnings) ? warnings.length : 0);

      console.log('Student statistics loaded:', {
        attempts: studentAttempts.length,
        tests: allTests.length,
        warnings: Array.isArray(warnings) ? warnings.length : 0
      });
    } catch (err) {
      console.error('Failed to load student statistics:', err);
      setError('O\'quvchi statistikasini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalTests = myAttempts.length;
  const scores = myAttempts.map(attempt => attempt.score || 0);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
  const highestScore = scores.length > 0
    ? Math.round(Math.max(...scores))
    : 0;
  const lowestScore = scores.length > 0
    ? Math.round(Math.min(...scores))
    : 0;

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
        label: 'Testlar soni',
        data: Object.values(scoreRanges),
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(147, 51, 234, 0.6)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(147, 51, 234, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Score trend over time
  const sortedAttempts = myAttempts
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
    .slice(-10); // Last 10 attempts

  const scoreTrendData = {
    labels: sortedAttempts.map((_, index) => `Test ${index + 1}`),
    datasets: [
      {
        label: 'Ball',
        data: sortedAttempts.map(attempt => attempt.score || 0),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.1,
      },
    ],
  };

  // Performance by subject
  const subjectStats = {};
  myAttempts.forEach(attempt => {
    const test = tests.find(t => t.id === attempt.test);
    if (test) {
      const subject = test.subject;
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, sum: 0 };
      }
      subjectStats[subject].total++;
      subjectStats[subject].sum += attempt.score || 0;
    }
  });

  const subjectPerformanceData = {
    labels: Object.keys(subjectStats),
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: Object.values(subjectStats).map(stat => Math.round(stat.sum / stat.total)),
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(147, 51, 234, 0.6)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(147, 51, 234, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Recent activity
  const recentAttempts = myAttempts
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 10);

  const StatCard = ({ title, value, subtitle }) => (
    <Card sx={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      aspectRatio: 1,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <CardContent sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography sx={{
          fontWeight: 600,
          color: '#64748b',
          fontSize: '0.875rem',
          mb: 2
        }}>
          {title}
        </Typography>
        <Typography sx={{
          fontWeight: 700,
          color: '#2563eb',
          fontSize: '2.25rem',
          mb: 1
        }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="#64748b">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ 
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Mening statistikam
        </Typography>
        <Typography sx={{ color: '#64748b' }}>Yuklanmoqda...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 4
        }}>
          Mening statistikam
        </Typography>
        <Alert severity="error" sx={{ 
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b'
        }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      py: 4,
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}
      data-aos="fade-down"
      >
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Mening statistikam
        </Typography>
      </Box>

      {/* Warning Count Alert - Only show if 3 or more warnings */}
      {warningCount >= 3 && (
        <div data-aos="fade-up" data-aos-delay="300">
          <Alert
            severity="warning"
            sx={{
              mb: 4,
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              color: '#92400e',
              '& .MuiAlert-icon': {
                color: '#f59e0b'
              }
            }}
          >
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              ⚠️ Ogohlantirishlar: {warningCount} ta
            </Typography>
            <Typography variant="body2">
              Siz test qoidalariga {warningCount} marta rioya qilmadingiz. Iltimos, test qoidalariga rioya qiling, aks holda profilingiz bloklanishi mumkin.
            </Typography>
          </Alert>
        </div>
      )}

      {/* Main Statistics Cards */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <div data-aos="fade-up" data-aos-delay="100">
            <StatCard
              title="Topshirilgan testlar"
              value={totalTests}
              subtitle="jami"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <div data-aos="fade-up" data-aos-delay="200">
            <StatCard
              title="O'rtacha ball"
              value={`${averageScore}%`}
              subtitle="barcha testlar"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <div data-aos="fade-up" data-aos-delay="300">
            <StatCard
              title="Eng yuqori ball"
              value={`${highestScore}%`}
              subtitle="eng yaxshi"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <div data-aos="fade-up" data-aos-delay="400">
            <StatCard
              title="Eng past ball"
              value={`${lowestScore}%`}
              subtitle="eng past"
            />
          </div>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Score Distribution Chart */}
        <Grid item xs={12} md={6}>
          <div data-aos="fade-right">
            <Card sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  mb: 3
                }}>
                  Ballar taqsimoti
                </Typography>
                <Bar
                  data={scoreDistributionData}
                  options={{
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
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </Grid>

        {/* Performance by Subject */}
        <Grid item xs={12} md={6}>
          <div data-aos="fade-left">
            <Card sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
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
              </CardContent>
            </Card>
          </div>
        </Grid>

        {/* Score Trend */}
        <Grid item xs={12}>
          <div data-aos="fade-up">
            <Card sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  mb: 3
                }}>
                  Ballar tendensiyasi (oxirgi 10 ta test)
                </Typography>
                <Line
                  data={scoreTrendData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <div data-aos="fade-right">
            <Card sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  mb: 3
                }}>
                  So'nggi faoliyat
                </Typography>
              {recentAttempts.length > 0 ? (
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {recentAttempts.map((attempt, index) => {
                    const test = tests.find(t => t.id === attempt.test);
                    return (
                      <Box key={attempt.id} sx={{ mb: 3, pb: 2, borderBottom: '1px solid #f1f5f9' }}>
                        <Typography variant="body2" sx={{ 
                          color: '#2563eb',
                          fontWeight: 600,
                          mb: 1
                        }}>
                          {test?.title || 'Noma\'lum test'} - {attempt.score || 0}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {new Date(attempt.submitted_at).toLocaleDateString('uz-UZ')}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Hali faoliyat yo'q
                </Typography>
              )}
            </CardContent>
          </Card>
          </div>
        </Grid>

        {/* Performance Summary */}
        <Grid item xs={12} md={6}>
          <div data-aos="fade-left">
            <Card sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  mb: 3
                }}>
                  Natija umumlashtiruvi
                </Typography>
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" gutterBottom sx={{ color: '#334155', fontWeight: 500 }}>
                  <strong>Jami testlar:</strong> {totalTests}
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: '#334155', fontWeight: 500 }}>
                  <strong>O'rtacha ball:</strong> {averageScore}%
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: '#334155', fontWeight: 500 }}>
                  <strong>Eng yuqori ball:</strong> {highestScore}%
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: '#334155', fontWeight: 500 }}>
                  <strong>Eng past ball:</strong> {lowestScore}%
                </Typography>
                <Typography variant="body2" sx={{ mt: 3, color: '#64748b', fontWeight: 500 }}>
                  {averageScore >= 80 ? 'Ajoyib natija! Davom eting!' :
                   averageScore >= 60 ? 'Yaxshi natija! Yanada yaxshilashingiz mumkin.' :
                   'Ko\'proq mashq qiling va bilim oling!'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          </div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentStatistics;