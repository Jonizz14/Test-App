import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Progress, Alert, Modal } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useServerTest } from '../../context/ServerTestContext';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

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
      <div style={{
        paddingTop: '16px',
        paddingBottom: '16px',
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card style={{
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <Title level={2} style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '16px'
          }}>
            Test natijasi
          </Title>
          <Progress 
            percent={100} 
            status="active"
            style={{ marginBottom: '16px' }}
            strokeColor="#3b82f6"
          />
          <Text style={{ color: '#64748b', marginBottom: '16px', display: 'block' }}>
            Iltimos kuting, sizning test natijangiz saqlanmoqda...
          </Text>
        </Card>
      </div>
    );
  }

  if (submissionResult) {
    const { success, score, error: submitError } = submissionResult;
    const isHighScore = success && score >= 70;

    return (
      <div style={{
        paddingTop: '16px',
        paddingBottom: '16px',
        backgroundColor: '#ffffff',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {/* Title, Description, and Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <Title level={2} style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '4px'
              }}>
                Test natijasi
              </Title>
              <Text style={{
                fontSize: '1.125rem',
                color: '#64748b',
                fontWeight: 400
              }}>
                Testni topshirish natijasi va ballaringiz
              </Text>
            </div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToTests}
              style={{
                borderColor: '#d1d5db',
                color: '#374151',
                marginLeft: '16px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Testlarga qaytish
            </Button>
          </div>
        </div>

        <div>
          <Card style={{
            padding: '24px',
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
            margin: '0 auto'
          }}>
            {success ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  {score >= 70 ? (
                    <CheckCircleOutlined style={{
                      fontSize: '4rem',
                      color: '#22c55e'
                    }} />
                  ) : (
                    <CloseCircleOutlined style={{
                      fontSize: '4rem',
                      color: '#dc2626'
                    }} />
                  )}
                </div>
                <Title level={1} style={{
                  fontWeight: 700,
                  color: score >= 70 ? '#22c55e' : '#dc2626',
                  marginBottom: '16px',
                  marginTop: 0
                }}>
                  {score}%
                </Title>
                <Title level={4} style={{ marginBottom: '16px' }}>
                  {selectedTest?.title}
                </Title>
                <Text style={{ marginBottom: '16px', display: 'block' }}>
                  {score >= 70 ? 'Tabriklaymiz! Testni muvaffaqiyatli topshirdingiz.' : 'Testni qayta topshirib ko\'ring.'}
                </Text>
              </>
            ) : (
              <>
                <CloseCircleOutlined style={{
                  fontSize: '4rem',
                  color: '#d97706',
                  marginBottom: '16px'
                }} />
                <Title level={4} style={{
                  fontWeight: 700,
                  color: '#d97706',
                  marginBottom: '16px'
                }}>
                  Test topshirishda muammo yuz berdi
                </Title>
                <Text style={{ marginBottom: '16px', color: '#64748b', display: 'block' }}>
                  {submitError || 'Noma\'lum xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.'}
                </Text>
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                type="primary"
                onClick={handleBackToTests}
                style={{
                  cursor: 'pointer',
                  backgroundColor: '#6b7280',
                  borderColor: '#6b7280'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#6b7280';
                }}
              >
                Boshqa test topshirish
              </Button>
              {success && (
                <Button
                  onClick={handleViewResults}
                  style={{
                    cursor: 'pointer',
                    borderColor: '#2563eb',
                    color: '#2563eb',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  Natijalarimni ko'rish
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Initial confirmation dialog
  return (
    <div style={{
      paddingTop: '16px',
      paddingBottom: '16px',
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Card style={{
        padding: '24px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <Title level={2} style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '16px'
        }}>
          Test natijasi
        </Title>
        <Text style={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400,
          marginBottom: '16px',
          display: 'block'
        }}>
          Testni topshirish natijasi va ballaringiz
        </Text>
        <Text style={{ marginBottom: '16px', color: '#64748b', display: 'block' }}>
          Siz testni topshirishni xohlaysizmi? Bu amal qaytarib bo'lmaydi.
        </Text>

        {error && (
          <Alert message={error} type="error" style={{ marginBottom: '16px' }} />
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <Button
            onClick={() => navigate('/student/take-test')}
            style={{
              borderColor: '#d1d5db',
              color: '#374151',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Bekor qilish
          </Button>
          <Button
            type="primary"
            onClick={() => setConfirmDialogOpen(true)}
            disabled={isLoading}
            style={{
              backgroundColor: '#10b981',
              borderColor: '#10b981'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#10b981';
              }
            }}
          >
            Testni topshirish
          </Button>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <Modal
        title={
          <span style={{ color: '#dc2626', fontWeight: 600 }}>
            Testni topshirishni tasdiqlang
          </span>
        }
        open={confirmDialogOpen}
        onCancel={() => setConfirmDialogOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmDialogOpen(false)} style={{ color: '#64748b' }}>
            Bekor qilish
          </Button>,
          <Button key="submit" type="primary" onClick={handleConfirmSubmit} style={{ marginLeft: '8px', backgroundColor: '#10b981', borderColor: '#10b981' }}>
            Ha, topshirish
          </Button>
        ]}
      >
        <Text style={{ color: '#374151' }}>
          Rostdan ham testni topshirishni xohlaysizmi? Test tugagandan keyin javoblarni o'zgartirib bo'lmaydi.
        </Text>
      </Modal>
    </div>
  );
};

export default SubmitTest;