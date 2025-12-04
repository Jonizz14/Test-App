import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import apiService from '../../data/apiService';

const Questions = () => {
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sorting and filtering states
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Always require password on page load/refresh
    // No persistent authentication
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load tests and questions using public endpoints (no authentication required)
      const [testsResponse, questionsResponse] = await Promise.all([
        apiService.getPublicTests(),
        apiService.getPublicQuestions()
      ]);

      const allTests = testsResponse.results || testsResponse;
      const allQuestions = questionsResponse.results || questionsResponse;

      setTests(allTests);
      setQuestions(allQuestions);

      console.log('Questions page data loaded:', {
        tests: allTests.length,
        questions: allQuestions.length
      });
    } catch (err) {
      console.error('Failed to load questions data:', err);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (password === 'katya2010') {
      setIsAuthenticated(true);
      loadData();
    } else {
      setPasswordError('Noto\'g\'ri parol');
    }
  };

  // Get unique subjects, teachers, and grades for filters
  const subjects = [...new Set(tests.map(test => test.subject).filter(Boolean))];
  const teachers = [...new Set(tests.map(test => test.teacher_name).filter(Boolean))];

  // Safely extract grades from all tests
  const allGrades = [];
  tests.forEach(test => {
    if (test && test.target_grades && Array.isArray(test.target_grades)) {
      test.target_grades.forEach(grade => {
        if (grade && typeof grade === 'string' && grade.trim()) {
          allGrades.push(grade.trim());
        }
      });
    }
  });
  const grades = [...new Set(allGrades)].sort((a, b) => {
    const aNum = parseInt(a) || 0;
    const bNum = parseInt(b) || 0;
    return aNum - bNum;
  });

  // Filter and sort tests
  const filteredAndSortedTests = tests
    .filter(test => {
      const matchesSubject = !subjectFilter || test.subject === subjectFilter;
      const matchesTeacher = !teacherFilter || test.teacher_name === teacherFilter;
      const matchesGrade = !gradeFilter || (test.target_grades && Array.isArray(test.target_grades) && test.target_grades.includes(gradeFilter));
      const matchesSearch = !searchQuery ||
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (test.teacher_name && test.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (test.target_grades && Array.isArray(test.target_grades) && test.target_grades.some(grade => grade.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesSubject && matchesTeacher && matchesGrade && matchesSearch;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'subject':
          aValue = a.subject.toLowerCase();
          bValue = b.subject.toLowerCase();
          break;
        case 'teacher':
          aValue = (a.teacher_name || '').toLowerCase();
          bValue = (b.teacher_name || '').toLowerCase();
          break;
        case 'target_grades':
          // Sort by first grade in the array, or 0 if no grades
          const aGrades = (a.target_grades && Array.isArray(a.target_grades) && a.target_grades.length > 0) ? a.target_grades : [];
          const bGrades = (b.target_grades && Array.isArray(b.target_grades) && b.target_grades.length > 0) ? b.target_grades : [];
          aValue = aGrades.length > 0 ? (parseInt(aGrades[0]) || 0) : 0;
          bValue = bGrades.length > 0 ? (parseInt(bGrades[0]) || 0) : 0;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Get questions for a specific test
  const getTestQuestions = (testId) => {
    return questions.filter(q => q.test === testId);
  };

  // Get correct answer for a question
  const getCorrectAnswer = (question) => {
    // First check if there's a direct correct_answer field and it's not empty
    if (question.correct_answer && question.correct_answer.trim()) {
      return question.correct_answer.trim();
    }

    // Then check options array for multiple choice questions
    if (question.options && Array.isArray(question.options) && question.options.length > 0) {
      const correctOption = question.options.find(option => option.is_correct === true);
      if (correctOption) {
        return correctOption.text || correctOption.option_text || correctOption.answer || 'Noma\'lum';
      }
    }

    // If no correct answer found, return unknown
    return 'Noma\'lum';
  };

  // Password protection
  if (!isAuthenticated) {
    return (
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 3
      }}>
        <Card sx={{
          maxWidth: 400,
          width: '100%',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <Box sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 4,
            textAlign: 'center'
          }}>
            <LockIcon sx={{ fontSize: '3rem', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Parol kiritish
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Davom etish uchun parolni kiriting
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {passwordError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {passwordError}
              </Alert>
            )}

            <Box component="form" onSubmit={handlePasswordSubmit}>
              <TextField
                fullWidth
                label="Parol"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#1d4ed8',
                  }
                }}
              >
                Kirish
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

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

  if (error) {
    return (
      <Box sx={{
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 4
        }}>
          Savollar
        </Typography>
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '16px',
          color: '#991b1b'
        }}>
          {error}
        </div>
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
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Barcha Savollar
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400,
          mt: 1
        }}>
          Barcha testlar va ularning to'g'ri javoblari
        </Typography>
      </Box>

      {/* Filters and Search */}
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
        <TextField
          placeholder="Qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            minWidth: 250,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff',
              borderRadius: '8px',
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{
          minWidth: 150,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
          }
        }}>
          <InputLabel>Fan</InputLabel>
          <Select
            value={subjectFilter}
            label="Fan"
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <MenuItem value="">Barcha fanlar</MenuItem>
            {subjects.map(subject => (
              <MenuItem key={subject} value={subject}>{subject}</MenuItem>
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
          <InputLabel>Ustoz</InputLabel>
          <Select
            value={teacherFilter}
            label="Ustoz"
            onChange={(e) => setTeacherFilter(e.target.value)}
          >
            <MenuItem value="">Barcha ustozlar</MenuItem>
            {teachers.map(teacher => (
              <MenuItem key={teacher} value={teacher}>{teacher}</MenuItem>
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
            value={gradeFilter}
            label="Sinf"
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <MenuItem value="">Barcha sinflar</MenuItem>
            {grades.map(grade => (
              <MenuItem key={grade} value={grade}>{grade}-sinf</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{
          minWidth: 180,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
          }
        }}>
          <InputLabel>Saralash</InputLabel>
          <Select
            value={`${sortBy}_${sortOrder}`}
            label="Saralash"
            onChange={(e) => {
              const [field, order] = e.target.value.split('_');
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <MenuItem value="created_at_desc">Yangi avval</MenuItem>
            <MenuItem value="created_at_asc">Eski avval</MenuItem>
            <MenuItem value="title_asc">Sarlavha (A-Z)</MenuItem>
            <MenuItem value="title_desc">Sarlavha (Z-A)</MenuItem>
            <MenuItem value="subject_asc">Fan (A-Z)</MenuItem>
            <MenuItem value="subject_desc">Fan (Z-A)</MenuItem>
            <MenuItem value="target_grades_asc">Sinflar (1-11)</MenuItem>
            <MenuItem value="target_grades_desc">Sinflar (11-1)</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<SortIcon />}
          onClick={() => {
            setSubjectFilter('');
            setTeacherFilter('');
            setGradeFilter('');
            setSearchQuery('');
            setSortBy('created_at');
            setSortOrder('desc');
          }}
          sx={{
            borderColor: '#e2e8f0',
            color: '#374151',
            '&:hover': {
              borderColor: '#2563eb',
              backgroundColor: '#f8fafc',
            }
          }}
        >
          Tozalash
        </Button>
      </Box>

      {/* Results Summary */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ color: '#64748b' }}>
          Jami: {filteredAndSortedTests.length} ta test topildi
        </Typography>
      </Box>

      {/* Tests List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredAndSortedTests.map((test, index) => {
          const testQuestions = getTestQuestions(test.id);

          return (
            <Card
              key={test.id}
              sx={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                overflow: 'visible'
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Accordion
                  sx={{
                    '&:before': { display: 'none' },
                    boxShadow: 'none',
                    '& .MuiAccordionSummary-root': {
                      px: 4,
                      py: 3,
                      '&:hover': {
                        backgroundColor: '#f8fafc'
                      }
                    },
                    '& .MuiAccordionDetails-root': {
                      px: 4,
                      pb: 4
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        gap: 2
                      }
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        mb: 1
                      }}>
                        {test.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip
                          label={test.subject}
                          size="small"
                          sx={{
                            backgroundColor: test.subject === 'Ingliz tili' ? '#3b82f6' : '#eff6ff',
                            color: test.subject === 'Ingliz tili' ? '#ffffff' : '#2563eb',
                            fontWeight: 600,
                            borderColor: test.subject === 'Ingliz tili' ? '#3b82f6' : undefined
                          }}
                        />
                        <Typography sx={{
                          fontSize: '0.875rem',
                          color: '#64748b'
                        }}>
                          {test.teacher_name || 'Noma\'lum ustoz'}
                        </Typography>
                        <Typography sx={{
                          fontSize: '0.875rem',
                          color: '#64748b'
                        }}>
                          {test.total_questions} ta savol
                        </Typography>
                        <Typography sx={{
                          fontSize: '0.875rem',
                          color: '#64748b'
                        }}>
                          Sinflar: {test.target_grades && Array.isArray(test.target_grades) && test.target_grades.length > 0 ? test.target_grades.join(', ') : 'Barcha sinflar'}
                        </Typography>
                        <Typography sx={{
                          fontSize: '0.875rem',
                          color: '#64748b'
                        }}>
                          {new Date(test.created_at).toLocaleDateString('uz-UZ')}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails>
                    {testQuestions.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {testQuestions.map((question, qIndex) => (
                          <Box
                            key={question.id}
                            sx={{
                              p: 3,
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px'
                            }}
                          >
                            <Typography sx={{
                              fontWeight: 600,
                              color: '#1e293b',
                              mb: 2
                            }}>
                              {qIndex + 1}. {question.text}
                            </Typography>

                            {question.image && (
                              <Box sx={{ mb: 2 }}>
                                <img
                                  src={question.image}
                                  alt="Savol rasmi"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '200px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0'
                                  }}
                                />
                              </Box>
                            )}

                            {question.options && question.options.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography sx={{
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  color: '#64748b',
                                  mb: 1
                                }}>
                                  Variantlar:
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {question.options.map((option, oIndex) => {
                                    const optionImageField = ['option_a_image', 'option_b_image', 'option_c_image', 'option_d_image'][oIndex];
                                    const optionImage = question[optionImageField];

                                    return (
                                      <Box
                                        key={oIndex}
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 2,
                                          p: 1,
                                          borderRadius: '4px',
                                          backgroundColor: option.is_correct ? '#ecfdf5' : '#ffffff',
                                          border: option.is_correct ? '1px solid #10b981' : '1px solid #e2e8f0'
                                        }}
                                      >
                                        <Typography sx={{
                                          fontSize: '0.875rem',
                                          fontWeight: option.is_correct ? 600 : 400,
                                          color: option.is_correct ? '#059669' : '#374151'
                                        }}>
                                          {String.fromCharCode(65 + oIndex)}. {option.text || option.option_text || option.answer || 'Variant yo\'q'}
                                          {option.is_correct && ' ✓'}
                                        </Typography>
                                        {optionImage && (
                                          <img
                                            src={optionImage}
                                            alt={`Option ${String.fromCharCode(65 + oIndex)}`}
                                            style={{
                                              maxWidth: '60px',
                                              maxHeight: '40px',
                                              borderRadius: '4px',
                                              border: '1px solid #e2e8f0',
                                              objectFit: 'contain'
                                            }}
                                            onError={(e) => {
                                              console.error('Option image failed to load:', optionImage);
                                              e.target.style.display = 'none';
                                            }}
                                          />
                                        )}
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </Box>
                            )}

                            <Box sx={{
                              p: 2,
                              backgroundColor: getCorrectAnswer(question) === 'Noma\'lum' ? '#fef3c7' : '#ecfdf5',
                              border: `1px solid ${getCorrectAnswer(question) === 'Noma\'lum' ? '#f59e0b' : '#10b981'}`,
                              borderRadius: '6px'
                            }}>
                              <Typography sx={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: getCorrectAnswer(question) === 'Noma\'lum' ? '#92400e' : '#059669',
                                mb: 1
                              }}>
                                To'g'ri javob:
                              </Typography>
                              <Typography sx={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: getCorrectAnswer(question) === 'Noma\'lum' ? '#b45309' : '#047857'
                              }}>
                                {getCorrectAnswer(question)}
                              </Typography>
                              {getCorrectAnswer(question) === 'Noma\'lum' && (
                                <Typography sx={{
                                  fontSize: '0.75rem',
                                  color: '#92400e',
                                  mt: 1,
                                  fontStyle: 'italic'
                                }}>
                                  ⚠️ Bu savol uchun to'g'ri javob o'rnatilmagan
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ color: '#64748b', fontStyle: 'italic' }}>
                        Bu test uchun savollar topilmadi
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {filteredAndSortedTests.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Testlar topilmadi
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Questions;