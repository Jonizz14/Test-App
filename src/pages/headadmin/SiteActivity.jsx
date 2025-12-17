import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  AdminPanelSettings as AdminIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import apiService from '../../data/apiService';

const SiteActivity = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalSellers: 0,
    totalTests: 0,
    totalAttempts: 0,
    recentActivity: [],
    allRecentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real statistics from the database
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);

        // Fetch all users, tests, and attempts in parallel
        const [usersData, testsData, attemptsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getTests(),
          apiService.getAttempts()
        ]);

        const users = usersData.results || usersData;
        const tests = testsData.results || testsData;
        const attempts = attemptsData.results || attemptsData;

        // Calculate statistics
        const totalUsers = users.length;
        const totalAdmins = users.filter(user => user.role === 'admin' || user.role === 'head_admin').length;
        const totalTeachers = users.filter(user => user.role === 'teacher').length;
        const totalStudents = users.filter(user => user.role === 'student').length;
        const totalSellers = users.filter(user => user.role === 'seller').length;
        const totalTests = tests.length;
        const totalAttempts = attempts.length;

        // Get recent activity (last 20 attempts for activity log)
        const allRecentActivity = attempts
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
          .slice(0, 20)
          .map(attempt => ({
            id: attempt.id,
            action: `Test yakunlandi: ${attempt.test_title || 'Noma\'lum test'}`,
            user: attempt.student_name || 'Noma\'lum o\'quvchi',
            time: new Date(attempt.submitted_at).toLocaleDateString('uz-UZ'),
            score: attempt.score,
            type: 'test_attempt'
          }));

        // Add user registration activity (mock data for now)
        const userActivity = users
          .slice(0, 10)
          .map(user => ({
            id: `user_${user.id}`,
            action: `${user.role === 'student' ? 'O\'quvchi' : user.role === 'teacher' ? 'O\'qituvchi' : 'Admin'} ro\'yxatdan o\'tdi`,
            user: user.name || user.username,
            time: user.registration_date ? new Date(user.registration_date).toLocaleDateString('uz-UZ') : 'Bugun',
            score: null,
            type: 'user_registration'
          }));

        // Combine and sort all activity
        const combinedActivity = [...allRecentActivity, ...userActivity]
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 30);

        const recentActivity = combinedActivity.slice(0, 5);

        setStats({
          totalUsers,
          totalAdmins,
          totalTeachers,
          totalStudents,
          totalSellers,
          totalTests,
          totalAttempts,
          recentActivity,
          allRecentActivity: combinedActivity,
        });

      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'test_attempt':
        return <AssessmentIcon sx={{ color: '#2563eb' }} />;
      case 'user_registration':
        return <PersonIcon sx={{ color: '#059669' }} />;
      default:
        return <TimelineIcon sx={{ color: '#64748b' }} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'test_attempt':
        return '#eff6ff';
      case 'user_registration':
        return '#ecfdf5';
      default:
        return '#f8fafc';
    }
  };

  if (loading) {
    return (
      <Box sx={{
        p: 4,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Ma'lumotlar yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mt: 2 }}>
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
        <Typography
          sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 2
          }}
        >
          Sayt faolligi
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Platformadagi barcha faoliyat va statistika
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            p: 3,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <AdminIcon sx={{ fontSize: '2rem', color: '#dc2626', mb: 1 }} />
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>
              {stats.totalAdmins}
            </Typography>
            <Typography sx={{ color: '#64748b' }}>Administratorlar</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            p: 3,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <SchoolIcon sx={{ fontSize: '2rem', color: '#059669', mb: 1 }} />
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#059669' }}>
              {stats.totalTeachers}
            </Typography>
            <Typography sx={{ color: '#64748b' }}>O'qituvchilar</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            p: 3,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <PersonIcon sx={{ fontSize: '2rem', color: '#7c3aed', mb: 1 }} />
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#7c3aed' }}>
              {stats.totalStudents}
            </Typography>
            <Typography sx={{ color: '#64748b' }}>O'quvchilar</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            p: 3,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <AssessmentIcon sx={{ fontSize: '2rem', color: '#d97706', mb: 1 }} />
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#d97706' }}>
              {stats.totalAttempts}
            </Typography>
            <Typography sx={{ color: '#64748b' }}>Test urinishlari</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Activity Log */}
      <Card sx={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography
            sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <TimelineIcon sx={{ color: '#2563eb' }} />
            Faoliyat tarixi
          </Typography>

          <List sx={{ p: 0 }}>
            {stats.allRecentActivity.length > 0 ? (
              stats.allRecentActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem sx={{
                    px: 0,
                    py: 2.5,
                    '&:hover': {
                      backgroundColor: '#f8fafc',
                    },
                    transition: 'background-color 0.2s ease'
                  }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      gap: 2
                    }}>
                      <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        backgroundColor: getActivityColor(activity.type),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getActivityIcon(activity.type)}
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          mb: 0.5
                        }}>
                          {activity.action}
                        </Typography>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          <Typography sx={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            fontWeight: 400
                          }}>
                            {activity.user} • {activity.time}
                          </Typography>
                          {activity.score !== null && (
                            <Chip
                              label={`${activity.score}%`}
                              size="small"
                              sx={{
                                backgroundColor: activity.score >= 80 ? '#ecfdf5' :
                                               activity.score >= 60 ? '#fffbeb' : '#fef2f2',
                                color: activity.score >= 80 ? '#059669' :
                                     activity.score >= 60 ? '#d97706' : '#dc2626',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < stats.allRecentActivity.length - 1 && (
                    <Divider sx={{ my: 0, mx: 0 }} />
                  )}
                </React.Fragment>
              ))
            ) : (
              <ListItem sx={{ px: 0, py: 6 }}>
                <ListItemText
                  primary={
                    <Typography sx={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#64748b',
                      textAlign: 'center'
                    }}>
                      Hozircha faoliyat yo'q
                    </Typography>
                  }
                  secondary={
                    <Typography sx={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      textAlign: 'center'
                    }}>
                      Faoliyat boshlanganda bu yerda ko'rinadi
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SiteActivity;