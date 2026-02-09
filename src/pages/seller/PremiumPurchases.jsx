import React, { useState, useEffect } from 'react';
import 'animate.css';
import {
  Row,
  Col,
  Card,
  Typography,
  Table,
  Statistic,
  Spin,
} from 'antd';
import {
  StarOutlined,
  DollarOutlined,
  CrownOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const PremiumPurchases = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    starsPurchasesCount: 0,
    moneyPurchasesCount: 0,
    totalStarsUsed: 0,
    totalMoneySpent: 0,
  });

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const [purchasesResponse, statsResponse] = await Promise.all([
        apiService.get('/premium-purchases/'),
        apiService.get('/premium-purchases/seller_stats/'),
      ]);

      if (Array.isArray(purchasesResponse)) {
        setPurchases(purchasesResponse);
      } else if (purchasesResponse.results) {
        setPurchases(purchasesResponse.results);
      } else {
        setPurchases([]);
      }

      if (statsResponse) {
        setStats({
          totalPurchases: statsResponse.total_purchases || 0,
          starsPurchasesCount: statsResponse.stars_purchases_count || 0,
          moneyPurchasesCount: statsResponse.money_purchases_count || 0,
          totalStarsUsed: statsResponse.total_stars_used || 0,
          totalMoneySpent: statsResponse.total_money_spent || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      align: 'center',
    },
    {
      title: "O'quvchi",
      key: 'student',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '14px' }}>
            {record.student_name || record.student_username || "Noma'lum"}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            @{record.student_username || record.student || 'N/A'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Sotib olish turi',
      dataIndex: 'purchase_type',
      key: 'purchase_type',
      width: 120,
      align: 'center',
      render: (type) => (
        <span style={{
          backgroundColor: type === 'stars' ? '#fef3c7' : '#dcfce7',
          color: type === 'stars' ? '#d97706' : '#16a34a',
          padding: '4px 12px',
          fontWeight: 700,
          fontSize: '12px',
          border: `2px solid ${type === 'stars' ? '#d97706' : '#16a34a'}`,
          borderRadius: 0,
        }}>
          {type === 'stars' ? '⭐ Yulduz' : '💵 Pul'}
        </span>
      ),
    },
    {
      title: ' Tanlangan Tariff',
      dataIndex: 'plan_type_name',
      key: 'plan_type_name',
      width: 100,
      align: 'center',
      render: (type, record) => {
        const planLabels = {
          week: '1 HAFTA',
          month: '1 OY',
          year: '1 YIL',
          performance: 'BAJARUVCHAN',
        };
        return (
          <span style={{
            backgroundColor: '#f3e8ff',
            color: '#7c3aed',
            padding: '4px 12px',
            fontWeight: 700,
            fontSize: '12px',
            border: '2px solid #7c3aed',
            borderRadius: 0,
          }}>
            {record.plan_type_name || planLabels[record.plan_type] || record.plan_type || 'N/A'}
          </span>
        );
      },
    },
    {
      title: 'Yulduzlar',
      dataIndex: 'stars_used',
      key: 'stars_used',
      width: 100,
      align: 'center',
      render: (stars) => (
        <Text strong style={{ fontSize: '16px', color: '#d97706' }}>
          ⭐ {stars || 0}
        </Text>
      ),
    },
    {
      title: 'Pul (USD)',
      dataIndex: 'money_spent',
      key: 'money_spent',
      width: 100,
      align: 'center',
      render: (money) => (
        <Text strong style={{ fontSize: '16px', color: '#16a34a' }}>
          ${parseFloat(money || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Berilgan vaqt',
      dataIndex: 'granted_date',
      key: 'granted_date',
      width: 150,
      align: 'center',
      render: (date) => (
        <Text style={{ fontSize: '12px', fontWeight: 600 }}>
          {dayjs(date).format('DD.MM.YYYY HH:mm')}
        </Text>
      ),
      sorter: (a, b) => new Date(a.granted_date) - new Date(b.granted_date),
    },
    {
      title: 'Amal qilish muddati',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 150,
      align: 'center',
      render: (date) => (
        <Text style={{ fontSize: '12px', fontWeight: 600 }}>
          {dayjs(date).format('DD.MM.YYYY HH:mm')}
        </Text>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, fontWeight: 800, textTransform: 'uppercase' }}>Yuklanmoqda...</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0' }}>
      {/* Brutalist Header */}
      <div className="animate__animated animate__fadeIn" style={{ marginBottom: '60px' }}>
        <div style={{ 
          display: 'inline-block', 
          backgroundColor: '#000', 
          color: '#fff', 
          padding: '8px 16px', 
          fontWeight: 900, 
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          marginBottom: '16px'
        }}>
          Monitoring
        </div>
        <Title level={1} style={{ 
          margin: 0, 
          fontWeight: 900, 
          fontSize: '2.5rem', 
          lineHeight: 0.9, 
          textTransform: 'uppercase',
          letterSpacing: '-0.05em',
          color: '#000'
        }}>
          Premium Sotuvlar
        </Title>
        <div style={{ 
          width: '80px', 
          height: '10px', 
          backgroundColor: '#000', 
          margin: '24px 0' 
        }}></div>
        <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
          Premium obuna sotuvlari, yulduzlar bilan almashuv va daromadlar monitoring paneli.
        </Paragraph>
      </div>

      {/* Refresh Button */}
      <div className="animate__animated animate__fadeIn" style={{ marginBottom: '32px' }}>
        <div
          onClick={loadPurchases}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#000',
            color: '#fff',
            fontWeight: 900,
            border: '3px solid #000',
            borderRadius: 0,
            boxShadow: '6px 6px 0px #000',
            cursor: 'pointer',
            textTransform: 'uppercase',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          <ReloadOutlined spin={loading} /> Yangilash
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[32, 32]} className="animate__animated animate__fadeIn" style={{ marginBottom: '48px' }}>
        <Col xs={12} sm={8} lg={4}>
          <div className="animate__animated animate__fadeIn">
            <Card
              style={{
                borderRadius: 0,
                border: '4px solid #000',
                boxShadow: '10px 10px 0px #000',
                backgroundColor: '#fff',
                height: '100%'
              }}
              styles={{ body: { padding: '24px' } }}
            >
              <Text style={{ 
                fontSize: '14px', 
                fontWeight: 900, 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                color: '#000',
                display: 'block',
                marginBottom: '4px'
              }}>
                Jami sotuvlar
              </Text>
              <Statistic
                value={stats.totalPurchases}
                valueStyle={{ 
                  fontSize: '48px', 
                  fontWeight: 900, 
                  color: '#000',
                  letterSpacing: '-2px',
                  lineHeight: 1
                }}
                prefix={<CrownOutlined style={{ marginRight: '12px', color: '#7c3aed' }} />}
              />
            </Card>
          </div>
        </Col>
        <Col xs={12} sm={8} lg={5}>
          <div className="animate__animated animate__fadeIn" style={{ animationDelay: '100ms' }}>
            <Card
              style={{
                borderRadius: 0,
                border: '4px solid #000',
                boxShadow: '10px 10px 0px #000',
                backgroundColor: '#fef3c7',
                height: '100%'
              }}
              styles={{ body: { padding: '24px' } }}
            >
              <Text style={{ 
                fontSize: '14px', 
                fontWeight: 900, 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                color: '#92400e',
                display: 'block',
                marginBottom: '4px'
              }}>
                Yulduz bilan
              </Text>
              <Statistic
                value={stats.starsPurchasesCount}
                valueStyle={{ 
                  fontSize: '48px', 
                  fontWeight: 900, 
                  color: '#92400e',
                  letterSpacing: '-2px',
                  lineHeight: 1
                }}
                prefix={<StarOutlined style={{ marginRight: '12px', color: '#d97706' }} />}
              />
            </Card>
          </div>
        </Col>
        <Col xs={12} sm={8} lg={5}>
          <div className="animate__animated animate__fadeIn" style={{ animationDelay: '200ms' }}>
            <Card
              style={{
                borderRadius: 0,
                border: '4px solid #000',
                boxShadow: '10px 10px 0px #000',
                backgroundColor: '#dcfce7',
                height: '100%'
              }}
              styles={{ body: { padding: '24px' } }}
            >
              <Text style={{ 
                fontSize: '14px', 
                fontWeight: 900, 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                color: '#166534',
                display: 'block',
                marginBottom: '4px'
              }}>
                Pul bilan
              </Text>
              <Statistic
                value={stats.moneyPurchasesCount}
                valueStyle={{ 
                  fontSize: '48px', 
                  fontWeight: 900, 
                  color: '#166534',
                  letterSpacing: '-2px',
                  lineHeight: 1
                }}
                prefix={<DollarOutlined style={{ marginRight: '12px', color: '#16a34a' }} />}
              />
            </Card>
          </div>
        </Col>
        <Col xs={12} sm={8} lg={5}>
          <div className="animate__animated animate__fadeIn" style={{ animationDelay: '300ms' }}>
            <Card
              style={{
                borderRadius: 0,
                border: '4px solid #000',
                boxShadow: '10px 10px 0px #000',
                backgroundColor: '#fef3c7',
                height: '100%'
              }}
              styles={{ body: { padding: '24px' } }}
            >
              <Text style={{ 
                fontSize: '14px', 
                fontWeight: 900, 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                color: '#92400e',
                display: 'block',
                marginBottom: '4px'
              }}>
                Jami yulduzlar
              </Text>
              <Statistic
                value={stats.totalStarsUsed}
                valueStyle={{ 
                  fontSize: '48px', 
                  fontWeight: 900, 
                  color: '#92400e',
                  letterSpacing: '-2px',
                  lineHeight: 1
                }}
                prefix={<StarOutlined style={{ marginRight: '12px', color: '#d97706' }} />}
              />
            </Card>
          </div>
        </Col>
        <Col xs={12} sm={8} lg={5}>
          <div className="animate__animated animate__fadeIn" style={{ animationDelay: '400ms' }}>
            <Card
              style={{
                borderRadius: 0,
                border: '4px solid #000',
                boxShadow: '10px 10px 0px #000',
                backgroundColor: '#dcfce7',
                height: '100%'
              }}
              styles={{ body: { padding: '24px' } }}
            >
              <Text style={{ 
                fontSize: '14px', 
                fontWeight: 900, 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                color: '#166534',
                display: 'block',
                marginBottom: '4px'
              }}>
                Jami daromad
              </Text>
              <Statistic
                value={stats.totalMoneySpent}
                precision={2}
                valueStyle={{ 
                  fontSize: '48px', 
                  fontWeight: 900, 
                  color: '#166534',
                  letterSpacing: '-2px',
                  lineHeight: 1
                }}
                prefix={<DollarOutlined style={{ marginRight: '12px', color: '#16a34a' }} />}
              />
            </Card>
          </div>
        </Col>
      </Row>

      {/* Table */}
      <div className="animate__animated animate__fadeIn" style={{ animationDelay: '500ms' }}>
        <Card
          style={{
            borderRadius: 0,
            border: '4px solid #000',
            boxShadow: '10px 10px 0px #000',
            backgroundColor: '#fff',
          }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={columns}
            dataSource={purchases}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${total} ta yozuv`,
              pageSizeOptions: ['10', '20', '50'],
              style: { padding: '16px' }
            }}
            scroll={{ x: 900 }}
            rowClassName={() => 'table-row'}
          />
        </Card>
      </div>

      <style>{`
        .table-row:hover {
          background-color: #f8fafc !important;
        }
        .ant-table-thead > tr > th {
          background-color: #f1f5f9 !important;
          font-weight: 900 !important;
          text-transform: uppercase;
          font-size: 12px !important;
          letter-spacing: 0.05em !important;
          border-bottom: 2px solid #000 !important;
          border-right: 2px solid #e2e8f0 !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #e2e8f0 !important;
          border-right: 1px solid #e2e8f0 !important;
        }
        .ant-pagination-item-active {
          border-color: #000 !important;
          background-color: #000 !important;
        }
        .ant-pagination-item-active a {
          color: #fff !important;
        }
      `}</style>
    </div>
  );
};

export default PremiumPurchases;
