import React, { useState, useEffect } from 'react';
import 'animate.css';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Avatar, Tag, Row, Col, Alert, Statistic } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  BarChartOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import { shouldShowPremiumFeatures } from '../../utils/premiumVisibility';

const { Title, Text } = Typography;

const StatCard = ({ title, value, icon, color, suffix, valueComponent, iconColor = '#ffffff' }) => (
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
        {valueComponent || (
          <Statistic
            value={value}
            suffix={suffix}
            styles={{
              content: {
                fontSize: '40px',
                fontWeight: 700,
                color: '#1e293b',
                lineHeight: 1.2
              }
            }}
          />
        )}
      </div>
      <div
        style={{
          backgroundColor: color,
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '16px'
        }}
      >
        {React.cloneElement(icon, {
          style: {
            fontSize: '32px',
            color: iconColor
          }
        })}
      </div>
    </div>
  </Card>
);

const StudentProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [student, setStudent] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [emojiPositions, setEmojiPositions] = useState([]);
  const [placedGifts, setPlacedGifts] = useState([]);
  const [myGifts, setMyGifts] = useState([]);
  const [displayGift, setDisplayGift] = useState(null);

  useEffect(() => {
    const loadStudentProfile = async () => {
      try {
        setLoading(true);

        // Get all users to find the student
        const users = await apiService.getUsers();
        const studentData = users.find(user => user.id === parseInt(id));
        setStudent(studentData);

        if (!studentData) {
          setError('O\'quvchi topilmadi');
          return;
        }

        // Check if this is the current user's own profile
        setIsOwnProfile(currentUser?.id === parseInt(id));

        // Get attempts by this student
        const allAttempts = await apiService.getAttempts({ student: id });
        setAttempts(allAttempts);

        // Generate random positions for the emojis if they exist
        const emojis = studentData.selected_emojis || [];
        if (emojis.length > 0) {
          setEmojiPositions(generateRandomPositions(emojis.length));
        }

      } catch (error) {
        console.error('Failed to load student profile:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadStudentProfile();
  }, [id, currentUser]);

  // Function to generate random positions for emojis
  const generateRandomPositions = (emojiCount) => {
    const positions = [];
    for (let i = 0; i < emojiCount; i++) {
      positions.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 15 + Math.random() * 10,
        scale: 0.7 + Math.random() * 0.6,
        rotation: Math.random() * 360
      });
    }
    return positions;
  };

  // Calculate statistics
  const totalTests = attempts.length;
  const scores = attempts.map(attempt => attempt.score || 0);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
  const highestScore = scores.length > 0
    ? Math.round(Math.max(...scores))
    : 0;

  if (loading) {
    return (
      <div style={{
        paddingTop: '32px',
        paddingBottom: '32px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        gap: '16px'
      }}>
        <Text>Yuklanmoqda...</Text>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div style={{
        paddingTop: '32px',
        paddingBottom: '32px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Text type="danger">{error || 'O\'quvchi topilmadi'}</Text>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginTop: '8px' }}
        >
          Orqaga
        </Button>
      </div>
    );
  }

  const profileBackgroundStyle = shouldShowPremiumFeatures(student, currentUser) && student.background_gradient
    ? { 
        background: (typeof student.background_gradient === 'string'
            ? JSON.parse(student.background_gradient).css
            : student.background_gradient.css)
      }
    : shouldShowPremiumFeatures(student, currentUser)
      ? {
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)
          `
        }
      : { background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' };

  return (
    <div className="animate__animated animate__fadeIn" style={{ paddingTop: '16px', paddingBottom: '16px', backgroundColor: '#ffffff' }}>
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
          {/* Left Side - Back Button and Title/Description */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1
          }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              style={{
                  borderColor: '#e2e8f0',
                  color: '#64748b'
              }}
            >
              Orqaga
            </Button>
            
            {/* Title and Description */}
            <div style={{
              marginLeft: '8px'
            }}>
              <Title level={2} style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '-1px'
              }}>
                Sinfdosh profili
              </Title>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Profile Card */}
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '200ms' }}>
        <Card style={{
        marginBottom: '16px',
        ...profileBackgroundStyle,
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '250px',
      }}>
        {/* Premium Badge */}
        {shouldShowPremiumFeatures(student, currentUser) && (
          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 2
          }}>
            <Tag
              icon={<TrophyOutlined />}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#d97706',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              PREMIUM
            </Tag>
          </div>
        )}

        <div style={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          padding: '24px',
          minHeight: '200px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* CSS Animations for Swimming Emojis */}
          <style>{`
            ${Array.from({ length: 20 }).map((_, i) => `
              @keyframes swimAllEmojis-${i} {
                0% { 
                  transform: translateX(${(i % 4 - 2) * 25}%) translateY(0%) rotate(${i * 18}deg) scale(${0.7 + (i % 3) * 0.1}); 
                }
                25% { 
                  transform: translateX(${(i % 4 - 1) * 25}%) translateY(-20%) rotate(${i * 18 + 90}deg) scale(${0.7 + ((i + 1) % 3) * 0.1}); 
                }
                50% { 
                  transform: translateX(${(i % 4) * 25}%) translateY(-40%) rotate(${i * 18 + 180}deg) scale(${0.7 + ((i + 2) % 3) * 0.1}); 
                }
                75% { 
                  transform: translateX(${(i % 4 + 1) * 25}%) translateY(-20%) rotate(${i * 18 + 270}deg) scale(${0.7 + ((i + 1) % 3) * 0.1}); 
                }
                100% { 
                  transform: translateX(${(i % 4 - 2) * 25}%) translateY(0%) rotate(${i * 18 + 360}deg) scale(${0.7 + (i % 3) * 0.1}); 
                }
              }
            `).join('')}
          `}</style>
          
          {/* Emoji Background for Premium Users */}
          {shouldShowPremiumFeatures(student, currentUser) && student.selected_emojis && student.selected_emojis.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 1,
              overflow: 'hidden'
            }}>
              {/* Floating emoji animation container */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                animation: 'swimEmojis 25s infinite linear'
              }}>
                {/* Random positioned animated emojis */}
                {student.selected_emojis.map((emoji, index) => {
                  const position = emojiPositions[index] || {
                    left: Math.random() * 100,
                    top: Math.random() * 100,
                    delay: Math.random() * 5,
                    duration: 15 + Math.random() * 10,
                    scale: 0.7 + Math.random() * 0.6,
                    rotation: Math.random() * 360
                  };
                  
                  return (
                    <div
                      key={`emoji-${index}`}
                      style={{
                        position: 'absolute',
                        fontSize: '3rem',
                        opacity: 0.25 + (index % 3) * 0.05,
                        color: 'rgba(255, 255, 255, 0.9)',
                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                        left: `${position.left}%`,
                        top: `${position.top}%`,
                        transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
                        animation: `swimAllEmojis-${index % 20} ${position.duration}s infinite ease-in-out`,
                        animationDelay: `${position.delay}s`,
                        zIndex: 1
                      }}
                    >
                      {emoji}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Profile Photo */}
          <div style={{
            position: 'relative',
            marginBottom: { xs: '12px', md: 0 },
            marginRight: { xs: 0, md: '16px' },
            zIndex: 3
          }}>
            {student.profile_photo ? (
              <Avatar
                src={student.profile_photo}
                size={150}
                style={{
                  border: '4px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  backgroundColor: shouldShowPremiumFeatures(student, currentUser) ? '#ffffff' : '#2563eb'
                }}
              >
                {student.name.charAt(0).toUpperCase()}
              </Avatar>
            ) : (
              <Avatar
                size={150}
                style={{
                  fontSize: '4rem',
                  fontWeight: 'bold',
                  border: '4px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  backgroundColor: shouldShowPremiumFeatures(student, currentUser) ? '#ffffff' : '#2563eb',
                  color: shouldShowPremiumFeatures(student, currentUser) ? '#2563eb' : '#ffffff'
                }}
              >
                {student.name.charAt(0).toUpperCase()}
              </Avatar>
            )}

            {/* Premium Checkmark */}
            {shouldShowPremiumFeatures(student, currentUser) && (
              <div style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                backgroundColor: '#10b981',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <CheckCircleOutlined style={{ color: 'white', fontSize: '1.2rem' }} />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div style={{
            textAlign: { xs: 'center', md: 'left' },
            flex: 1,
            color: student.is_premium ? '#ffffff' : '#1e293b',
            position: 'relative',
            marginLeft: '16px',
            zIndex: 2
          }}>
            <Title level={2} style={{
              fontWeight: 700,
              marginBottom: '8px',
              textShadow: student.is_premium ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
              color: student.is_premium ? '#ffffff' : '#1e293b'
            }}>
              {student.name}
            </Title>

            {student.profile_status && (
              <Title level={4} style={{
                marginBottom: '16px',
                fontStyle: 'italic',
                opacity: 0.9,
                textShadow: student.is_premium ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                color: student.is_premium ? '#ffffff' : '#1e293b'
              }}>
                "{student.profile_status}"
              </Title>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Tag
                style={{
                  backgroundColor: student.is_premium ? 'rgba(255, 255, 255, 0.2)' : '#ecfdf5',
                  color: student.is_premium ? '#ffffff' : '#059669',
                  border: student.is_premium ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontWeight: 600
                }}
              >
                O'quvchi
              </Tag>
              <Tag
                style={{
                  backgroundColor: student.is_premium ? 'rgba(255, 255, 255, 0.2)' : '#eff6ff',
                  color: student.is_premium ? '#ffffff' : '#2563eb',
                  border: student.is_premium ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontWeight: 600
                }}
              >
                {student.class_group || 'Noma\'lum'} sinf
              </Tag>
              <Tag
                style={{
                  backgroundColor: student.is_premium ? 'rgba(255, 255, 255, 0.2)' : '#f3f4f6',
                  color: student.is_premium ? '#ffffff' : '#374151',
                  border: student.is_premium ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontWeight: 600
                }}
              >
                {student.direction === 'natural' ? 'Tabiiy fanlar' : student.direction === 'exact' ? 'Aniq fanlar' : 'Yo\'nalish yo\'q'}
              </Tag>
            </div>
          </div>
        </div>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '400ms' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Topshirilgan testlar"
            value={totalTests}
            icon={<BarChartOutlined />}
            color="#2563eb"
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="O'rtacha ball"
            value={averageScore}
            suffix="%"
            icon={<TrophyOutlined />}
            color="#16a34a"
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Eng yuqori ball"
            value={highestScore}
            suffix="%"
            icon={<TrophyOutlined />}
            color="#059669"
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Premium status"
            icon={<TrophyOutlined />}
            color={student.is_premium ? '#fef3c7' : '#f3f4f6'}
            iconColor={student.is_premium ? '#d97706' : '#6b7280'}
            valueComponent={
              <div>
                <Title level={3} style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: student.is_premium ? '#d97706' : '#64748b',
                  lineHeight: 1.2,
                  marginBottom: student.is_premium ? 0 : '8px'
                }}>
                  {student.is_premium ? 'Faol' : 'Yo\'q'}
                </Title>
              </div>
            }
          />
        </Col>
        </Row>
      </div>
    </div>
  );
};

export default StudentProfileView;