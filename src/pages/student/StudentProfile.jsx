import React, { useState, useEffect } from 'react';
import 'animate.css';
import { Card, Typography, Row, Col, Button, Avatar, Modal, Alert, Statistic } from 'antd';
import {
  CameraOutlined,
  EditOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  BarChartOutlined,
  UserOutlined,
  BookOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ShoppingOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';
import { useCountdown } from '../../hooks/useCountdown';
import { shouldShowPremiumFeatures } from '../../utils/premiumVisibility';
import GradientPicker from '../../components/GradientPicker';
import { useEconomy } from '../../context/EconomyContext';
import StarPiggyBank from '../../components/economy/StarPiggyBank';
import StarExchange from '../../components/economy/StarExchange';


const { Title, Text, Paragraph } = Typography;

const StudentProfile = () => {
  const { currentUser, setCurrentUserData, logout: _logout } = useAuth();
  const navigate = useNavigate();
  const { ownedTests } = useEconomy();
  const [testCount, setTestCount] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [highestScore, setHighestScore] = useState(0);
  const [curatorTeacher, setCuratorTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [gradientPickerOpen, setGradientPickerOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [selectedGradient, setSelectedGradient] = useState(null);
  const [selectedEmojis, setSelectedEmojis] = useState([]);

  useEffect(() => {
    loadStudentStats();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setStatusText(currentUser.profile_status || '');
      // Initialize gradient and emojis from current user data
      if (currentUser.background_gradient) {
        try {
          const gradientData = typeof currentUser.background_gradient === 'string'
            ? JSON.parse(currentUser.background_gradient)
            : currentUser.background_gradient;
          setSelectedGradient(gradientData);
        } catch (_e) {
          setSelectedGradient(null);
        }
      }
      if (currentUser.selected_emojis) {
        setSelectedEmojis(currentUser.selected_emojis);
      }
    }
  }, [currentUser]);

  // Countdown timer for premium expiry
  const handlePremiumExpire = async () => {
    try {
      // Refresh user data when premium expires
      const updatedUser = await apiService.getUser(currentUser.id);
      setCurrentUserData(updatedUser);
    } catch (error) {
      console.error('Failed to refresh user data on premium expiry:', error);
    }
  };

  const { formattedTime: _formattedTime, isExpired: _isExpired } = useCountdown(currentUser?.premium_expiry_date, handlePremiumExpire);

  const loadStudentStats = React.useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      // Use existing stats from currentUser if available, or fetch them
      setTestCount(currentUser.total_tests_taken || 0);
      setAverageScore(Math.round(currentUser.average_score || 0));

      // Fetch attempts just to get highest score (if needed) and list of teachers for curator
      const [attempts, teachers] = await Promise.all([
        apiService.getAttempts({ student: currentUser.id }),
        apiService.getUsers({ role: 'teacher' }) // Optimized: only fetch teachers
      ]);

      const attemptsList = attempts.results || attempts;
      const teachersList = teachers.results || teachers;

      // Update test count from attempts list for accuracy
      setTestCount(attemptsList.length);

      // Calculate average and highest scores
      const scores = attemptsList.map(attempt => attempt.score || 0);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
      const highScore = scores.length > 0
        ? Math.round(Math.max(...scores))
        : 0;

      setAverageScore(avgScore);
      setHighestScore(highScore);

      // Find curator teacher from optimized teacher list
      const curator = teachersList.find(t => t.is_curator && t.curator_class === currentUser.class_group);
      setCuratorTeacher(curator);
    } catch (error) {
      console.error('Error loading student stats:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if it's a GIF or image
      if (file.type.startsWith('image/')) {
        setProfilePhoto(file);
      } else {
        alert('Faqat rasm fayllarini yuklash mumkin!');
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const formData = new FormData();

      if (profilePhoto) {
        formData.append('profile_photo', profilePhoto);
      }

      formData.append('profile_status', statusText);

      // Add gradient if selected
      if (selectedGradient) {
        formData.append('background_gradient', JSON.stringify(selectedGradient));
      }

      // Add emojis if selected
      if (selectedEmojis.length > 0) {
        formData.append('selected_emojis', JSON.stringify(selectedEmojis));
      }

      const updatedUser = await apiService.patch(`/users/${currentUser.id}/`, formData, true);
      setCurrentUserData(updatedUser);
      setEditDialogOpen(false);
      setProfilePhoto(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3 seconds
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (error.message.includes('401')) {
        alert('Sessiya muddati tugagan. Iltimos, qaytadan kiriting.');
        logout();
      } else {
        alert('Profilni saqlashda xatolik yuz berdi');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfileData = async () => {
    if (!currentUser) return;

    // Only allow deletion for the specific student ID
    if (currentUser.id !== 'TO\'XTAYEVJT9-03-AE114') {
      alert('Bu funksiya faqat ma\'lum o\'quvchi uchun mavjud!');
      return;
    }

    const confirmed = window.confirm(
      '⚠️ Diqqat! Bu amalni bajarishdan oldin o\'ylab ko\'ring:\n\n' +
      '• Profil rasmi o\'chiriladi\n' +
      '• Status xabari o\'chiriladi\n' +
      '• Bu amalni bekor qilib bo\'lmaydi!\n\n' +
      'Davom etishni xohlaysizmi?'
    );

    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      await apiService.deleteStudentProfileData(currentUser.id);

      // Refresh user data
      const updatedUser = await apiService.getUser(currentUser.id);
      setCurrentUserData(updatedUser);

      alert('✅ Profil ma\'lumotlari muvaffaqiyatli o\'chirildi!');
    } catch (error) {
      console.error('Failed to delete profile data:', error);
      alert('❌ Profil ma\'lumotlarini o\'chirishda xatolik yuz berdi');
    } finally {
      setDeleteLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, suffix }) => (
    <Card
      style={{
        backgroundColor: '#ffffff',
        border: `4px solid ${color}`,
        borderRadius: 0,
        boxShadow: `12px 12px 0px ${color}10`,
        transition: 'all 0.3s ease',
      }}
      styles={{ body: { padding: '24px' } }}
      hoverable
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: '12px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#64748b',
              display: 'block',
              marginBottom: '8px'
            }}
          >
            {title}
          </Text>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <Text style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b' }}>{value}</Text>
            {suffix && <Text style={{ fontSize: '18px', fontWeight: 700, color: color }}>{suffix}</Text>}
          </div>
        </div>
        <div
          style={{
            backgroundColor: color,
            borderRadius: 0,
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '16px',
            boxShadow: `4px 4px 0px ${color}40`,
            border: '2px solid rgba(255,255,255,0.4)'
          }}
        >
          {React.cloneElement(icon, {
            style: {
              fontSize: '24px',
              color: '#ffffff'
            }
          })}
        </div>
      </div>
    </Card>
  );

  // Profile background style based on premium status
  const getProfileBackgroundStyle = () => {
    if (shouldShowPremiumFeatures(currentUser, currentUser) && currentUser?.background_gradient) {
      try {
        const gradientData = typeof currentUser.background_gradient === 'string'
          ? JSON.parse(currentUser.background_gradient)
          : currentUser.background_gradient;
        return { background: gradientData.css };
      } catch (e) {
        return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
      }
    }
    if (shouldShowPremiumFeatures(currentUser, currentUser)) {
      return {
        background: `radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)`
      };
    }
    return { background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' };
  };

  // Check if current gradient is a custom premium gradient (not default)
  const isCustomGradient = () => {
    if (shouldShowPremiumFeatures(currentUser, currentUser) && currentUser?.background_gradient) {
      try {
        const gradientData = typeof currentUser.background_gradient === 'string'
          ? JSON.parse(currentUser.background_gradient)
          : currentUser.background_gradient;
        return gradientData.name && gradientData.name !== 'Standart';
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  return (
    <div className="animate__animated animate__fadeIn" style={{
      paddingTop: '16px',
      paddingBottom: '16px',
      backgroundColor: '#ffffff'
    }}>
      <div style={{ marginBottom: '60px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <div style={{ backgroundColor: '#2563eb', color: '#fff', padding: '8px 16px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', display: 'inline-block' }}>
              Profil Ma'lumotlari
            </div>
            <Title level={1} style={{ fontWeight: 900, fontSize: '3rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#1e293b', margin: 0 }}>
              Mening <span style={{ color: '#2563eb' }}>ma'lumotlarim</span>
            </Title>
            <div style={{ width: '80px', height: '10px', backgroundColor: '#2563eb', margin: '24px 0' }}></div>
            <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px', marginBottom: 0 }}>
              Shaxsiy ma'lumotlaringizni ko'rish, tahrirlash va hisobingizni boshqarish bo'limi.
            </Paragraph>
          </div>

          {/* Action Buttons Container */}
          <div style={{
            display: 'flex',
            gap: '12px',
          }} className="header-actions">
            <Button
              size="large"
              icon={<ShoppingOutlined />}
              onClick={() => navigate('/student/pricing')}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 900,
                padding: '12px 24px',
                borderRadius: 0,
                height: 'auto',
                boxShadow: '8px 8px 0px rgba(245, 158, 11, 0.2)',
                border: '4px solid #f59e0b',
                textTransform: 'uppercase'
              }}
            >
              Market
            </Button>

            {/* Edit Button - Only for premium users */}
            {shouldShowPremiumFeatures(currentUser, currentUser) && (
              <Button
                size="large"
                icon={<EditOutlined />}
                onClick={() => setEditDialogOpen(true)}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 900,
                  padding: '12px 24px',
                  borderRadius: 0,
                  height: 'auto',
                  boxShadow: '8px 8px 0px rgba(16, 185, 129, 0.2)',
                  border: '4px solid #10b981',
                  textTransform: 'uppercase'
                }}
              >
                Tahrirlash
              </Button>
            )}

            {/* Delete Profile Data Button - Only for specific student */}
            {currentUser?.id === 'TO\'XTAYEVJT9-03-AE114' && (
              <Button
                size="large"
                icon={<DeleteOutlined />}
                onClick={handleDeleteProfileData}
                loading={deleteLoading}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 900,
                  padding: '12px 24px',
                  borderRadius: 0,
                  height: 'auto',
                  boxShadow: '8px 8px 0px rgba(220, 38, 38, 0.2)',
                  border: '4px solid #dc2626',
                  textTransform: 'uppercase'
                }}
              >
                Profilni tozalash
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="animate__animated animate__fadeIn">
          <Alert
            message="Profil muvaffaqiyatli saqlandi!"
            type="success"
            style={{
              marginBottom: '16px',
              backgroundColor: '#ecfdf5',
              border: '4px solid #10b981',
              color: '#059669',
              borderRadius: 0,
              boxShadow: '8px 8px 0px rgba(16, 185, 129, 0.1)',
              fontWeight: 800
            }}
            showIcon
          />
        </div>
      )}

      {/* Profile Card */}
      <div className="animate__animated animate__fadeIn" style={{ animationDelay: '200ms' }}>
        <Card style={{
          marginBottom: '24px',
          borderRadius: 0,
          border: `4px solid ${isCustomGradient() ? 'rgba(255,255,255,0.3)' : '#2563eb'}`,
          boxShadow: isCustomGradient() ? '12px 12px 0px rgba(0,0,0,0.2)' : '12px 12px 0px rgba(37, 99, 235, 0.1)',
          overflow: 'hidden',
          position: 'relative',
          minHeight: '200px',
          ...getProfileBackgroundStyle()
        }}>
          <div style={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            padding: '32px',
            minHeight: '200px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Profile Photo */}
            <div style={{
              position: 'relative',
              marginBottom: { xs: '12px', md: 0 },
              marginRight: { xs: 0, md: '24px' },
              zIndex: 3
            }}>
              {currentUser?.profile_photo_url ? (
                <Avatar
                  src={currentUser.profile_photo_url}
                  size={140}
                  style={{
                    border: `6px solid ${isCustomGradient() ? '#fff' : '#2563eb'}`,
                    boxShadow: '8px 8px 0px rgba(0,0,0,0.2)',
                    backgroundColor: '#2563eb',
                    borderRadius: 0
                  }}
                >
                  {currentUser?.name.charAt(0).toUpperCase()}
                </Avatar>
              ) : (
                <Avatar
                  size={140}
                  style={{
                    fontSize: '4rem',
                    fontWeight: 'bold',
                    border: `6px solid ${isCustomGradient() ? '#fff' : '#2563eb'}`,
                    boxShadow: '8px 8px 0px rgba(0,0,0,0.2)',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    borderRadius: 0
                  }}
                >
                  {currentUser?.name.charAt(0).toUpperCase()}
                </Avatar>
              )}
            </div>

            {/* Profile Info */}
            <div style={{
              textAlign: { xs: 'center', md: 'left' },
              flex: 1,
              color: isCustomGradient() ? '#ffffff' : '#1e293b',
              position: 'relative',
              marginLeft: "16px",
              zIndex: 2
            }}>
              <Title level={1} style={{
                fontWeight: 900,
                fontSize: '3rem',
                marginBottom: 0,
                color: isCustomGradient() ? '#ffffff' : '#1e293b',
                textShadow: isCustomGradient() ? '4px 4px 0px rgba(0,0,0,0.3)' : 'none',
                textTransform: 'uppercase'
              }}>
                {currentUser?.name}
              </Title>

              {currentUser?.profile_status && (
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginBottom: '16px',
                  fontStyle: 'italic',
                  opacity: 0.9,
                  color: isCustomGradient() ? '#ffffff' : '#1e293b',
                  textShadow: isCustomGradient() ? '2px 2px 0px rgba(0,0,0,0.3)' : 'none'
                }}>
                  "{currentUser.profile_status}"
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <span style={{
                  backgroundColor: '#1e293b',
                  color: '#fff',
                  padding: '6px 16px',
                  borderRadius: 0,
                  fontWeight: 900,
                  fontSize: '0.875rem',
                  border: '2px solid rgba(255,255,255,0.2)',
                  textTransform: 'uppercase'
                }}>
                  O'quvchi
                </span>
                <span style={{
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  padding: '6px 16px',
                  borderRadius: 0,
                  fontWeight: 900,
                  fontSize: '0.875rem',
                  border: '2px solid rgba(255,255,255,0.2)',
                  textTransform: 'uppercase'
                }}>
                  {currentUser?.class_group || 'Noma\'lum'} sinf
                </span>
                <span style={{
                  backgroundColor: '#059669',
                  color: '#fff',
                  padding: '6px 16px',
                  borderRadius: 0,
                  fontWeight: 900,
                  fontSize: '0.875rem',
                  border: '2px solid rgba(255,255,255,0.2)',
                  textTransform: 'uppercase'
                }}>
                  {currentUser?.direction === 'natural' ? 'Tabiiy fanlar' : currentUser?.direction === 'exact' ? 'Aniq fanlar' : 'Yo\'nalish yo\'q'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>


      {/* Statistics Cards */}
      <div className="animate__animated animate__fadeIn" style={{ animationDelay: '400ms' }}>
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="Jami testlar"
              value={loading ? '...' : testCount}
              icon={<BookOutlined />}
              color="#2563eb"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="O'rtacha ball"
              value={loading ? '...' : averageScore}
              suffix="%"
              icon={<TrophyOutlined />}
              color="#16a34a"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="Eng yuqori ball"
              value={loading ? '...' : highestScore}
              suffix="%"
              icon={<BarChartOutlined />}
              color="#059669"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="Premium status"
              value={currentUser?.premium_info?.is_premium ? 'Faol' : 'Yo\'q'}
              icon={<StarOutlined />}
              color={currentUser?.premium_info?.is_premium ? '#d97706' : '#6b7280'}
            />
          </Col>
        </Row>
      </div>


      <div className="animate__animated animate__fadeIn" style={{ animationDelay: '500ms', marginTop: '40px' }}>
        <Title level={3} style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '24px', fontSize: '1.75rem' }}>
          Mening Sotib Olingan Testlarim
        </Title>
        <div
          style={{
            backgroundColor: '#fff',
            border: '4px solid #000',
            boxShadow: '8px 8px 0px #000',
            padding: '32px',
            minHeight: '120px'
          }}
        >
          {ownedTests.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {ownedTests.map(testId => (
                <div
                  key={testId}
                  style={{
                    backgroundColor: '#22c55e',
                    color: '#fff',
                    padding: '8px 16px',
                    fontWeight: 900,
                    border: '3px solid #000',
                    boxShadow: '4px 4px 0px #000',
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}
                >
                  Test ID: {testId} (SOTIB OLINGAN)
                </div>
              ))}
            </div>
          ) : (
            <Text type="secondary" style={{ fontStyle: 'italic', fontWeight: 600, fontSize: '1.1rem' }}>
              Hali hech qanday test sotib olmagansiz. Test yulduzlarini to'plang va yangi testlarni kashf qiling!
            </Text>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Modal
        title={
          <div>
            <div style={{ backgroundColor: '#2563eb', color: '#fff', padding: '4px 12px', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px', display: 'inline-block' }}>
              Sozlamalar
            </div>
            <Title level={4} style={{ fontWeight: 900, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#1e293b', margin: 0 }}>
              Profilni <span style={{ color: '#2563eb' }}>sozlash</span>
            </Title>
          </div>
        }
        open={editDialogOpen}
        onOk={handleSaveProfile}
        onCancel={() => setEditDialogOpen(false)}
        okText="SAQLASH"
        cancelText="BEKOR QILISH"
        confirmLoading={saving}
        width={600}
        closeIcon={<span className="material-symbols-outlined" style={{ color: '#000', fontWeight: 900 }}>close</span>}
        style={{ top: 20 }}
        modalRender={(modal) => (
          <div style={{
            border: '6px solid #000',
            boxShadow: '16px 16px 0px rgba(0,0,0,1)',
            borderRadius: 0,
            overflow: 'hidden'
          }}>
            {modal}
          </div>
        )}
        styles={{
          header: {
            borderRadius: 0,
            borderBottom: '4px solid #000',
            padding: '24px',
            margin: 0,
            backgroundColor: '#f8fafc'
          },
          body: {
            padding: '32px',
            backgroundColor: '#fff'
          },
          footer: {
            borderRadius: 0,
            borderTop: '4px solid #000',
            padding: '24px',
            margin: 0,
            backgroundColor: '#f8fafc'
          }
        }}
        okButtonProps={{
          style: {
            borderRadius: 0,
            height: 'auto',
            padding: '12px 32px',
            fontWeight: 900,
            fontSize: '1rem',
            backgroundColor: '#2563eb',
            border: '4px solid #000',
            boxShadow: '4px 4px 0px #000',
            textTransform: 'uppercase'
          }
        }}
        cancelButtonProps={{
          style: {
            borderRadius: 0,
            height: 'auto',
            padding: '12px 32px',
            fontWeight: 900,
            fontSize: '1rem',
            backgroundColor: '#fff',
            color: '#000',
            border: '4px solid #000',
            boxShadow: '4px 4px 0px #000',
            textTransform: 'uppercase'
          }
        }}
      >
        <div style={{ paddingTop: '8px' }}>
          {/* Profile Photo Upload */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#f59e0b', color: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0 }}>
                <CameraOutlined style={{ fontSize: '18px' }} />
              </div>
              <Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' }}>
                Profil rasmi
              </Title>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Avatar
                src={profilePhoto ? URL.createObjectURL(profilePhoto) : currentUser?.profile_photo_url}
                size={100}
                style={{
                  border: '4px solid #f59e0b',
                  boxShadow: '8px 8px 0px rgba(245, 158, 11, 0.1)',
                  borderRadius: 0,
                  backgroundColor: '#2563eb'
                }}
              >
                {currentUser?.name.charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Button
                  onClick={() => document.getElementById('profile-photo-input').click()}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    borderWidth: '2px',
                    color: '#1e293b',
                    fontWeight: 900,
                    borderRadius: 0,
                    height: 'auto',
                    padding: '10px 20px',
                    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.05)',
                    textTransform: 'uppercase'
                  }}
                >
                  Rasm tanlash
                </Button>
                <input
                  id="profile-photo-input"
                  type="file"
                  accept="image/*,.gif"
                  hidden
                  onChange={handlePhotoChange}
                />
                <Text style={{ marginTop: '12px', display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  GIF va rasm fayllarini yuklash mumkin
                </Text>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#3b82f6', color: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0 }}>
                <EditOutlined style={{ fontSize: '18px' }} />
              </div>
              <Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' }}>
                Status xabari
              </Title>
            </div>
            <textarea
              rows={3}
              placeholder="Sizning status xabaringiz..."
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 0,
                border: '4px solid #3b82f6',
                fontSize: '1rem',
                fontWeight: 600,
                resize: 'none',
                boxShadow: '8px 8px 0px rgba(59, 130, 246, 0.05)'
              }}
            />
            <Text style={{ marginTop: '8px', display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              Status xabari boshqa o'quvchilarga ko'rinadi
            </Text>
          </div>

          {/* Gradient Selection */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#10b981', color: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0 }}>
                <StarOutlined style={{ fontSize: '18px' }} />
              </div>
              <Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' }}>
                Profil fon gradienti
              </Title>
            </div>
            <div
              onClick={() => setGradientPickerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                border: '4px solid #10b981',
                borderRadius: 0,
                cursor: 'pointer',
                backgroundColor: '#fff',
                boxShadow: '8px 8px 0px rgba(16, 185, 129, 0.05)'
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: 0,
                background: selectedGradient?.css || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '3px solid #10b981',
                boxShadow: '4px 4px 0px rgba(16, 185, 129, 0.1)'
              }} />
              <div style={{ flex: 1 }}>
                <Text style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                  {selectedGradient?.name || 'Gradient tanlash'}
                </Text>
                <Text style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  Premium profilingiz uchun chiroyli gradient tanlang
                </Text>
              </div>
              <Button
                style={{
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontWeight: 900,
                  borderRadius: 0,
                  border: '2px solid rgba(255,255,255,0.2)',
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.05)',
                  textTransform: 'uppercase'
                }}
              >
                Tanlash
              </Button>
            </div>
          </div>

        </div>
      </Modal>

      {/* Gradient Picker Modal */}
      <GradientPicker
        open={gradientPickerOpen}
        onClose={() => setGradientPickerOpen(false)}
        selectedGradient={selectedGradient}
        onGradientSelect={(gradient) => {
          setSelectedGradient(gradient);
          setGradientPickerOpen(false);
        }}
      />


    </div>
  );
};

export default StudentProfile;