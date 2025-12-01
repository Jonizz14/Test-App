import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Button,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as TrophyIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  PhotoCamera as PhotoIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const StudentProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [student, setStudent] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const loadStudentProfile = async () => {
      try {
        setLoading(true);

        // Get all users to find the student
        const users = await apiService.getUsers();
        const studentData = users.find(user => user.id === parseInt(id));
        setStudent(studentData);

        if (!studentData) {
          setError('O\'quvchi topilmadi');
          return;
        }

        // Check if this is the current user's own profile
        setIsOwnProfile(currentUser?.id === parseInt(id));

        // Get attempts by this student
        const allAttempts = await apiService.getAttempts({ student: id });
        setAttempts(allAttempts);

      } catch (error) {
        console.error('Failed to load student profile:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadStudentProfile();
  }, [id, currentUser]);

  // Calculate statistics
  const totalTests = attempts.length;
  const scores = attempts.map(attempt => attempt.score || 0);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
  const highestScore = scores.length > 0
    ? Math.round(Math.max(...scores))
    : 0;

  if (loading) {
    return (
      <Box sx={{
        py: 8,
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        gap: 3
      }}>
        <Typography>Yuklanmoqda...</Typography>
      </Box>
    );
  }

  if (error || !student) {
    return (
      <Box sx={{
        py: 8,
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Typography color="error">{error || 'O\'quvchi topilmadi'}</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Orqaga
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <Box sx={{
        mb: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}
      data-aos="fade-down"
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          variant="outlined"
          sx={{
            borderColor: '#2563eb',
            color: '#2563eb',
            '&:hover': {
              backgroundColor: '#eff6ff',
              borderColor: '#1d4ed8'
            }
          }}
        >
          Orqaga
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
          {student.name} - Profil
        </Typography>
      </Box>

      {/* Premium Profile Card */}
      <Paper sx={{
        p: 0,
        mb: 4,
        background: student.is_premium
          ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '300px'
      }}
      data-aos="fade-up"
      data-aos-delay="200"
      >
        {/* Premium Badge */}
        {student.is_premium && (
          <Box sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 2
          }}>
            <Chip
              icon={<TrophyIcon />}
              label="PREMIUM"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#d97706',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '& .MuiChip-icon': {
                  color: '#d97706'
                }
              }}
            />
          </Box>
        )}

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          p: 4,
          minHeight: '300px'
        }}>
          {/* Profile Photo */}
          <Box sx={{
            position: 'relative',
            mb: { xs: 3, md: 0 },
            mr: { xs: 0, md: 4 }
          }}>
            {student.profile_photo ? (
              <Avatar
                src={student.profile_photo}
                sx={{
                  width: 150,
                  height: 150,
                  border: '4px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  backgroundColor: student.is_premium ? '#ffffff' : '#2563eb'
                }}
                imgProps={{
                  style: { objectFit: 'cover' }
                }}
              >
                {student.name.charAt(0).toUpperCase()}
              </Avatar>
            ) : (
              <Avatar sx={{
                width: 150,
                height: 150,
                fontSize: '4rem',
                fontWeight: 'bold',
                border: '4px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                backgroundColor: student.is_premium ? '#ffffff' : '#2563eb',
                color: student.is_premium ? '#2563eb' : '#ffffff'
              }}>
                {student.name.charAt(0).toUpperCase()}
              </Avatar>
            )}

            {/* Premium Checkmark */}
            {student.is_premium && (
              <Box sx={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                backgroundColor: '#10b981',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <CheckCircleIcon sx={{ color: 'white', fontSize: '1.2rem' }} />
              </Box>
            )}
          </Box>

          {/* Profile Info */}
          <Box sx={{
            textAlign: { xs: 'center', md: 'left' },
            flex: 1,
            color: student.is_premium ? '#ffffff' : '#1e293b'
          }}>
            <Typography variant="h3" sx={{
              fontWeight: 700,
              mb: 2,
              textShadow: student.is_premium ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
            }}>
              {student.name}
            </Typography>

            {student.profile_status && (
              <Typography variant="h6" sx={{
                mb: 3,
                fontStyle: 'italic',
                opacity: 0.9,
                textShadow: student.is_premium ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
              }}>
                "{student.profile_status}"
              </Typography>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Chip
                label="O'quvchi"
                sx={{
                  backgroundColor: student.is_premium ? 'rgba(255, 255, 255, 0.2)' : '#ecfdf5',
                  color: student.is_premium ? '#ffffff' : '#059669',
                  border: student.is_premium ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontWeight: 600
                }}
              />
              <Chip
                label={`${student.class_group || 'Noma\'lum'} sinf`}
                sx={{
                  backgroundColor: student.is_premium ? 'rgba(255, 255, 255, 0.2)' : '#eff6ff',
                  color: student.is_premium ? '#ffffff' : '#2563eb',
                  border: student.is_premium ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontWeight: 600
                }}
              />
              <Chip
                label={student.direction === 'natural' ? 'Tabiiy fanlar' : student.direction === 'exact' ? 'Aniq fanlar' : 'Yo\'nalish yo\'q'}
                sx={{
                  backgroundColor: student.is_premium ? 'rgba(255, 255, 255, 0.2)' : '#f3f4f6',
                  color: student.is_premium ? '#ffffff' : '#374151',
                  border: student.is_premium ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontWeight: 600
                }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }} data-aos="fade-up" data-aos-delay="400">
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'none',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}>
            <CardContent sx={{
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              '&:last-child': { pb: 3 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flex={1}>
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
                    Topshirilgan testlar
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      lineHeight: 1.2
                    }}
                  >
                    {totalTests}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: '#eff6ff',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 2
                  }}
                >
                  <AssessmentIcon sx={{ fontSize: '1.5rem', color: '#2563eb' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'none',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}>
            <CardContent sx={{
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              '&:last-child': { pb: 3 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flex={1}>
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
                    O'rtacha ball
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      lineHeight: 1.2
                    }}
                  >
                    {averageScore}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: '#ecfdf5',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 2
                  }}
                >
                  <TrophyIcon sx={{ fontSize: '1.5rem', color: '#059669' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'none',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}>
            <CardContent sx={{
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              '&:last-child': { pb: 3 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flex={1}>
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
                    Eng yuqori ball
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      lineHeight: 1.2
                    }}
                  >
                    {highestScore}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: '#fef3c7',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 2
                  }}
                >
                  <TrophyIcon sx={{ fontSize: '1.5rem', color: '#d97706' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'none',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}>
            <CardContent sx={{
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              '&:last-child': { pb: 3 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flex={1}>
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
                    Premium status
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: student.is_premium ? '#d97706' : '#64748b',
                      lineHeight: 1.2
                    }}
                  >
                    {student.is_premium ? 'Faol' : 'Yo\'q'}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: student.is_premium ? '#fef3c7' : '#f3f4f6',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 2
                  }}
                >
                  <TrophyIcon sx={{
                    fontSize: '1.5rem',
                    color: student.is_premium ? '#d97706' : '#6b7280'
                  }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card sx={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }
      }}
      data-aos="fade-up"
      data-aos-delay="600"
      >
        <CardContent sx={{ p: 4 }}>
          <Typography sx={{
            fontWeight: 600,
            color: '#1e293b',
            fontSize: '1.25rem',
            mb: 3
          }}>
            Oxirgi faoliyat
          </Typography>

          {attempts.length > 0 ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
                Oxirgi test natijalari:
              </Typography>
              <Box sx={{
                maxHeight: '300px',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f5f9',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#cbd5e1',
                  borderRadius: '3px',
                  '&:hover': {
                    backgroundColor: '#94a3b8',
                  },
                },
              }}>
                {attempts
                  .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
                  .slice(0, 5)
                  .map((attempt, index) => (
                    <Box key={attempt.id} sx={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      p: 3,
                      mb: 2,
                      border: '1px solid #e2e8f0',
                      '&:hover': {
                        backgroundColor: '#f1f5f9',
                      }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{
                          fontWeight: 600,
                          color: '#1e293b',
                          fontSize: '0.95rem'
                        }}>
                          Test #{attempt.test}
                        </Typography>
                        <Chip
                          label={`${attempt.score}%`}
                          size="small"
                          sx={{
                            backgroundColor: attempt.score >= 70 ? '#ecfdf5' : '#fef3c7',
                            color: attempt.score >= 70 ? '#059669' : '#d97706',
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {new Date(attempt.submitted_at).toLocaleString('uz-UZ')}
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="#64748b">
                Hali faoliyat yo'q
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentProfileView;