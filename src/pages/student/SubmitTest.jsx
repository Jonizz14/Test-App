import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Spin, ConfigProvider, Result } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  TrophyOutlined,
  FrownOutlined
} from '@ant-design/icons';
import { useServerTest } from '../../context/ServerTestContext';
import { useAuth } from '../../context/AuthContext';
import { useEconomy } from '../../context/EconomyContext';
import apiService from '../../data/apiService';

const triggerStarAnimation = () => {
  const rect = document.querySelector('.neon-gold-text')?.getBoundingClientRect();
  const targetX = rect ? rect.left + rect.width / 2 : window.innerWidth - 100;
  const targetY = rect ? rect.top + rect.height / 2 : 50;

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const star = document.createElement('div');
      star.className = 'star-particle';
      star.innerHTML = '⭐';
      star.style.left = `${window.innerWidth / 2}px`;
      star.style.top = `${window.innerHeight / 2}px`;

      const deltaX = targetX - (window.innerWidth / 2);
      const deltaY = targetY - (window.innerHeight / 2);

      star.style.setProperty('--target-x', `${deltaX}px`);
      star.style.setProperty('--target-y', `${deltaY}px`);

      document.body.appendChild(star);

      setTimeout(() => star.remove(), 1000);
    }, i * 150);
  }
};

const { Title, Text } = Typography;

const SubmitTest = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    currentSession,
    submitTest,
    clearSession,
    selectedTest,
  } = useServerTest();
  const { addStars } = useEconomy();

  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Auto-submit when component mounts
    handleSubmit();
  }, []);

  const handleSubmit = async () => {
    if (!currentSession) {
      setSubmissionResult({ success: false, error: 'Sessiya topilmadi. Qaytadan boshlang.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitTest();
      if (result && result.success) {
        setSubmissionResult(result);
        triggerStarAnimation();
      } else {
        setSubmissionResult({ success: false, error: result?.error || 'Test topshirishda muammo yuz berdi.' });
      }
    } catch (error) {
      console.error('Failed to submit test:', error);
      if (error.message && (error.message.includes('Test already completed') || error.message.includes('DUPLICATE_ATTEMPT'))) {
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
          setSubmissionResult({ success: false, error: 'Test allaqachon tugagan.' });
        }
      } else {
        setSubmissionResult({ success: false, error: error.message || 'Test topshirishda xatolik yuz berdi.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToTests = () => {
    clearSession();
    navigate('/student/take-test');
  };

  const handleViewResults = () => {
    navigate('/student/results');
  };

  const commonButtonStyle = {
    borderRadius: 0,
    border: '3px solid #000',
    fontWeight: 900,
    textTransform: 'uppercase',
    height: '48px',
    padding: '0 32px',
    boxShadow: '4px 4px 0px #000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  if (isSubmitting) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff'
      }}>
        <div style={{ textAlign: 'center', border: '4px solid #000', padding: '40px', boxShadow: '8px 8px 0px #000' }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: '24px', fontWeight: 900, textTransform: 'uppercase' }}>Natijalar hisoblanmoqda...</Title>
        </div>
      </div>
    );
  }

  if (submissionResult) {
    const { success, score, error: submitError } = submissionResult;
    // Score thresholds
    const isHighScore = success && score >= 80;
    const isPass = success && score >= 60;

    // Colors based on score
    const scoreColor = isHighScore ? '#16a34a' : (isPass ? '#2563eb' : '#dc2626');
    const accentColor = isHighScore ? '#bbf7d0' : (isPass ? '#bfdbfe' : '#fecaca');

    return (
      <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000', fontFamily: 'Inter, sans-serif' } }}>
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#fff',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Card
            bordered={false}
            style={{
              maxWidth: '600px',
              width: '100%',
              border: '4px solid #000',
              boxShadow: '12px 12px 0px #000',
              borderRadius: 0,
              backgroundColor: success ? '#fff' : '#fff5f5'
            }}
            styles={{ body: { padding: '48px 24px', textAlign: 'center' } }}
          >
            {success ? (
              <>
                <div style={{
                  width: '100px',
                  height: '100px',
                  margin: '0 auto 24px auto',
                  backgroundColor: accentColor,
                  border: '3px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '4px 4px 0px #000'
                }}>
                  {isHighScore ?
                    <TrophyOutlined style={{ fontSize: '48px', color: '#000' }} /> :
                    (isPass ? <CheckCircleOutlined style={{ fontSize: '48px', color: '#000' }} /> : <CloseCircleOutlined style={{ fontSize: '48px', color: '#000' }} />)
                  }
                </div>

                <Text style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666' }}>Test Natijasi</Text>

                <Title level={1} style={{
                  fontSize: '5rem',
                  fontWeight: 900,
                  lineHeight: 1,
                  margin: '16px 0 8px 0',
                  color: '#000' // Black score for brutalism, or use scoreColor if preferred
                }}>
                  {score}%
                </Title>

                <Title level={3} style={{ fontWeight: 900, margin: '0 0 32px 0', textTransform: 'uppercase' }}>
                  {isHighScore ? "Qoyilmaqom!" : (isPass ? "Yaxshi natija!" : "Afsuski, o'tmadingiz")}
                </Title>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    onClick={handleViewResults}
                    style={{
                      ...commonButtonStyle,
                      backgroundColor: '#000',
                      color: '#fff'
                    }}
                  >
                    Natijalar
                  </Button>
                  <Button
                    onClick={handleBackToTests}
                    style={{
                      ...commonButtonStyle,
                      backgroundColor: '#fff',
                      color: '#000'
                    }}
                  >
                    Testlarga qaytish
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 24px auto',
                  backgroundColor: '#fee2e2',
                  border: '3px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '4px 4px 0px #000'
                }}>
                  <FrownOutlined style={{ fontSize: '40px', color: '#000' }} />
                </div>
                <Title level={2} style={{ fontWeight: 900, textTransform: 'uppercase', color: '#dc2626' }}>Xatolik</Title>
                <Text style={{ fontSize: '1.1rem', fontWeight: 700, display: 'block', marginBottom: '32px' }}>
                  {submitError || "Tizimda xatolik yuz berdi."}
                </Text>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleSubmit}
                    style={{
                      ...commonButtonStyle,
                      backgroundColor: '#fff',
                      color: '#000'
                    }}
                  >
                    Qayta urinib ko'rish
                  </Button>
                  <Button
                    onClick={handleBackToTests}
                    style={{
                      ...commonButtonStyle,
                      backgroundColor: '#000',
                      color: '#fff',
                      border: '3px solid #000'
                    }}
                  >
                    Chiqish
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin />
    </div>
  );
};

export default SubmitTest;