import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Button,
  Row,
  Col,
  Tag,
  Table,
  Alert,
  Modal,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  StarOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const PricingPage = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUserData } = useAuth();
  const [pricingPlans, setPricingPlans] = useState([]);
  const [starPackages, setStarPackages] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [myGifts, setMyGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [userStars, setUserStars] = useState(currentUser?.stars || 0);

  useEffect(() => {
    const loadPricingData = async () => {
      try {
        setLoading(true);
        const [pricingResponse, starResponse, giftsResponse, myGiftsResponse] = await Promise.all([
          apiService.get('/pricing/'),
          apiService.get('/star-packages/'),
          apiService.get('/gifts/'),
          apiService.get('/student-gifts/my_gifts/')
        ]);

        // Transform pricing data
        const transformedPricing = pricingResponse.map(plan => ({
          key: plan.plan_type,
          planType: plan.plan_name,
          originalPrice: `$${plan.original_price}`,
          discountedPrice: `$${plan.discounted_price}`,
          discount: `${plan.discount_percentage}% Chegirma`,
          popular: plan.plan_type === 'month', // Make month popular
          color: plan.plan_type === 'week' ? '#2563eb' :
                 plan.plan_type === 'month' ? '#d97706' : '#16a34a'
        }));

        // Transform star packages data
        const transformedStars = starResponse.map(pkg => ({
          key: `stars_${pkg.stars}`,
          stars: pkg.stars,
          originalPrice: `$${pkg.original_price}`,
          price: `$${pkg.discounted_price}`,
          discount: pkg.discount_text,
          popular: pkg.is_popular,
          color: pkg.stars >= 500 ? '#d97706' : '#f59e0b'
        }));

        setPricingPlans(transformedPricing);
        setStarPackages(transformedStars);
        setGifts(giftsResponse.results || giftsResponse);
        setMyGifts(myGiftsResponse.results || myGiftsResponse);
        setUserStars(currentUser?.stars || 0);
      } catch (err) {
        console.error('Failed to load pricing data:', err);
        setError('Narxlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadPricingData();
  }, [currentUser]);

  const handlePurchase = (planId) => {
    window.open('https://t.me/jonizz_devvvv', '_blank');
  };

  const hasPurchasedGift = (giftId) => {
    return myGifts.some(gift => gift.gift === giftId);
  };

  const handleGiftPurchaseClick = (gift) => {
    if (userStars < gift.star_cost) {
      alert('Sizda yetarli yulduz yo\'q!');
      return;
    }
    setSelectedGift(gift);
    setPurchaseDialogOpen(true);
  };

  const handleGiftPurchaseConfirm = async () => {
    if (!selectedGift) return;

    try {
      console.log('Purchasing gift:', selectedGift.id);
      const response = await apiService.post('/student-gifts/purchase_gift/', {
        gift_id: selectedGift.id
      });

      console.log('Purchase response:', response);

      // Update local state
      setSuccessMessage(`${selectedGift.name} sovg'asi muvaffaqiyatli sotib olindi!`);
      setUserStars(response.remaining_stars);

      // Update currentUser in AuthContext
      const updatedUser = { ...currentUser, stars: response.remaining_stars };
      setCurrentUserData(updatedUser);

      await loadData(); // Reload to update purchased gifts
      setPurchaseDialogOpen(false);
      setSelectedGift(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to purchase gift:', error);
      alert('Sovg\'ani sotib olishda xatolik yuz berdi');
    }
  };

  const handleClosePurchaseDialog = () => {
    setPurchaseDialogOpen(false);
    setSelectedGift(null);
  };

  const loadData = async () => {
    try {
      const [giftsResponse, myGiftsResponse] = await Promise.all([
        apiService.get('/gifts/'),
        apiService.get('/student-gifts/my_gifts/')
      ]);
      setGifts(giftsResponse.results || giftsResponse);
      setMyGifts(myGiftsResponse.results || myGiftsResponse);
    } catch (error) {
      console.error('Failed to reload gifts data:', error);
    }
  };

  // Table columns for pricing plans
  const pricingColumns = [
    {
      title: 'Obuna turi',
      dataIndex: 'planType',
      key: 'planType',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
            {text}
          </Text>
          {record.popular && (
            <Tag
              style={{
                backgroundColor: '#d97706',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
                margin: 0,
                height: '20px',
                lineHeight: '20px'
              }}
            >
              Eng mashhur
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Narx',
      dataIndex: 'discountedPrice',
      key: 'discountedPrice',
      render: (text, record) => (
        <div>
          <Title level={4} style={{
            fontWeight: 700,
            color: record.color,
            marginBottom: '4px',
            marginTop: 0
          }}>
            {text}
          </Title>
          <Text style={{
            color: '#64748b',
            textDecoration: 'line-through',
            fontSize: '0.75rem'
          }}>
            {record.originalPrice}
          </Text>
        </div>
      ),
    },
    {
      title: 'Chegirma',
      dataIndex: 'discount',
      key: 'discount',
      render: (text) => (
        <Tag
          style={{
            backgroundColor: '#ecfdf5',
            color: '#059669',
            fontWeight: 600,
            fontSize: '0.75rem',
            margin: 0
          }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: 'Harakat',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handlePurchase(record.key)}
          style={{
            backgroundColor: record.color,
            color: 'white',
            fontWeight: 600,
            border: 'none',
            fontSize: '0.75rem',
            padding: '4px 8px',
            height: 'auto'
          }}
        >
          Sotib olish
        </Button>
      ),
    },
  ];

  // Table columns for star packages
  const starColumns = [
    {
      title: 'Yulduzlar soni',
      dataIndex: 'stars',
      key: 'stars',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StarOutlined style={{ color: record.color }} />
          <Text style={{
            fontWeight: 700,
            color: record.color,
            fontSize: '1.125rem'
          }}>
            {text}
          </Text>
          {record.popular && (
            <Tag
              style={{
                backgroundColor: '#d97706',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
                margin: 0,
                height: '20px',
                lineHeight: '20px'
              }}
            >
              Mashhur
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Narx',
      dataIndex: 'price',
      key: 'price',
      render: (text, record) => (
        <div>
          <Title level={4} style={{
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '4px',
            marginTop: 0
          }}>
            {text}
          </Title>
          <Text style={{
            color: '#64748b',
            textDecoration: 'line-through',
            fontSize: '0.75rem'
          }}>
            {record.originalPrice}
          </Text>
        </div>
      ),
    },
    {
      title: 'Chegirma',
      dataIndex: 'discount',
      key: 'discount',
      render: (text) => (
        <Tag
          style={{
            backgroundColor: '#ecfdf5',
            color: '#059669',
            fontWeight: 600,
            fontSize: '0.75rem',
            margin: 0
          }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: 'Harakat',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handlePurchase(record.key)}
          style={{
            backgroundColor: record.color,
            color: 'white',
            fontWeight: 600,
            border: 'none',
            fontSize: '0.75rem',
            padding: '4px 8px',
            height: 'auto'
          }}
        >
          Sotib olish
        </Button>
      ),
    },
  ];

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common':
        return { bg: '#f3f4f6', color: '#374151' };
      case 'rare':
        return { bg: '#dbeafe', color: '#1e40af' };
      case 'epic':
        return { bg: '#f3e8ff', color: '#7c3aed' };
      case 'legendary':
        return { bg: '#fef3c7', color: '#d97706' };
      default:
        return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div style={{ 
      paddingTop: '24px', 
      paddingBottom: '24px', 
      maxWidth: '1800px', 
      margin: '0 auto' 
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={2} style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          Narxlar va paketlar
        </Title>
        <Text style={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Premium xizmatlar narxlari va paketlar
        </Text>

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{
            color: '#2563eb',
            border: 'none',
            backgroundColor: 'transparent'
          }}
        >
          Orqaga
        </Button>
      </div>

      {error && (
        <Alert 
          message={error}
          type="error" 
          style={{ marginBottom: '16px' }}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Text>Yuklanmoqda...</Text>
        </div>
      ) : (
        <>
          {/* Premium Plans Section */}
          <div style={{ marginBottom: '32px' }}>
            <Title level={3} style={{
              fontWeight: 600,
              color: '#374151',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              💎 Premium Obunalar
            </Title>

            <Card style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <Table
                columns={pricingColumns}
                dataSource={pricingPlans}
                pagination={false}
                style={{
                  '& .ant-table-thead > tr > th': {
                    backgroundColor: '#f8fafc',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#1e293b',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '16px'
                  },
                  '& .ant-table-tbody > tr > td': {
                    borderBottom: '1px solid #f1f5f9',
                    padding: '16px',
                    fontSize: '0.875rem',
                    color: '#334155'
                  },
                  '& .ant-table-tbody > tr:hover > td': {
                    backgroundColor: '#f8fafc'
                  }
                }}
              />
            </Card>
          </div>

          {/* Stars Section */}
          <div style={{ marginBottom: '32px' }}>
            <Title level={3} style={{
              fontWeight: 600,
              color: '#374151',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              ⭐ Yulduzlar
            </Title>

            <Card style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <Table
                columns={starColumns}
                dataSource={starPackages}
                pagination={false}
                style={{
                  '& .ant-table-thead > tr > th': {
                    backgroundColor: '#f8fafc',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#1e293b',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '16px'
                  },
                  '& .ant-table-tbody > tr > td': {
                    borderBottom: '1px solid #f1f5f9',
                    padding: '16px',
                    fontSize: '0.875rem',
                    color: '#334155'
                  },
                  '& .ant-table-tbody > tr:hover > td': {
                    backgroundColor: '#f8fafc'
                  }
                }}
              />
            </Card>
          </div>

          {/* Gifts Section */}
          <div style={{ marginTop: '32px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <Title level={3} style={{
                fontWeight: 600,
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: 0
              }}>
                🎁 Sovg'alar do'koni
              </Title>
              <div style={{
                backgroundColor: '#fef3c7',
                borderRadius: '12px',
                padding: '8px 16px',
                border: '1px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <StarOutlined style={{ color: '#f59e0b' }} />
                <Text style={{
                  fontWeight: 700,
                  color: '#92400e'
                }}>
                  {userStars} yulduz
                </Text>
              </div>
            </div>

            {successMessage && (
              <Alert
                message={`✅ ${successMessage}`}
                type="success"
                style={{
                  marginBottom: '16px',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #10b981',
                  color: '#059669',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
                }}
              />
            )}

            <Row gutter={[16, 16]}>
              {gifts.map((gift) => {
                const alreadyPurchased = hasPurchasedGift(gift.id);
                const canAfford = userStars >= gift.star_cost;
                const isSoldOut = gift.gift_count === 0;
                const rarityColors = getRarityColor(gift.rarity);

                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={gift.id}>
                    <Card
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease',
                        aspectRatio: '1/1',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{
                        height: '50%',
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px 12px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        {gift.image_url ? (
                          <img
                            src={gift.image_url}
                            alt={gift.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <Text style={{ color: '#64748b', fontSize: '3rem' }}>
                            🎁
                          </Text>
                        )}

                        {/* Rarity badge */}
                        <Tag
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: rarityColors.bg,
                            color: rarityColors.color,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            margin: 0,
                            border: 'none',
                            backdropFilter: 'blur(4px)'
                          }}
                        >
                          {gift.rarity_display || 'Oddiy'}
                        </Tag>
                      </div>

                      <div style={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '16px'
                      }}>
                        <Text style={{
                          fontWeight: 600,
                          color: '#1e293b',
                          fontSize: '1rem',
                          marginBottom: '8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {gift.name}
                        </Text>

                        {gift.description && (
                          <Text style={{
                            color: '#64748b',
                            fontSize: '0.85rem',
                            marginBottom: '16px',
                            flexGrow: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {gift.description}
                          </Text>
                        )}

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <StarOutlined style={{ marginRight: '4px', color: '#f59e0b', fontSize: '1.1rem' }} />
                            <Text style={{
                              fontWeight: 700,
                              color: '#d97706',
                              fontSize: '1rem'
                            }}>
                              {gift.star_cost}
                            </Text>
                          </div>

                          {alreadyPurchased && (
                            <Tag
                              style={{
                                backgroundColor: '#ecfdf5',
                                color: '#059669',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                margin: 0
                              }}
                            >
                              Sotib olingan
                            </Tag>
                          )}
                        </div>

                        {/* Quantity display */}
                        <div style={{ marginBottom: '16px' }}>
                          <Text style={{
                            color: '#dc2626',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textAlign: 'center'
                          }}>
                            Tugadi
                          </Text>
                        </div>

                        <Button
                          type="primary"
                          block
                          icon={<ShoppingCartOutlined />}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            handleGiftPurchaseClick(gift);
                          }}
                          disabled={alreadyPurchased || !canAfford || isSoldOut}
                          style={{
                            backgroundColor: alreadyPurchased ? '#10b981' : '#f59e0b',
                            color: '#ffffff',
                            fontWeight: 600,
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.85rem'
                          }}
                        >
                          {alreadyPurchased ? 'Qolmadi' :
                           !canAfford ? 'Yulduz yetmaydi' :
                           isSoldOut ? 'Tugadi' : 'Sotib olish'}
                        </Button>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            {gifts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Text style={{
                  fontSize: '3rem',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  🎁
                </Text>
                <Title level={3} style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  marginBottom: '8px'
                }}>
                  Hozircha sovg'alar yo'q
                </Title>
                <Text style={{ color: '#64748b' }}>
                  Admin tez orada yangi sovg'alar qo'shadi!
                </Text>
              </div>
            )}
          </div>
        </>
      )}

      {/* Gift Purchase Confirmation Dialog */}
      <Modal
        title={
          <div style={{ textAlign: 'center', fontWeight: 600, color: '#1e293b', fontSize: '1.25rem' }}>
            🎁 Sovg'ani sotib olish
          </div>
        }
        open={purchaseDialogOpen}
        onCancel={handleClosePurchaseDialog}
        footer={null}
        width={400}
      >
        {selectedGift && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              margin: '0 auto 16px',
              border: '1px solid #e2e8f0'
            }}>
              {selectedGift.image_url ? (
                <img
                  src={selectedGift.image_url}
                  alt={selectedGift.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <Text style={{ fontSize: '3rem' }}>🎁</Text>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Text style={{
                fontWeight: 600,
                color: '#1e293b',
                fontSize: '1.2rem'
              }}>
                {selectedGift.name}
              </Text>
              <Tag
                style={{
                  backgroundColor: getRarityColor(selectedGift.rarity).bg,
                  color: getRarityColor(selectedGift.rarity).color,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  margin: 0
                }}
              >
                {selectedGift.rarity_display || 'Oddiy'}
              </Tag>
            </div>

            {selectedGift.description && (
              <Text style={{
                color: '#64748b',
                marginBottom: '16px',
                fontSize: '0.95rem',
                display: 'block'
              }}>
                {selectedGift.description}
              </Text>
            )}

            <div style={{
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              border: '1px solid #f59e0b'
            }}>
              <Text style={{
                fontWeight: 600,
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <StarOutlined />
                {selectedGift.star_cost} yulduz
              </Text>
            </div>

            <Text style={{
              color: '#374151',
              fontSize: '0.95rem'
            }}>
              Haqiqatan ham bu sovg'ani sotib olmoqchimisiz? Yulduzlaringizdan {selectedGift.star_cost} ta ayriladi.
            </Text>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '16px', 
          marginTop: '24px',
          paddingBottom: '16px'
        }}>
          <Button
            onClick={handleClosePurchaseDialog}
            style={{
              borderColor: '#d1d5db',
              color: '#374151',
              padding: '8px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              border: '1px solid #d1d5db'
            }}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleGiftPurchaseConfirm}
            type="primary"
            style={{
              backgroundColor: '#f59e0b',
              border: 'none',
              padding: '8px 24px',
              borderRadius: '8px',
              fontWeight: 600
            }}
          >
            Sotib olish
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PricingPage;