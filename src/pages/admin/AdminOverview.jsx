import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
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
} from '@mui/material';
import {
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import apiService from '../../data/apiService';

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalTests: 0,
    totalAttempts: 0,
    activeTests: 0,
    recentActivity: [],
    bannedUsers: []
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
        const bannedUsers = users.filter(user => user.is_banned);
        const tests = testsData.results || testsData;
        const attempts = attemptsData.results || attemptsData;

        // Calculate statistics
        const totalUsers = users.length;
        const totalTeachers = users.filter(user => user.role === 'teacher').length;
        const totalStudents = users.filter(user => user.role === 'student').length;
        const totalTests = tests.length;
        const totalAttempts = attempts.length;
        const activeTests = tests.filter(test => test.is_active !== false).length;

        // Calculate score statistics
        const scores = attempts.map(attempt => attempt.score || 0);

        // Calculate statistics
        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;

        const highestScore = scores.length > 0
          ? Math.round(Math.max(...scores))
          : 0;

        const lowestScore = scores.length > 0
          ? Math.round(Math.min(...scores))
          : 0;

        // Get recent activity (last 5 attempts)
        const recentActivity = attempts
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
          .slice(0, 5)
          .map(attempt => ({
            id: attempt.id,
            action: `Test yakunlandi: ${attempt.test_title || 'Noma\'lum test'}`,
            user: attempt.student_name || 'Noma\'lum o\'quvchi',
            time: new Date(attempt.submitted_at).toLocaleDateString('uz-UZ')
          }));

        setStats({
          totalUsers,
          totalTeachers,
          totalStudents,
          totalTests,
          totalAttempts,
          activeTests,
          averageScore,
          highestScore,
          lowestScore,
          recentActivity,
          bannedUsers
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
      }}>
        <Typography
          sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 2
          }}
        >
          Admin Umumiy ko'rinishi
        </Typography>
        <Typography sx={{ 
          fontSize: '1.125rem', 
          color: '#64748b',
          fontWeight: 400 
        }}>
          Platformaning umumiy statistikasi va faoliyati
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Jami foydalanuvchilar"
            value={stats.totalUsers}
            icon={<PeopleIcon fontSize="large" />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="O'qituvchilar"
            value={stats.totalTeachers}
            icon={<SchoolIcon fontSize="large" />}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="O'quvchilar"
            value={stats.totalStudents}
            icon={<PeopleIcon fontSize="large" />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Jami testlar"
            value={stats.totalTests}
            icon={<AssessmentIcon fontSize="large" />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Jami urinishlar"
            value={stats.totalAttempts}
            icon={<AssessmentIcon fontSize="large" />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Faol testlar"
            value={stats.activeTests}
            icon={<AssessmentIcon fontSize="large" />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="O'rtacha ball"
            value={`${stats.averageScore}%`}
            icon={<TrendingUpIcon fontSize="large" />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Eng yuqori ball"
            value={`${stats.highestScore}%`}
            icon={<TrendingUpIcon fontSize="large" />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Eng past ball"
            value={`${stats.lowestScore}%`}
            icon={<TrendingUpIcon fontSize="large" />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{
            p: 4,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}>
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1e293b',
                mb: 3
              }}
            >
              Platform Statistikasi
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ px: 0, py: 2 }}>
                <ListItemText
                  primary="Jami test urinishlari"
                  secondary={
                    <Typography sx={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 700, 
                      color: '#2563eb' 
                    }}>
                      {stats.totalAttempts}
                    </Typography>
                  }
                />
              </ListItem>
              <Divider sx={{ my: 1 }} />
              <ListItem sx={{ px: 0, py: 2 }}>
                <ListItemText
                  primary="Faol testlar"
                  secondary={
                    <Typography sx={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 700, 
                      color: '#059669' 
                    }}>
                      {stats.activeTests}
                    </Typography>
                  }
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{
            p: 4,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}>
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1e293b',
                mb: 3
              }}
            >
              So'nggi Faoliyat
            </Typography>
            <List sx={{ p: 0 }}>
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ 
                      px: 0, 
                      py: 2,
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                      }
                    }}>
                      <ListItemText
                        primary={
                          <Typography sx={{ 
                            fontSize: '0.875rem', 
                            fontWeight: 600, 
                            color: '#1e293b' 
                          }}>
                            {activity.action}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ 
                            fontSize: '0.75rem', 
                            color: '#64748b',
                            fontWeight: 400
                          }}>
                            {activity.user} • {activity.time}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < stats.recentActivity.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem sx={{ px: 0, py: 2 }}>
                  <ListItemText
                    primary={
                      <Typography sx={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 500, 
                        color: '#64748b' 
                      }}>
                        Hozircha faoliyat yo'q
                      </Typography>
                    }
                    secondary={
                      <Typography sx={{ 
                        fontSize: '0.75rem', 
                        color: '#94a3b8' 
                      }}>
                        Testlar yakunlanganda bu yerda ko'rinadi
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Banned Users Section */}
      {stats.bannedUsers.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Paper sx={{
            p: 4,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}>
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1e293b',
                mb: 3
              }}
            >
              🚫 Bloklangan o'quvchilar
            </Typography>
            <List sx={{ p: 0 }}>
              {stats.bannedUsers.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem sx={{
                    px: 0,
                    py: 2,
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px',
                    mb: 1
                  }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography sx={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#dc2626'
                          }}>
                            {user.name || user.username}
                          </Typography>
                          <Typography sx={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            backgroundColor: '#fee2e2',
                            px: 2,
                            py: 0.5,
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontWeight: 'bold'
                          }}>
                            Kod: {user.unban_code}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography sx={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          Bloklash sababi: {user.ban_reason} • Bloklangan: {user.ban_date ? new Date(user.ban_date).toLocaleDateString('uz-UZ') : 'Noma\'lum'}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < stats.bannedUsers.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default AdminOverview;
