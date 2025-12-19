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
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  LocalLibrary as LocalLibraryIcon,
  EmojiPeople as EmojiPeopleIcon,
  BarChart as BarChartIcon,
  Quiz as QuizIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import apiService from '../../data/apiService';

const HeadAdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalSellers: 0,
    totalTests: 0,
    totalAttempts: 0,
    activeTests: 0,
    recentActivity: [],
    allRecentActivity: [],
    bannedUsers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

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
        const totalAdmins = users.filter(user => user.role === 'admin' || user.role === 'head_admin').length;
        const totalTeachers = users.filter(user => user.role === 'teacher').length;
        const totalStudents = users.filter(user => user.role === 'student').length;
        const totalSellers = users.filter(user => user.role === 'seller').length;
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

        // Get recent activity (last 10 attempts for modal, 3 for overview)
        const allRecentActivity = attempts
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
          .slice(0, 10)
          .map(attempt => ({
            id: attempt.id,
            action: `Test yakunlandi: ${attempt.test_title || 'Noma\'lum test'}`,
            user: attempt.student_name || 'Noma\'lum o\'quvchi',
            time: new Date(attempt.submitted_at).toLocaleDateString('uz-UZ'),
            score: attempt.score
          }));

        const recentActivity = allRecentActivity.slice(0, 3);

        setStats({
          totalUsers,
          totalAdmins,
          totalTeachers,
          totalStudents,
          totalSellers,
          totalTests,
          totalAttempts,
          activeTests,
          averageScore,
          highestScore,
          lowestScore,
          recentActivity,
          allRecentActivity,
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
          Head Admin Umumiy ko'rinishi
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Platformaning to'liq statistikasi va barcha faoliyati
        </Typography>
      </Box>



      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Jami foydalanuvchilar"
            value={stats.totalUsers}
            icon={<AdminPanelSettingsIcon fontSize="large" />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Administratorlar"
            value={stats.totalAdmins}
            icon={<SecurityIcon fontSize="large" />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="O'qituvchilar"
            value={stats.totalTeachers}
            icon={<LocalLibraryIcon fontSize="large" />}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="O'quvchilar"
            value={stats.totalStudents}
            icon={<EmojiPeopleIcon fontSize="large" />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Sotuvchilar"
            value={stats.totalSellers}
            icon={<PeopleIcon fontSize="large" />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Jami testlar"
            value={stats.totalTests}
            icon={<AssessmentIcon fontSize="large" />}
            color="info.main"
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
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Accordion
          expanded={detailsExpanded}
          onChange={() => setDetailsExpanded(!detailsExpanded)}
          sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px !important',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            '&:before': {
              display: 'none',
            },
            '&.Mui-expanded': {
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#2563eb' }} />}
            sx={{
              backgroundColor: '#f8fafc',
              borderBottom: detailsExpanded ? '1px solid #e2e8f0' : 'none',
              borderRadius: detailsExpanded ? '16px 16px 0 0' : '16px',
              py: 3,
              px: 4,
              '&:hover': {
                backgroundColor: '#f1f5f9',
              },
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 2,
              }
            }}
          >
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SecurityIcon sx={{ color: '#2563eb', fontSize: '1.5rem' }} />
            </Box>
            <Box>
              <Typography sx={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1e293b',
                mb: 0.5
              }}>
                📊 To'liq statistika va faoliyatni ko'rish
              </Typography>
              <Typography sx={{
                fontSize: '0.875rem',
                color: '#64748b',
                fontWeight: 400
              }}>
                Platformaning batafsil statistikasi va faoliyat tarixi
              </Typography>
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ p: 0 }}>
            <Box sx={{ p: 4 }}>
              {/* Recent Activity */}
              <Box>
                <Box sx={{
                  backgroundColor: '#fffbeb',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  mb: 3,
                  border: '1px solid #e2e8f0'
                }}>
                  <Typography sx={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <TimelineIcon sx={{ color: '#d97706' }} />
                    So'nggi faoliyat
                  </Typography>
                </Box>
                <Card sx={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  maxHeight: '400px',
                  overflow: 'auto'
                }}>
                  <List sx={{ p: 0 }}>
                    {stats.allRecentActivity.length > 0 ? (
                      stats.allRecentActivity.map((activity, index) => (
                        <React.Fragment key={activity.id}>
                          <ListItem sx={{
                            px: 3,
                            py: 2.5,
                            '&:hover': {
                              backgroundColor: '#f8fafc',
                            },
                            transition: 'background-color 0.2s ease'
                          }}>
                            <ListItemText
                              primary={
                                <Box sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 0.5
                                }}>
                                  <Typography sx={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: '#1e293b'
                                  }}>
                                    {activity.action}
                                  </Typography>
                                  <Box sx={{
                                    backgroundColor: activity.score >= 80 ? '#ecfdf5' :
                                                   activity.score >= 60 ? '#fffbeb' : '#fef2f2',
                                    color: activity.score >= 80 ? '#059669' :
                                          activity.score >= 60 ? '#d97706' : '#dc2626',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                  }}>
                                    {activity.score}%
                                  </Box>
                                </Box>
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
                          {index < stats.allRecentActivity.length - 1 && (
                            <Divider sx={{ my: 0, mx: 3 }} />
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <ListItem sx={{ px: 3, py: 6 }}>
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
                              Testlar yakunlanganda bu yerda ko'rinadi
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Card>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

export default HeadAdminOverview;