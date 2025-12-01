import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Button,
  TextField,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  PhotoCamera as PhotoIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as TrophyIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const StudentProfile = () => {
  const { currentUser, setCurrentUserData } = useAuth();
  const [testCount, setTestCount] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [highestScore, setHighestScore] = useState(0);
  const [curatorTeacher, setCuratorTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadStudentStats();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setStatusText(currentUser.profile_status || '');
    }
  }, [currentUser]);

  const loadStudentStats = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const [attempts, users] = await Promise.all([
        apiService.getAttempts({ student: currentUser.id }),
        apiService.getUsers()
      ]);
      const attemptsList = attempts.results || attempts;
      setTestCount(attemptsList.length);

      // Calculate average and highest scores
      const scores = attemptsList.map(attempt => attempt.score || 0).filter(score => score > 0);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
      const highScore = scores.length > 0
        ? Math.round(Math.max(...scores))
        : 0;

      setAverageScore(avgScore);
      setHighestScore(highScore);

      // Find curator teacher
      const teachers = users.filter(user => user.role === 'teacher');
      const curator = teachers.find(t => t.is_curator && t.curator_class === currentUser.class_group);
      setCuratorTeacher(curator);
    } catch (error) {
      console.error('Error loading student stats:', error);
      setTestCount(0);
      setCuratorTeacher(null);
    } finally {
      setLoading(false);
    }
  };

  const getDirectionLabel = (direction) => {
    if (direction === 'natural') return 'Tabiiy fanlar';
    if (direction === 'exact') return 'Aniq fanlar';
    return 'Yo\'nalish kiritilmagan';
  };

  const getDirectionColor = (direction) => {
    if (direction === 'natural') return '#059669';
    if (direction === 'exact') return '#2563eb';
    return '#64748b';
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if it's a GIF or image
      if (file.type.startsWith('image/')) {
        setProfilePhoto(file);
      } else {
        alert('Faqat rasm fayllarini yuklash mumkin!');
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const formData = new FormData();

      if (profilePhoto) {
        formData.append('profile_photo', profilePhoto);
      }

      formData.append('profile_status', statusText);

      const updatedUser = await apiService.patch(`/users/${currentUser.id}/`, formData, true);
      setCurrentUserData(updatedUser);
      setEditDialogOpen(false);
      setProfilePhoto(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3 seconds
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Profilni saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

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
          Mening ma'lumotlarim
        </Typography>
      </Box>

      {/* Success Message */}
      {saveSuccess && (
        <Alert
          severity="success"
          sx={{
            mb: 4,
            backgroundColor: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#059669',
            borderRadius: '12px'
          }}
          data-aos="fade-down"
        >
          ✅ Profil muvaffaqiyatli saqlandi!
        </Alert>
      )}

      {/* Profile Card */}
      <Paper sx={{
        p: 0,
        mb: 4,
        background: currentUser?.is_premium
          ? `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)
          `
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
        {currentUser?.is_premium && (
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
            {currentUser?.profile_photo_url ? (
              <Avatar
                src={currentUser.profile_photo_url}
                sx={{
                  width: 150,
                  height: 150,
                  border: '4px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  backgroundColor: currentUser?.is_premium ? '#ffffff' : '#2563eb'
                }}
                imgProps={{
                  style: { objectFit: 'cover' }
                }}
              >
                {currentUser?.name.charAt(0).toUpperCase()}
              </Avatar>
            ) : (
              <Avatar sx={{
                width: 150,
                height: 150,
                fontSize: '4rem',
                fontWeight: 'bold',
                border: '4px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                backgroundColor: currentUser?.is_premium ? '#ffffff' : '#2563eb',
                color: currentUser?.is_premium ? '#2563eb' : '#ffffff'
              }}>
                {currentUser?.name.charAt(0).toUpperCase()}
              </Avatar>
            )}

            {/* Premium Checkmark */}
            {currentUser?.is_premium && (
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
            color: currentUser?.is_premium ? '#ffffff' : '#1e293b'
          }}>
            <Typography variant="h3" sx={{
              fontWeight: 700,
              mb: 2,
              textShadow: currentUser?.is_premium ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
            }}>
              {currentUser?.name}
            </Typography>

            {currentUser?.profile_status && (
              <Typography variant="h6" sx={{
                mb: 3,
                fontStyle: 'italic',
                opacity: 0.9,
                textShadow: currentUser?.is_premium ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
              }}>
                "{currentUser.profile_status}"
              </Typography>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Chip
                label="O'quvchi"
                sx={{
                  backgroundColor: currentUser?.is_premium ? 'rgba(255, 255, 255, 0.2)' : '#ecfdf5',
                  color: currentUser?.is_premium ? '#ffffff' : '#059669',
                  border: currentUser?.is_premium ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontWeight: 600
                }}
              />
              <Chip
                label={`${currentUser?.class_group || 'Noma\'lum'} sinf`}
                sx={{
                  backgroundColor: currentUser?.is_premium ? 'rgba(255, 255, 255, 0.2)' : '#eff6ff',
                  color: currentUser?.is_premium ? '#ffffff' : '#2563eb',
                  border: currentUser?.is_premium ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontWeight: 600
                }}
              />
              <Chip
                label={currentUser?.direction === 'natural' ? 'Tabiiy fanlar' : currentUser?.direction === 'exact' ? 'Aniq fanlar' : 'Yo\'nalish yo\'q'}
                sx={{
                  backgroundColor: currentUser?.is_premium ? 'rgba(255, 255, 255, 0.2)' : '#f3f4f6',
                  color: currentUser?.is_premium ? '#ffffff' : '#374151',
                  border: currentUser?.is_premium ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontWeight: 600
                }}
              />
              {currentUser?.is_premium && (
                <Chip
                  label={`${currentUser.premium_emoji_count || 0} ta premium emoji`}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: 600
                  }}
                />
              )}
              {currentUser?.is_premium && (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setEditDialogOpen(true)}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    }
                  }}
                >
                  Tahrirlash
                </Button>
              )}
            </Box>

            {/* Emoji Placement Area for Premium Users */}
            {currentUser?.is_premium && (
              <Box sx={{
                mt: 3,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                justifyContent: { xs: 'center', md: 'flex-start' }
              }}>
                {/* Sample emoji placements - in real app this would be dynamic */}
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '2px dashed rgba(255, 255, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'scale(1.05)'
                  }
                }}>
                  🎓
                </Box>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '2px dashed rgba(255, 255, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'scale(1.05)'
                  }
                }}>
                  ⭐
                </Box>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '2px dashed rgba(255, 255, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'scale(1.05)'
                  }
                }}>
                  🏆
                </Box>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '2px dashed rgba(255, 255, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'scale(1.05)'
                  }
                }}>
                  🎯
                </Box>
              </Box>
            )}
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
                    {loading ? '...' : testCount}
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
                    {loading ? '...' : `${averageScore}%`}
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
                    {loading ? '...' : `${highestScore}%`}
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
                      color: currentUser?.is_premium ? '#d97706' : '#64748b',
                      lineHeight: 1.2
                    }}
                  >
                    {currentUser?.is_premium ? 'Faol' : 'Yo\'q'}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: currentUser?.is_premium ? '#fef3c7' : '#f3f4f6',
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
                    color: currentUser?.is_premium ? '#d97706' : '#6b7280'
                  }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      {/* Premium Status Info */}
      {!currentUser?.is_premium && (
        <Grid item xs={12}>
          <div data-aos="fade-up" data-aos-delay="300">
            <Alert
              severity="info"
              sx={{
                backgroundColor: '#eff6ff',
                border: '1px solid #3b82f6',
                color: '#1e40af',
                borderRadius: '12px'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Premium rejimga ega bo'lish uchun
              </Typography>
              <Typography>
                O'rtacha bahoyingiz 95% va undan yuqori bo'lsa, avtomatik ravishda premium rejim faollashadi va maxsus imkoniyatlarga ega bo'lasiz!
              </Typography>
            </Alert>
          </div>
        </Grid>
      )}

      {/* Summary Card */}
      <div data-aos="fade-up" data-aos-delay="500">
        <Paper sx={{
          p: 4,
          mt: 4,
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
        <Typography variant="h6" gutterBottom sx={{ 
          fontWeight: 600, 
          color: '#1e293b',
          fontSize: '1.125rem',
          mb: 2 
        }}>
          📊 Hisobot
        </Typography>
        <Typography variant="body1" sx={{ 
          color: '#334155', 
          lineHeight: 1.6,
          fontSize: '0.875rem'
        }}>
          Siz {testCount} ta test ishlagansiz va "{getDirectionLabel(currentUser?.direction)}" yo'nalishida 
          o'qimoqdasiz. Ro'yxatdan o'tgan sana: {currentUser?.date_joined 
            ? new Date(currentUser.date_joined).toLocaleDateString('uz-UZ')
            : 'noma\'lum'
          }.
        </Typography>
      </Paper>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#1e293b' }}>
          Premium profilni tahrirlash
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Profile Photo Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
                Profil rasmi
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={profilePhoto ? URL.createObjectURL(profilePhoto) : currentUser?.profile_photo_url}
                  sx={{
                    width: 80,
                    height: 80,
                    border: '2px solid #e2e8f0'
                  }}
                  imgProps={{
                    style: { objectFit: 'cover' }
                  }}
                >
                  {currentUser?.name.charAt(0).toUpperCase()}
                </Avatar>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoIcon />}
                  sx={{
                    borderColor: '#2563eb',
                    color: '#2563eb',
                    '&:hover': {
                      backgroundColor: '#eff6ff',
                      borderColor: '#1d4ed8'
                    }
                  }}
                >
                  Rasm tanlash
                  <input
                    type="file"
                    accept="image/*,.gif"
                    hidden
                    onChange={handlePhotoChange}
                  />
                </Button>
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                GIF va rasm fayllarini yuklash mumkin (animatsion GIFlar ham qo'llab-quvvatlanadi)
              </Typography>
            </Box>

            {/* Status Message */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
                Status xabari
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Sizning status xabaringiz..."
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Status xabari boshqa o'quvchilarga ko'rinadi
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{ color: '#64748b' }}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={saving}
            sx={{
              backgroundColor: '#2563eb',
              '&:hover': {
                backgroundColor: '#1d4ed8'
              }
            }}
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentProfile;