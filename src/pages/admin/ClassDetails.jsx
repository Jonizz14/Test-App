import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Chip,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Person as PersonIcon, Assessment as AssessmentIcon, TrendingUp as TrendingUpIcon, School as SchoolIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

const ClassDetails = () => {
  const { classGroup } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClassData = async () => {
      try {
        setLoading(true);
        const [allUsers, allAttempts, allTests] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts(),
          apiService.getTests()
        ]);

        const allStudents = allUsers.filter(user => user.role === 'student');
        const allTeachers = allUsers.filter(user => user.role === 'teacher');
        
        // Filter students by class
        const classStudents = allStudents.filter(student => student.class_group === classGroup);
        const classTeachers = allTeachers.filter(teacher => teacher.curator_class === classGroup);
        
        setStudents(classStudents);
        setTeachers(classTeachers);
        setAttempts(allAttempts.results || allAttempts);
        setTests(allTests.results || allTests);
      } catch (error) {
        console.error('Failed to load class data:', error);
        setError('Sinflar ma\'lumotlarini yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadClassData();
  }, [classGroup]);

  const getDirectionLabel = (direction) => {
    return direction === 'natural' ? 'Tabiiy fanlar' : 'Aniq fanlar';
  };

  const getStudentAttemptCount = (studentId) => {
    return attempts.filter(attempt => attempt.student === studentId).length;
  };

  const getStudentAverageScore = (studentId) => {
    const studentAttempts = attempts.filter(attempt => attempt.student === studentId);
    if (studentAttempts.length === 0) return 0;

    const averageScore = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
    return Math.round(averageScore);
  };

  const getClassStatistics = () => {
    if (students.length === 0) return { totalStudents: 0, totalAttempts: 0, averageScore: 0, activeStudents: 0 };

    let totalScore = 0;
    let totalAttempts = 0;
    let studentsWithAttempts = 0;
    let activeStudents = 0;

    students.forEach(student => {
      const studentAttempts = attempts.filter(attempt => attempt.student === student.id);
      totalAttempts += studentAttempts.length;

      if (studentAttempts.length > 0) {
        const studentAverage = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
        totalScore += studentAverage;
        studentsWithAttempts++;
      }

      // Active students (has login in last 30 days)
      if (student.last_login && new Date(student.last_login) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        activeStudents++;
      }
    });

    return {
      totalStudents: students.length,
      totalAttempts,
      averageScore: studentsWithAttempts > 0 ? Math.round(totalScore / studentsWithAttempts) : 0,
      activeStudents
    };
  };


  const getRecentActivity = () => {
    const classAttempts = attempts.filter(attempt => 
      students.some(student => student.id === attempt.student)
    );
    
    return classAttempts
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
      .slice(0, 10);
  };

  const getClassCurator = () => {
    return teachers.find(teacher => teacher.curator_class === classGroup);
  };

  const statistics = getClassStatistics();
  const recentActivity = getRecentActivity();
  const curator = getClassCurator();

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 4,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/students')}
          sx={{ mr: 3 }}
        >
          Orqaga
        </Button>
        <Box>
          <Typography sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 1
          }}>
            {classGroup} sinfi
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '1rem' }}>
            Sinf haqida batafsil ma'lumot va statistika
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #0ea5e9',
            borderRadius: '12px'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon sx={{ color: '#0ea5e9', mr: 2, fontSize: '2rem' }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0ea5e9' }}>
                  {statistics.totalStudents}
                </Typography>
              </Box>
              <Typography sx={{ color: '#0c4a6e', fontWeight: 600 }}>
                Jami o'quvchi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: '#f0fdf4', 
            border: '1px solid #22c55e',
            borderRadius: '12px'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ color: '#22c55e', mr: 2, fontSize: '2rem' }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#22c55e' }}>
                  {statistics.totalAttempts}
                </Typography>
              </Box>
              <Typography sx={{ color: '#166534', fontWeight: 600 }}>
                Jami testlar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: '#fefce8', 
            border: '1px solid #eab308',
            borderRadius: '12px'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon sx={{ color: '#eab308', mr: 2, fontSize: '2rem' }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#eab308' }}>
                  {statistics.averageScore}%
                </Typography>
              </Box>
              <Typography sx={{ color: '#713f12', fontWeight: 600 }}>
                O'rtacha ball
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: '#fdf2f8', 
            border: '1px solid #ec4899',
            borderRadius: '12px'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ color: '#ec4899', mr: 2, fontSize: '2rem' }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ec4899' }}>
                  {statistics.activeStudents}
                </Typography>
              </Box>
              <Typography sx={{ color: '#831843', fontWeight: 600 }}>
                Faol o'quvchi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Class Curator */}
      {curator && (
        <Card sx={{
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          mb: 4
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b',
              mb: 3
            }}>
              Sinf rahbari
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {curator.is_premium && curator.profile_photo_url ? (
                <Avatar
                  src={curator.profile_photo_url}
                  sx={{
                    width: 64,
                    height: 64,
                    border: '3px solid #e2e8f0',
                    mr: 2
                  }}
                  imgProps={{
                    style: { objectFit: 'cover' }
                  }}
                />
              ) : (
                <Avatar sx={{
                  width: 64,
                  height: 64,
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  mr: 2
                }}>
                  {curator.name ? curator.name.charAt(0) : 'R'}
                </Avatar>
              )}
              <Box>
                <Typography sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '1.125rem'
                }}>
                  {curator.name}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                  {curator.display_id || curator.username}
                </Typography>
              </Box>
            </Box>
            {curator.bio && (
              <Typography sx={{
                color: '#64748b',
                fontSize: '0.875rem',
                fontStyle: 'italic',
                mt: 2
              }}>
                "{curator.bio}"
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <Card sx={{ 
        mt: 4,
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            color: '#1e293b',
            mb: 3 
          }}>
            Barcha o'quvchilar ({students.length} ta)
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>O'quvchi</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Yo'nalish</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Testlar</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>O'rtacha ball</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Oxirgi faollik</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} sx={{
                    '&:hover': {
                      backgroundColor: '#f8fafc'
                    }
                  }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {student.is_premium && student.profile_photo_url ? (
                          <Avatar
                            src={student.profile_photo_url}
                            sx={{
                              width: 40,
                              height: 40,
                              border: '2px solid #e2e8f0',
                              mr: 2
                            }}
                            imgProps={{
                              style: { objectFit: 'cover' }
                            }}
                          />
                        ) : (
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #e2e8f0',
                            mr: 2
                          }}>
                            <Typography sx={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#64748b'
                            }}>
                              -
                            </Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography sx={{ 
                            fontWeight: 600, 
                            color: '#1e293b',
                            fontSize: '0.875rem'
                          }}>
                            {student.name}
                          </Typography>
                          <Typography sx={{ 
                            color: '#64748b', 
                            fontSize: '0.75rem',
                            fontFamily: 'monospace'
                          }}>
                            {student.display_id || student.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getDirectionLabel(student.direction)}
                        size="small"
                        sx={{
                          backgroundColor: student.direction === 'natural' ? '#ecfdf5' : '#eff6ff',
                          color: student.direction === 'natural' ? '#059669' : '#2563eb',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ 
                        fontWeight: 700,
                        color: '#2563eb',
                        fontSize: '1.125rem'
                      }}>
                        {getStudentAttemptCount(student.id)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{
                        fontWeight: 700,
                        color: '#059669',
                        fontSize: '1.125rem'
                      }}>
                        {getStudentAverageScore(student.id)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{
                        fontWeight: 500,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                      }}>
                        {student.last_login ? new Date(student.last_login).toLocaleString('uz-UZ') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.is_banned ? 'Bloklangan' : 'Faol'}
                        size="small"
                        sx={{
                          backgroundColor: student.is_banned ? '#fef2f2' : '#ecfdf5',
                          color: student.is_banned ? '#dc2626' : '#059669',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {students.length === 0 && (
            <Typography sx={{ 
              color: '#64748b', 
              textAlign: 'center', 
              py: 4,
              fontSize: '0.875rem'
            }}>
              Bu sinfda hali o'quvchilar yo'q
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClassDetails;