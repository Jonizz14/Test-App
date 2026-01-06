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
} from 'antd';
import {
  ArrowLeftOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const PricingPage = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUserData } = useAuth();
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
          originalPrice: `${plan.original_price}`,
          discountedPrice: `${plan.discounted_price}`,
          discount: `${plan.discount_percentage}% Chegirma`,
          popular: plan.plan_type === 'month', // Make month popular
          color: plan.plan_type === 'week' ? '#2563eb' :
                 plan.plan_type === 'month' ? '#d97706' : '#16a34a'
        }));

        // Transform star packages data with fallback
        const transformedStars = (starResponse || []).map(pkg => ({
          key: `stars_${pkg.stars}`,
          stars: pkg.stars,
          originalPrice: `${pkg.original_price}`,
          price: `${pkg.discounted_price}`,
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

  return (
    <div className="animate__animated animate__fadeIn" style={{
      paddingTop: '24px',
      paddingBottom: '24px',
      maxWidth: '1800px',
      margin: '0 auto'
    }}>
      <div className="animate__animated animate__slideInDown" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
          <Title level={2} style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '-1px',
            marginLeft: '16px'
          }}>
            Narxlar Do'koni
          </Title>
        </div>
      </div>

      {error && (
        <div className="animate__animated animate__slideInRight">
          <Alert
            message={error}
            type="error"
            style={{ marginBottom: '16px' }}
          />
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Text>Yuklanmoqda...</Text>
        </div>
      ) : (
        <>
          {/* Premium Plans Section */}
          <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '200ms', marginBottom: '32px' }}>
            <Title level={3} style={{
              fontWeight: 600,
              color: '#374151',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              💎 Premium Obunalar
            </Title>

            <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '600ms' }}>
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
            </div>
          </div>

          {/* Stars Section */}
          <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '400ms', marginBottom: '32px' }}>
            <Title level={3} style={{
              fontWeight: 600,
              color: '#374151',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              ⭐ Yulduzlar
            </Title>

            <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '800ms' }}>
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
            </div>
          </div>


        </>
      )}
    </div>
  );
};

export default PricingPage;