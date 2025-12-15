import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Button,
  TextField,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Checkbox,
} from '@mui/material';
import {
  PhotoCamera as PhotoIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as TrophyIcon,
  Assessment as AssessmentIcon,
  Palette as PaletteIcon,
  EmojiEmotions as EmojiIcon,
  Star as StarIcon,
  ShoppingCart as MarketIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';
import EmojiPicker from '../../components/EmojiPicker';
import GradientPicker from '../../components/GradientPicker';
import { shouldShowPremiumFeatures } from '../../utils/premiumVisibility';
import { useCountdown } from '../../hooks/useCountdown';

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

  // Emoji and Gradient picker states
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [gradientPickerOpen, setGradientPickerOpen] = useState(false);
  const [selectedEmojis, setSelectedEmojis] = useState([]);
  const [selectedGradient, setSelectedGradient] = useState(null);
  const [emojiPositions, setEmojiPositions] = useState([]);
  const [placedGifts, setPlacedGifts] = useState([]);
  const [myGifts, setMyGifts] = useState([]);
  const [displayGift, setDisplayGift] = useState(null);
  const [selectedDisplayGifts, setSelectedDisplayGifts] = useState([]);
  const [giftPlacementDialogOpen, setGiftPlacementDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [giftPositions, setGiftPositions] = useState([]);
  const [displayGiftDialogOpen, setDisplayGiftDialogOpen] = useState(false);
  const [eventRewards, setEventRewards] = useState([]);
  const [eventRewardsDialogOpen, setEventRewardsDialogOpen] = useState(false);
  const [unclaimedRewards, setUnclaimedRewards] = useState([]);

  useEffect(() => {
    loadStudentStats();
    loadPlacedGifts();
    loadEventRewards();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setStatusText(currentUser.profile_status || '');
      const emojis = currentUser.selected_emojis || [];
      setSelectedEmojis(emojis);
      setSelectedGradient(currentUser.background_gradient || null);

      // Generate random positions for the emojis
      if (emojis.length > 0) {
        setEmojiPositions(generateRandomPositions(emojis.length));
      }
    }
  }, [currentUser]);

  useEffect(() => {
    // Generate random positions for the placed gifts
    if (placedGifts.length > 0) {
      setGiftPositions(generateRandomPositions(placedGifts.length));
    }
  }, [placedGifts]);

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

  const loadPlacedGifts = async () => {
    if (!currentUser) return;

    try {
      const [placedResponse, myGiftsResponse] = await Promise.all([
        apiService.get('/student-gifts/placed_gifts/'),
        apiService.get('/student-gifts/my_gifts/')
      ]);
      const placedGifts = placedResponse.results || placedResponse;
      const myGifts = myGiftsResponse.results || myGiftsResponse;
      setPlacedGifts(placedGifts);
      setMyGifts(myGifts);
      setSelectedDisplayGifts(placedGifts.map(g => g.id));

      // Debug: Log the display gift structure
      console.log('currentUser.display_gift:', currentUser.display_gift);
      console.log('myGifts:', myGifts);

      // Set display gift - try to find the full gift object from myGifts
      if (currentUser.display_gift) {
        const giftId = typeof currentUser.display_gift === 'object' ? currentUser.display_gift.id : currentUser.display_gift;
        const fullGift = myGifts.find(g => g.id === giftId);
        console.log('Found full gift for display:', fullGift);
        setDisplayGift(fullGift || currentUser.display_gift);
      } else {
        setDisplayGift(null);
      }
    } catch (error) {
      console.error('Error loading gifts:', error);
      setPlacedGifts([]);
      setMyGifts([]);
      setDisplayGift(null);
    }
  };

  const loadEventRewards = async () => {
    if (!currentUser) return;

    try {
      const [rewardsResponse, unclaimedResponse] = await Promise.all([
        apiService.get('/event-rewards/my_rewards/'),
        apiService.get('/event-rewards/unclaimed_rewards/')
      ]);

      const rewards = rewardsResponse.results || rewardsResponse;
      const unclaimed = unclaimedResponse.results || unclaimedResponse;

      setEventRewards(rewards);
      setUnclaimedRewards(unclaimed);

      // Show modal if there are unclaimed rewards
      if (unclaimed.length > 0) {
        setEventRewardsDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading event rewards:', error);
      setEventRewards([]);
      setUnclaimedRewards([]);
    }
  };

  const handleClaimReward = async (rewardId) => {
    try {
      await apiService.post(`/event-rewards/${rewardId}/claim_reward/`);
      await loadEventRewards(); // Reload rewards
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Mukofotni qabul qilishda xatolik yuz berdi');
    }
  };

  const getDirectionLabel = (direction) => {
    if (direction === 'natural') return 'Tabiiy fanlar';
    if (direction === 'exact') return 'Aniq fanlar';
    return 'Yo\'nalish kiritilmagan';
  };

  const getDirectionColor = (direction) => {
    if (direction === 'natural') return '#059669';
    if (direction === 'exact') return '#2563eb';
    return '#64748b';
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

  const handleEmojiSelect = async (emojis) => {
    if (!currentUser) return;
    
    try {
      setSelectedEmojis(emojis);
      // Generate new random positions for the selected emojis
      const positions = generateRandomPositions(emojis.length);
      setEmojiPositions(positions);
      
      const updatedUser = await apiService.patch(`/users/${currentUser.id}/`, {
        selected_emojis: emojis
      });
      setCurrentUserData(updatedUser);
    } catch (error) {
      console.error('Failed to update emojis:', error);
      alert('Emojilarni saqlashda xatolik yuz berdi');
    }
  };

  const handleGradientSelect = async (gradient) => {
    if (!currentUser) return;
    
    try {
      setSelectedGradient(gradient);
      const updatedUser = await apiService.patch(`/users/${currentUser.id}/`, {
        background_gradient: gradient
      });
      setCurrentUserData(updatedUser);
    } catch (error) {
      console.error('Failed to update gradient:', error);
      alert('Gradientni saqlashda xatolik yuz berdi');
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
      formData.append('selected_emojis', JSON.stringify(selectedEmojis));
      formData.append('background_gradient', JSON.stringify(selectedGradient));

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

  const handleGiftPlacement = async (giftId, position) => {
    try {
      await apiService.post(`/student-gifts/${giftId}/place_gift/`, {
        position: position
      });
      await loadPlacedGifts(); // Reload placed gifts
    } catch (error) {
      console.error('Failed to place gift:', error);
      if (error.message.includes('401')) {
        alert('Sessiya muddati tugagan. Iltimos, qaytadan kiriting.');
        logout();
      } else {
        alert('Sovg\'ani joylashtirishda xatolik yuz berdi');
      }
    }
  };

  const handleDisplayGiftToggle = async (giftId) => {
    const isSelected = selectedDisplayGifts.includes(giftId);
    if (isSelected) {
      // Remove
      const position = placedGifts.find(g => g.id === giftId)?.placement_position;
      await handleGiftPlacement(giftId, null);
    } else {
      if (selectedDisplayGifts.length >= 3) return;
      // Add to next position
      const nextPosition = [1,2,3].find(pos => !placedGifts.some(g => g.placement_position === pos)) || 1;
      await handleGiftPlacement(giftId, nextPosition);
    }
  };

  const handleDisplayGiftSelect = async (giftId) => {
    try {
      const updatedUser = await apiService.patch(`/users/${currentUser.id}/`, {
        display_gift: giftId || null
      });
      setCurrentUserData(updatedUser);
      setDisplayGift(giftId ? myGifts.find(g => g.id === giftId) : null);
      setDisplayGiftDialogOpen(false);
    } catch (error) {
      console.error('Failed to set display gift:', error);
      if (error.message.includes('401')) {
        alert('Sessiya muddati tugagan. Iltimos, qaytadan kiriting.');
        logout();
      } else {
        alert('Displey sovg\'asini o\'rnatishda xatolik yuz berdi');
      }
    }
  };


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
          Mening ma'lumotlarim
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<MarketIcon />}
            onClick={() => navigate('/student/pricing')}
            sx={{
              borderColor: '#f59e0b',
              color: '#f59e0b',
              fontSize: '1.1rem',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              '&:hover': {
                backgroundColor: '#fef3c7',
                borderColor: '#d97706',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Market
          </Button>

          {/* Edit Button for Premium Users */}
          {shouldShowPremiumFeatures(currentUser, currentUser) && (
            <Button
              variant="contained"
              size="large"
              startIcon={<EditIcon />}
              onClick={() => setEditDialogOpen(true)}
              sx={{
                backgroundColor: '#2563eb',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3)',
                '&:hover': {
                  backgroundColor: '#1d4ed8',
                  boxShadow: '0 8px 30px rgba(37, 99, 235, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Tahrirlash
            </Button>
          )}
        </Box>
      </Box>

      {/* Success Message */}
      {saveSuccess && (
        <Alert
          severity="success"
          sx={{
            mb: 4,
            backgroundColor: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#059669',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}
        >
          ✅ Profil muvaffaqiyatli saqlandi!
        </Alert>
      )}

      {/* Profile Card */}
      <Paper sx={{
        p: 0,
        mb: 4,
        background: shouldShowPremiumFeatures(currentUser, currentUser) && selectedGradient?.css
          ? selectedGradient.css
          : shouldShowPremiumFeatures(currentUser, currentUser)
            ? `
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)
            `
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '300px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Premium Badge */}
        {shouldShowPremiumFeatures(currentUser, currentUser) && (
          <Box sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 2
          }}>
            <Chip
              icon={<TrophyIcon />}
              label="PREMIUM"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#d97706',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '& .MuiChip-icon': {
                  color: '#d97706'
                }
              }}
            />
          </Box>
        )}

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          p: 4,
          minHeight: '300px',
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
          {shouldShowPremiumFeatures(currentUser, currentUser) && selectedEmojis.length > 0 && (
            <Box sx={{
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
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                animation: 'swimEmojis 25s infinite linear'
              }}>
                {/* Random positioned animated emojis */}
                {selectedEmojis.map((emoji, index) => {
                  const position = emojiPositions[index] || {
                    left: Math.random() * 100,
                    top: Math.random() * 100,
                    delay: Math.random() * 5,
                    duration: 15 + Math.random() * 10,
                    scale: 0.7 + Math.random() * 0.6,
                    rotation: Math.random() * 360
                  };

                  return (
                    <Box
                      key={`emoji-${index}`}
                      sx={{
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
                    </Box>
                  );
                })}

                {/* Additional floating emojis for density */}
                {Array.from({ length: Math.min(8, selectedEmojis.length * 2) }).map((_, index) => {
                  const originalIndex = index % selectedEmojis.length;
                  const position = {
                    left: Math.random() * 100,
                    top: Math.random() * 100,
                    delay: Math.random() * 8,
                    duration: 12 + Math.random() * 8,
                    scale: 0.5 + Math.random() * 0.5,
                    rotation: Math.random() * 360
                  };

                  return (
                    <Box
                      key={`extra-emoji-${index}`}
                      sx={{
                        position: 'absolute',
                        fontSize: '2.2rem',
                        opacity: 0.15 + (index % 2) * 0.03,
                        color: 'rgba(255, 255, 255, 0.7)',
                        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                        left: `${position.left}%`,
                        top: `${position.top}%`,
                        transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
                        animation: `swimAllEmojis-${(index + 10) % 20} ${position.duration}s infinite ease-in-out`,
                        animationDelay: `${position.delay}s`,
                        zIndex: 1
                      }}
                    >
                      {selectedEmojis[originalIndex]}
                    </Box>
                  );
                })}

                {/* Floating Gifts around avatar */}
                {placedGifts.map((giftItem, index) => {
                  const position = giftPositions[index] || {
                    left: Math.random() * 100,
                    top: Math.random() * 100,
                    delay: Math.random() * 5,
                    duration: 20 + Math.random() * 15,
                    scale: 0.8 + Math.random() * 0.4,
                    rotation: Math.random() * 360
                  };

                  return (
                    <Box
                      key={`floating-gift-${giftItem.id}`}
                      sx={{
                        position: 'absolute',
                        fontSize: '3.5rem',
                        opacity: 0.9,
                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
                        left: `${position.left}%`,
                        top: `${position.top}%`,
                        transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
                        animation: `swimAllEmojis-${index % 20} ${position.duration}s infinite ease-in-out`,
                        animationDelay: `${position.delay}s`,
                        zIndex: 2,
                        pointerEvents: 'none'
                      }}
                    >
                      {giftItem.gift.image_url ? (
                        <img
                          src={giftItem.gift.image_url}
                          alt={giftItem.gift.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: '8px'
                          }}
                        />
                      ) : (
                        '🎁'
                      )}
                    </Box>
                  );
                })}
              </Box>

              {/* Animated gradient overlay for depth */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%)',
                animation: 'shimmer 8s infinite',
                pointerEvents: 'none'
              }} />
            </Box>
          )}
          {/* Profile Photo */}
          <Box sx={{
            position: 'relative',
            mb: { xs: 3, md: 0 },
            mr: { xs: 0, md: 4 },
            zIndex: 3
          }}>
            {currentUser?.profile_photo_url ? (
              <Avatar
                src={currentUser.profile_photo_url}
                sx={{
                  width: 150,
                  height: 150,
                  border: '4px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  backgroundColor: shouldShowPremiumFeatures(currentUser, currentUser) ? '#ffffff' : '#2563eb'
                }}
                imgProps={{
                  style: { objectFit: 'cover' }
                }}
              >
                {currentUser?.name.charAt(0).toUpperCase()}
              </Avatar>
            ) : (
              <Avatar sx={{
                width: 150,
                height: 150,
                fontSize: '4rem',
                fontWeight: 'bold',
                border: '4px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                backgroundColor: shouldShowPremiumFeatures(currentUser, currentUser) ? '#ffffff' : '#2563eb',
                color: shouldShowPremiumFeatures(currentUser, currentUser) ? '#2563eb' : '#ffffff'
              }}>
                {currentUser?.name.charAt(0).toUpperCase()}
              </Avatar>
            )}

            {/* Premium Checkmark */}
            {shouldShowPremiumFeatures(currentUser, currentUser) && (
              <Box sx={{
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
                <CheckCircleIcon sx={{ color: 'white', fontSize: '1.2rem' }} />
              </Box>
            )}
          </Box>

          {/* Profile Info */}
          <Box sx={{
            textAlign: { xs: 'center', md: 'left' },
            flex: 1,
            color: shouldShowPremiumFeatures(currentUser, currentUser) ? '#ffffff' : '#1e293b',
            position: 'relative',
            zIndex: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
              {displayGift && (
                <Box
                  onClick={() => setDisplayGiftDialogOpen(true)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '20px',
                    backgroundColor: displayGift.gift_rarity === 'common' ? 'rgba(255, 255, 255, 0.2)' :
                                   displayGift.gift_rarity === 'rare' ? 'rgba(59, 130, 246, 0.3)' :
                                   displayGift.gift_rarity === 'epic' ? 'rgba(147, 51, 234, 0.3)' :
                                   displayGift.gift_rarity === 'legendary' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                    border: `2px solid ${displayGift.gift_rarity === 'common' ? 'rgba(255, 255, 255, 0.3)' :
                                         displayGift.gift_rarity === 'rare' ? 'rgba(59, 130, 246, 0.5)' :
                                         displayGift.gift_rarity === 'epic' ? 'rgba(147, 51, 234, 0.5)' :
                                         displayGift.gift_rarity === 'legendary' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.3)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  {displayGift?.gift_image_url && (
                    <img
                      src={displayGift.gift_image_url}
                      alt={displayGift.gift_name || 'Sovg\'a'}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        console.warn('Failed to load gift image:', displayGift.gift_image_url);
                      }}
                    />
                  )}
                </Box>
              )}
              <Typography variant="h3" sx={{
                fontWeight: 700,
                textShadow: shouldShowPremiumFeatures(currentUser, currentUser) ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
                cursor: !displayGift ? 'pointer' : 'default',
                '&:hover': !displayGift ? { textDecoration: 'underline' } : {}
              }} onClick={!displayGift ? () => setDisplayGiftDialogOpen(true) : undefined}>
                {currentUser?.name}
              </Typography>
            </Box>

            {currentUser?.profile_status && (
              <Typography variant="h6" sx={{
                mb: 3,
                fontStyle: 'italic',
                opacity: 0.9,
                textShadow: shouldShowPremiumFeatures(currentUser, currentUser) ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
              }}>
                "{currentUser.profile_status}"
              </Typography>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Chip
                label="O'quvchi"
                sx={{
                  backgroundColor: shouldShowPremiumFeatures(currentUser, currentUser) ? 'rgba(255, 255, 255, 0.2)' : '#ecfdf5',
                  color: shouldShowPremiumFeatures(currentUser, currentUser) ? '#ffffff' : '#059669',
                  border: shouldShowPremiumFeatures(currentUser, currentUser) ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontWeight: 600
                }}
              />
              <Chip
                label={`${currentUser?.class_group || 'Noma\'lum'} sinf`}
                sx={{
                  backgroundColor: shouldShowPremiumFeatures(currentUser, currentUser) ? 'rgba(255, 255, 255, 0.2)' : '#eff6ff',
                  color: shouldShowPremiumFeatures(currentUser, currentUser) ? '#ffffff' : '#2563eb',
                  border: shouldShowPremiumFeatures(currentUser, currentUser) ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontWeight: 600
                }}
              />
              <Chip
                label={currentUser?.direction === 'natural' ? 'Tabiiy fanlar' : currentUser?.direction === 'exact' ? 'Aniq fanlar' : 'Yo\'nalish yo\'q'}
                sx={{
                  backgroundColor: shouldShowPremiumFeatures(currentUser, currentUser) ? 'rgba(255, 255, 255, 0.2)' : '#f3f4f6',
                  color: shouldShowPremiumFeatures(currentUser, currentUser) ? '#ffffff' : '#374151',
                  border: shouldShowPremiumFeatures(currentUser, currentUser) ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  fontWeight: 600
                }}
              />

            </Box>



          </Box>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'none',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}>
            <CardContent sx={{
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              '&:last-child': { pb: 3 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flex={1}>
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
                    Topshirilgan testlar
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      lineHeight: 1.2
                    }}
                  >
                    {loading ? '...' : testCount}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: '#eff6ff',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 2
                  }}
                >
                  <AssessmentIcon sx={{ fontSize: '1.5rem', color: '#2563eb' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'none',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}>
            <CardContent sx={{
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              '&:last-child': { pb: 3 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flex={1}>
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
                    O'rtacha ball
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      lineHeight: 1.2
                    }}
                  >
                    {loading ? '...' : `${averageScore}%`}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: '#ecfdf5',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 2
                  }}
                >
                  <TrophyIcon sx={{ fontSize: '1.5rem', color: '#059669' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'none',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}>
            <CardContent sx={{
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              '&:last-child': { pb: 3 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flex={1}>
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
                    Eng yuqori ball
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      lineHeight: 1.2
                    }}
                  >
                    {loading ? '...' : `${highestScore}%`}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: '#fef3c7',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 2
                  }}
                >
                  <TrophyIcon sx={{ fontSize: '1.5rem', color: '#d97706' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'none',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}>
            <CardContent sx={{
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              '&:last-child': { pb: 3 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flex={1}>
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
                    Premium status
                  </Typography>
                  {currentUser?.premium_info?.is_premium ? (
                    <Typography
                      sx={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: '#d97706',
                        lineHeight: 1.2,
                        mb: 0
                      }}
                    >
                      Faol
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography
                        sx={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: '#64748b',
                          lineHeight: 1.2
                        }}
                      >
                        Yo'q
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate('/student/pricing')}
                        sx={{
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: '8px',
                          px: 2,
                          py: 0.5,
                          fontSize: '0.8rem',
                          '&:hover': {
                            backgroundColor: '#1d4ed8',
                          }
                        }}
                      >
                        Sotib olish
                      </Button>
                    </Box>
                  )}
                </Box>
                <Box
                  sx={{
                    backgroundColor: currentUser?.premium_info?.is_premium ? '#fef3c7' : '#f3f4f6',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 2
                  }}
                >
                  <TrophyIcon sx={{
                    fontSize: '1.5rem',
                    color: currentUser?.premium_info?.is_premium ? '#d97706' : '#6b7280'
                  }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'none',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}>
            <CardContent sx={{
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              '&:last-child': { pb: 3 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flex={1}>
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
                    Yulduzlar
                  </Typography>
                  {currentUser?.stars > 0 ? (
                    <Typography
                      sx={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: '#f59e0b',
                        lineHeight: 1.2
                      }}
                    >
                      {currentUser.stars}
                    </Typography>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate('/student/pricing')}
                      sx={{
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: '8px',
                        px: 2,
                        py: 0.5,
                        fontSize: '0.8rem',
                        '&:hover': {
                          backgroundColor: '#d97706',
                        }
                      }}
                    >
                      Sotib olish
                    </Button>
                  )}
                </Box>
                <Box
                  sx={{
                    backgroundColor: '#fef3c7',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 2
                  }}
                >
                  <StarIcon sx={{ fontSize: '1.5rem', color: '#f59e0b' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: 'none',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}>
            <CardContent sx={{
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              '&:last-child': { pb: 3 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flex={1}>
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
                    Premium vaqti
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: currentUser?.premium_info?.is_premium && !isExpired ? '#d97706' : '#64748b',
                      lineHeight: 1.2,
                      mb: (currentUser?.premium_info?.is_premium && !isExpired) ? 0 : 2
                    }}
                  >
                    {currentUser?.premium_info?.is_premium && !isExpired ? formattedTime : 'Yo\'q'}
                  </Typography>
                  {currentUser?.premium_info?.is_premium && currentUser?.premium_plan && (
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        fontWeight: 500
                      }}
                    >
                      {currentUser.premium_plan === 'week' ? '1 Hafta' :
                       currentUser.premium_plan === 'month' ? '1 Oy' :
                       currentUser.premium_plan === 'year' ? '1 Yil' : 'Performance-based'}
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    backgroundColor: currentUser?.premium_info?.is_premium ? '#fef3c7' : '#f3f4f6',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 2
                  }}
                >
                  <TrophyIcon sx={{
                    fontSize: '1.5rem',
                    color: currentUser?.premium_info?.is_premium ? '#d97706' : '#6b7280'
                  }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gifts Section */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography sx={{
          fontSize: '1.8rem',
          fontWeight: 800,
          color: '#1e293b',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎁 Mening sovg'alarim
        </Typography>

        <Card sx={{
          backgroundColor: '#ffffff',
          border: '3px solid transparent',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '13px',
            padding: '3px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6, #06b6d4, #10b981)',
            backgroundSize: '300% 300%',
            animation: 'gradientBorder 4s ease infinite',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor'
          }
        }}>
          <style>{`
            @keyframes gradientBorder {
              0% { background-position: 0% 50%; }
              25% { background-position: 100% 50%; }
              50% { background-position: 100% 100%; }
              75% { background-position: 0% 100%; }
              100% { background-position: 0% 50%; }
            }
          `}</style>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{
                fontWeight: 700,
                color: '#1e293b',
                fontSize: '1.3rem',
                mb: 1
              }}>
                Sotib olingan sovg'alar
              </Typography>
              <Typography sx={{
                color: '#64748b',
                fontSize: '0.9rem'
              }}>
                Profilingizda ko'rsatish uchun 3 tagacha sovg'ani belgilashingiz mumkin.
              </Typography>
            </Box>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 3,
              minHeight: '120px',
              mb: 4
            }}>
              {myGifts.length > 0 ? (
                myGifts.map((giftItem) => (
                  <Box
                    key={giftItem.id}
                    sx={{
                      background: giftItem.gift_image_url
                        ? `url(${giftItem.gift_image_url})`
                        : `linear-gradient(135deg, ${giftItem.gift_rarity === 'common' ? '#f3f4f6' :
                                                  giftItem.gift_rarity === 'rare' ? '#dbeafe' :
                                                  giftItem.gift_rarity === 'epic' ? '#f3e8ff' :
                                                  giftItem.gift_rarity === 'legendary' ? '#fef3c7' : '#f8fafc'} 0%, #ffffff 100%)`,
                      backgroundSize: '60%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      border: `3px solid ${giftItem.gift_rarity === 'common' ? '#e5e7eb' :
                                          giftItem.gift_rarity === 'rare' ? '#3b82f6' :
                                          giftItem.gift_rarity === 'epic' ? '#8b5cf6' :
                                          giftItem.gift_rarity === 'legendary' ? '#f59e0b' : '#e2e8f0'}`,
                      borderRadius: '16px',
                      p: 3,
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedDisplayGifts.includes(giftItem.id)
                        ? '0 4px 15px rgba(16, 185, 129, 0.2)'
                        : '0 2px 8px rgba(0,0,0,0.05)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                        borderColor: giftItem.gift_rarity === 'common' ? '#9ca3af' :
                                    giftItem.gift_rarity === 'rare' ? '#2563eb' :
                                    giftItem.gift_rarity === 'epic' ? '#7c3aed' :
                                    giftItem.gift_rarity === 'legendary' ? '#d97706' : '#64748b'
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '13px',
                        padding: '2px',
                        background: selectedDisplayGifts.includes(giftItem.id)
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'transparent',
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        maskComposite: 'exclude',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor'
                      }
                    }}
                  >
                    <Checkbox
                      checked={selectedDisplayGifts.includes(giftItem.id)}
                      onChange={() => handleDisplayGiftToggle(giftItem.id)}
                      disabled={!selectedDisplayGifts.includes(giftItem.id) && selectedDisplayGifts.length >= 3}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 3,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: '50%',
                        padding: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        '& .MuiCheckbox-root': {
                          padding: '4px'
                        },
                        '&:hover': {
                          backgroundColor: 'white'
                        }
                      }}
                    />

                    {/* Rarity indicator */}
                    <Box sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 3,
                      backgroundColor: giftItem.gift_rarity === 'common' ? 'rgba(107, 114, 128, 0.9)' :
                                      giftItem.gift_rarity === 'rare' ? 'rgba(59, 130, 246, 0.9)' :
                                      giftItem.gift_rarity === 'epic' ? 'rgba(139, 92, 246, 0.9)' :
                                      giftItem.gift_rarity === 'legendary' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(107, 114, 128, 0.9)',
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {giftItem.gift_rarity === 'common' ? 'Oddiy' :
                       giftItem.gift_rarity === 'rare' ? 'Nodiy' :
                       giftItem.gift_rarity === 'epic' ? 'Epik' :
                       giftItem.gift_rarity === 'legendary' ? 'Afsonaviy' : 'Oddiy'}
                    </Box>

                    {!giftItem.gift_image_url && (
                      <Typography sx={{
                        fontSize: '3.5rem',
                        position: 'relative',
                        zIndex: 2,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}>
                        🎁
                      </Typography>
                    )}

                  </Box>
                ))
              ) : (
                <Box sx={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  py: 6,
                  px: 4,
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '16px',
                  border: '2px dashed #cbd5e1'
                }}>
                  <Typography sx={{
                    fontSize: '4rem',
                    mb: 2,
                    opacity: 0.6
                  }}>
                    🎁
                  </Typography>
                  <Typography sx={{
                    color: '#64748b',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    mb: 1
                  }}>
                    Hali sovg'alar yo'q
                  </Typography>
                  <Typography sx={{
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                    mb: 3
                  }}>
                    Marketdan qiziqarli sovg'alar sotib oling va profilingizni bezang!
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/student/pricing')}
                    sx={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      borderRadius: '12px',
                      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🎁 Marketga o'tish
                  </Button>
                </Box>
              )}
            </Box>

          </CardContent>
        </Card>
      </Box>

      {/* Summary Card */}
      <Paper sx={{
        p: 4,
        mt: 4,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <Typography variant="h6" gutterBottom sx={{ 
          fontWeight: 600, 
          color: '#1e293b',
          fontSize: '1.125rem',
          mb: 2 
        }}>
          📊 Hisobot
        </Typography>
        <Typography variant="body1" sx={{ 
          color: '#334155', 
          lineHeight: 1.6,
          fontSize: '0.875rem'
        }}>
          Siz {testCount} ta test ishlagansiz va "{getDirectionLabel(currentUser?.direction)}" yo'nalishida 
          o'qimoqdasiz. Ro'yxatdan o'tgan sana: {currentUser?.date_joined 
            ? new Date(currentUser.date_joined).toLocaleDateString('uz-UZ')
            : 'noma\'lum'
          }.
        </Typography>
      </Paper>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          color: '#1e293b',
          borderBottom: '1px solid #e2e8f0',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrophyIcon sx={{ color: '#d97706' }} />
            Premium profilni sozlash
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Gradient Selection - Prominent Button */}
            {shouldShowPremiumFeatures(currentUser, currentUser) && (
              <Box sx={{ mb: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PaletteIcon />}
                  onClick={() => setGradientPickerOpen(true)}
                  sx={{
                    background: selectedGradient?.css || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {selectedGradient?.name ? `🎨 ${selectedGradient.name}` : '🎨 Orqa fon gradientini tanlang'}
                </Button>
              </Box>
            )}

            {/* Profile Photo Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
                📸 Profil rasmi
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={profilePhoto ? URL.createObjectURL(profilePhoto) : currentUser?.profile_photo_url}
                  sx={{
                    width: 80,
                    height: 80,
                    border: '3px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  imgProps={{
                    style: { objectFit: 'cover' }
                  }}
                >
                  {currentUser?.name.charAt(0).toUpperCase()}
                </Avatar>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoIcon />}
                  sx={{
                    borderColor: '#2563eb',
                    color: '#2563eb',
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: '#eff6ff',
                      borderColor: '#1d4ed8',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Rasm tanlash
                  <input
                    type="file"
                    accept="image/*,.gif"
                    hidden
                    onChange={handlePhotoChange}
                  />
                </Button>
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                GIF va rasm fayllarini yuklash mumkin (animatsion GIFlar ham qo'llab-quvvatlanadi)
              </Typography>
            </Box>

            {/* Status Message */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
                💬 Status xabari
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Sizning status xabaringiz..."
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover fieldset': {
                      borderColor: '#2563eb'
                    }
                  }
                }}
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Status xabari boshqa o'quvchilarga ko'rinadi
              </Typography>
            </Box>

            {/* Emoji Selection for Premium Users */}
            {shouldShowPremiumFeatures(currentUser, currentUser) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
                  😊 Emojilar
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EmojiIcon />}
                  onClick={() => setEmojiPickerOpen(true)}
                  sx={{
                    borderColor: '#d97706',
                    color: '#d97706',
                    borderRadius: '8px',
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#fef3c7',
                      borderColor: '#d97706',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  {selectedEmojis.length > 0 ? `😊 ${selectedEmojis.length}/10 emoji tanlangan` : '😊 Emojilarni tanlash'}
                </Button>
                
                {/* Selected Emojis Preview */}
                {selectedEmojis.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#d97706', fontWeight: 600 }}>
                      Tanlangan emojilar:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedEmojis.map((emoji, index) => (
                        <Box
                          key={index}
                          sx={{
                            fontSize: '1.5rem',
                            lineHeight: 1,
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            p: 1,
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          {emoji}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{ color: '#64748b' }}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={saving}
            sx={{
              backgroundColor: '#2563eb',
              '&:hover': {
                backgroundColor: '#1d4ed8'
              }
            }}
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Emoji Picker Dialog */}
      <EmojiPicker
        open={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        selectedEmojis={selectedEmojis}
        onEmojiSelect={handleEmojiSelect}
        maxEmojis={10}
      />

      {/* Gradient Picker Dialog */}
      <GradientPicker
        open={gradientPickerOpen}
        onClose={() => setGradientPickerOpen(false)}
        selectedGradient={selectedGradient}
        onGradientSelect={handleGradientSelect}
      />

      {/* Gift Placement Dialog */}
      <Dialog
        open={giftPlacementDialogOpen}
        onClose={() => {
          setGiftPlacementDialogOpen(false);
          setSelectedPosition(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          color: '#1e293b',
          fontSize: '1.25rem',
          textAlign: 'center'
        }}>
          🎁 Joy {selectedPosition} uchun sovg'a tanlang
        </DialogTitle>
        <DialogContent>
          <Typography sx={{
            color: '#64748b',
            mb: 3,
            textAlign: 'center'
          }}>
            Bu joyga qaysi sovg'ani qo'ymoqchisiz?
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {myGifts.map((giftItem) => {
              const isPlaced = placedGifts.some(pg => pg.id === giftItem.id);
              const isInCurrentPosition = placedGifts.some(pg => pg.id === giftItem.id && pg.placement_position === selectedPosition);

              return (
                <Box
                  key={giftItem.id}
                  onClick={() => {
                    if (isInCurrentPosition) {
                      // Remove from this position
                      handleGiftPlacement(giftItem.id, null);
                    } else {
                      // Place in this position
                      handleGiftPlacement(giftItem.id, selectedPosition);
                    }
                    setGiftPlacementDialogOpen(false);
                    setSelectedPosition(null);
                  }}
                  sx={{
                    border: isInCurrentPosition ? '2px solid #10b981' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    p: 2,
                    cursor: isPlaced && !isInCurrentPosition ? 'not-allowed' : 'pointer',
                    backgroundColor: isInCurrentPosition ? '#ecfdf5' : '#ffffff',
                    opacity: isPlaced && !isInCurrentPosition ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isPlaced && !isInCurrentPosition ? '#ffffff' : (isInCurrentPosition ? '#d1fae5' : '#f8fafc'),
                      transform: isPlaced && !isInCurrentPosition ? 'none' : 'translateY(-1px)',
                      boxShadow: isPlaced && !isInCurrentPosition ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ fontSize: '2rem' }}>
                      {giftItem.gift.image_url ? (
                        <img
                          src={giftItem.gift.image_url}
                          alt={giftItem.gift.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        '🎁'
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '1rem'
                      }}>
                        {giftItem.gift.name}
                      </Typography>
                      {giftItem.gift.description && (
                        <Typography sx={{
                          color: '#64748b',
                          fontSize: '0.85rem'
                        }}>
                          {giftItem.gift.description}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      {isInCurrentPosition ? (
                        <Chip
                          label="Joylashtirilgan"
                          size="small"
                          sx={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      ) : isPlaced ? (
                        <Chip
                          label="Boshqa joyda"
                          size="small"
                          sx={{
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      ) : (
                        <Chip
                          label="Mavjud"
                          size="small"
                          sx={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}

            {myGifts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{
                  fontSize: '3rem',
                  mb: 2
                }}>
                  🎁
                </Typography>
                <Typography sx={{
                  color: '#64748b',
                  mb: 2
                }}>
                  Sizda hali sovg'alar yo'q
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setGiftPlacementDialogOpen(false);
                    setSelectedPosition(null);
                    navigate('/student/pricing');
                  }}
                  sx={{
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    '&:hover': { backgroundColor: '#d97706' }
                  }}
                >
                  Marketga o'tish
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => {
              setGiftPlacementDialogOpen(false);
              setSelectedPosition(null);
            }}
            sx={{
              color: '#374151',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Yopish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Display Gift Selection Dialog */}
      <Dialog
        open={displayGiftDialogOpen}
        onClose={() => setDisplayGiftDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          color: '#1e293b',
          fontSize: '1.25rem',
          textAlign: 'center'
        }}>
          🎁 Displey uchun sovg'a tanlang
        </DialogTitle>
        <DialogContent>
          <Typography sx={{
            color: '#64748b',
            mb: 3,
            textAlign: 'center'
          }}>
            Ismingiz oldida ko'rsatiladigan sovg'ani tanlang. Faqat bitta sovg'ani tanlashingiz mumkin.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Option to remove display gift */}
            <Box
              onClick={() => handleDisplayGiftSelect(null)}
              sx={{
                border: displayGift ? '1px solid #e2e8f0' : '2px solid #10b981',
                borderRadius: '8px',
                p: 2,
                cursor: 'pointer',
                backgroundColor: displayGift ? '#ffffff' : '#ecfdf5',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: displayGift ? '#f8fafc' : '#d1fae5',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ fontSize: '2rem' }}>
                  ❌
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{
                    fontWeight: 600,
                    color: '#1e293b',
                    fontSize: '1rem'
                  }}>
                    Sovg'asiz ko'rsatish
                  </Typography>
                  <Typography sx={{
                    color: '#64748b',
                    fontSize: '0.85rem'
                  }}>
                    Ismingiz oddiy ko'rinishda bo'ladi
                  </Typography>
                </Box>
                {!displayGift && (
                  <Chip
                    label="Tanlangan"
                    size="small"
                    sx={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                )}
              </Box>
            </Box>

            {myGifts.map((giftItem) => {
              const isSelected = displayGift && displayGift.id === giftItem.id;

              return (
                <Box
                  key={giftItem.id}
                  onClick={() => handleDisplayGiftSelect(giftItem.id)}
                  sx={{
                    border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    p: 2,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isSelected ? '#d1fae5' : '#f8fafc',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ fontSize: '2rem' }}>
                      {giftItem.gift_image_url ? (
                        <img
                          src={giftItem.gift_image_url}
                          alt={giftItem.gift_name}
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        '🎁'
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '1rem'
                      }}>
                        {giftItem.gift_name}
                      </Typography>
                      <Typography sx={{
                        color: '#64748b',
                        fontSize: '0.85rem'
                      }}>
                        #{giftItem.gift_number} • {giftItem.gift_rarity_display}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      {isSelected ? (
                        <Chip
                          label="Tanlangan"
                          size="small"
                          sx={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      ) : (
                        <Chip
                          label={giftItem.gift_rarity_display}
                          size="small"
                          sx={{
                            backgroundColor: giftItem.gift_rarity === 'common' ? '#f3f4f6' :
                                           giftItem.gift_rarity === 'rare' ? '#dbeafe' :
                                           giftItem.gift_rarity === 'epic' ? '#f3e8ff' :
                                           giftItem.gift_rarity === 'legendary' ? '#fef3c7' : '#f3f4f6',
                            color: giftItem.gift_rarity === 'common' ? '#374151' :
                                 giftItem.gift_rarity === 'rare' ? '#1e40af' :
                                 giftItem.gift_rarity === 'epic' ? '#7c3aed' :
                                 giftItem.gift_rarity === 'legendary' ? '#d97706' : '#374151',
                            fontWeight: 600
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}

            {myGifts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{
                  fontSize: '3rem',
                  mb: 2
                }}>
                  🎁
                </Typography>
                <Typography sx={{
                  color: '#64748b',
                  mb: 2
                }}>
                  Sizda hali sovg'alar yo'q
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setDisplayGiftDialogOpen(false);
                    navigate('/student/pricing');
                  }}
                  sx={{
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    '&:hover': { backgroundColor: '#d97706' }
                  }}
                >
                  Marketga o'tish
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => setDisplayGiftDialogOpen(false)}
            sx={{
              color: '#374151',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Yopish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Rewards Modal */}
      <Dialog
        open={eventRewardsDialogOpen}
        onClose={() => setEventRewardsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          color: '#1e293b',
          fontSize: '1.25rem',
          textAlign: 'center'
        }}>
          🎉 Tabriklaymiz! Siz mukofot yutdingiz!
        </DialogTitle>
        <DialogContent>
          <Typography sx={{
            color: '#64748b',
            mb: 3,
            textAlign: 'center'
          }}>
            Quyidagi tadbirlarda qatnashganingiz uchun mukofotlar berildi:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {unclaimedRewards.map((reward) => (
              <Card key={reward.id} sx={{
                border: '2px solid #f59e0b',
                backgroundColor: '#fef3c7',
                borderRadius: '12px'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ fontSize: '2rem' }}>
                      🏆
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '1.1rem'
                      }}>
                        {reward.event_title}
                      </Typography>
                      {reward.position && (
                        <Typography sx={{
                          color: '#d97706',
                          fontSize: '0.9rem',
                          fontWeight: 500
                        }}>
                          {reward.position}-o'rin
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#f59e0b'
                      }}>
                        +{reward.stars_awarded} ⭐
                      </Typography>
                      <Typography sx={{
                        color: '#64748b',
                        fontSize: '0.8rem'
                      }}>
                        {new Date(reward.awarded_at).toLocaleDateString('uz-UZ')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={() => handleClaimReward(reward.id)}
                      sx={{
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: '#d97706'
                        }
                      }}
                    >
                      Mukofotni qabul qilish
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {unclaimedRewards.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{
                fontSize: '3rem',
                mb: 2
              }}>
                🎉
              </Typography>
              <Typography sx={{
                color: '#64748b',
                mb: 2
              }}>
                Hozircha yangi mukofotlar yo'q
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => setEventRewardsDialogOpen(false)}
            sx={{
              color: '#374151',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Yopish
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default StudentProfile;