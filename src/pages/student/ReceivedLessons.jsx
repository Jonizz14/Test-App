import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const ReceivedLessons = () => {
  const { currentUser } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, [currentUser.id]);

  const loadLessons = () => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const lessonNotifications = notifications.filter(n =>
        n.studentId === currentUser.id && n.type === 'lesson_reminder'
      );
      // Map notifications to lesson format
      const studentLessons = lessonNotifications.map(notification => ({
        id: notification.id,
        topic: notification.lessonTopic,
        subject: notification.subject,
        description: notification.lessonDescription,
        room: notification.room,
        lessonDate: notification.lessonDate,
        lessonTime: notification.lessonTime,
        teacherName: notification.teacherName,
        sentAt: notification.createdAt,
        difficulty: notification.difficulty || 'medium',
        estimatedTime: notification.estimatedTime || 60,
        resources: null,
      }));
      setLessons(studentLessons);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Oson';
      case 'medium': return 'O\'rtacha';
      case 'hard': return 'Qiyin';
      default: return difficulty;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ 
        pl: { xs: 0, md: 35 }, 
        pr: 4,
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Qabul qilingan darslar
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
          Qabul qilingan darslar
        </Typography>
      </Box>

      {lessons.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Hozircha qo'shimcha darslar yo'q
          </Typography>
          <Typography variant="body2" color="textSecondary">
            O'qituvchingiz test natijalaringizga qarab qo'shimcha dars yuborishi mumkin
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Sizga {lessons.length} ta qo'shimcha dars yuborilgan. Har bir darsni o'rganib, bilimlaringizni mustahkamlang!
          </Alert>

          <Grid container spacing={3}>
            {lessons.map((lesson) => (
              <Grid item xs={12} key={lesson.id}>
                <Card sx={{
                  border: '1px solid #e9ecef',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'none',
                }}>
                  <CardContent sx={{ p: 0 }}>
                    <Accordion sx={{
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      borderRadius: 2,
                    }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          px: 3,
                          py: 2,
                          '&:hover': { backgroundColor: 'transparent' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                          <SchoolIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />

                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#212529' }}>
                              {lesson.topic}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={lesson.subject}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                              />
                              <Chip
                                label={getDifficultyLabel(lesson.difficulty)}
                                color={getDifficultyColor(lesson.difficulty)}
                                size="small"
                                sx={{ fontWeight: 500 }}
                              />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="textSecondary">
                                  {lesson.estimatedTime} daqiqa
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="textSecondary">
                              {formatDate(lesson.sentAt)}
                            </Typography>
                            <Chip
                              label="Yangi"
                              color="primary"
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                      </AccordionSummary>

                      <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                        <Box sx={{ borderTop: '1px solid #e9ecef', pt: 2 }}>
                          <Typography variant="h6" gutterBottom sx={{ color: '#495057', fontWeight: 600 }}>
                            Dars tafsilotlari
                          </Typography>

                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TimeIcon sx={{ color: 'primary.main' }} />
                                <Box>
                                  <Typography variant="body2" color="textSecondary">
                                    Sana va vaqt
                                  </Typography>
                                  <Typography variant="body1" fontWeight="500">
                                    {lesson.lessonDate} • {lesson.lessonTime}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SchoolIcon sx={{ color: 'primary.main' }} />
                                <Box>
                                  <Typography variant="body2" color="textSecondary">
                                    Hona
                                  </Typography>
                                  <Typography variant="body1" fontWeight="500">
                                    {lesson.room}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>

                          <Typography variant="h6" gutterBottom sx={{ color: '#495057', fontWeight: 600 }}>
                            Dars mazmuni
                          </Typography>

                          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6, color: '#212529' }}>
                            {lesson.description}
                          </Typography>

                          {lesson.resources && (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#495057' }}>
                                Qo'shimcha resurslar:
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#6c757d', fontStyle: 'italic' }}>
                                {lesson.resources}
                              </Typography>
                            </Box>
                          )}

                          <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              <strong>O'qituvchi:</strong> {lesson.teacherName}
                            </Typography>
                          </Alert>

                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                              variant="outlined"
                              sx={{
                                cursor: 'pointer',
                                borderRadius: 2,
                                px: 3,
                                fontWeight: 600,
                                borderColor: '#d1d5db',
                                color: '#374151',
                                '&:hover': { backgroundColor: 'transparent' }
                              }}
                            >
                              Savol berish
                            </Button>
                          </Box>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ReceivedLessons;