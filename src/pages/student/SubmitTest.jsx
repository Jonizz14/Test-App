import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Button,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useServerTest } from '../../context/ServerTestContext';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const SubmitTest = () => {
   const navigate = useNavigate();
   const { currentUser } = useAuth();
   const {
     currentSession,
     submitTest,
     clearSession,
     selectedTest,
     isLoading,
     error,
   } = useServerTest();

  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    // Auto-submit when component mounts
    handleSubmit();
  }, []);

  const handleSubmit = async () => {
    if (!currentSession) {
      alert('Test sessiyasi topilmadi. Iltimos, testni qaytadan boshlang.');
      navigate('/student/take-test');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitTest();
      if (result && result.success) {
        setSubmissionResult(result);
      } else {
        setSubmissionResult({ success: false, error: 'Test topshirishda muammo yuz berdi.' });
      }
    } catch (error) {
      console.error('Failed to submit test:', error);

      // Handle "Test already completed" case
      if (error.message && error.message.includes('Test already completed')) {
        // Try to fetch the existing attempt result
        try {
          const attempts = await apiService.getAttempts({
            student: currentUser.id,
            test: currentSession.test
          });
          if (attempts && attempts.length > 0) {
            const latestAttempt = attempts[attempts.length - 1];
            setSubmissionResult({
              success: true,
              score: latestAttempt.score
            });
          } else {
            setSubmissionResult({ success: false, error: 'Test allaqachon tugagan, lekin natija topilmadi.' });
          }
        } catch (fetchError) {
          console.error('Failed to fetch existing attempt:', fetchError);
          setSubmissionResult({ success: false, error: 'Test allaqachon tugagan.' });
        }
      } else {
        setSubmissionResult({ success: false, error: error.message || 'Test topshirishda xatolik yuz berdi.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = () => {
    setConfirmDialogOpen(false);
    handleSubmit();
  };

  const handleBackToTests = () => {
    clearSession();
    navigate('/student/take-test');
  };

  const handleViewResults = () => {
    navigate('/student/results');
  };

  if (isSubmitting) {
    return (
      <Box sx={{
        py: 4,
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Paper sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <Typography sx={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1e293b',
            mb: 3
          }}>
            Test topshirilmoqda...
          </Typography>
          <LinearProgress sx={{ mb: 2, height: 8, borderRadius: 4 }} />
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Iltimos kuting, sizning test natijangiz saqlanmoqda...
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (submissionResult) {
    const { success, score, error: submitError } = submissionResult;

    return (
      <Box sx={{
        py: 4,
        backgroundColor: '#ffffff',
        minHeight: '100vh'
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
            Test natijasi
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToTests}
            variant="outlined"
            sx={{
              borderColor: '#d1d5db',
              color: '#374151',
              '&:hover': { backgroundColor: '#f9fafb' }
            }}
          >
            Testlarga qaytish
          </Button>
        </Box>

        <div>
          <Paper sx={{
            p: 4,
            textAlign: 'center',
            background: success && score >= 70
              ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
              : success && score < 70
              ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
              : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: success && score >= 70 ? '1px solid #22c55e' :
                   success && score < 70 ? '1px solid #dc2626' :
                   '1px solid #d97706',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            mx: 'auto'
          }}>
            {success ? (
              <>
                <CheckCircleIcon sx={{
                  fontSize: '4rem',
                  color: score >= 70 ? 'success.main' : 'error.main',
                  mb: 2
                }} />
                <Typography variant="h3" sx={{
                  fontWeight: 700,
                  color: score >= 70 ? 'success.main' : 'error.main',
                  mb: 2
                }}>
                  {score}%
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {selectedTest?.title}
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {score >= 70 ? 'Tabriklaymiz! Testni muvaffaqiyatli topshirdingiz.' : 'Testni qayta topshirib ko\'ring.'}
                </Typography>
              </>
            ) : (
              <>
                <ErrorIcon sx={{
                  fontSize: '4rem',
                  color: 'warning.main',
                  mb: 2
                }} />
                <Typography variant="h6" sx={{
                  fontWeight: 700,
                  color: 'warning.main',
                  mb: 2
                }}>
                  Test topshirishda muammo yuz berdi
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#64748b' }}>
                  {submitError || 'Noma\'lum xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.'}
                </Typography>
              </>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleBackToTests}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: '#6b7280',
                  '&:hover': { backgroundColor: '#4b5563' }
                }}
              >
                Boshqa test topshirish
              </Button>
              {success && (
                <Button
                  variant="outlined"
                  onClick={handleViewResults}
                  sx={{
                    cursor: 'pointer',
                    borderColor: '#2563eb',
                    color: '#2563eb',
                    '&:hover': { backgroundColor: '#eff6ff' }
                  }}
                >
                  Natijalarimni ko'rish
                </Button>
              )}
            </Box>
          </Paper>
        </div>
      </Box>
    );
  }

  // Initial confirmation dialog
  return (
    <Box sx={{
      py: 4,
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Paper sx={{
        p: 4,
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <Typography sx={{
          fontSize: '2rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 3
        }}>
          Testni topshirish
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: '#64748b' }}>
          Siz testni topshirishni xohlaysizmi? Bu amal qaytarib bo'lmaydi.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/student/take-test')}
            sx={{
              borderColor: '#d1d5db',
              color: '#374151',
              '&:hover': { backgroundColor: '#f9fafb' }
            }}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={() => setConfirmDialogOpen(true)}
            disabled={isLoading}
            sx={{
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' }
            }}
          >
            Testni topshirish
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#dc2626', fontWeight: 600 }}>
          Testni topshirishni tasdiqlang
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#374151' }}>
            Rostdan ham testni topshirishni xohlaysizmi? Test tugagandan keyin javoblarni o'zgartirib bo'lmaydi.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setConfirmDialogOpen(false)} sx={{ color: '#64748b' }}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            variant="contained"
            color="success"
            sx={{ ml: 1 }}
          >
            Ha, topshirish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubmitTest;