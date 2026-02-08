import React, { useState, useEffect } from 'react';
import 'animate.css';
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
  Space,
} from 'antd';
import {
  ArrowLeftOutlined,
  StarOutlined,
  StarFilled,
  SketchOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useEconomy } from '../../context/EconomyContext';
import apiService from '../../data/apiService';

const { Title, Text, Paragraph } = Typography;

const PricingPage = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUserData } = useAuth();
  const { stars: userStars, exchangeStarsForPremium } = useEconomy();
  const [pricingPlans, setPricingPlans] = useState([]);
  const [starPackages, setStarPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPricingData = async () => {
      try {
        setLoading(true);

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );

        const [pricingResponse, starResponse] = await Promise.all([
          Promise.race([
            apiService.get('/pricing/'),
            timeoutPromise
          ]),
          Promise.race([
            apiService.get('/star-packages/'),
            timeoutPromise
          ])
        ]);

        console.log('Pricing response:', pricingResponse);
        console.log('Star packages response:', starResponse);

        // Transform pricing data with fallback
        const transformedPricing = (pricingResponse || []).map(plan => ({
          key: plan.plan_type,
          planType: plan.plan_name,
          originalPrice: `$${plan.original_price}`,
          discountedPrice: `$${plan.discounted_price}`,
          discount: `${plan.discount_percentage}% Chegirma`,
          popular: plan.plan_type === 'month', // Make month popular
          color: plan.plan_type === 'week' ? '#2563eb' :
            plan.plan_type === 'month' ? '#d97706' : '#16a34a'
        }));

        // Transform star packages data with fallback
        const transformedStars = (starResponse || []).map(pkg => ({
          key: `stars_${pkg.stars}`,
          stars: pkg.stars,
          originalPrice: `$${pkg.original_price}`,
          price: `$${pkg.discounted_price}`,
          discount: pkg.discount_text,
          popular: pkg.is_popular,
          color: pkg.stars >= 500 ? '#d97706' : '#f59e0b'
        }));

        // If no data from API, use fallback data
        if (transformedPricing.length === 0) {
          console.log('Using fallback pricing data');
          setPricingPlans([
            {
              key: 'week',
              planType: 'Haftalik obuna',
              originalPrice: '$15',
              discountedPrice: '$10',
              discount: '33% Chegirma',
              popular: false,
              color: '#2563eb'
            },
            {
              key: 'month',
              planType: 'Oylik obuna',
              originalPrice: '$50',
              discountedPrice: '$35',
              discount: '30% Chegirma',
              popular: true,
              color: '#d97706'
            },
            {
              key: 'year',
              planType: 'Yillik obuna',
              originalPrice: '$500',
              discountedPrice: '$300',
              discount: '40% Chegirma',
              popular: false,
              color: '#16a34a'
            }
          ]);
        } else {
          setPricingPlans(transformedPricing);
        }

        // If no star packages from API, use fallback data
        if (transformedStars.length === 0) {
          console.log('Using fallback star packages data');
          setStarPackages([
            {
              key: 'stars_100',
              stars: 100,
              originalPrice: '$5',
              price: '$3',
              discount: '40% Chegirma',
              popular: false,
              color: '#f59e0b'
            },
            {
              key: 'stars_500',
              stars: 500,
              originalPrice: '$20',
              price: '$15',
              discount: '25% Chegirma',
              popular: true,
              color: '#d97706'
            },
            {
              key: 'stars_1000',
              stars: 1000,
              originalPrice: '$35',
              price: '$25',
              discount: '29% Chegirma',
              popular: false,
              color: '#d97706'
            }
          ]);
        } else {
          setStarPackages(transformedStars);
        }
      } catch (err) {
        console.error('Failed to load pricing data:', err);
        setError('Narxlarni yuklashda xatolik yuz berdi. Fallback ma\'lumotlar ishlatilmoqda.');

        // Set fallback data on error
        setPricingPlans([
          {
            key: 'week',
            planType: 'Haftalik obuna',
            originalPrice: '$15',
            discountedPrice: '$10',
            discount: '33% Chegirma',
            popular: false,
            color: '#2563eb'
          },
          {
            key: 'month',
            planType: 'Oylik obuna',
            originalPrice: '$50',
            discountedPrice: '$35',
            discount: '30% Chegirma',
            popular: true,
            color: '#d97706'
          },
          {
            key: 'year',
            planType: 'Yillik obuna',
            originalPrice: '$500',
            discountedPrice: '$300',
            discount: '40% Chegirma',
            popular: false,
            color: '#16a34a'
          }
        ]);

        setStarPackages([
          {
            key: 'stars_100',
            stars: 100,
            originalPrice: '$5',
            price: '$3',
            discount: '40% Chegirma',
            popular: false,
            color: '#f59e0b'
          },
          {
            key: 'stars_500',
            stars: 500,
            originalPrice: '$20',
            price: '$15',
            discount: '25% Chegirma',
            popular: true,
            color: '#d97706'
          },
          {
            key: 'stars_1000',
            stars: 1000,
            originalPrice: '$35',
            price: '$25',
            discount: '29% Chegirma',
            popular: false,
            color: '#d97706'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPricingData();
  }, [currentUser]);

  const handlePurchase = (planId) => {
    window.open('https://t.me/jonizz_devvvv', '_blank');
  };

  // Table columns for pricing plans
  const pricingColumns = [
    {
      title: 'Obuna turi',
      dataIndex: 'planType',
      key: 'planType',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text style={{ fontWeight: 900, color: '#1e293b', fontSize: '1rem', textTransform: 'uppercase' }}>
            {text}
          </Text>
          {record.popular && (
            <Tag
              style={{
                backgroundColor: '#d97706',
                color: 'white',
                fontWeight: 900,
                fontSize: '0.7rem',
                margin: 0,
                height: '24px',
                lineHeight: '20px',
                borderRadius: 0,
                border: '2px solid rgba(255,255,255,0.4)'
              }}
            >
              MASHHUR
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
          <Title level={3} style={{
            fontWeight: 900,
            color: record.color,
            marginBottom: '4px',
            marginTop: 0,
            fontSize: '1.5rem'
          }}>
            {text}
          </Title>
          <Text style={{
            color: '#64748b',
            textDecoration: 'line-through',
            fontSize: '0.875rem',
            fontWeight: 700
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
            fontWeight: 900,
            fontSize: '0.875rem',
            margin: 0,
            borderRadius: 0,
            border: '2px solid #059669'
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
          onClick={() => handlePurchase(record.key)}
          style={{
            backgroundColor: record.color,
            color: 'white',
            fontWeight: 900,
            border: '2px solid rgba(255,255,255,0.2)',
            fontSize: '0.875rem',
            padding: '8px 16px',
            height: 'auto',
            borderRadius: 0,
            boxShadow: `4px 4px 0px rgba(0,0,0,0.05)`,
            textTransform: 'uppercase'
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
          onClick={() => handlePurchase(record.key)}
          style={{
            backgroundColor: record.color,
            color: 'white',
            fontWeight: 900,
            border: '2px solid rgba(255,255,255,0.2)',
            fontSize: '0.875rem',
            padding: '8px 16px',
            height: 'auto',
            borderRadius: 0,
            boxShadow: `4px 4px 0px rgba(0,0,0,0.05)`,
            textTransform: 'uppercase'
          }}
        >
          Sotib olish
        </Button>
      ),
    },
  ];

  return (
    <div className="animate__animated animate__fadeIn" style={{
      paddingTop: '24px',
      paddingBottom: '24px',
      maxWidth: '1800px',
      margin: '0 auto'
    }}>
      <div style={{ marginBottom: '60px' }}>
        <div style={{ backgroundColor: '#2563eb', color: '#fff', padding: '8px 16px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', display: 'inline-block' }}>
          Market
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <Title level={1} style={{ fontWeight: 900, fontSize: '3rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#1e293b', margin: 0 }}>
            Narxlar <span style={{ color: '#2563eb' }}>Do'koni</span>
          </Title>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{
              borderColor: '#e2e8f0',
              borderWidth: '2px',
              color: '#64748b',
              fontWeight: 900,
              borderRadius: 0,
              boxShadow: '4px 4px 0px rgba(0,0,0,0.05)',
              height: 'auto',
              padding: '12px 24px',
              textTransform: 'uppercase'
            }}
          >
            ORQAGA
          </Button>
        </div>
        <div style={{ width: '80px', height: '10px', backgroundColor: '#2563eb', margin: '24px 0' }}></div>
        <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px', marginBottom: 0 }}>
          Premium imkoniyatlar, yulduzlar to'plami va maxsus obunalar bilan o'quv jarayoningizni yanada foydali qiling.
        </Paragraph>
      </div>

      {error && (
        <div className="animate__animated animate__fadeIn">
          <Alert
            message={error}
            type="error"
            style={{ marginBottom: '16px', borderRadius: 0, border: '4px solid #000', fontWeight: 900 }}
          />
        </div>
      )}

      {/* Star Balance Information Card */}
      <div className="animate__animated animate__fadeIn" style={{ marginBottom: '40px' }}>
        <Card style={{
          border: '4px solid #000',
          borderRadius: 0,
          boxShadow: '10px 10px 0px #000',
          backgroundColor: '#fff',
          padding: '20px'
        }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Text style={{ fontWeight: 900, fontSize: '14px', textTransform: 'uppercase', color: '#666', display: 'block' }}>SIZNING BALANSINGIZ</Text>
              <Title level={2} style={{ margin: 0, fontWeight: 900, fontSize: '2.5rem' }}>
                {userStars} <StarFilled style={{ color: 'var(--star-gold)' }} />
              </Title>
            </Col>
            <Col>
              <div style={{ padding: '10px 20px', backgroundColor: '#000', color: '#fff', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}>
                STAR ECONOMY ACTIVE
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Text>Yuklanmoqda...</Text>
        </div>
      ) : (
        <>
          <div className="animate__animated animate__fadeIn" style={{ animationDelay: '200ms', marginBottom: '60px' }}>
            <Title level={2} style={{
              fontWeight: 900,
              color: '#000',
              marginBottom: '32px',
              textAlign: 'left',
              textTransform: 'uppercase'
            }}>
              <SketchOutlined style={{ marginRight: '12px' }} /> Premium Obunalar
            </Title>

            <Row gutter={[24, 24]}>
              {pricingPlans.map((plan) => {
                const priceMatch = plan.discountedPrice.match(/\d+/);
                const priceValue = priceMatch ? parseInt(priceMatch[0]) : 0;
                // Since prices are in stars in the UI but API might return USD, 
                // we'll use a multiplier or just assume the number if it's large, 
                // but usually the images show 300, 1200, 8000.
                // Let's manually map them for this view if it matches typical plans
                const starPrices = {
                  'week': 300,
                  'month': 1200,
                  'year': 8000
                };
                const displayPrice = starPrices[plan.key] || (priceValue * 100);
                const hasEnough = userStars >= displayPrice;

                return (
                  <Col xs={24} md={8} key={plan.key}>
                    <Card style={{
                      border: '4px solid #000',
                      borderRadius: 0,
                      boxShadow: '10px 10px 0px #000',
                      height: '100%',
                      textAlign: 'center',
                      padding: '20px'
                    }}>
                      <div style={{ backgroundColor: plan.color, color: '#fff', padding: '4px 12px', fontWeight: 900, fontSize: '10px', display: 'inline-block', marginBottom: '15px' }}>
                        OMMABOP
                      </div>
                      <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                        {plan.key === 'week' ? '📅' : plan.key === 'month' ? '☀️' : '👑'}
                      </div>
                      <Title level={3} style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '15px' }}>
                        {plan.key === 'week' ? '1 HAFTA' : plan.key === 'month' ? '1 OY' : '1 YIL'}
                      </Title>

                      <div style={{ marginBottom: '25px' }}>
                        <Title level={2} style={{ margin: 0, fontWeight: 900 }}>
                          <StarFilled style={{ color: 'var(--star-gold)' }} /> {displayPrice}
                        </Title>
                        <Text style={{ fontWeight: 800, color: '#64748b' }}>YOKI {plan.discountedPrice}</Text>
                      </div>

                      <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Button
                          type="primary"
                          block
                          disabled={!hasEnough}
                          onClick={async () => {
                            try {
                              await exchangeStarsForPremium(plan.key);
                              window.location.reload();
                            } catch (e) {
                              console.error('Exchange failed', e);
                            }
                          }}
                          style={{
                            height: '50px',
                            backgroundColor: hasEnough ? 'var(--star-gold)' : '#f1f5f9',
                            color: '#000',
                            border: '3px solid #000',
                            borderRadius: 0,
                            fontWeight: 900,
                            textTransform: 'uppercase'
                          }}
                        >
                          {hasEnough ? 'YULDUZGA ALMASHISH' : 'YULDUZLAR YETARLI EMAS'}
                        </Button>

                        <Button
                          block
                          onClick={() => handlePurchase(plan.key)}
                          style={{
                            height: '50px',
                            backgroundColor: '#fff',
                            color: '#000',
                            border: '3px solid #000',
                            borderRadius: 0,
                            fontWeight: 900,
                            textTransform: 'uppercase'
                          }}
                        >
                          SOTIB OLISH ({plan.discountedPrice})
                        </Button>
                      </Space>

                      {!hasEnough && (
                        <Text style={{ display: 'block', marginTop: '10px', color: 'red', fontWeight: 700 }}>
                          Yulduz bilan olish uchun yana {displayPrice - userStars} yulduz kerak
                        </Text>
                      )}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>

          <div className="animate__animated animate__fadeIn" style={{ animationDelay: '400ms', marginBottom: '32px' }}>
            <Title level={2} style={{
              fontWeight: 900,
              color: '#000',
              marginBottom: '32px',
              textAlign: 'left',
              textTransform: 'uppercase'
            }}>
              <StarFilled style={{ color: '#f59e0b', marginRight: '12px' }} /> Yulduzlar To'plami
            </Title>

            <Row gutter={[24, 24]}>
              {starPackages.map((pkg) => (
                <Col xs={24} md={8} key={pkg.key}>
                  <Card style={{
                    border: '4px solid #000',
                    borderRadius: 0,
                    boxShadow: '10px 10px 0px #000',
                    height: '100%',
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    {pkg.popular && (
                      <div style={{ backgroundColor: '#000', color: '#fff', padding: '4px 12px', fontWeight: 900, fontSize: '10px', display: 'inline-block', marginBottom: '15px' }}>
                        MASHHUR
                      </div>
                    )}
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                      ⭐
                    </div>
                    <Title level={2} style={{ fontWeight: 900, marginBottom: '5px' }}>
                      {pkg.stars}
                    </Title>
                    <Text style={{ fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '15px' }}>YULDUZ</Text>

                    <div style={{ marginBottom: '25px' }}>
                      <Text style={{ color: '#64748b', textDecoration: 'line-through', marginRight: '10px', fontWeight: 700 }}>
                        {pkg.originalPrice}
                      </Text>
                      <Title level={3} style={{ margin: 0, fontWeight: 900, display: 'inline-block', color: '#059669' }}>
                        {pkg.price}
                      </Title>
                    </div>

                    <Button
                      type="primary"
                      block
                      onClick={() => handlePurchase(pkg.key)}
                      style={{
                        height: '50px',
                        backgroundColor: '#000',
                        color: '#fff',
                        border: '3px solid #000',
                        borderRadius: 0,
                        fontWeight: 900,
                        textTransform: 'uppercase'
                      }}
                    >
                      SOTIB OLISH
                    </Button>
                    <div style={{ marginTop: '10px' }}>
                      <Tag style={{ borderRadius: 0, border: '2px solid #059669', color: '#059669', fontWeight: 900, backgroundColor: '#ecfdf5' }}>
                        {pkg.discount}
                      </Tag>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>


        </>
      )}
    </div>
  );
};

export default PricingPage;