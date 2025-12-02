import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Chip,
  InputAdornment,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Group as GroupIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const Classmates = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [classmates, setClassmates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadClassmates = async () => {
      try {
        setLoading(true);

        // Get all users and filter by same class_group
        const allUsers = await apiService.getUsers();
        const allStudents = allUsers.filter(user => user.role === 'student');

        // Filter students in the same class, excluding current user
        const sameClassStudents = allStudents.filter(student =>
          student.class_group === currentUser?.class_group &&
          student.id !== currentUser?.id
        );

        setClassmates(sameClassStudents);
      } catch (error) {
        console.error('Failed to load classmates:', error);
        setError('Sinfdoshlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.class_group) {
      loadClassmates();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleViewProfile = (studentId) => {
    navigate(`/student/student-profile/${studentId}`);
  };

  // Filter classmates based on search term
  const filteredClassmates = classmates.filter(classmate => {
    const classmateName = classmate.name || '';
    return classmateName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Gradient presets for background
  const GRADIENT_PRESETS = {
    default: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    sunset: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff4757 100%)',
    ocean: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    cherry: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    royal: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fire: 'linear-gradient(135deg, #ff6b35 0%, #ff4757 50%, #ff3838 100%)',
    ice: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #6c5ce7 100%)',
    sunrise: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    galaxy: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    mint: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };

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

  if (error) {
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
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!currentUser?.class_group) {
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
        <Typography>Sizning sinfingiz aniqlanmagan</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      py: 4,
      background: currentUser?.is_premium
        ? GRADIENT_PRESETS[currentUser.background_gradient?.id || 'default'] || GRADIENT_PRESETS.default
        : '#ffffff',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Floating Emojis Background */}
      {currentUser?.is_premium && currentUser?.selected_emojis && currentUser.selected_emojis.length > 0 && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {currentUser.selected_emojis.map((emoji, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                fontSize: `${Math.random() * 20 + 20}px`, // Random size between 20-40px
                opacity: 0.6,
                animation: `float${index % 3} ${Math.random() * 10 + 15}s linear infinite`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                '@keyframes float0': {
                  '0%': { transform: 'translateY(0px) rotate(0deg)' },
                  '33%': { transform: 'translateY(-20px) rotate(120deg)' },
                  '66%': { transform: 'translateY(10px) rotate(240deg)' },
                  '100%': { transform: 'translateY(0px) rotate(360deg)' }
                },
                '@keyframes float1': {
                  '0%': { transform: 'translateX(0px) translateY(0px) rotate(0deg)' },
                  '25%': { transform: 'translateX(30px) translateY(-15px) rotate(90deg)' },
                  '50%': { transform: 'translateX(-20px) translateY(25px) rotate(180deg)' },
                  '75%': { transform: 'translateX(40px) translateY(-10px) rotate(270deg)' },
                  '100%': { transform: 'translateX(0px) translateY(0px) rotate(360deg)' }
                },
                '@keyframes float2': {
                  '0%': { transform: 'translateX(0px) translateY(0px) scale(1) rotate(0deg)' },
                  '50%': { transform: 'translateX(50px) translateY(-30px) scale(1.2) rotate(180deg)' },
                  '100%': { transform: 'translateX(0px) translateY(0px) scale(1) rotate(360deg)' }
                }
              }}
            >
              {emoji}
            </Box>
          ))}
        </Box>
      )}

      {/* Header */}
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0',
        position: 'relative',
        zIndex: 2
      }}
     
      >
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 2
        }}>
          Sinfdoshlarim
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          {currentUser?.class_group} sinfidagi sinfdoshlaringizni toping va ularning profilini ko'ring
        </Typography>
      </Box>

      {/* Search section */}
      <Box sx={{ mb: 6, position: 'relative', zIndex: 2 }}>
        <Box>
          <Typography sx={{
            fontWeight: 600,
            color: '#374151',
            fontSize: '0.875rem',
            mb: 1
          }}>
            Sinfdosh ismi bo'yicha qidirish
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sinfdosh nomini kiriting..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2563eb'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2563eb'
                }
              }
            }}
          />
        </Box>
      </Box>

      {/* Classmates section */}
      <Box sx={{ mb: 6, position: 'relative', zIndex: 2 }}>
        <Typography sx={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 4
        }}>
          👥 {filteredClassmates.length} ta sinfdosh topildi
        </Typography>

        <div>
          <TableContainer component={Paper} sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{
                  backgroundColor: '#f8fafc',
                  '& th': {
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#1e293b',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '16px'
                  }
                }}>
                  <TableCell>Sinfdosh ismi</TableCell>
                  <TableCell>Yo'nalish</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Harakatlar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClassmates.map((classmate) => (
                  <TableRow key={classmate.id} sx={{
                    '&:hover': {
                      backgroundColor: '#f8fafc',
                    },
                    '& td': {
                      borderBottom: '1px solid #f1f5f9',
                      padding: '16px',
                      fontSize: '0.875rem',
                      color: '#334155'
                    }
                  }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {classmate.is_premium && classmate.profile_photo_url ? (
                          <Box
                            component="img"
                            src={classmate.profile_photo_url}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              border: '2px solid #2563eb',
                              objectFit: 'cover',
                              mr: 2
                            }}
                            alt={classmate.name}
                          />
                        ) : (
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: classmate.is_premium ? '#ffffff' : '#2563eb',
                            color: classmate.is_premium ? '#2563eb' : '#ffffff',
                            border: classmate.is_premium ? '2px solid #2563eb' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            mr: 2
                          }}>
                            {classmate.name.charAt(0).toUpperCase()}
                          </Box>
                        )}
                        <Box>
                          <Typography sx={{
                            fontWeight: 600,
                            color: '#1e293b',
                            fontSize: '0.875rem'
                          }}>
                            {classmate.name}
                          </Typography>
                          {classmate.is_premium && (
                            <Typography sx={{
                              fontSize: '0.75rem',
                              color: '#d97706',
                              fontWeight: 500
                            }}>
                              Premium o'quvchi
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{
                        color: '#64748b',
                        fontSize: '0.875rem'
                      }}>
                        {classmate.direction === 'natural' ? 'Tabiiy fanlar' : 'Aniq fanlar'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label="O'quvchi"
                          size="small"
                          sx={{
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            fontWeight: 600,
                            borderRadius: '6px',
                            fontSize: '0.75rem'
                          }}
                        />

                        {classmate.is_premium && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Premium"
                            size="small"
                            sx={{
                              backgroundColor: '#fef3c7',
                              color: '#d97706',
                              fontWeight: 600,
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          />
                        )}

                        {classmate.is_banned && (
                          <Chip
                            label="Bloklangan"
                            size="small"
                            sx={{
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              fontWeight: 600,
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleViewProfile(classmate.id)}
                        sx={{
                          fontSize: '0.75rem',
                          padding: '4px 8px',
                          minWidth: 'auto',
                          backgroundColor: '#2563eb',
                          '&:hover': {
                            backgroundColor: '#1d4ed8',
                          }
                        }}
                        startIcon={<PersonIcon />}
                      >
                        Ko'rish
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        
      </Box>

      {/* No results message */}
      {filteredClassmates.length === 0 && classmates.length > 0 && (
        <div>
          <Paper sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            p: 6,
            textAlign: 'center',
            position: 'relative',
            zIndex: 2
          }}>
            <Typography variant="h6" sx={{
              color: '#64748b',
              fontWeight: 600,
              mb: 2
            }}>
              Sizning qidiruvingizga mos sinfdosh topilmadi
            </Typography>
            <Typography sx={{ color: '#94a3b8' }}>
              Qidiruv so'zini o'zgartirib ko'ring
            </Typography>
          </Paper>
        
      )}

      {/* No classmates message */}
      {classmates.length === 0 && (
        <div>
          <Paper sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            p: 6,
            textAlign: 'center',
            position: 'relative',
            zIndex: 2
          }}>
            <GroupIcon sx={{ fontSize: '4rem', color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" sx={{
              color: '#64748b',
              fontWeight: 600,
              mb: 2
            }}>
              Sinfdoshlar topilmadi
            </Typography>
            <Typography sx={{ color: '#94a3b8' }}>
              Sizning sinfingizda boshqa o'quvchilar yo'q
            </Typography>
          </Paper>
        
      )}
    </Box>
  );
};

export default Classmates;