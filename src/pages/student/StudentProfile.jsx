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
  Star as StarIcon,
  ShoppingCart as MarketIcon,
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
  const [placedGifts, setPlacedGifts] = useState([]);
  const [myGifts, setMyGifts] = useState([]);
  const [giftPlacementDialogOpen, setGiftPlacementDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [giftPositions, setGiftPositions] = useState([]);

  useEffect(() => {
    loadStudentStats();
    loadPlacedGifts();
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

  useEffect(() => {
    // Generate random positions for the placed gifts
    if (placedGifts.length > 0) {
      setGiftPositions(generateRandomPositions(placedGifts.length));
    }
  }, [placedGifts]);

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

  const loadPlacedGifts = async () => {
    if (!currentUser) return;

    try {
      const [placedResponse, myGiftsResponse] = await Promise.all([
        apiService.get('/student-gifts/placed_gifts/'),
        apiService.get('/student-gifts/my_gifts/')
      ]);
      const placedGifts = placedResponse.results || placedResponse;
      const myGifts = myGiftsResponse.results || myGiftsResponse;
      setPlacedGifts(placedGifts);
      setMyGifts(myGifts);
    } catch (error) {
      console.error('Error loading gifts:', error);
      setPlacedGifts([]);
      setMyGifts([]);
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

  const handleGiftPlacement = async (giftId, position) => {
    try {
      await apiService.post(`/student-gifts/${giftId}/place_gift/`, {
        position: position
      });
      await loadPlacedGifts(); // Reload placed gifts
    } catch (error) {
      console.error('Failed to place gift:', error);
      alert('Sovg\'ani joylashtirishda xatolik yuz berdi');
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

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<MarketIcon />}
            onClick={() => navigate('/student/pricing')}
            sx={{
              borderColor: '#f59e0b',
              color: '#f59e0b',
              fontSize: '1.1rem',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              '&:hover': {
                backgroundColor: '#fef3c7',
                borderColor: '#d97706',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Market
          </Button>

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

                {/* Floating Gifts around avatar */}
                {placedGifts.map((giftItem, index) => {
                  const position = giftPositions[index] || {
                    left: Math.random() * 100,
                    top: Math.random() * 100,
                    delay: Math.random() * 5,
                    duration: 20 + Math.random() * 15,
                    scale: 0.8 + Math.random() * 0.4,
                    rotation: Math.random() * 360
                  };

                  return (
                    <Box
                      key={`floating-gift-${giftItem.id}`}
                      sx={{
                        position: 'absolute',
                        fontSize: '3.5rem',
                        opacity: 0.9,
                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
                        left: `${position.left}%`,
                        top: `${position.top}%`,
                        transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
                        animation: `swimAllEmojis-${index % 20} ${position.duration}s infinite ease-in-out`,
                        animationDelay: `${position.delay}s`,
                        zIndex: 2,
                        pointerEvents: 'none'
                      }}
                    >
                      {giftItem.gift.image_url ? (
                        <img
                          src={giftItem.gift.image_url}
                          alt={giftItem.gift.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: '8px'
                          }}
                        />
                      ) : (
                        '🎁'
                      )}
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
                    Yulduzlar
                  </Typography>
                  {currentUser?.stars > 0 ? (
                    <Typography
                      sx={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: '#f59e0b',
                        lineHeight: 1.2
                      }}
                    >
                      {currentUser.stars}
                    </Typography>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate('/student/pricing')}
                      sx={{
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: '8px',
                        px: 2,
                        py: 0.5,
                        fontSize: '0.8rem',
                        '&:hover': {
                          backgroundColor: '#d97706',
                        }
                      }}
                    >
                      Sotib olish
                    </Button>
                  )}
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
                  <StarIcon sx={{ fontSize: '1.5rem', color: '#f59e0b' }} />
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

      {/* Gifts Section */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography sx={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          🎁 Sovg'alarim
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  mb: 3
                }}>
                  Sotib olingan sovg'alar
                </Typography>

                <Box sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  minHeight: '100px'
                }}>
                  {placedGifts.length > 0 ? (
                    placedGifts.map((giftItem) => (
                      <Box
                        key={giftItem.id}
                        sx={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          p: 2,
                          minWidth: '120px',
                          textAlign: 'center',
                          '&:hover': {
                            backgroundColor: '#f1f5f9',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Box sx={{
                          fontSize: '2rem',
                          mb: 1
                        }}>
                          {giftItem.gift.image_url ? (
                            <img
                              src={giftItem.gift.image_url}
                              alt={giftItem.gift.name}
                              style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                          ) : (
                            '🎁'
                          )}
                        </Box>
                        <Typography sx={{
                          fontWeight: 600,
                          color: '#1e293b',
                          fontSize: '0.9rem',
                          mb: 0.5
                        }}>
                          {giftItem.gift.name}
                        </Typography>
                        <Chip
                          label={`Joy ${giftItem.placement_position}`}
                          size="small"
                          sx={{
                            backgroundColor: '#fef3c7',
                            color: '#d97706',
                            fontSize: '0.7rem',
                            height: '20px'
                          }}
                        />
                      </Box>
                    ))
                  ) : (
                    <Typography sx={{ color: '#64748b', fontStyle: 'italic' }}>
                      Hali sovg'alar joylashtirilmagan. Marketdan sovg'a sotib oling va joylashtiring!
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  mb: 3
                }}>
                  Profil sovg'alari
                </Typography>

                <Typography sx={{
                  color: '#64748b',
                  fontSize: '0.9rem',
                  mb: 3
                }}>
                  Profilingizda ko'rsatish uchun 3 tagacha sovg'ani joylashtirishingiz mumkin.
                </Typography>

                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minHeight: '100px'
                }}>
                  {/* Position slots for gifts */}
                  {[1, 2, 3].map((position) => {
                    const placedGift = placedGifts.find(gift => gift.placement_position === position);
                    return (
                      <Box
                        key={position}
                        onClick={() => {
                          setSelectedPosition(position);
                          setGiftPlacementDialogOpen(true);
                        }}
                        sx={{
                          border: placedGift ? '2px solid #10b981' : '2px dashed #e2e8f0',
                          borderRadius: '8px',
                          p: 2,
                          textAlign: 'center',
                          backgroundColor: placedGift ? '#ecfdf5' : '#f8fafc',
                          minHeight: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: placedGift ? '#d1fae5' : '#f1f5f9',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        {placedGift ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ fontSize: '1.5rem' }}>
                              {placedGift.gift.image_url ? (
                                <img
                                  src={placedGift.gift.image_url}
                                  alt={placedGift.gift.name}
                                  style={{
                                    width: '30px',
                                    height: '30px',
                                    objectFit: 'cover',
                                    borderRadius: '4px'
                                  }}
                                />
                              ) : (
                                '🎁'
                              )}
                            </Box>
                            <Box sx={{ textAlign: 'left' }}>
                              <Typography sx={{
                                fontWeight: 600,
                                color: '#059669',
                                fontSize: '0.9rem'
                              }}>
                                {placedGift.gift.name}
                              </Typography>
                              <Typography sx={{
                                color: '#047857',
                                fontSize: '0.75rem'
                              }}>
                                Joy {position}
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                            Joy {position} - bo'sh
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

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

      {/* Gift Placement Dialog */}
      <Dialog
        open={giftPlacementDialogOpen}
        onClose={() => {
          setGiftPlacementDialogOpen(false);
          setSelectedPosition(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          color: '#1e293b',
          fontSize: '1.25rem',
          textAlign: 'center'
        }}>
          🎁 Joy {selectedPosition} uchun sovg'a tanlang
        </DialogTitle>
        <DialogContent>
          <Typography sx={{
            color: '#64748b',
            mb: 3,
            textAlign: 'center'
          }}>
            Bu joyga qaysi sovg'ani qo'ymoqchisiz?
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {myGifts.map((giftItem) => {
              const isPlaced = placedGifts.some(pg => pg.id === giftItem.id);
              const isInCurrentPosition = placedGifts.some(pg => pg.id === giftItem.id && pg.placement_position === selectedPosition);

              return (
                <Box
                  key={giftItem.id}
                  onClick={() => {
                    if (isInCurrentPosition) {
                      // Remove from this position
                      handleGiftPlacement(giftItem.id, null);
                    } else {
                      // Place in this position
                      handleGiftPlacement(giftItem.id, selectedPosition);
                    }
                    setGiftPlacementDialogOpen(false);
                    setSelectedPosition(null);
                  }}
                  sx={{
                    border: isInCurrentPosition ? '2px solid #10b981' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    p: 2,
                    cursor: isPlaced && !isInCurrentPosition ? 'not-allowed' : 'pointer',
                    backgroundColor: isInCurrentPosition ? '#ecfdf5' : '#ffffff',
                    opacity: isPlaced && !isInCurrentPosition ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isPlaced && !isInCurrentPosition ? '#ffffff' : (isInCurrentPosition ? '#d1fae5' : '#f8fafc'),
                      transform: isPlaced && !isInCurrentPosition ? 'none' : 'translateY(-1px)',
                      boxShadow: isPlaced && !isInCurrentPosition ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ fontSize: '2rem' }}>
                      {giftItem.gift.image_url ? (
                        <img
                          src={giftItem.gift.image_url}
                          alt={giftItem.gift.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        '🎁'
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '1rem'
                      }}>
                        {giftItem.gift.name}
                      </Typography>
                      {giftItem.gift.description && (
                        <Typography sx={{
                          color: '#64748b',
                          fontSize: '0.85rem'
                        }}>
                          {giftItem.gift.description}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      {isInCurrentPosition ? (
                        <Chip
                          label="Joylashtirilgan"
                          size="small"
                          sx={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      ) : isPlaced ? (
                        <Chip
                          label="Boshqa joyda"
                          size="small"
                          sx={{
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      ) : (
                        <Chip
                          label="Mavjud"
                          size="small"
                          sx={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}

            {myGifts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{
                  fontSize: '3rem',
                  mb: 2
                }}>
                  🎁
                </Typography>
                <Typography sx={{
                  color: '#64748b',
                  mb: 2
                }}>
                  Sizda hali sovg'alar yo'q
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setGiftPlacementDialogOpen(false);
                    setSelectedPosition(null);
                    navigate('/student/pricing');
                  }}
                  sx={{
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    '&:hover': { backgroundColor: '#d97706' }
                  }}
                >
                  Marketga o'tish
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => {
              setGiftPlacementDialogOpen(false);
              setSelectedPosition(null);
            }}
            sx={{
              color: '#374151',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Yopish
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default StudentProfile;