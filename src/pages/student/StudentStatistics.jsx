import React, { useState, useEffect } from 'react';
import { Typography, Box, Paper, Grid, Card, CardContent, Alert, Button } from '@mui/material';
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
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
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
  const navigate = useNavigate();
  const [myAttempts, setMyAttempts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatistics();
  }, [currentUser.id]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');

      // Load student's attempts and all tests from API
      const [attemptsResponse, testsResponse] = await Promise.all([
        apiService.getAttempts({ student: currentUser.id }),
        apiService.getTests()
      ]);

      const studentAttempts = attemptsResponse.results || attemptsResponse;
      const allTests = testsResponse.results || testsResponse;

      setMyAttempts(studentAttempts);
      setTests(allTests);

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

  const StatCard = ({ title, value, icon, color }) => (
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
                lineHeight: 1.2
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color === 'primary.main' ? '#eff6ff' :
                              color === 'secondary.main' ? '#f0fdf4' :
                              color === 'success.main' ? '#ecfdf5' :
                              color === 'warning.main' ? '#fffbeb' :
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
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography
            sx={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#1e293b',
              mb: 2
            }}
          >
            Mening statistikam
          </Typography>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={() => navigate('/student/search')}
            sx={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#1d4ed8',
              }
            }}
            >
              O'qituvchilarni topish
          </Button>
        </Box>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Test natijalaringiz va statistik ma'lumotlari
        </Typography>
      </Box>


      {/* Main Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <div>
            <StatCard
              title="Topshirilgan testlar"
              value={totalTests}
              icon={<AssessmentIcon fontSize="large" />}
              color="primary.main"
            />
          </div>
        </Grid>
        <Grid item xs={12} md={3}>
          <div>
            <StatCard
              title="O'rtacha ball"
              value={`${averageScore}%`}
              icon={<TrendingUpIcon fontSize="large" />}
              color="success.main"
            />
          </div>
        </Grid>
        <Grid item xs={12} md={3}>
          <div>
            <StatCard
              title="Eng yuqori ball"
              value={`${highestScore}%`}
              icon={<TrendingUpIcon fontSize="large" />}
              color="warning.main"
            />
          </div>
        </Grid>
        <Grid item xs={12} md={3}>
          <div>
            <StatCard
              title="Eng past ball"
              value={`${lowestScore}%`}
              icon={<TrendingUpIcon fontSize="large" />}
              color="error.main"
            />
          </div>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Box sx={{
          backgroundColor: '#eff6ff',
          borderRadius: '12px',
          padding: '16px 20px',
          mb: 3,
          border: '1px solid #e2e8f0'
        }}
        >
          <Typography sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <AssessmentIcon sx={{ color: '#2563eb' }} />
            Statistik ma'lumotlar va tahlillar
          </Typography>
        </Box>

        <Grid container spacing={4}>
        {/* Score Distribution Chart */}
        <Grid item xs={12} md={6}>
          <div>
            <Card sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              height: '100%',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  mb: 3
                }}>
                  Ballar taqsimoti
                </Typography>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bar
                    data={scoreDistributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
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
                </Box>
              </CardContent>
            </Card>
          </div>
        </Grid>

        {/* Performance by Subject */}
        <Grid item xs={12} md={6}>
          <div>
            <Card sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              height: '100%',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  mb: 3
                }}>
                  Fanlar bo'yicha natijalar
                </Typography>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pie
                    data={subjectPerformanceData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </div>
        </Grid>

        {/* Score Trend */}
        <Grid item xs={12}>
          <div>
            <Card sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  mb: 3
                }}>
                  Ballar tendensiyasi (oxirgi 10 ta test)
                </Typography>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Line
                    data={scoreTrendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
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
                </Box>
              </CardContent>
            </Card>
          </div>
        </Grid>

        {/* Performance Summary */}
        <Grid item xs={12}>
          <div>
            <Card sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              height: '100%',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  mb: 3
                }}>
                  Natija umumlashtiruvi
                </Typography>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 2 }}>
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

      {/* Quick Actions */}
      <Box sx={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '16px 20px',
        mt: 3,
        border: '1px solid #e2e8f0'
      }}
      >
        <Typography sx={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 3
        }}>
          <AssessmentIcon sx={{ color: '#2563eb' }} />
          Tezkor amallar
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<SearchIcon />}
              onClick={() => navigate('/student/search')}
              sx={{
                borderColor: '#e2e8f0',
                color: '#374151',
                borderRadius: '8px',
                padding: '12px 16px',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#2563eb',
                  backgroundColor: '#f8fafc',
                }
              }}
            >
              O'qituvchilarni topish
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AssessmentIcon />}
              onClick={() => navigate('/student/results')}
              sx={{
                borderColor: '#e2e8f0',
                color: '#374151',
                borderRadius: '8px',
                padding: '12px 16px',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#2563eb',
                  backgroundColor: '#f8fafc',
                }
              }}
            >
              Test natijalari
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<TrendingUpIcon />}
              onClick={() => navigate('/student')}
              sx={{
                borderColor: '#e2e8f0',
                color: '#374151',
                borderRadius: '8px',
                padding: '12px 16px',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#2563eb',
                  backgroundColor: '#f8fafc',
                }
              }}
            >
              Bosh sahifa
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AssessmentIcon />}
              onClick={() => navigate('/student/profile')}
              sx={{
                borderColor: '#e2e8f0',
                color: '#374151',
                borderRadius: '8px',
                padding: '12px 16px',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#2563eb',
                  backgroundColor: '#f8fafc',
                }
              }}
            >
              Mening profilim
            </Button>
          </Grid>
        </Grid>
      </Box>
      </Box>
    </Box>
  );
};

export default StudentStatistics;