import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  School as SchoolIcon,
} from '@mui/icons-material';

const SendLessonModal = ({ open, onClose, student, testResult, teacherInfo }) => {
  const subjects = [
    'Matematika',
    'Algebra',
    'Geometriya',
    'SI',
    'Robototexnika',
    'Fizika',
    'Kimyo',
    'Biologiya',
    'Tarix',
    'Geografiya',
    'O\'zbek tili',
    'Ingliz tili',
    'Adabiyot',
    'Informatika',
  ];

  const [formData, setFormData] = useState({
    subject: testResult?.test?.subject || '',
    room: '',
    lessonDate: '',
    lessonTime: '',
    topic: '',
    description: '',
    difficulty: 'medium',
    estimatedTime: 60,
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSend = async () => {
    if (!formData.room || !formData.lessonDate || !formData.lessonTime || !formData.topic || !formData.description) {
      return;
    }

    setSending(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create notification for student
      const notification = {
        id: `lesson-${Date.now()}`,
        studentId: student.id,
        teacherId: teacherInfo?.id || 'current-teacher-id',
        teacherName: teacherInfo?.fullName || teacherInfo?.name || 'O\'qituvchi',
        type: 'lesson_reminder',
        title: 'Qo\'shimcha dars belgilandi',
        message: `${teacherInfo?.fullName || teacherInfo?.name || 'O\'qituvchi'} sizni ${formData.lessonDate} kuni ${formData.lessonTime}da "${formData.topic}" mavzusida qo\'shimcha darsga taklif qiladi.\n\nFan: ${formData.subject}\nQiyinlik: ${formData.difficulty === 'easy' ? 'Oson' : formData.difficulty === 'medium' ? 'O\'rtacha' : 'Qiyin'}\nDavomiyligi: ${formData.estimatedTime} daqiqa\nHona: ${formData.room}\nTafsilot: ${formData.description}`,
        testId: testResult?.id,
        testTitle: testResult?.test?.title,
        subject: formData.subject,
        room: formData.room,
        lessonDate: formData.lessonDate,
        lessonTime: formData.lessonTime,
        lessonTopic: formData.topic,
        lessonDescription: formData.description,
        difficulty: formData.difficulty,
        estimatedTime: formData.estimatedTime,
        createdAt: new Date().toISOString(),
        isRead: false
      };

      // Save notification to database
      const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      existingNotifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(existingNotifications));

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        // Reset form
        setFormData({
          subject: testResult?.test?.subject || '',
          room: '',
          lessonDate: '',
          lessonTime: '',
          topic: '',
          description: '',
          difficulty: 'medium',
          estimatedTime: 60,
        });
      }, 2000);

    } catch (error) {
      console.error('Error sending lesson:', error);
    } finally {
      setSending(false);
    }
  };

  const difficultyColors = {
    easy: 'success',
    medium: 'warning',
    hard: 'error'
  };

  const difficultyLabels = {
    easy: 'Oson',
    medium: 'O\'rtacha',
    hard: 'Qiyin'
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          minHeight: '600px',
        }
      }}
    >
      <DialogTitle sx={{
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e9ecef',
        pb: 2
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <SchoolIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#212529' }}>
              Qo'shimcha dars yuborish
            </Typography>
            <Typography variant="body2" sx={{ color: '#6c757d', mt: 0.5 }}>
              {student?.fullName || student?.name} uchun individual dars
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Dars muvaffaqiyatli yuborildi! Talaba bildirishnoma oladi.
          </Alert>
        )}

        {testResult && (
          <Box sx={{
            backgroundColor: '#f8f9fa',
            p: 2,
            borderRadius: 2,
            mb: 3,
            border: '1px solid #e9ecef'
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#495057', mb: 1 }}>
              Test natijasi asosida:
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <Chip
                label={`${testResult.score}%`}
                color={testResult.score >= 70 ? 'success' : 'warning'}
                size="small"
              />
              <Typography variant="body2" color="textSecondary">
                {testResult.test?.title}
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, alignItems: 'start' }}>
          <FormControl fullWidth required>
            <InputLabel>Fan</InputLabel>
            <Select
              name="subject"
              value={formData.subject}
              label="Fan"
              onChange={handleChange}
              sx={{
                borderRadius: 2,
                backgroundColor: '#fafafa',
                minHeight: '56px',
              }}
            >
              {subjects.map(subject => (
                <MenuItem key={subject} value={subject}>{subject}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Hona"
            name="room"
            value={formData.room}
            onChange={handleChange}
            fullWidth
            required
            placeholder="Masalan: 101, V-5"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#fafafa',
                minHeight: '56px',
              }
            }}
          />

          <TextField
            label="Dars sanasi"
            name="lessonDate"
            type="date"
            value={formData.lessonDate}
            onChange={handleChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#fafafa',
                minHeight: '56px',
              }
            }}
          />

          <TextField
            label="Dars vaqti"
            name="lessonTime"
            type="time"
            value={formData.lessonTime}
            onChange={handleChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#fafafa',
                minHeight: '56px',
              }
            }}
          />

          <FormControl fullWidth required>
            <InputLabel>Qiyinlik darajasi</InputLabel>
            <Select
              name="difficulty"
              value={formData.difficulty}
              label="Qiyinlik darajasi"
              onChange={handleChange}
              sx={{
                borderRadius: 2,
                backgroundColor: '#fafafa',
                minHeight: '56px',
              }}
            >
              <MenuItem value="easy">Oson</MenuItem>
              <MenuItem value="medium">O'rtacha</MenuItem>
              <MenuItem value="hard">Qiyin</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Dars davomiyligi (daqiqa)"
            name="estimatedTime"
            type="number"
            value={formData.estimatedTime}
            onChange={handleChange}
            fullWidth
            required
            placeholder="Masalan: 60"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#fafafa',
                minHeight: '56px',
              }
            }}
          />

          <TextField
            label="Mavzu"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            fullWidth
            required
            placeholder="Masalan: Algebra asoslari, Newton qonunlari"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#fafafa',
                minHeight: '56px',
              },
              gridColumn: '1 / -1'
            }}
          />

          <TextField
            label="Tafsilot"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            required
            multiline
            rows={4}
            placeholder="Darsning mazmuni, o'rganiladigan tushunchalar, amaliy mashqlar haqida batafsil yozing..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#fafafa',
              },
              gridColumn: '1 / -1'
            }}
          />
        </Box>

        <Box sx={{
          mt: 3,
          p: 2,
          backgroundColor: '#e3f2fd',
          borderRadius: 2,
          border: '1px solid #bbdefb'
        }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1976d2' }}>
            💡 Maslahat: Darsni talabaning test natijalariga qarab, uning zaif tomonlariga e'tibor qaratib tuzing.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{
        p: 3,
        pt: 2,
        borderTop: '1px solid #e9ecef',
        backgroundColor: '#f8f9fa'
      }}>
        <Button
          onClick={onClose}
          sx={{
            cursor: 'pointer',
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 600,
            borderColor: '#d1d5db',
            color: '#374151',
            '&:hover': { backgroundColor: 'transparent' }
          }}
          variant="outlined"
        >
          Bekor qilish
        </Button>
        <Button
          onClick={handleSend}
          disabled={sending || !formData.room || !formData.lessonDate || !formData.lessonTime || !formData.topic || !formData.description}
          sx={{
            cursor: sending ? 'not-allowed' : 'pointer',
            borderRadius: 2,
            px: 4,
            py: 1,
            fontWeight: 600,
            backgroundColor: 'primary.main',
            '&:hover': { backgroundColor: 'primary.main' },
            '&:disabled': {
              backgroundColor: '#9ca3af',
              cursor: 'not-allowed'
            }
          }}
          variant="contained"
          startIcon={<SendIcon />}
        >
          {sending ? 'Yuborilmoqda...' : 'Darsni yuborish'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendLessonModal;