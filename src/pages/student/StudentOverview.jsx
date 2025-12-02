import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  EmojiPeople as EmojiPeopleIcon,
  LocalLibrary as LocalLibraryIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const StudentOverview = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [myAttempts, setMyAttempts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warningCount, setWarningCount] = useState(0);
  const [selectedResult, setSelectedResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load student's attempts, tests, and warnings from API
      const [attemptsResponse, testsResponse, warningsResponse] = await Promise.all([
        apiService.getAttempts({ student: currentUser.id }),
        apiService.getTests(),
        apiService.getWarnings({ student: currentUser.id })
      ]);

      const studentAttempts = attemptsResponse.results || attemptsResponse;
      const allTests = testsResponse.results || testsResponse;
      const warnings = warningsResponse.results || warningsResponse;

      setMyAttempts(studentAttempts);
      setTests(allTests);
      setWarningCount(Array.isArray(warnings) ? warnings.length : 0);

      console.log('Student overview data loaded:', {
        attempts: studentAttempts.length,
        tests: allTests.length,
        warnings: Array.isArray(warnings) ? warnings.length : 0
      });
    } catch (error) {
      console.error('Failed to load student data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalTests = myAttempts.length;

  // Calculate score statistics
  const scores = myAttempts.map(attempt => attempt.score || 0);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
  const highestScore = scores.length > 0
    ? Math.round(Math.max(...scores))
    : 0;
  const lowestScore = scores.length > 0
    ? Math.round(Math.min(...scores))
    : 0;

  const getTestById = (testId) => {
    return tests.find(test => test.id === testId);
  };

  const loadQuestions = async (testId) => {
    try {
      setQuestionsLoading(true);
      const questionsResponse = await apiService.getQuestions({ test: testId });
      const testQuestions = questionsResponse.results || questionsResponse;
      setQuestions(testQuestions);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleViewDetails = async (result) => {
    setSelectedResult(result);
    setDialogOpen(true);
    await loadQuestions(result.test);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedResult(null);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'A\'lo';
    if (score >= 70) return 'Yaxshi';
    if (score >= 50) return 'Qoniqarli';
    return 'Qoniqarsiz';
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'none',
      '&:hover': {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    }}>
      <CardContent sx={{
        p: 4,
        '&:last-child': { pb: 4 }
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#64748b',
                mb: 1
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#1e293b',
                lineHeight: 1.2
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color === 'primary.main' ? '#eff6ff' :
                              color === 'secondary.main' ? '#f0fdf4' :
                              color === 'success.main' ? '#ecfdf5' :
                              color === 'warning.main' ? '#fffbeb' :
                              '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ml: 2
            }}
          >
            {React.cloneElement(icon, {
              sx: {
                fontSize: '2rem',
                color: color === 'primary.main' ? '#2563eb' :
                       color === 'secondary.main' ? '#16a34a' :
                       color === 'success.main' ? '#059669' :
                       color === 'warning.main' ? '#d97706' :
                       '#64748b'
              }
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          O'quvchi bosh sahifasi
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
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography
            sx={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#1e293b',
              mb: 2
            }}
          >
            O'quvchi bosh sahifasi
          </Typography>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={() => navigate('/student/search')}
            sx={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#1d4ed8',
              }
            }}
            >
              O'qituvchilarni topish
          </Button>
        </Box>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Sizning test natijalaringiz va faoliyatingiz
        </Typography>
      </Box>

      {/* Warning Count Alert - Only show if 3 or more warnings */}
      {warningCount >= 3 && (
        <div>
          <Alert
            severity="warning"
            sx={{
              mb: 4,
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              color: '#92400e',
              '& .MuiAlert-icon': {
                color: '#f59e0b'
              }
            }}
          >
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              ⚠️ Ogohlantirishlar: {warningCount} ta
            </Typography>
            <Typography variant="body2">
              Siz test qoidalariga {warningCount} marta rioya qilmadingiz. Iltimos, test qoidalariga rioya qiling, aks holda profilingiz bloklanishi mumkin.
            </Typography>
          </Alert>
        </div>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <div>
            <StatCard
              title="Topshirilgan testlar"
              value={totalTests}
              icon={<AssessmentIcon fontSize="large" />}
              color="primary.main"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <div>
            <StatCard
              title="O'rtacha ball"
              value={`${averageScore}%`}
              icon={<TrendingUpIcon fontSize="large" />}
              color="success.main"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <div>
            <StatCard
              title="Eng yuqori ball"
              value={`${highestScore}%`}
              icon={<TrendingUpIcon fontSize="large" />}
              color="warning.main"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <div>
            <StatCard
              title="Eng past ball"
              value={`${lowestScore}%`}
              icon={<TrendingUpIcon fontSize="large" />}
              color="error.main"
            />
          </div>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Box sx={{
          backgroundColor: '#eff6ff',
          borderRadius: '12px',
          padding: '16px 20px',
          mb: 3,
          border: '1px solid #e2e8f0'
        }}
        >
          <Typography sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <AssessmentIcon sx={{ color: '#2563eb' }} />
            Faoliyat va tavsiyalar
          </Typography>
        </Box>
        {/* Activity Section - Show recent tests with scroll */}
        <Card sx={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }
        }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography sx={{
              fontWeight: 600,
              color: '#1e293b',
              fontSize: '1.25rem',
              mb: 3
            }}>
              Oxirgi ishlangan testlar
            </Typography>

            {myAttempts.length > 0 ? (
              <Box>
                <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
                  Sizning oxirgi test natijalaringiz:
                </Typography>
                <Box sx={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f1f5f9',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#cbd5e1',
                    borderRadius: '3px',
                    '&:hover': {
                      backgroundColor: '#94a3b8',
                    },
                  },
                }}>
                  {myAttempts
                    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
                    .slice(0, 10) // Show last 10 tests
                    .map((attempt, index) => {
                      const test = tests.find(t => t.id === attempt.test);
                      return (
                        <Box key={attempt.id} sx={{
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          p: 3,
                          mb: 2,
                          border: '1px solid #e2e8f0',
                          '&:hover': {
                            backgroundColor: '#f1f5f9',
                          }
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{
                                fontWeight: 600,
                                color: '#1e293b',
                                fontSize: '1rem',
                                mb: 1
                              }}>
                                {test?.title || 'Noma\'lum test'}
                              </Typography>
                              <Typography variant="body2" color="#64748b" sx={{ mb: 1 }}>
                                Fan: {test?.subject || 'Noma\'lum'} | Sana: {new Date(attempt.submitted_at).toLocaleDateString('uz-UZ')}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${attempt.score}%`}
                              size="small"
                              sx={{
                                backgroundColor: attempt.score >= 70 ? '#ecfdf5' : '#fef3c7',
                                color: attempt.score >= 70 ? '#059669' : '#d97706',
                                fontWeight: 600,
                                fontSize: '0.8rem'
                              }}
                            />
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewDetails(attempt)}
                            sx={{
                              borderColor: '#e2e8f0',
                              color: '#374151',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'none',
                              '&:hover': {
                                borderColor: '#2563eb',
                                backgroundColor: '#f8fafc',
                              }
                            }}
                          >
                            Batafsil ko'rish
                          </Button>
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="#64748b" sx={{ mb: 3 }}>
                  Hali test topshirmagan. Birinchi testni topshirib, natijalarni ko'ring.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/student/search')}
                  sx={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#1d4ed8',
                    }
                  }}
                >
                  O'qituvchilarni topish
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Box sx={{
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          padding: '16px 20px',
          mt: 3,
          border: '1px solid #e2e8f0'
        }}>
          <Typography sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 3
          }}>
            <SchoolIcon sx={{ color: '#2563eb' }} />
            Tezkor amallar
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<SearchIcon />}
                onClick={() => navigate('/student/search')}
                sx={{
                  borderColor: '#e2e8f0',
                  color: '#374151',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#2563eb',
                    backgroundColor: '#f8fafc',
                  }
                }}
              >
                O'qituvchilarni topish
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AssessmentIcon />}
                onClick={() => navigate('/student/results')}
                sx={{
                  borderColor: '#e2e8f0',
                  color: '#374151',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#2563eb',
                    backgroundColor: '#f8fafc',
                  }
                }}
              >
                Test natijalari
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<TrendingUpIcon />}
                onClick={() => navigate('/student/statistics')}
                sx={{
                  borderColor: '#e2e8f0',
                  color: '#374151',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#2563eb',
                    backgroundColor: '#f8fafc',
                  }
                }}
              >
                Batafsil statistika
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<SchoolIcon />}
                onClick={() => navigate('/student/profile')}
                sx={{
                  borderColor: '#e2e8f0',
                  color: '#374151',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#2563eb',
                    backgroundColor: '#f8fafc',
                  }
                }}
              >
                Mening profilim
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Results Details Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{
            fontWeight: 600,
            color: '#1e293b',
            fontSize: '1.25rem',
            pb: 2
          }}>
            Test natijalari tafsilotlari
          </DialogTitle>
          <DialogContent>
            {selectedResult && (() => {
              const test = getTestById(selectedResult.test);

              return (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1e293b', fontWeight: 600 }}>
                    {test?.title || 'Noma\'lum test'}
                  </Typography>
                  <Typography variant="body2" color="#64748b" gutterBottom sx={{ mb: 3 }}>
                    Fan: {test?.subject || 'Noma\'lum'}
                  </Typography>

                  <Card sx={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    mb: 3
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, mb: 2 }}>
                        Sizning balingiz: <span style={{ color: getScoreColor(selectedResult.score) }}>{selectedResult.score}%</span> ({getScoreLabel(selectedResult.score)})
                      </Typography>
                    </CardContent>
                  </Card>

                  <Typography variant="h6" gutterBottom sx={{ color: '#1e293b', fontWeight: 600 }}>
                    Test ma'lumotlari:
                  </Typography>

                  <Card sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="body2" gutterBottom sx={{ color: '#334155' }}>
                        <strong>Fan:</strong> {test?.subject || 'Noma\'lum'}
                      </Typography>
                      <Typography variant="body2" gutterBottom sx={{ color: '#334155' }}>
                        <strong>Savollar soni:</strong> {test?.total_questions || 'Noma\'lum'}
                      </Typography>
                      <Typography variant="body2" gutterBottom sx={{ color: '#334155' }}>
                        <strong>Vaqt limiti:</strong> {test?.time_limit || 'Noma\'lum'} daqiqa
                      </Typography>
                    </CardContent>
                  </Card>

                  <Typography variant="h6" gutterBottom sx={{ color: '#1e293b', fontWeight: 600, mt: 3 }}>
                    Savollar va javoblar:
                  </Typography>

                  {questionsLoading ? (
                    <Typography sx={{ color: '#64748b', fontStyle: 'italic' }}>
                      Savollar yuklanmoqda...
                    </Typography>
                  ) : questions.length > 0 ? (
                    <Box>
                      {questions.map((question, index) => {
                        const studentAnswer = selectedResult.answers?.[question.id];
                        const isCorrect = studentAnswer && question.correct_answer &&
                          studentAnswer.toString().trim().toLowerCase() === question.correct_answer.toString().trim().toLowerCase();

                        return (
                          <Card key={question.id} sx={{
                            mb: 2,
                            border: '1px solid #e2e8f0',
                            borderLeft: `4px solid ${isCorrect ? '#10b981' : '#ef4444'}`
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Chip
                                  label={`${index + 1}-savol`}
                                  size="small"
                                  sx={{
                                    mr: 2,
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    fontWeight: 600
                                  }}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {isCorrect ? (
                                    <CheckCircleIcon sx={{ color: '#10b981', mr: 1 }} />
                                  ) : (
                                    <CancelIcon sx={{ color: '#ef4444', mr: 1 }} />
                                  )}
                                  <Typography variant="body2" sx={{
                                    color: isCorrect ? '#10b981' : '#ef4444',
                                    fontWeight: 600
                                  }}>
                                    {isCorrect ? 'To\'g\'ri' : 'Noto\'g\'ri'}
                                  </Typography>
                                </Box>
                              </Box>

                              <Typography variant="h6" sx={{
                                color: '#1e293b',
                                fontWeight: 600,
                                mb: 2,
                                fontSize: '1rem'
                              }}>
                                {question.question_text}
                              </Typography>

                              {/* Question Image */}
                              {question.image && (
                                <Box sx={{ mb: 2, textAlign: 'center' }}>
                                  <img
                                    src={question.image}
                                    alt="Question"
                                    style={{
                                      maxWidth: '100%',
                                      maxHeight: '300px',
                                      width: 'auto',
                                      border: '1px solid #e0e0e0',
                                      borderRadius: '8px',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                      objectFit: 'contain'
                                    }}
                                  />
                                </Box>
                              )}

                              <Box sx={{ mt: 2 }}>
                                {question.question_type === 'multiple_choice' && question.options && (
                                  <Box>
                                    <Typography variant="body2" sx={{
                                      color: '#64748b',
                                      fontWeight: 600,
                                      mb: 1
                                    }}>
                                      Variantlar:
                                    </Typography>
                                    {question.options.map((option, optionIndex) => (
                                      <Box key={optionIndex} sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 1,
                                        p: 1,
                                        borderRadius: '4px',
                                        backgroundColor: option === question.correct_answer ? '#ecfdf5' :
                                                      option === studentAnswer ? '#fef3c7' : 'transparent',
                                        border: option === question.correct_answer ? '1px solid #10b981' :
                                              option === studentAnswer ? '1px solid #f59e0b' : '1px solid #f1f5f9'
                                      }}>
                                        <Typography variant="body2" sx={{
                                          color: option === question.correct_answer ? '#10b981' : '#334155',
                                          fontWeight: option === studentAnswer ? 600 : 400
                                        }}>
                                          {option}
                                        </Typography>
                                        {option === question.correct_answer && (
                                          <Typography variant="caption" sx={{
                                            color: '#10b981',
                                            fontWeight: 600,
                                            ml: 1
                                          }}>
                                            (To'g'ri javob)
                                          </Typography>
                                        )}
                                        {option === studentAnswer && option !== question.correct_answer && (
                                          <Typography variant="caption" sx={{
                                            color: '#f59e0b',
                                            fontWeight: 600,
                                            ml: 1
                                          }}>
                                            (Sizning javobingiz)
                                          </Typography>
                                        )}
                                      </Box>
                                    ))}
                                  </Box>
                                )}

                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="body2" sx={{
                                    color: '#64748b',
                                    fontWeight: 600,
                                    mb: 1
                                  }}>
                                    Sizning javobingiz:
                                  </Typography>
                                  <Typography variant="body1" sx={{
                                    color: '#1e293b',
                                    fontWeight: 500,
                                    backgroundColor: '#f8fafc',
                                    p: 2,
                                    borderRadius: '4px',
                                    border: '1px solid #e2e8f0'
                                  }}>
                                    {studentAnswer || 'Javob berilmagan'}
                                  </Typography>
                                </Box>

                                {question.correct_answer && question.correct_answer !== studentAnswer && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{
                                      color: '#64748b',
                                      fontWeight: 600,
                                      mb: 1
                                    }}>
                                      To'g'ri javob:
                                    </Typography>
                                    <Typography variant="body1" sx={{
                                      color: '#10b981',
                                      fontWeight: 500,
                                      backgroundColor: '#ecfdf5',
                                      p: 2,
                                      borderRadius: '4px',
                                      border: '1px solid #10b981'
                                    }}>
                                      {question.correct_answer}
                                    </Typography>
                                  </Box>
                                )}

                                {question.explanation && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{
                                      color: '#64748b',
                                      fontWeight: 600,
                                      mb: 1
                                    }}>
                                      Tushuntirish:
                                    </Typography>
                                    <Typography variant="body2" sx={{
                                      color: '#334155',
                                      backgroundColor: '#f8fafc',
                                      p: 2,
                                      borderRadius: '4px',
                                      border: '1px solid #e2e8f0'
                                    }}>
                                      {question.explanation}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography sx={{ color: '#64748b', fontStyle: 'italic' }}>
                      Bu test uchun savollar topilmadi.
                    </Typography>
                  )}
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog} sx={{
              color: '#374151',
              fontWeight: 600,
              textTransform: 'none'
            }}>
              Yopish
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default StudentOverview;