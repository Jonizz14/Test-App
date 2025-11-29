import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  EmojiPeople as EmojiPeopleIcon,
  LocalLibrary as LocalLibraryIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const StudentOverview = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [myAttempts, setMyAttempts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warningCount, setWarningCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load student's attempts, tests, and warnings from API
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

      console.log('Student overview data loaded:', {
        attempts: studentAttempts.length,
        tests: allTests.length,
        warnings: Array.isArray(warnings) ? warnings.length : 0
      });
    } catch (error) {
      console.error('Failed to load student data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalTests = myAttempts.length;

  // Calculate score statistics
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

  const StatCard = ({ title, value, subtitle, count }) => (
    <Card sx={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <CardContent sx={{ p: 4 }}>
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
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1e293b', fontWeight: 700 }}>
          O'quvchi bosh sahifasi
        </Typography>
        <Typography sx={{ color: '#64748b' }}>Yuklanmoqda...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      py: 4,
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <Box
        sx={{
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
          O'quvchi bosh sahifasi
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
          data-aos="zoom-in"
          data-aos-delay="200"
        >
          O'qituvchilarni topish
        </Button>
      </Box>

      {/* Warning Count Alert - Only show if 3 or more warnings */}
      {warningCount >= 3 && (
        <div data-aos="fade-up" data-aos-delay="300">
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            color: '#92400e'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>
              ⚠️ Ogohlantirishlar: {warningCount} ta
            </div>
            <div style={{ fontSize: '14px' }}>
              Siz test qoidalariga {warningCount} marta rioya qilmadingiz. Iltimos, test qoidalariga rioya qiling, aks holda profilingiz bloklanishi mumkin.
            </div>
          </div>
        </div>
      )}

      {/* Main Statistics Cards */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <div data-aos="fade-up" data-aos-delay="100">
            <StatCard
              title="Topshirilgan testlar"
              value={totalTests}
              subtitle="jami"
            />
          </div>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <div data-aos="fade-up" data-aos-delay="200">
            <StatCard
              title="O'rtacha ball"
              value={`${averageScore}%`}
              subtitle="barcha testlar"
            />
          </div>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <div data-aos="fade-up" data-aos-delay="300">
            <StatCard
              title="Eng yuqori ball"
              value={`${highestScore}%`}
              subtitle="eng yaxshi"
            />
          </div>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
        {/* Activity Summary */}
        <Grid size={{ xs: 12, md: 8 }}>
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
                  Faoliyat
                </Typography>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="#64748b" sx={{ mb: 3 }}>
                    Siz {totalTests} ta test topshirgansiz. O'qituvchilarni topib, ko'proq testlarni sinab ko'ring.
                  </Typography>
                  <Button
                    variant="contained"
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
              </CardContent>
            </Card>
          </div>
        </Grid>

        {/* Recent Tests */}
        <Grid size={{ xs: 12, md: 4 }}>
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
                  So'nggi testlar
                </Typography>
              <List>
                {myAttempts
                  .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
                  .slice(0, 5)
                  .map((attempt) => {
                    const test = tests.find(t => t.id === attempt.test);
                    return (
                      <ListItem key={attempt.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={test?.title || 'Noma\'lum test'}
                          secondary={
                            <Typography variant="caption" color="#64748b">
                              {new Date(attempt.submitted_at).toLocaleDateString('uz-UZ')}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })}
                {myAttempts.length === 0 && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Hali test topshirmagan"
                      secondary="Birinchi testni topshirib, natijalarni ko'ring"
                    />
                  </ListItem>
                )}
              </List>
              {myAttempts.length > 5 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button onClick={() => navigate('/student/results')} sx={{ color: '#2563eb', fontWeight: 600 }}>
                    Barcha natijalarni ko'rish
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
          </div>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12 }}>
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
                  Tezkor amallar
                </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate('/student/statistics')}
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
                    Batafsil statistika
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<SchoolIcon />}
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
            </CardContent>
          </Card>
          </div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentOverview;