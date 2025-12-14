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
import { shouldShowPremiumFeatures } from '../../utils/premiumVisibility';

const StudentProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [student, setStudent] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [emojiPositions, setEmojiPositions] = useState([]);
  const [placedGifts, setPlacedGifts] = useState([]);
  const [myGifts, setMyGifts] = useState([]);
  const [displayGift, setDisplayGift] = useState(null);

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

        // Generate random positions for the emojis if they exist
        const emojis = studentData.selected_emojis || [];
        if (emojis.length > 0) {
          setEmojiPositions(generateRandomPositions(emojis.length));
        }

      } catch (error) {
        console.error('Failed to load student profile:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadStudentProfile();
  }, [id, currentUser]);

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
        background: shouldShowPremiumFeatures(student, currentUser) && student.background_gradient
          ? (typeof student.background_gradient === 'string'
              ? JSON.parse(student.background_gradient).css
              : student.background_gradient.css)
          : shouldShowPremiumFeatures(student, currentUser)
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
      }}
      >
        {/* Premium Badge */}
        {shouldShowPremiumFeatures(student, currentUser) && (
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
          {shouldShowPremiumFeatures(student, currentUser) && student.selected_emojis && student.selected_emojis.length > 0 && (
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
                {student.selected_emojis.map((emoji, index) => {
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
                {Array.from({ length: Math.min(8, student.selected_emojis.length * 2) }).map((_, index) => {
                  const originalIndex = index % student.selected_emojis.length;
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
                      {student.selected_emojis[originalIndex]}
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
            {student.profile_photo ? (
              <Avatar
                src={student.profile_photo}
                sx={{
                  width: 150,
                  height: 150,
                  border: '4px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  backgroundColor: shouldShowPremiumFeatures(student, currentUser) ? '#ffffff' : '#2563eb'
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
                backgroundColor: shouldShowPremiumFeatures(student, currentUser) ? '#ffffff' : '#2563eb',
                color: shouldShowPremiumFeatures(student, currentUser) ? '#2563eb' : '#ffffff'
              }}>
                {student.name.charAt(0).toUpperCase()}
              </Avatar>
            )}

            {/* Premium Checkmark */}
            {shouldShowPremiumFeatures(student, currentUser) && (
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
            color: student.is_premium ? '#ffffff' : '#1e293b',
            position: 'relative',
            zIndex: 2
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
                      lineHeight: 1.2,
                      mb: student.is_premium ? 0 : 2
                    }}
                  >
                    {student.is_premium ? 'Faol' : 'Yo\'q'}
                  </Typography>
                  {!student.is_premium && (
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


    </Box>
  );
};

export default StudentProfileView;