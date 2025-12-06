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
  Palette as PaletteIcon,
  EmojiEmotions as EmojiIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';
import EmojiPicker from '../../components/EmojiPicker';
import GradientPicker from '../../components/GradientPicker';

const StudentProfile = () => {
  const { currentUser, setCurrentUserData, logout } = useAuth();
  const navigate = useNavigate();
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

  // Emoji and Gradient picker states
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [gradientPickerOpen, setGradientPickerOpen] = useState(false);
  const [selectedEmojis, setSelectedEmojis] = useState([]);
  const [selectedGradient, setSelectedGradient] = useState(null);
  const [emojiPositions, setEmojiPositions] = useState([]);

  useEffect(() => {
    loadStudentStats();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setStatusText(currentUser.profile_status || '');
      const emojis = currentUser.selected_emojis || [];
      setSelectedEmojis(emojis);
      setSelectedGradient(currentUser.background_gradient || null);
      
      // Generate random positions for the emojis
      if (emojis.length > 0) {
        setEmojiPositions(generateRandomPositions(emojis.length));
      }
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
      const scores = attemptsList.map(attempt => attempt.score || 0);
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

  // Function to generate random positions for emojis
  const generateRandomPositions = (emojiCount) => {
    const positions = [];
    for (let i = 0; i < emojiCount; i++) {
      positions.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 15 + Math.random() * 10,
        scale: 0.7 + Math.random() * 0.6,
        rotation: Math.random() * 360
      });
    }
    return positions;
  };

  const handleEmojiSelect = async (emojis) => {
    if (!currentUser) return;
    
    try {
      setSelectedEmojis(emojis);
      // Generate new random positions for the selected emojis
      const positions = generateRandomPositions(emojis.length);
      setEmojiPositions(positions);
      
      const updatedUser = await apiService.patch(`/users/${currentUser.id}/`, {
        selected_emojis: emojis
      });
      setCurrentUserData(updatedUser);
    } catch (error) {
      console.error('Failed to update emojis:', error);
      alert('Emojilarni saqlashda xatolik yuz berdi');
    }
  };

  const handleGradientSelect = async (gradient) => {
    if (!currentUser) return;
    
    try {
      setSelectedGradient(gradient);
      const updatedUser = await apiService.patch(`/users/${currentUser.id}/`, {
        background_gradient: gradient
      });
      setCurrentUserData(updatedUser);
    } catch (error) {
      console.error('Failed to update gradient:', error);
      alert('Gradientni saqlashda xatolik yuz berdi');
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
      formData.append('selected_emojis', JSON.stringify(selectedEmojis));
      formData.append('background_gradient', JSON.stringify(selectedGradient));

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
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Mening ma'lumotlarim
        </Typography>

        {/* Edit Button for Premium Users */}
        {currentUser?.is_premium && (
          <Button
            variant="contained"
            size="large"
            startIcon={<EditIcon />}
            onClick={() => setEditDialogOpen(true)}
            sx={{
              backgroundColor: '#2563eb',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3)',
              '&:hover': {
                backgroundColor: '#1d4ed8',
                boxShadow: '0 8px 30px rgba(37, 99, 235, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Tahrirlash
          </Button>
        )}
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
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}
        >
          ✅ Profil muvaffaqiyatli saqlandi!
        </Alert>
      )}

      {/* Profile Card */}
      <Paper sx={{
        p: 0,
        mb: 4,
        background: currentUser?.is_premium && selectedGradient?.css
          ? selectedGradient.css
          : currentUser?.is_premium
            ? `
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)
            `
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '300px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
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
          minHeight: '300px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* CSS Animations for Swimming Emojis */}
          <style>{`
            ${Array.from({ length: 20 }).map((_, i) => `
              @keyframes swimAllEmojis-${i} {
                0% {
                  transform: translateX(${(i % 4 - 2) * 25}%) translateY(0%) rotate(${i * 18}deg) scale(${0.7 + (i % 3) * 0.1});
                }
                25% {
                  transform: translateX(${(i % 4 - 1) * 25}%) translateY(-20%) rotate(${i * 18 + 90}deg) scale(${0.7 + ((i + 1) % 3) * 0.1});
                }
                50% {
                  transform: translateX(${(i % 4) * 25}%) translateY(-40%) rotate(${i * 18 + 180}deg) scale(${0.7 + ((i + 2) % 3) * 0.1});
                }
                75% {
                  transform: translateX(${(i % 4 + 1) * 25}%) translateY(-20%) rotate(${i * 18 + 270}deg) scale(${0.7 + ((i + 1) % 3) * 0.1});
                }
                100% {
                  transform: translateX(${(i % 4 - 2) * 25}%) translateY(0%) rotate(${i * 18 + 360}deg) scale(${0.7 + (i % 3) * 0.1});
                }
              }
            `).join('')}
          `}</style>
          {/* Emoji Background for Premium Users */}
          {currentUser?.is_premium && selectedEmojis.length > 0 && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 1,
              overflow: 'hidden'
            }}>
              {/* Floating emoji animation container */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                animation: 'swimEmojis 25s infinite linear'
              }}>
                {/* Random positioned animated emojis */}
                {selectedEmojis.map((emoji, index) => {
                  const position = emojiPositions[index] || {
                    left: Math.random() * 100,
                    top: Math.random() * 100,
                    delay: Math.random() * 5,
                    duration: 15 + Math.random() * 10,
                    scale: 0.7 + Math.random() * 0.6,
                    rotation: Math.random() * 360
                  };

                  return (
                    <Box
                      key={`emoji-${index}`}
                      sx={{
                        position: 'absolute',
                        fontSize: '3rem',
                        opacity: 0.25 + (index % 3) * 0.05,
                        color: 'rgba(255, 255, 255, 0.9)',
                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                        left: `${position.left}%`,
                        top: `${position.top}%`,
                        transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
                        animation: `swimAllEmojis-${index % 20} ${position.duration}s infinite ease-in-out`,
                        animationDelay: `${position.delay}s`,
                        zIndex: 1
                      }}
                    >
                      {emoji}
                    </Box>
                  );
                })}

                {/* Additional floating emojis for density */}
                {Array.from({ length: Math.min(8, selectedEmojis.length * 2) }).map((_, index) => {
                  const originalIndex = index % selectedEmojis.length;
                  const position = {
                    left: Math.random() * 100,
                    top: Math.random() * 100,
                    delay: Math.random() * 8,
                    duration: 12 + Math.random() * 8,
                    scale: 0.5 + Math.random() * 0.5,
                    rotation: Math.random() * 360
                  };

                  return (
                    <Box
                      key={`extra-emoji-${index}`}
                      sx={{
                        position: 'absolute',
                        fontSize: '2.2rem',
                        opacity: 0.15 + (index % 2) * 0.03,
                        color: 'rgba(255, 255, 255, 0.7)',
                        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                        left: `${position.left}%`,
                        top: `${position.top}%`,
                        transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
                        animation: `swimAllEmojis-${(index + 10) % 20} ${position.duration}s infinite ease-in-out`,
                        animationDelay: `${position.delay}s`,
                        zIndex: 1
                      }}
                    >
                      {selectedEmojis[originalIndex]}
                    </Box>
                  );
                })}
              </Box>

              {/* Animated gradient overlay for depth */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%)',
                animation: 'shimmer 8s infinite',
                pointerEvents: 'none'
              }} />
            </Box>
          )}
          {/* Profile Photo */}
          <Box sx={{
            position: 'relative',
            mb: { xs: 3, md: 0 },
            mr: { xs: 0, md: 4 },
            zIndex: 3
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
            color: currentUser?.is_premium ? '#ffffff' : '#1e293b',
            position: 'relative',
            zIndex: 2
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

            </Box>



          </Box>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
                      lineHeight: 1.2,
                      mb: currentUser?.is_premium ? 0 : 2
                    }}
                  >
                    {currentUser?.is_premium ? 'Faol' : 'Yo\'q'}
                  </Typography>
                  {!currentUser?.is_premium && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate('/student/pricing')}
                      sx={{
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: '8px',
                        px: 2,
                        py: 0.5,
                        fontSize: '0.8rem',
                        '&:hover': {
                          backgroundColor: '#1d4ed8',
                        }
                      }}
                    >
                      Sotib olish
                    </Button>
                  )}
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
                    Premium vaqti
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: currentUser?.is_premium ? '#d97706' : '#64748b',
                      lineHeight: 1.2,
                      mb: currentUser?.is_premium ? 0 : 2
                    }}
                  >
                    {currentUser?.is_premium ? currentUser?.premium_info?.message || 'Faol' : 'Yo\'q'}
                  </Typography>
                  {currentUser?.is_premium && currentUser?.premium_plan && (
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        fontWeight: 500
                      }}
                    >
                      {currentUser.premium_plan === 'week' ? '1 Hafta' :
                       currentUser.premium_plan === 'month' ? '1 Oy' :
                       currentUser.premium_plan === 'year' ? '1 Yil' : 'Performance-based'}
                    </Typography>
                  )}
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
          <Alert
            severity="info"
            sx={{
              backgroundColor: '#eff6ff',
              border: '1px solid #3b82f6',
              color: '#1e40af',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Premium rejimga ega bo'lish uchun
            </Typography>
            <Typography>
              O'rtacha bahoyingiz 95% va undan yuqori bo'lsa, avtomatik ravishda premium rejim faollashadi va maxsus imkoniyatlarga ega bo'lasiz!
            </Typography>
          </Alert>
        </Grid>
      )}

      {/* Summary Card */}
      <Paper sx={{
        p: 4,
        mt: 4,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
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

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          color: '#1e293b',
          borderBottom: '1px solid #e2e8f0',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrophyIcon sx={{ color: '#d97706' }} />
            Premium profilni sozlash
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Gradient Selection - Prominent Button */}
            {currentUser?.is_premium && (
              <Box sx={{ mb: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PaletteIcon />}
                  onClick={() => setGradientPickerOpen(true)}
                  sx={{
                    background: selectedGradient?.css || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {selectedGradient?.name ? `🎨 ${selectedGradient.name}` : '🎨 Orqa fon gradientini tanlang'}
                </Button>
              </Box>
            )}

            {/* Profile Photo Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
                📸 Profil rasmi
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={profilePhoto ? URL.createObjectURL(profilePhoto) : currentUser?.profile_photo_url}
                  sx={{
                    width: 80,
                    height: 80,
                    border: '3px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
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
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: '#eff6ff',
                      borderColor: '#1d4ed8',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
                    },
                    transition: 'all 0.2s ease'
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
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
                💬 Status xabari
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
                    borderRadius: '8px',
                    '&:hover fieldset': {
                      borderColor: '#2563eb'
                    }
                  }
                }}
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Status xabari boshqa o'quvchilarga ko'rinadi
              </Typography>
            </Box>

            {/* Emoji Selection for Premium Users */}
            {currentUser?.is_premium && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
                  😊 Emojilar
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EmojiIcon />}
                  onClick={() => setEmojiPickerOpen(true)}
                  sx={{
                    borderColor: '#d97706',
                    color: '#d97706',
                    borderRadius: '8px',
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#fef3c7',
                      borderColor: '#d97706',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  {selectedEmojis.length > 0 ? `😊 ${selectedEmojis.length}/10 emoji tanlangan` : '😊 Emojilarni tanlash'}
                </Button>
                
                {/* Selected Emojis Preview */}
                {selectedEmojis.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#d97706', fontWeight: 600 }}>
                      Tanlangan emojilar:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedEmojis.map((emoji, index) => (
                        <Box
                          key={index}
                          sx={{
                            fontSize: '1.5rem',
                            lineHeight: 1,
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            p: 1,
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          {emoji}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
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

      {/* Emoji Picker Dialog */}
      <EmojiPicker
        open={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        selectedEmojis={selectedEmojis}
        onEmojiSelect={handleEmojiSelect}
        maxEmojis={10}
      />

      {/* Gradient Picker Dialog */}
      <GradientPicker
        open={gradientPickerOpen}
        onClose={() => setGradientPickerOpen(false)}
        selectedGradient={selectedGradient}
        onGradientSelect={handleGradientSelect}
      />

    </Box>
  );
};

export default StudentProfile;