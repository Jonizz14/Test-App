import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Avatar,
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
  Warning as WarningIcon,
  Block as BlockIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import apiService from '../../data/apiService';

const TestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [studentDetails, setStudentDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestDetails = async () => {
      try {
        // Get all tests to find the specific test
        const allTests = await apiService.getTests();
        const testData = allTests.find(t => t.id === parseInt(id));
        setTest(testData);

        if (testData) {
          // Get test attempts with student details
          const attempts = await apiService.getAttempts({ test: testData.id });

          // Get warning logs for ban calculations
          const warnings = await apiService.getWarnings();

          // Process student data
          const studentData = attempts.map(attempt => {
            // Calculate bans based on warnings (every 3 warnings = 1 ban)
            const studentWarnings = warnings.filter(w => w.student === attempt.student).length;
            const banCount = Math.floor(studentWarnings / 3);

            return {
              id: attempt.student,
              name: attempt.student_name,
              score: attempt.score,
              submittedAt: attempt.submitted_at,
              timeTaken: attempt.time_taken,
              warningCount: studentWarnings,
              banCount: banCount,
              // Mock data for additional lessons (you may need to implement this based on your backend)
              hasExtraLessons: Math.random() > 0.7, // Placeholder - replace with actual data
            };
          });

          setStudentDetails(studentData);
        }
      } catch (error) {
        console.error('Failed to load test details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTestDetails();
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

  if (!test) {
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
        <Typography>Test topilmadi</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/test-stats')}
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
          onClick={() => navigate('/admin/test-stats')}
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
          {test.title} - Batafsil natijalar
        </Typography>
      </Box>

      {/* Test Info Card */}
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
            <AssessmentIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              {test.title}
            </Typography>
            <Typography sx={{ color: '#64748b', mb: 1 }}>
              O'qituvchi: {test.teacher_name || ''} {test.teacher_surname || ''}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={test.subject}
                sx={{
                  backgroundColor: test.subject === 'Ingliz tili' ? '#3b82f6' : '#ecfdf5',
                  color: test.subject === 'Ingliz tili' ? '#ffffff' : '#059669',
                  fontWeight: 600,
                  borderColor: test.subject === 'Ingliz tili' ? '#3b82f6' : undefined
                }}
              />
              <Chip
                label={`${test.total_questions} savol`}
                sx={{
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  fontWeight: 600
                }}
              />
              <Chip
                label={`${test.time_limit} daqiqa`}
                sx={{
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  fontWeight: 600
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1, color: '#1e293b', fontWeight: 600 }}>
              Urinishlar soni
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '1.5rem', fontWeight: 700 }}>
              {test.attempt_count || 0}
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ mb: 1, color: '#1e293b', fontWeight: 600 }}>
              O'rtacha ball
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '1.5rem', fontWeight: 700 }}>
              {(test.average_score || 0).toFixed(1)}%
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ mb: 1, color: '#1e293b', fontWeight: 600 }}>
              Status
            </Typography>
            <Chip
              label={test.is_active ? 'Faol' : 'Nofaol'}
              sx={{
                backgroundColor: test.is_active ? '#ecfdf5' : '#f1f5f9',
                color: test.is_active ? '#059669' : '#64748b',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Students Table */}
      <Paper sx={{
        p: 4,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px'
      }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#1e293b' }}>
          Test topshirgan o'quvchilar ({studentDetails.length})
        </Typography>

        {studentDetails.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            py: 6,
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <AssessmentIcon sx={{ fontSize: '3rem', color: '#cbd5e1', mb: 2 }} />
            <Typography sx={{ color: '#64748b', fontSize: '1.1rem' }}>
              Bu testni hali hech kim topshirmagan
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
                  <TableCell>O'quvchi</TableCell>
                  <TableCell>Ball</TableCell>
                  <TableCell>Topshirgan sana</TableCell>
                  <TableCell>Sarflangan vaqt</TableCell>
                  <TableCell>Qo'shimcha dars</TableCell>
                  <TableCell>Ogohlantirishlar</TableCell>
                  <TableCell>Banlar soni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentDetails.map((student, index) => (
                  <TableRow key={student.id} sx={{
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{
                          width: 32,
                          height: 32,
                          bgcolor: '#059669',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}>
                          {student.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography sx={{
                          fontWeight: 500,
                          color: '#1e293b'
                        }}>
                          {student.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${student.score.toFixed(1)}%`}
                        size="small"
                        sx={{
                          backgroundColor: student.score >= 70 ? '#ecfdf5' : student.score >= 50 ? '#fef3c7' : '#fef2f2',
                          color: student.score >= 70 ? '#059669' : student.score >= 50 ? '#d97706' : '#dc2626',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      {new Date(student.submittedAt).toLocaleString('uz-UZ')}
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      {Math.floor(student.timeTaken / 60)}:{(student.timeTaken % 60).toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell>
                      {student.hasExtraLessons ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon sx={{ color: '#059669', fontSize: '1.2rem' }} />
                          <Typography sx={{ color: '#059669', fontWeight: 500, fontSize: '0.875rem' }}>
                            Oldi
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                          Olmadi
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon sx={{
                          color: student.warningCount > 0 ? '#d97706' : '#64748b',
                          fontSize: '1.2rem'
                        }} />
                        <Typography sx={{
                          color: student.warningCount > 0 ? '#d97706' : '#64748b',
                          fontWeight: 500
                        }}>
                          {student.warningCount}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BlockIcon sx={{
                          color: student.banCount > 0 ? '#dc2626' : '#64748b',
                          fontSize: '1.2rem'
                        }} />
                        <Typography sx={{
                          color: student.banCount > 0 ? '#dc2626' : '#64748b',
                          fontWeight: 500
                        }}>
                          {student.banCount}
                        </Typography>
                      </Box>
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

export default TestDetails;