import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const TestResults = () => {
  const { currentUser } = useAuth();
  const [results, setResults] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  useEffect(() => {
    loadResults();
  }, [currentUser.id]);

  const loadResults = async () => {
    try {
      setLoading(true);

      // Load student's attempts from API
      const attemptsResponse = await apiService.getAttempts({ student: currentUser.id });
      const studentAttempts = attemptsResponse.results || attemptsResponse;
      setResults(studentAttempts);

      // Load tests to get titles and subjects
      const testsResponse = await apiService.getTests();
      const allTests = testsResponse.results || testsResponse;
      setTests(allTests);

      console.log('Test results loaded:', {
        attempts: studentAttempts.length,
        tests: allTests.length
      });
    } catch (error) {
      console.error('Failed to load test results:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Box sx={{ 
        py: 4,
        backgroundColor: '#ffffff'
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 6,
          pb: 4,
          borderBottom: '1px solid #e2e8f0'
        }}>
          <Typography sx={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b'
          }}>
            Mening test natijalarim
          </Typography>
        </Box>
        <Typography sx={{ color: '#64748b' }}>Yuklanmoqda...</Typography>
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}
      >
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Mening test natijalarim
        </Typography>
      </Box>

      {results.length === 0 ? (
        <div>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            p: 4,
            textAlign: 'center'
          }}>
            <AssessmentIcon sx={{ fontSize: 64, color: '#64748b', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#64748b', mb: 2 }}>
              Hozircha test natijalari yo'q
            </Typography>
            <Typography variant="body2" color="#64748b">
              Test topshirgandan keyin natijalaringiz shu yerda ko'rinadi
            </Typography>
          </Card>
        </div>
      ) : (
        <div>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
          <TableContainer>
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
                  <TableCell>Fan</TableCell>
                  <TableCell>Ball</TableCell>
                  <TableCell>Baho</TableCell>
                  <TableCell>Harakatlar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results
                  .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
                  .map((result) => {
                  const test = getTestById(result.test);
                  return (
                    <TableRow key={result.id} sx={{
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
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {test?.title || 'Noma\'lum test'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={test?.subject || 'Noma\'lum'}
                          size="small"
                          sx={{
                            backgroundColor: test?.subject === 'Ingliz tili' ? '#3b82f6' : '#eff6ff',
                            color: test?.subject === 'Ingliz tili' ? '#ffffff' : '#2563eb',
                            fontWeight: 600,
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            borderColor: test?.subject === 'Ingliz tili' ? '#3b82f6' : undefined
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: '1.125rem',
                            color: getScoreColor(result.score)
                          }}
                        >
                          {result.score}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getScoreLabel(result.score)}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            backgroundColor: result.score >= 70 ? '#ecfdf5' : '#fef3c7',
                            color: result.score >= 70 ? '#059669' : '#d97706',
                            borderRadius: '6px'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewDetails(result)}
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
                          Tafsilotlar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
        </div>
      )}

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
                                  onError={(e) => {
                                    console.error('Image failed to load:', question.image);
                                    e.target.style.display = 'none';
                                    // Show error message instead of broken image
                                    const errorDiv = document.createElement('div');
                                    errorDiv.style.cssText = `
                                      padding: 15px;
                                      background: #f3f4f6;
                                      border: 2px dashed #d1d5db;
                                      border-radius: 8px;
                                      color: #6b7280;
                                      font-size: 12px;
                                      text-align: center;
                                      margin: 10px 0;
                                    `;
                                    errorDiv.textContent = 'Rasm yuklanmadi.';
                                    e.target.parentNode.appendChild(errorDiv);
                                  }}
                                  onLoad={() => {
                                    console.log('Image loaded successfully:', question.image);
                                  }}
                                />
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
  );
};

export default TestResults;