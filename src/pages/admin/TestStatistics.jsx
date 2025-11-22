import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  People as PeopleIcon,
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
  useEffect(() => {
    const loadTests = async () => {
      try {
        const allTests = await apiService.getTests();
        setTests(allTests);
        const uniqueTeachers = [...new Set(allTests.map(test => test.teacher_name).filter(Boolean))];
        setTeachers(uniqueTeachers);
        const uniqueSubjects = [...new Set(allTests.map(test => test.subject).filter(Boolean))];
        setSubjects(uniqueSubjects);
        const subGradesMap = {};
        allTests.forEach(test => {
          test.target_grades.forEach(grade => {
            if (grade.includes('-')) {
              const [main, sub] = grade.split('-');
              if (!subGradesMap[main]) subGradesMap[main] = new Set();
              subGradesMap[main].add(sub);
            }
          });
        });
        const subGradesObj = {};
        Object.keys(subGradesMap).forEach(main => {
          subGradesObj[main] = Array.from(subGradesMap[main]).sort();
        });
        setSubGrades(subGradesObj);
      } catch (error) {
        console.error('Failed to load tests:', error);
      }
    };
    loadTests();
  }, []);

  const filteredTests = tests.filter(test => {
    if (selectedTeacher && test.teacher_name !== selectedTeacher) return false;
    if (selectedSubject && test.subject !== selectedSubject) return false;
    if (selectedGrade) {
      if (selectedSubGrade) {
        if (!test.target_grades.includes(`${selectedGrade}-${selectedSubGrade}`)) return false;
      } else {
        if (!test.target_grades.some(grade => grade === selectedGrade || grade.startsWith(`${selectedGrade}-`))) return false;
      }
    }
    return true;
  });

  const sortedTests = [...filteredTests].sort((a, b) => {
    if (scoreOrder) {
      return scoreOrder === 'asc' ? a.average_score - b.average_score : b.average_score - a.average_score;
    }
    if (attemptOrder) {
      return attemptOrder === 'asc' ? a.attempt_count - b.attempt_count : b.attempt_count - a.attempt_count;
    }
    // Default sort by created_at desc
    return new Date(b.created_at) - new Date(a.created_at);
  });

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
        {sortedTests.map((test) => (
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
                              {test.attempt_count}
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
                              {test.average_score.toFixed(1)}%
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
                        {test.target_grades?.length > 0 ? (
                          [...test.target_grades].sort((a, b) => parseInt(a.split('-')[0]) - parseInt(b.split('-')[0])).map((grade, index) => (
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
                        )}
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography sx={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: '#64748b',
                        mb: 2
                      }}>
                        Qo'shimcha ma'lumotlar:
                      </Typography>
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

      {tests.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Testlar topilmadi
          </Typography>
        </Box>
      )}


    </Box>
  );
};

export default TestStatistics;