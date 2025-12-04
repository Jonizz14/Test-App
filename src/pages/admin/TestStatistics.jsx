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
import { CircularProgress } from '@mui/material';
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


  // Debug logging (remove in production)
  // console.log('Total tests:', Array.isArray(tests) ? tests.length : 'Not an array');
  // console.log('Filtered tests:', filteredTests.length);
  // console.log('Sorted tests:', sortedTests.length);

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
        <CircularProgress
          size={60}
          thickness={4}
          sx={{
            color: '#2563eb',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
        <Typography
          sx={{
            fontSize: '1.125rem',
            color: '#64748b',
            fontWeight: 500,
            textAlign: 'center'
          }}
        >
          Testlar yuklanmoqda...
        </Typography>
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
              <TableCell>Test nomi</TableCell>
              <TableCell>O'qituvchi</TableCell>
              <TableCell>Fan</TableCell>
              <TableCell>Savollar</TableCell>
              <TableCell>Vaqt (daqiqa)</TableCell>
              <TableCell>Urinishlar</TableCell>
              <TableCell>O'rtacha ball</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Harakatlar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTests.map((test, index) => (
              <TableRow key={test.id} sx={{
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                '&:hover': {
                  backgroundColor: '#eff6ff',
                },
                '& td': {
                  borderBottom: '1px solid #e2e8f0',
                  padding: '16px',
                  fontSize: '0.875rem',
                  color: '#334155'
                }
              }}>
                <TableCell>
                  <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                    {test.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 500 }}>
                    {test.teacher_name || ''} {test.teacher_surname || ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={test.subject}
                    size="small"
                    sx={{
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 500,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: '#2563eb' }}>
                    {test.total_questions}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: '#059669' }}>
                    {test.time_limit}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: '#2563eb' }}>
                    {test.attempt_count || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: '#059669' }}>
                    {(test.average_score || 0).toFixed(1)}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={test.is_active ? 'Faol' : 'Nofaol'}
                    size="small"
                    sx={{
                      backgroundColor: test.is_active ? '#ecfdf5' : '#f1f5f9',
                      color: test.is_active ? '#059669' : '#64748b',
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => navigate(`/admin/test-details/${test.id}`)}
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && tests.length === 0 && (
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