import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Row, Col, Statistic, Spin, Alert, Button, Modal, List, Empty, Tag } from 'antd';
import {
  BookOutlined,
  TrophyOutlined,
  BarChartOutlined,
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  DragOutlined,
  SwapOutlined,
  PlusOutlined,
  SettingOutlined,
  CloseOutlined,
  SaveOutlined,
  UnorderedListOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import { useCountdown } from '../../hooks/useCountdown';

const { Title, Text } = Typography;

const StudentOverview = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalTests: 0,
    completedTests: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    totalAttempts: 0,
    activeTests: 0,
    recentTests: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Card management states
  const [draggedCard, setDraggedCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [cardOrder, setCardOrder] = useState([]);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [longPressedCard, setLongPressedCard] = useState(null);
  const [isLongPressActive, setIsLongPressActive] = useState(false);

  // Available cards library
  const availableCards = [
    {
      id: 'totalTests',
      title: 'Jami testlar',
      key: 'totalTests',
      icon: <BookOutlined />,
      color: '#2563eb',
      type: 'statistic',
      description: 'Umumiy testlar soni'
    },
    {
      id: 'averageScore',
      title: "O'rtacha ball",
      key: 'averageScore',
      suffix: '%',
      icon: <TrophyOutlined />,
      color: '#16a34a',
      type: 'statistic',
      description: "O'rtacha test natijasi"
    },
    {
      id: 'highestScore',
      title: 'Eng yuqori ball',
      key: 'highestScore',
      suffix: '%',
      icon: <BarChartOutlined />,
      color: '#059669',
      type: 'statistic',
      description: 'Eng yuqori natija'
    },
    {
      id: 'lowestScore',
      title: 'Eng past ball',
      key: 'lowestScore',
      suffix: '%',
      icon: <RiseOutlined />,
      color: '#dc2626',
      type: 'statistic',
      description: 'Eng past natija'
    },
    {
      id: 'totalAttempts',
      title: 'Jami urinishlar',
      key: 'totalAttempts',
      icon: <ClockCircleOutlined />,
      color: '#7c3aed',
      type: 'statistic',
      description: 'Umumiy urinishlar'
    },
    {
      id: 'completedTests',
      title: 'Topshirilgan testlar',
      key: 'completedTests',
      icon: <TeamOutlined />,
      color: '#d97706',
      type: 'statistic',
      description: 'Tugallangan testlar'
    },
    {
      id: 'premiumStatus',
      title: 'Premium status',
      key: 'premiumStatus',
      icon: <SafetyCertificateOutlined />,
      color: '#d97706',
      type: 'special',
      description: 'Premium hisob holati'
    },
    {
      id: 'stars',
      title: 'Yulduzlar',
      key: 'stars',
      icon: <StarOutlined />,
      color: '#f59e0b',
      type: 'special',
      description: 'Yulduzlar soni'
    },
    {
      id: 'premiumTime',
      title: 'Premium vaqti',
      key: 'premiumTime',
      icon: <ClockCircleOutlined />,
      color: '#d97706',
      type: 'special',
      description: 'Premium muddati'
    },
    {
      id: 'recentActivity',
      title: 'Oxirgi faoliyat',
      key: 'recentActivity',
      icon: <UnorderedListOutlined />,
      color: '#6366f1',
      type: 'list',
      description: 'So\'nggi test natijalari'
    }
  ];

  // Countdown timer for premium expiry
  const handlePremiumExpire = async () => {
    try {
      const updatedUser = await apiService.getUser(currentUser.id);
    } catch (error) {
      console.error('Failed to refresh user data on premium expiry:', error);
    }
  };

  const { formattedTime, isExpired } = useCountdown(currentUser?.premium_expiry_date, handlePremiumExpire);

  useEffect(() => {
    if (currentUser) {
      loadStudentStats();
      loadCardOrder();
    }
  }, [currentUser]);

  // Load saved card order from localStorage
  const loadCardOrder = () => {
    const saved = localStorage.getItem(`studentCards_${currentUser?.id}`);
    if (saved) {
      try {
        setCardOrder(JSON.parse(saved));
      } catch {
        setCardOrder(availableCards.map(card => card.id));
      }
    } else {
      setCardOrder(availableCards.map(card => card.id));
    }
  };

  // Save card order to localStorage
  const saveCardOrder = useCallback((order) => {
    localStorage.setItem(`studentCards_${currentUser?.id}`, JSON.stringify(order));
  }, [currentUser?.id]);

  const loadStudentStats = async () => {
    try {
      setLoading(true);
      
      const attemptsData = await apiService.getAttempts({ student: currentUser.id });
      const attempts = attemptsData.results || attemptsData;
      
      const completedTests = attempts.length;
      const scores = attempts.map(attempt => attempt.score || 0);
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
      const highestScore = scores.length > 0
        ? Math.round(Math.max(...scores))
        : 0;
      const lowestScore = scores.length > 0
        ? Math.round(Math.min(...scores))
        : 0;

      const recentTests = attempts
        .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
        .slice(0, 5)
        .map(attempt => ({
          id: attempt.id,
          title: attempt.test_title || 'Noma\'lum test',
          score: attempt.score,
          subject: attempt.subject || 'Noma\'lum fan',
          date: new Date(attempt.submitted_at).toLocaleDateString('uz-UZ')
        }));

      setStats({
        totalTests: completedTests,
        completedTests,
        averageScore,
        highestScore,
        lowestScore,
        totalAttempts: attempts.length,
        activeTests: completedTests,
        recentTests
      });

    } catch (error) {
      console.error('Error loading student stats:', error);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, cardId) => {
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetCardId) => {
    e.preventDefault();
    if (draggedCard && draggedCard !== targetCardId) {
      const newOrder = [...cardOrder];
      const draggedIndex = newOrder.indexOf(draggedCard);
      const targetIndex = newOrder.indexOf(targetCardId);
      
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedCard);
      
      setCardOrder(newOrder);
      saveCardOrder(newOrder);
    }
    setDraggedCard(null);
  };

  // Click-to-swap functionality
  const handleCardClick = (cardId) => {
    if (isSwapping) {
      if (selectedCard === null) {
        setSelectedCard(cardId);
      } else if (selectedCard === cardId) {
        setSelectedCard(null);
        setIsSwapping(false);
      } else {
        // Swap cards
        const newOrder = [...cardOrder];
        const selectedIndex = newOrder.indexOf(selectedCard);
        const currentIndex = newOrder.indexOf(cardId);
        
        newOrder[selectedIndex] = cardId;
        newOrder[currentIndex] = selectedCard;
        
        setCardOrder(newOrder);
        saveCardOrder(newOrder);
        setSelectedCard(null);
        setIsSwapping(false);
      }
    } else if (isLongPressActive && longPressedCard === cardId) {
      // If long press is active, start dragging
      setDraggedCard(cardId);
    }
  };

  // Long press functionality
  const handleMouseDown = (e, cardId) => {
    if (isSwapping) return;
    
    e.preventDefault();
    const timer = setTimeout(() => {
      setIsLongPressActive(true);
      setLongPressedCard(cardId);
      setDraggedCard(cardId);
      
      // Show visual feedback for long press
      const card = e.currentTarget;
      card.style.transform = 'scale(1.05)';
      card.style.transition = 'transform 0.2s ease';
    }, 2000); // 2 seconds
    
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Reset visual feedback
    setTimeout(() => {
      setIsLongPressActive(false);
      setLongPressedCard(null);
    }, 500);
  };

  const handleMouseLeave = (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Reset visual feedback
    const card = e.currentTarget;
    if (card) {
      card.style.transform = 'scale(1)';
      card.style.transition = 'transform 0.2s ease';
    }
    
    setIsLongPressActive(false);
    setLongPressedCard(null);
  };

  const startSwapMode = () => {
    setIsSwapping(true);
    setSelectedCard(null);
  };

  const cancelSwap = () => {
    setIsSwapping(false);
    setSelectedCard(null);
  };

  // Library management
  const addCardToDashboard = (cardId) => {
    if (!cardOrder.includes(cardId)) {
      const newOrder = [...cardOrder, cardId];
      setCardOrder(newOrder);
      saveCardOrder(newOrder);
    }
  };

  const removeCardFromDashboard = (cardId) => {
    const newOrder = cardOrder.filter(id => id !== cardId);
    setCardOrder(newOrder);
    saveCardOrder(newOrder);
  };

  const resetCardOrder = () => {
    const defaultOrder = availableCards.map(card => card.id);
    setCardOrder(defaultOrder);
    saveCardOrder(defaultOrder);
  };

  const StatCard = ({ cardConfig, isDragged, isSelected }) => {
    const getValue = () => {
      if (cardConfig.type === 'special') {
        switch (cardConfig.key) {
          case 'premiumStatus':
            return currentUser?.premium_info?.is_premium ? 'Faol' : 'Yoq';
          case 'stars':
            return currentUser?.stars || 0;
          case 'premiumTime':
            return currentUser?.premium_info?.is_premium && !isExpired ? formattedTime : 'Yoq';
          default:
            return 0;
        }
      }
      if (cardConfig.key === 'recentActivity') {
        return stats.recentTests.length;
      }
      return stats[cardConfig.key] || 0;
    };

    return (
      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            backgroundColor: '#ffffff',
            border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: isDragged ? '0 8px 25px rgba(0,0,0,0.15)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            cursor: isSwapping ? 'pointer' : isLongPressActive ? 'grabbing' : 'grab',
            transform: isDragged ? 'rotate(5deg)' : isLongPressActive ? 'scale(1.05)' : 'scale(1)',
            opacity: isDragged ? 0.8 : 1,
          }}
          styles={{ body: { padding: '24px' } }}
          hoverable={!isSwapping && !isLongPressActive}
          draggable={!isSwapping && !isLongPressActive}
          onDragStart={(e) => handleDragStart(e, cardConfig.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, cardConfig.id)}
          onClick={() => handleCardClick(cardConfig.id)}
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
                {cardConfig.title}
              </Text>
              <Statistic
                value={getValue()}
                suffix={cardConfig.suffix}
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
                backgroundColor: cardConfig.color,
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '16px'
              }}
            >
              {React.cloneElement(cardConfig.icon, {
                style: {
                  fontSize: '24px',
                  color: '#ffffff'
                }
              })}
            </div>
          </div>
          {isSwapping && (
            <div style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: isSelected ? '#3b82f6' : 'rgba(0,0,0,0.5)',
              color: 'white',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              {isSelected ? <SwapOutlined /> : <DragOutlined />}
            </div>
          )}
        </Card>
      </Col>
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, color: '#64748b' }}>Ma'lumotlar yuklanmoqda...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        marginTop: '-6px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              Talaba boshqaruv paneli
            </Title>
            <Text style={{
              fontSize: '1.125rem',
              color: '#64748b',
              fontWeight: 400
            }}>
              O'quv faoliyatingiz haqida umumiy ma'lumot
            </Text>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isSwapping ? (
              <>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setShowLibrary(true)}
                >
                  Kutubxona
                </Button>
                <Button
                  type="primary"
                  icon={<SwapOutlined />}
                  onClick={startSwapMode}
                >
                  Kartalarni boshqarish
                </Button>
              </>
            ) : (
              <>
                <Button onClick={cancelSwap}>
                  <CloseOutlined /> Bekor qilish
                </Button>
                <Button type="primary" onClick={cancelSwap}>
                  <SaveOutlined /> Saqlash
                </Button>
              </>
            )}
          </div>
        </div>
        {isSwapping && (
          <Alert
            message="Kartalarni almashtirish rejimi"
            description="Birinchi kartani tanlang, keyin uni boshqa kartaga bosib almashtiring. Yoki kartalarni sudrab o'zgartiring."
            type="info"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </div>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {cardOrder.map(cardId => {
          const cardConfig = availableCards.find(card => card.id === cardId);
          if (!cardConfig) return null;
          
          return (
            <StatCard
              key={cardId}
              cardConfig={cardConfig}
              isDragged={draggedCard === cardId}
              isSelected={selectedCard === cardId}
            />
          );
        })}
      </Row>

      {/* Recent Activity Card */}
      {cardOrder.includes('recentActivity') && stats.recentTests.length > 0 && (
        <Card
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}
        >
          <Title level={4} style={{ marginBottom: '16px' }}>Oxirgi testlar</Title>
          <List
            dataSource={stats.recentTests}
            renderItem={(test) => (
              <List.Item>
                <List.Item.Meta
                  title={test.title}
                  description={`${test.subject} - ${test.date}`}
                />
                <div style={{ fontWeight: 'bold', color: test.score >= 70 ? '#16a34a' : '#dc2626' }}>
                  {test.score}%
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Card Library Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOutlined />
            Kartalar kutubxonasi
          </div>
        }
        open={showLibrary}
        onCancel={() => setShowLibrary(false)}
        width={600}
        footer={[
          <Button key="reset" onClick={resetCardOrder}>
            Standart tartibni tiklash
          </Button>,
          <Button key="close" type="primary" onClick={() => setShowLibrary(false)}>
            Yopish
          </Button>
        ]}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">
            Quyidagi kartalardan tanlang va dashboard ga qo'shing
          </Text>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <Text strong>Dashboard dagi kartalar:</Text>
          <div style={{ marginTop: '8px' }}>
            {cardOrder.map(cardId => {
              const card = availableCards.find(c => c.id === cardId);
              return card ? (
                <Tag
                  key={cardId}
                  closable
                  onClose={() => removeCardFromDashboard(cardId)}
                  style={{ margin: '4px' }}
                >
                  {card.icon} {card.title}
                </Tag>
              ) : null;
            })}
          </div>
        </div>

        <div>
          <Text strong>Mavjud kartalar:</Text>
          <List
            dataSource={availableCards.filter(card => !cardOrder.includes(card.id))}
            renderItem={(card) => (
              <List.Item
                actions={[
                  <Button
                    key="add"
                    type="link"
                    icon={<PlusOutlined />}
                    onClick={() => addCardToDashboard(card.id)}
                  >
                    Qo'shish
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={React.cloneElement(card.icon, { style: { fontSize: '20px', color: card.color } })}
                  title={card.title}
                  description={card.description}
                />
              </List.Item>
            )}
            locale={{ emptyText: <Empty description="Barcha kartalar qo'shilgan" /> }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default StudentOverview;