import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  School as SchoolIcon,
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
      }}
      >
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Qabul qilingan darslar
        </Typography>
      </Box>

      {lessons.length === 0 ? (
        <div>
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Hozircha qo'shimcha darslar yo'q
            </Typography>
            <Typography variant="body2" color="textSecondary">
              O'qituvchingiz test natijalaringizga qarab qo'shimcha dars yuborishi mumkin
            </Typography>
          </Paper>
        </div>
      ) : (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Sizga {lessons.length} ta qo'shimcha dars yuborilgan. Har bir darsni o'rganib, bilimlaringizni mustahkamlang!
          </Alert>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dars mavzusi</TableCell>
                  <TableCell>Fan</TableCell>
                  <TableCell>Sana va vaqt</TableCell>
                  <TableCell>Hona</TableCell>
                  <TableCell>O'qituvchi</TableCell>
                  <TableCell>Yuborilgan sana</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell>
                      <Typography sx={{
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                      }}>
                        {lesson.topic}
                      </Typography>
                      {lesson.description && (
                        <Typography sx={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          mt: 0.5
                        }}>
                          {lesson.description.length > 50 ? lesson.description.substring(0, 50) + '...' : lesson.description}
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
                      <Typography sx={{
                        fontWeight: 500,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                      }}>
                        {lesson.teacherName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {formatDate(lesson.sentAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default ReceivedLessons;