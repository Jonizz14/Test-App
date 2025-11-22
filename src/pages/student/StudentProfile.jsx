import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const StudentProfile = () => {
  const { currentUser } = useAuth();
  const [testCount, setTestCount] = useState(0);
  const [curatorTeacher, setCuratorTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentStats();
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
      </Box>

      <Grid container spacing={4}>
        {/* Name and Basic Info */}
        <Grid item xs={12} md={6}>
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
                Shaxsiy ma'lumotlar
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="#64748b" gutterBottom>
                  Ism va Familiya
                </Typography>
                <Typography variant="h6" sx={{ 
                  fontFamily: 'inherit', 
                  fontWeight: 600,
                  color: '#1e293b'
                }}>
                  {currentUser?.first_name && currentUser?.last_name 
                    ? `${currentUser.first_name} ${currentUser.last_name}`
                    : currentUser?.name || 'Noma\'lum'
                  }
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="#64748b" gutterBottom>
                  ID raqami
                </Typography>
                <Typography sx={{ 
                  fontFamily: 'monospace', 
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  backgroundColor: '#f1f5f9',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  color: '#475569',
                  display: 'inline-block'
                }}>
                  {currentUser?.display_id || currentUser?.username || currentUser?.id}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="#64748b" gutterBottom>
                  Email
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155' }}>
                  {currentUser?.email || 'Noma\'lum'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Information */}
        <Grid item xs={12} md={6}>
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
                Akademik ma'lumotlar
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="#64748b" gutterBottom>
                  Yo'nalish
                </Typography>
                <Chip
                  label={getDirectionLabel(currentUser?.direction)}
                  sx={{ 
                    fontSize: '0.875rem', 
                    py: 1,
                    fontWeight: 600,
                    backgroundColor: currentUser?.direction === 'natural' ? '#ecfdf5' : '#eff6ff',
                    color: getDirectionColor(currentUser?.direction),
                    borderRadius: '6px'
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="#64748b" gutterBottom>
                  Sinf guruhi
                </Typography>
                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
                  {currentUser?.class_group || 'Noma\'lum'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="#64748b" gutterBottom>
                  Ro'yxatdan o'tgan sana
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155' }}>
                  {currentUser?.date_joined 
                    ? new Date(currentUser.date_joined).toLocaleDateString('uz-UZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Noma\'lum'
                  }
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Curator Teacher */}
        {curatorTeacher && (
          <Grid item xs={12} md={6}>
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
                  Kurator o'qituvchi
                </Typography>

                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  color: '#1e293b',
                  mb: 1
                }}>
                  {curatorTeacher.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {curatorTeacher.curator_class} sinf kuratori
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Test Statistics */}
        <Grid item xs={12} md={6}>
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
                Test statistikasi
              </Typography>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ 
                  fontWeight: 700, 
                  color: '#2563eb',
                  mb: 1,
                  fontSize: '3rem'
                }}>
                  {loading ? '...' : testCount}
                </Typography>
                <Typography variant="body1" color="#64748b">
                  ta test ishlangan
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Summary Card */}
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
    </Box>
  );
};

export default StudentProfile;