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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
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
      width: '100%',
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
                  <TableCell>Dars mavzusi</TableCell>
                  <TableCell>O'quvchi</TableCell>
                  <TableCell>Fan</TableCell>
                  <TableCell>Sana va vaqt</TableCell>
                  <TableCell>Hona</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Harakatlar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sentLessons.map((lesson) => (
                  <TableRow
                    key={lesson.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                      },
                      '& td': {
                        borderBottom: '1px solid #f1f5f9',
                        padding: '16px',
                        fontSize: '0.875rem',
                        color: '#334155'
                      }
                    }}
                  >
                    <TableCell>
                      <Typography sx={{
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                      }}>
                        {lesson.lessonTopic}
                      </Typography>
                      {lesson.lessonDescription && (
                        <Typography sx={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          mt: 0.5
                        }}>
                          {lesson.lessonDescription.length > 50 ? lesson.lessonDescription.substring(0, 50) + '...' : lesson.lessonDescription}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{
                        fontWeight: 500,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                      }}>
                        {lesson.studentName || 'O\'quvchi'}
                      </Typography>
                      {lesson.studentClass && (
                        <Typography sx={{
                          fontSize: '0.75rem',
                          color: '#64748b'
                        }}>
                          {lesson.studentClass}-sinf
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={lesson.subject}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{
                        fontWeight: 500,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                      }}>
                        {lesson.lessonDate}
                      </Typography>
                      <Typography sx={{
                        fontSize: '0.75rem',
                        color: '#64748b'
                      }}>
                        {lesson.lessonTime}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{
                        fontWeight: 500,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                      }}>
                        {lesson.room}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {lesson.isRead ? (
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
                        ) : (
                          <UncheckedIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                        )}
                        <Typography variant="body2" color={lesson.isRead ? 'success.main' : 'warning.main'}>
                          {lesson.isRead ? 'Ko\'rilgan' : 'Ko\'rilmagan'}
                        </Typography>
                      </Box>
                      <Typography sx={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        mt: 0.5
                      }}>
                        {formatDate(lesson.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<DoneIcon />}
                        onClick={() => setConfirmDialog({ open: true, lesson })}
                        sx={{
                          fontSize: '0.75rem',
                          padding: '4px 8px',
                          minWidth: 'auto',
                          fontWeight: 600,
                          textTransform: 'none',
                          color: '#ffffff'
                        }}
                      >
                        Dars o'tildi
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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