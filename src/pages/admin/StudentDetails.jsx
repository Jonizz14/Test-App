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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  PlayArrow as PlayArrowIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
} from '@mui/icons-material';
import apiService from '../../data/apiService';

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentDetails = async () => {
      try {
        const users = await apiService.getUsers();
        const studentData = users.find(user => user.id === parseInt(id));
        setStudent(studentData);

        const allAttempts = await apiService.getAttempts({ student: id });
        setAttempts(allAttempts);
      } catch (error) {
        console.error('Failed to load student details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudentDetails();
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

  if (!student) {
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
        <Typography>O'quvchi topilmadi</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/students')}
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
      }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/students')}
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
          {student.name} - Batafsil ma'lumotlar
        </Typography>
      </Box>

      <Paper sx={{
        p: 4,
        mb: 4,
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Avatar sx={{
            width: 80,
            height: 80,
            bgcolor: '#2563eb',
            fontSize: '2rem',
            fontWeight: 700
          }}>
            {student.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#2563eb',
                mb: 1,
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
              onClick={() => navigate(`/admin/student-profile/${student.id}`)}
            >
              {student.name}
            </Typography>
            <Typography sx={{ color: '#64748b', mb: 1 }}>
              ID: {student.id}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="O'quvchi"
                sx={{
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  fontWeight: 600
                }}
              />
              {student.is_banned && (
                <Chip
                  label="Bloklangan"
                  sx={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    fontWeight: 600
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
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
                {student.last_login ? new Date(student.last_login).toLocaleString('uz-UZ') : 'Ma\'lumot yo\'q'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              p: 3
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
                Sinf
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '1rem' }}>
                {student.class_group || 'Ma\'lumot yo\'q'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              p: 3
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
                Yo'nalish
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '1rem' }}>
                {student.direction === 'natural' ? 'Tabiiy fanlar' : student.direction === 'exact' ? 'Aniq fanlar' : 'Ma\'lumot yo\'q'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{
        p: 4,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px'
      }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#1e293b' }}>
          Test natijalari ({attempts.length})
        </Typography>

        {attempts.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            py: 6,
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <AssessmentIcon sx={{ fontSize: '3rem', color: '#cbd5e1', mb: 2 }} />
            <Typography sx={{ color: '#64748b', fontSize: '1.1rem' }}>
              Hali testlar topshirilmagan
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{
            boxShadow: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
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
                  <TableCell>Test nomi</TableCell>
                  <TableCell>Ball</TableCell>
                  <TableCell>Topshirgan sana</TableCell>
                  <TableCell>Sarflangan vaqt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attempts.map((attempt, index) => (
                  <TableRow key={attempt.id} sx={{
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
                      <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {attempt.test_title || `Test ${attempt.test}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${attempt.score.toFixed(1)}%`}
                        size="small"
                        sx={{
                          backgroundColor: attempt.score >= 70 ? '#ecfdf5' : attempt.score >= 50 ? '#fef3c7' : '#fef2f2',
                          color: attempt.score >= 70 ? '#059669' : attempt.score >= 50 ? '#d97706' : '#dc2626',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      {new Date(attempt.submitted_at).toLocaleString('uz-UZ')}
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      {Math.floor(attempt.time_taken / 60)}:{(attempt.time_taken % 60).toString().padStart(2, '0')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default StudentDetails;