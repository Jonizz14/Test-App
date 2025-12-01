import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Avatar,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import apiService from '../../data/apiService';

const TeacherDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeacherDetails = async () => {
      try {
        // Get all users to find the teacher
        const users = await apiService.getUsers();
        const teacherData = users.find(user => user.id === parseInt(id));
        setTeacher(teacherData);

        // Get tests created by this teacher
        const allTests = await apiService.getTests();
        const teacherTests = allTests.filter(test => test.teacher === parseInt(id));
        setTests(teacherTests);
      } catch (error) {
        console.error('Failed to load teacher details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherDetails();
  }, [id]);

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

  if (!teacher) {
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
        <Typography>O'qituvchi topilmadi</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/teachers')}
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
      data-aos="fade-down"
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/teachers')}
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
          {teacher.name} - Batafsil ma'lumotlar
        </Typography>
      </Box>

      {/* Teacher Info Card */}
      <Paper sx={{
        p: 4,
        mb: 4,
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px'
      }}
      data-aos="fade-up"
      data-aos-delay="200"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Avatar sx={{
            width: 80,
            height: 80,
            bgcolor: '#2563eb',
            fontSize: '2rem',
            fontWeight: 700
          }}>
            {teacher.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              {teacher.name}
            </Typography>
            <Typography sx={{ color: '#64748b', mb: 1 }}>
              ID: {teacher.id}
            </Typography>
            <Chip
              label="O'qituvchi"
              sx={{
                backgroundColor: '#ecfdf5',
                color: '#059669',
                fontWeight: 600
              }}
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              p: 3
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
                Oxirgi kirish
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '1rem' }}>
                {teacher.last_login ? new Date(teacher.last_login).toLocaleString('uz-UZ') : 'Ma\'lumot yo\'q'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              p: 3
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
                Ro'yxatdan o'tgan sana
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '1rem' }}>
                {teacher.registration_date ? new Date(teacher.registration_date).toLocaleString('uz-UZ') : 'Ma\'lumot yo\'q'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tests Section */}
      <Paper sx={{
        p: 4,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px'
      }}
      data-aos="fade-up"
      data-aos-delay="400"
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#1e293b' }}>
          Yaratilgan testlar ({tests.length})
        </Typography>

        {tests.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            py: 6,
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <AssessmentIcon sx={{ fontSize: '3rem', color: '#cbd5e1', mb: 2 }} />
            <Typography sx={{ color: '#64748b', fontSize: '1.1rem' }}>
              Hali testlar yaratilmagan
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {tests.map((test, index) => (
              <Grid item xs={12} md={6} key={test.id} data-aos="zoom-in" data-aos-delay={index * 100}>
                <Card sx={{
                  height: '100%',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    borderColor: '#2563eb'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                      {test.title}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip
                        label={test.subject}
                        size="small"
                        sx={{
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          fontWeight: 500
                        }}
                      />
                      <Chip
                        label={`${test.total_questions} savol`}
                        size="small"
                        sx={{
                          backgroundColor: '#f0fdf4',
                          color: '#166534',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                    <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mb: 1 }}>
                      Vaqt: {test.time_limit} daqiqa
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mb: 1 }}>
                      Urinishlar: {test.attempt_count || 0}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                      O'rtacha ball: {(test.average_score || 0).toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default TeacherDetails;