import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

const TestStatistics = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubGrade, setSelectedSubGrade] = useState('');
  const [subGrades, setSubGrades] = useState({});
  const [scoreOrder, setScoreOrder] = useState('');
  const [attemptOrder, setAttemptOrder] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [studentDetails, setStudentDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => {
    const loadTests = async () => {
      try {
        const allTestsData = await apiService.getTests();
        // Handle both array and object with results property
        const allTests = allTestsData.results || allTestsData;
        setTests(allTests);

        const uniqueTeachers = [...new Set(allTests.map(test => test.teacher_name).filter(Boolean))];
        setTeachers(uniqueTeachers);
        const uniqueSubjects = [...new Set(allTests.map(test => test.subject).filter(Boolean))];
        setSubjects(uniqueSubjects);

        const subGradesMap = {};
        allTests.forEach(test => {
          if (test.target_grades && Array.isArray(test.target_grades)) {
            test.target_grades.forEach(grade => {
              if (grade && grade.includes('-')) {
                const [main, sub] = grade.split('-');
                if (!subGradesMap[main]) subGradesMap[main] = new Set();
                subGradesMap[main].add(sub);
              }
            });
          }
        });
        const subGradesObj = {};
        Object.keys(subGradesMap).forEach(main => {
          subGradesObj[main] = Array.from(subGradesMap[main]).sort();
        });
        setSubGrades(subGradesObj);
      } catch (error) {
        console.error('Failed to load tests:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTests();
  }, []);

  // Calculate filtered and sorted tests
  const filteredTests = useMemo(() => {
    const testsArray = Array.isArray(tests) ? tests : [];
    return testsArray.filter(test => {
      // Skip filtering if no filters are selected
      if (!selectedTeacher && !selectedSubject && !selectedGrade) return true;

      // Teacher filter
      if (selectedTeacher && test.teacher_name !== selectedTeacher) return false;

      // Subject filter
      if (selectedSubject && test.subject !== selectedSubject) return false;

      // Grade filter
      if (selectedGrade) {
        const targetGrades = test.target_grades || [];
        if (selectedSubGrade) {
          if (!targetGrades.includes(`${selectedGrade}-${selectedSubGrade}`)) return false;
        } else {
          if (!targetGrades.some(grade => grade === selectedGrade || grade.startsWith(`${selectedGrade}-`))) return false;
        }
      }

      return true;
    });
  }, [tests, selectedTeacher, selectedSubject, selectedGrade, selectedSubGrade]);

  const sortedTests = useMemo(() => {
    return [...filteredTests].sort((a, b) => {
      if (scoreOrder) {
        const aScore = a.average_score || 0;
        const bScore = b.average_score || 0;
        return scoreOrder === 'asc' ? aScore - bScore : bScore - aScore;
      }
      if (attemptOrder) {
        const aAttempts = a.attempt_count || 0;
        const bAttempts = b.attempt_count || 0;
        return attemptOrder === 'asc' ? aAttempts - bAttempts : bAttempts - aAttempts;
      }
      // Default: no sorting, keep original order
      return 0;
    });
  }, [filteredTests, scoreOrder, attemptOrder]);

  const handleViewDetails = async (test) => {
    setSelectedTest(test);
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      // Get test attempts with student details
      const attempts = await apiService.getAttempts({ test: test.id });

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
    } catch (error) {
      console.error('Failed to load student details:', error);
      setStudentDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedTest(null);
    setStudentDetails([]);
  };

  // Debug logging (remove in production)
  // console.log('Total tests:', Array.isArray(tests) ? tests.length : 'Not an array');
  // console.log('Filtered tests:', filteredTests.length);
  // console.log('Sorted tests:', sortedTests.length);

  if (loading) {
    return (
      <Box sx={{
        py: 4,
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Typography>Yuklanmoqda...</Typography>
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
          Testlar statistikasi
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Barcha testlarning batafsil statistikasi va natijalari
        </Typography>
      </Box>

      <Box sx={{
        mb: 4,
        p: 4,
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 3,
        alignItems: 'center'
      }}>
        <FormControl size="small" sx={{ 
          minWidth: 150,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
          }
        }}>
          <InputLabel>Ustoz</InputLabel>
          <Select value={selectedTeacher} label="Ustoz" onChange={(e) => setSelectedTeacher(e.target.value)}>
            <MenuItem value="">Barcha</MenuItem>
            {teachers.map(teacher => (
              <MenuItem key={teacher} value={teacher}>{teacher}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ 
          minWidth: 150,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
          }
        }}>
          <InputLabel>Fan</InputLabel>
          <Select value={selectedSubject} label="Fan" onChange={(e) => setSelectedSubject(e.target.value)}>
            <MenuItem value="">Barcha</MenuItem>
            {subjects.map(subject => (
              <MenuItem key={subject} value={subject}>{subject}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ 
          minWidth: 120,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
          }
        }}>
          <InputLabel>Sinf</InputLabel>
          <Select 
            value={selectedGrade} 
            label="Sinf" 
            onChange={(e) => {
              setSelectedGrade(e.target.value);
              setSelectedSubGrade('');
            }}
          >
            <MenuItem value="">Barcha sinflar</MenuItem>
            {[5,6,7,8,9,10,11].map(grade => (
              <MenuItem key={grade} value={grade.toString()}>{grade}-sinf</MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedGrade && subGrades[selectedGrade] && (
          <FormControl size="small" sx={{ 
            minWidth: 140,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff',
              borderRadius: '8px',
            }
          }}>
            <InputLabel>Yo'nalish</InputLabel>
            <Select 
              value={selectedSubGrade} 
              label="Yo'nalish" 
              onChange={(e) => setSelectedSubGrade(e.target.value)}
            >
              <MenuItem value="">Barcha yo'nalishlar</MenuItem>
              {subGrades[selectedGrade].map(sub => (
                <MenuItem key={sub} value={sub}>{selectedGrade}-{sub}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl size="small" sx={{ 
          minWidth: 220,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
          }
        }}>
          <InputLabel>Ball bo'yicha tartiblash</InputLabel>
          <Select 
            value={scoreOrder} 
            label="Ball bo'yicha tartiblash" 
            onChange={(e) => setScoreOrder(e.target.value)}
          >
            <MenuItem value="">Tartiblanmagan</MenuItem>
            <MenuItem value="desc">Eng baland ball</MenuItem>
            <MenuItem value="asc">Eng past ball</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ 
          minWidth: 220,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
          }
        }}>
          <InputLabel>Urinishlar soni bo'yicha</InputLabel>
          <Select 
            value={attemptOrder} 
            label="Urinishlar soni bo'yicha" 
            onChange={(e) => setAttemptOrder(e.target.value)}
          >
            <MenuItem value="">Tartiblanmagan</MenuItem>
            <MenuItem value="asc">Eng kam ishlangan</MenuItem>
            <MenuItem value="desc">Eng ko'p ishlangan</MenuItem>
          </Select>
        </FormControl>
      </Box>


      <Grid container spacing={3}>
        {sortedTests.map((test, index) => (
          <Grid item xs={12} key={test.id}>
            <Card
                sx={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'none',
                  '&:hover': {
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                  <Box flex={1}>
                    <Typography variant="h6" sx={{ 
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      lineHeight: 1.4,
                      mb: 1
                    }}>
                      {test.title}
                    </Typography>
                    <Typography sx={{ 
                      fontSize: '0.875rem',
                      color: '#64748b'
                    }}>
                      {test.teacher_name || ''} {test.teacher_surname || ''} {test.teacher_id ? ` (ID: ${test.teacher_id})` : ''}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Chip 
                      label={test.is_active ? 'Faol' : 'Nofaol'}
                      size="small"
                      sx={{
                        backgroundColor: test.is_active ? '#ecfdf5' : '#f1f5f9',
                        color: test.is_active ? '#059669' : '#64748b',
                        fontWeight: 600,
                      }}
                    />
                    <Chip 
                      label={test.subject} 
                      size="small" 
                      sx={{
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                </Box>
                
                <Grid container spacing={4}>
                  <Grid item xs={12} md={8}>
                    <Box mb={3}>
                      <Typography sx={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: '#64748b',
                        mb: 2
                      }}>
                        Test ma'lumotlari:
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ 
                            backgroundColor: '#f8fafc', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            p: 2,
                            textAlign: 'center'
                          }}>
                            <Typography sx={{ 
                              fontSize: '1.5rem', 
                              fontWeight: 700, 
                              color: '#2563eb',
                              mb: 0.5
                            }}>
                              {test.total_questions}
                            </Typography>
                            <Typography sx={{ 
                              fontSize: '0.75rem', 
                              color: '#64748b',
                              fontWeight: 600
                            }}>
                              Savollar
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ 
                            backgroundColor: '#f8fafc', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            p: 2,
                            textAlign: 'center'
                          }}>
                            <Typography sx={{ 
                              fontSize: '1.5rem', 
                              fontWeight: 700, 
                              color: '#059669',
                              mb: 0.5
                            }}>
                              {test.time_limit}
                            </Typography>
                            <Typography sx={{ 
                              fontSize: '0.75rem', 
                              color: '#64748b',
                              fontWeight: 600
                            }}>
                              Daqiqa
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ 
                            backgroundColor: '#f8fafc', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            p: 2,
                            textAlign: 'center'
                          }}>
                            <Typography sx={{
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              color: '#2563eb',
                              mb: 0.5
                            }}>
                              {test.attempt_count || 0}
                            </Typography>
                            <Typography sx={{ 
                              fontSize: '0.75rem', 
                              color: '#64748b',
                              fontWeight: 600
                            }}>
                              Urinish
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ 
                            backgroundColor: '#f8fafc', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            p: 2,
                            textAlign: 'center'
                          }}>
                            <Typography sx={{
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              color: '#059669',
                              mb: 0.5
                            }}>
                              {(test.average_score || 0).toFixed(1)}%
                            </Typography>
                            <Typography sx={{ 
                              fontSize: '0.75rem', 
                              color: '#64748b',
                              fontWeight: 600
                            }}>
                              O'rtacha ball
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                    
                    <Box>
                      <Typography sx={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: '#64748b',
                        mb: 1
                      }}>
                        Maqsadli sinflar:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {(() => {
                          // Parse target_grades properly
                          let grades = [];
                          if (Array.isArray(test.target_grades)) {
                            grades = test.target_grades;
                          } else if (typeof test.target_grades === 'string') {
                            // Handle string that might be JSON array or comma-separated
                            try {
                              const parsed = JSON.parse(test.target_grades);
                              if (Array.isArray(parsed)) {
                                grades = parsed;
                              } else {
                                grades = test.target_grades.split(',').map(g => g.trim()).filter(g => g);
                              }
                            } catch {
                              // Not JSON, treat as comma-separated
                              grades = test.target_grades.split(',').map(g => g.trim()).filter(g => g);
                            }
                          }

                          // Remove any brackets or quotes from grade names
                          grades = grades.map(grade => grade.replace(/[\[\]"'`]/g, '').trim());

                          return grades.length > 0 ? (
                            grades.sort((a, b) => parseInt(a.split('-')[0]) - parseInt(b.split('-')[0])).map((grade, index) => (
                              <Chip
                                key={index}
                                label={`${grade}-sinf`}
                                size="small"
                                sx={{
                                  backgroundColor: '#eff6ff',
                                  color: '#2563eb',
                                  fontWeight: 600
                                }}
                              />
                            ))
                          ) : (
                            <Chip
                              label="Barcha sinflar uchun"
                              size="small"
                              sx={{
                                backgroundColor: '#ecfdf5',
                                color: '#059669',
                                fontWeight: 600
                              }}
                            />
                          );
                        })()}
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#64748b'
                        }}>
                          Qo'shimcha ma'lumotlar:
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDetails(test)}
                          sx={{
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 2,
                            borderColor: '#059669',
                            color: '#059669',
                            '&:hover': {
                              borderColor: '#047857',
                              backgroundColor: '#ecfdf5',
                            }
                          }}
                        >
                          Batafsil
                        </Button>
                      </Box>
                      <Box sx={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        p: 2
                      }}>
                        <Typography sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#64748b',
                          mb: 1
                        }}>
                          Yaratilgan sana:
                        </Typography>
                        <Typography sx={{
                          fontSize: '0.875rem',
                          color: '#1e293b',
                          fontWeight: 600,
                          mb: 2
                        }}>
                          {new Date(test.created_at).toLocaleString('uz-UZ')}
                        </Typography>

                        {test.updated_at && test.updated_at !== test.created_at && (
                          <>
                            <Typography sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#64748b',
                              mb: 1
                            }}>
                              Oxirgi yangilanish:
                            </Typography>
                            <Typography sx={{
                              fontSize: '0.875rem',
                              color: '#1e293b',
                              fontWeight: 600
                            }}>
                              {new Date(test.updated_at).toLocaleString('uz-UZ')}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!loading && tests.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Testlar topilmadi
          </Typography>
        </Box>
      )}

      {/* Detailed Student View Modal */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '12px',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f8fafc 100%)',
          borderBottom: '1px solid #e2e8f0',
          py: 3,
          px: 4
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{
                fontWeight: 700,
                color: '#1e293b',
                mb: 1
              }}>
                {selectedTest?.title} - Batafsil natijalar
              </Typography>
              <Typography sx={{
                color: '#64748b',
                fontSize: '0.95rem'
              }}>
                Test topshirgan barcha o'quvchilar ro'yxati
              </Typography>
            </Box>
            <IconButton
              onClick={handleCloseDetails}
              sx={{
                color: '#64748b',
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <Typography>Yuklanmoqda...</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>O'quvchi</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Ball</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Topshirgan sana</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Sarflangan vaqt</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Qo'shimcha dars</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Ogohlantirishlar</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Banlar soni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentDetails.map((student) => (
                    <TableRow
                      key={student.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f8fafc',
                        }
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
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
                      <TableCell sx={{ py: 2 }}>
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
                      <TableCell sx={{ py: 2, color: '#64748b' }}>
                        {new Date(student.submittedAt).toLocaleString('uz-UZ')}
                      </TableCell>
                      <TableCell sx={{ py: 2, color: '#64748b' }}>
                        {Math.floor(student.timeTaken / 60)}:{(student.timeTaken % 60).toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
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
                      <TableCell sx={{ py: 2 }}>
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
                      <TableCell sx={{ py: 2 }}>
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
                  {studentDetails.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: '#64748b' }}>
                        Bu testni hali hech kim topshirmagan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export default TestStatistics;