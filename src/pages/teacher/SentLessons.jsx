import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Chip,
  Alert,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Done as DoneIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const SentLessons = () => {
  const { currentUser } = useAuth();
  const [sentLessons, setSentLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, lesson: null });

  useEffect(() => {
    loadSentLessons();
  }, [currentUser.id]);

  const loadSentLessons = () => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const teacherLessons = notifications.filter(n =>
        n.type === 'lesson_reminder' && n.teacherId === currentUser.id
      );
      setSentLessons(teacherLessons);
    } catch (error) {
      console.error('Error loading sent lessons:', error);
    } finally {
      setLoading(false);
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

  const markLessonCompleted = (lessonId) => {
    // Remove the notification from localStorage
    const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updatedNotifications = allNotifications.filter(n => n.id !== lessonId);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));

    // Update local state
    setSentLessons(prevLessons => prevLessons.filter(lesson => lesson.id !== lessonId));
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
          Yuborilgan darslar
        </Typography>
        <Typography sx={{ color: '#64748b', mt: 2 }}>Yuklanmoqda...</Typography>
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
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 2
        }}>
          Yuborilgan darslar
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          O'quvchilarga yuborilgan qo'shimcha darslar ro'yxati
        </Typography>
      </Box>

      {sentLessons.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Hozircha darsga chaqirish yuborilmagan
          </Typography>
          <Typography variant="body2" color="textSecondary">
            O'quvchilarga qo'shimcha dars yuborish uchun test natijalarini ko'ring
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Siz {sentLessons.length} ta darsga chaqirish yuborgansiz
          </Alert>

          <Grid container spacing={3}>
            {sentLessons.map((lesson) => (
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
                              {lesson.lessonTopic}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="textSecondary">
                                {lesson.studentName || 'O\'quvchi'}
                              </Typography>
                              <Chip
                                label={lesson.subject}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                              />
                            </Box>
                          </Box>

                          <Box sx={{ textAlign: 'right' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              {lesson.isRead ? (
                                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
                              ) : (
                                <UncheckedIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                              )}
                              <Typography variant="body2" color={lesson.isRead ? 'success.main' : 'warning.main'}>
                                {lesson.isRead ? 'Ko\'rilgan' : 'Ko\'rilmagan'}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                              {formatDate(lesson.createdAt)}
                            </Typography>
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

                          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6, color: '#212529' }}>
                            {lesson.lessonDescription}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Chip
                              label={`Qiyinlik: ${lesson.difficulty === 'easy' ? 'Oson' : lesson.difficulty === 'medium' ? 'O\'rtacha' : 'Qiyin'}`}
                              color={lesson.difficulty === 'easy' ? 'success' : lesson.difficulty === 'medium' ? 'warning' : 'error'}
                              size="small"
                            />
                            <Chip
                              label={`${lesson.estimatedTime} daqiqa`}
                              variant="outlined"
                              size="small"
                            />
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<DoneIcon />}
                              onClick={() => setConfirmDialog({ open: true, lesson })}
                              sx={{
                                cursor: 'pointer',
                                borderRadius: 2,
                                px: 3,
                                fontWeight: 600,
                                '&:hover': { backgroundColor: 'success.main' }
                              }}
                            >
                              Dars o'tildi
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

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, lesson: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Darsni tugagan deb belgilash
        </DialogTitle>
        <DialogContent>
          <Typography>
            "{confirmDialog.lesson?.lessonTopic}" mavzusidagi darsni tugagan deb belgilamoqchimisiz?
            Bu amal o'quvchi bildirishnomasini o'chiradi va ortga qaytarib bo'lmaydi.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false, lesson: null })}
            sx={{ fontWeight: 600 }}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={() => {
              if (confirmDialog.lesson) {
                markLessonCompleted(confirmDialog.lesson.id);
              }
              setConfirmDialog({ open: false, lesson: null });
            }}
            color="success"
            variant="contained"
            sx={{ fontWeight: 600 }}
          >
            Tasdiqlash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SentLessons;