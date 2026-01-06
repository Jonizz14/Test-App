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

const { Title, Text } = Typography;

const StudentProfile = () => {
  const { currentUser, setCurrentUserData, logout } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => {
    loadStudentStats();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setStatusText(currentUser.profile_status || '');
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

  const { formattedTime, isExpired } = useCountdown(currentUser?.premium_expiry_date, handlePremiumExpire);

  const loadStudentStats = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const [attempts, users] = await Promise.all([
        apiService.getAttempts({ student: currentUser.id }),
        apiService.getUsers()
      ]);
      const attemptsList = attempts.results || attempts;
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

      // Find curator teacher
      const teachers = users.filter(user => user.role === 'teacher');
      const curator = teachers.find(t => t.is_curator && t.curator_class === currentUser.class_group);
      setCuratorTeacher(curator);
    } catch (error) {
      console.error('Error loading student stats:', error);
      setTestCount(0);
      setCuratorTeacher(null);
    } finally {
      setLoading(false);
    }
  };

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
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
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
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#64748b',
              display: 'block',
              marginBottom: '8px'
            }}
          >
            {title}
          </Text>
          <Statistic
            value={value}
            suffix={suffix}
            styles={{
              content: {
                fontSize: '32px',
                fontWeight: 700,
                color: '#1e293b',
                lineHeight: 1.2
              }
            }}
          />
        </div>
        <div
          style={{
            backgroundColor: color,
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '16px'
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

  return (
    <div className="animate__animated animate__fadeIn" style={{
      paddingTop: '16px',
      paddingBottom: '16px',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div className="animate__animated animate__slideInDown" style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {/* Main Content with Flex Layout */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Title and Description */}
          <div style={{
            flex: 1
          }}>
            <Title level={2} style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '12px'
            }}>
              Mening ma'lumotlarim
            </Title>
            <Text style={{
              fontSize: '1.125rem',
              color: '#64748b',
              fontWeight: 400
            }}>
              Shaxsiy ma'lumotlaringizni ko'rish va tahrirlash
            </Text>
          </div>
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginLeft: '16px'
          }}>
            <Button
              size="large"
              icon={<ShoppingOutlined />}
              onClick={() => navigate('/student/pricing')}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 600,
                padding: '12px 24px',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
                borderColor: '#f59e0b',
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
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  padding: '12px 24px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                  borderColor: '#10b981',
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
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  padding: '12px 24px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)',
                  borderColor: '#dc2626',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#b91c1c';
                  e.target.style.boxShadow = '0 8px 30px rgba(220, 38, 38, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#dc2626';
                  e.target.style.boxShadow = '0 4px 20px rgba(220, 38, 38, 0.3)';
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
        <div className="animate__animated animate__slideInRight">
          <Alert
          message="✅ Profil muvaffaqiyatli saqlandi!"
          type="success"
          style={{
            marginBottom: '16px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#059669',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}
          showIcon
          />
        </div>
      )}

      {/* Profile Card */}
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '200ms' }}>
        <Card style={{
        marginBottom: '16px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '200px',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          padding: '24px',
          minHeight: '200px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Profile Photo */}
          <div style={{
            position: 'relative',
            marginBottom: { xs: '12px', md: 0 },
            marginRight: { xs: 0, md: '16px' },
            zIndex: 3
          }}>
            {currentUser?.profile_photo_url ? (
              <Avatar
                src={currentUser.profile_photo_url}
                size={120}
                style={{
                  border: '4px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  backgroundColor: '#2563eb'
                }}
              >
                {currentUser?.name.charAt(0).toUpperCase()}
              </Avatar>
            ) : (
              <Avatar
                size={120}
                style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  border: '4px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  backgroundColor: '#2563eb',
                  color: '#ffffff'
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
            color: '#1e293b',
            position: 'relative',
            marginLeft: "10px",
            zIndex: 2
          }}>
            <Title level={2} style={{
              fontWeight: 700,
              marginBottom: '-20px',
              color: '#1e293b'
            }}>
              {currentUser?.name}
            </Title>

            {currentUser?.profile_status && (
              <Title level={4} style={{
                marginBottom: '16px',
                fontStyle: 'italic',
                opacity: 0.9,
                color: '#1e293b'
              }}>
                "{currentUser.profile_status}"
              </Title>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <span style={{
                backgroundColor: '#ecfdf5',
                color: '#059669',
                padding: '4px 12px',
                borderRadius: '16px',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}>
                O'quvchi
              </span>
              <span style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                padding: '4px 12px',
                borderRadius: '16px',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}>
                {currentUser?.class_group || 'Noma\'lum'} sinf
              </span>
              <span style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '4px 12px',
                borderRadius: '16px',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}>
                {currentUser?.direction === 'natural' ? 'Tabiiy fanlar' : currentUser?.direction === 'exact' ? 'Aniq fanlar' : 'Yo\'nalish yo\'q'}
              </span>
            </div>
          </div>
        </div>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '400ms' }}>
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Topshirilgan testlar"
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



      {/* Edit Profile Dialog */}
      <div className="animate__animated animate__zoomIn">
        <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <EditOutlined style={{ color: '#2563eb' }} />
            Profilni sozlash
          </div>
        }
        open={editDialogOpen}
        onCancel={() => setEditDialogOpen(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setEditDialogOpen(false)} style={{ color: '#64748b' }}>
            Bekor qilish
          </Button>,
          <Button key="submit" type="primary" onClick={handleSaveProfile} loading={saving} style={{ backgroundColor: '#2563eb' }}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        ]}
        style={{ top: 20 }}
      >
        <div style={{ paddingTop: '8px' }}>
          {/* Profile Photo Upload */}
          <div style={{ marginBottom: '16px' }}>
            <Title level={6} style={{ marginBottom: '8px', fontWeight: 600, color: '#1e293b' }}>
              📸 Profil rasmi
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar
                src={profilePhoto ? URL.createObjectURL(profilePhoto) : currentUser?.profile_photo_url}
                size={80}
                style={{
                  border: '3px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              >
                {currentUser?.name.charAt(0).toUpperCase()}
              </Avatar>
              <Button
                icon={<CameraOutlined />}
                onClick={() => document.getElementById('profile-photo-input').click()}
                style={{
                  borderColor: '#2563eb',
                  color: '#2563eb',
                  borderRadius: '8px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#eff6ff';
                  e.target.style.borderColor = '#1d4ed8';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
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
            </div>
            <Text style={{ marginTop: '4px', display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
              GIF va rasm fayllarini yuklash mumkin (animatsion GIFlar ham qo'llab-quvvatlanadi)
            </Text>
          </div>

          {/* Status Message */}
          <div style={{ marginBottom: '16px' }}>
            <Title level={6} style={{ marginBottom: '8px', fontWeight: 600, color: '#1e293b' }}>
              💬 Status xabari
            </Title>
            <textarea
              rows={3}
              placeholder="Sizning status xabaringiz..."
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                resize: 'none'
              }}
            />
            <Text style={{ marginTop: '4px', display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
              Status xabari boshqa o'quvchilarga ko'rinadi
            </Text>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
};

export default StudentProfile;