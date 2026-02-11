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
      width: 55,
      align: 'center',
    },
    {
      title: "O'quvchi",
      key: 'student',
      width: 130,
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: '13px' }}>
            {record.student_name || record.student_username || "Noma'lum"}
          </Text>
        </div>
      ),
    },
    {
      title: 'Turi',
      dataIndex: 'purchase_type',
      key: 'purchase_type',
      width: 80,
      align: 'center',
      render: (type) => (
        <span style={{
          backgroundColor: type === 'stars' ? '#fef3c7' : '#dcfce7',
          color: type === 'stars' ? '#d97706' : '#16a34a',
          padding: '3px 8px',
          fontWeight: 700,
          fontSize: '11px',
          border: `2px solid ${type === 'stars' ? '#d97706' : '#16a34a'}`,
          borderRadius: 0,
        }}>
          {type === 'stars' ? '⭐ Yulduz' : '💵 Pul'}
        </span>
      ),
    },
    {
      title: 'Tariff',
      dataIndex: 'plan_type_name',
      key: 'plan_type_name',
      width: 90,
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
            padding: '3px 8px',
            fontWeight: 700,
            fontSize: '10px',
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
      width: 70,
      align: 'center',
      render: (stars) => (
        <Text strong style={{ fontSize: '14px', color: '#d97706' }}>
          ⭐ {stars || 0}
        </Text>
      ),
    },
    {
      title: 'Pul (USD)',
      dataIndex: 'money_spent',
      key: 'money_spent',
      width: 80,
      align: 'center',
      render: (money) => (
        <Text strong style={{ fontSize: '14px', color: '#16a34a' }}>
          ${parseFloat(money || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Berilgan',
      dataIndex: 'granted_date',
      key: 'granted_date',
      width: 100,
      align: 'center',
      render: (date) => (
        <Text style={{ fontSize: '11px', fontWeight: 600 }}>
          {dayjs(date).format('DD.MM.YYYY HH:mm')}
        </Text>
      ),
      sorter: (a, b) => new Date(a.granted_date) - new Date(b.granted_date),
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
    <div style={{ padding: '32px 0' }}>
      {/* Brutalist Header */}
      <div className="animate__animated animate__fadeIn" style={{ marginBottom: '48px' }}>
        <div style={{
          display: 'inline-block',
          backgroundColor: '#000',
          color: '#fff',
          padding: '7px 14px',
          fontWeight: 900,
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          marginBottom: '14px'
        }}>
          Monitoring
        </div>
        <Title level={1} style={{
          margin: 0,
          fontWeight: 900,
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          lineHeight: 1,
          textTransform: 'uppercase',
          letterSpacing: '-0.04em',
          color: '#000'
        }}>
          Premium Sotuvlar
        </Title>
        <div style={{
          width: '70px',
          height: '9px',
          backgroundColor: '#000',
          margin: '20px 0'
        }}></div>
        <Paragraph style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
          Premium obuna sotuvlari, yulduzlar bilan almashuv va daromadlar monitoring paneli.
        </Paragraph>
      </div>

      {/* Refresh Button */}
      <div className="animate__animated animate__fadeIn" style={{ marginBottom: '28px' }}>
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
            fontSize: '13px',
            transition: 'all 0.2s'
          }}
        >
          <ReloadOutlined spin={loading} /> Yangilash
        </div>
      </div>

      {/* Statistics Cards - Single Row */}
      <div className="animate__animated animate__fadeIn" style={{ marginBottom: '40px' }}>
        <Row gutter={[12, 12]} style={{ width: '100%', margin: 0 }}>
          <Col xs={24} style={{ padding: 0 }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '8px'
            }}>
              {/* Card 1 - Jami sotuvlar */}
              <Card
                style={{
                  borderRadius: 0,
                  border: '2px solid #000',
                  boxShadow: '6px 6px 0px #000',
                  backgroundColor: '#fff',
                  minWidth: '180px',
                  flex: 1
                }}
                styles={{ body: { padding: '16px' } }}
              >
                <Text style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#000',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  Jami sotuvlar
                </Text>
                <Statistic
                  value={stats.totalPurchases}
                  valueStyle={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#000',
                    letterSpacing: '-1px',
                    lineHeight: 1
                  }}
                  prefix={<CrownOutlined style={{ marginRight: '6px', fontSize: '16px', color: '#7c3aed' }} />}
                />
              </Card>

              {/* Card 2 - Yulduz bilan */}
              <Card
                style={{
                  borderRadius: 0,
                  border: '2px solid #000',
                  boxShadow: '6px 6px 0px #000',
                  backgroundColor: '#fef3c7',
                  minWidth: '180px',
                  flex: 1
                }}
                styles={{ body: { padding: '16px' } }}
              >
                <Text style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#92400e',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  Yulduz bilan
                </Text>
                <Statistic
                  value={stats.starsPurchasesCount}
                  valueStyle={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#92400e',
                    letterSpacing: '-1px',
                    lineHeight: 1
                  }}
                  prefix={<StarOutlined style={{ marginRight: '6px', fontSize: '16px', color: '#d97706' }} />}
                />
              </Card>

              {/* Card 3 - Pul bilan */}
              <Card
                style={{
                  borderRadius: 0,
                  border: '2px solid #000',
                  boxShadow: '6px 6px 0px #000',
                  backgroundColor: '#dcfce7',
                  minWidth: '180px',
                  flex: 1
                }}
                styles={{ body: { padding: '16px' } }}
              >
                <Text style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#166534',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  Pul bilan
                </Text>
                <Statistic
                  value={stats.moneyPurchasesCount}
                  valueStyle={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#166534',
                    letterSpacing: '-1px',
                    lineHeight: 1
                  }}
                  prefix={<DollarOutlined style={{ marginRight: '6px', fontSize: '16px', color: '#16a34a' }} />}
                />
              </Card>

              {/* Card 4 - Jami yulduzlar */}
              <Card
                style={{
                  borderRadius: 0,
                  border: '2px solid #000',
                  boxShadow: '6px 6px 0px #000',
                  backgroundColor: '#fef3c7',
                  minWidth: '180px',
                  flex: 1
                }}
                styles={{ body: { padding: '16px' } }}
              >
                <Text style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#92400e',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  Jami yulduzlar
                </Text>
                <Statistic
                  value={stats.totalStarsUsed}
                  valueStyle={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#92400e',
                    letterSpacing: '-1px',
                    lineHeight: 1
                  }}
                  prefix={<StarOutlined style={{ marginRight: '6px', fontSize: '16px', color: '#d97706' }} />}
                />
              </Card>

              {/* Card 5 - Jami daromad */}
              <Card
                style={{
                  borderRadius: 0,
                  border: '2px solid #000',
                  boxShadow: '6px 6px 0px #000',
                  backgroundColor: '#dcfce7',
                  minWidth: '180px',
                  flex: 1
                }}
                styles={{ body: { padding: '16px' } }}
              >
                <Text style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#166534',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  Jami daromad
                </Text>
                <Statistic
                  value={stats.totalMoneySpent}
                  precision={2}
                  valueStyle={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#166534',
                    letterSpacing: '-1px',
                    lineHeight: 1
                  }}
                  prefix={<DollarOutlined style={{ marginRight: '6px', fontSize: '16px', color: '#16a34a' }} />}
                />
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      {/* Table */}
      <div className="animate__animated animate__fadeIn">
        <Card
          style={{
            borderRadius: 0,
            border: '3px solid #000',
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
            scroll={{ x: 800 }}
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
          font-size: 11px !important;
          letter-spacing: 0.05em !important;
          border-bottom: 2px solid #000 !important;
          border-right: 2px solid #e2e8f0 !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #e2e8f0 !important;
          border-right: 2px solid #e2e8f0 !important;
        }
      `}</style>
    </div>
  );
};

export default PremiumPurchases;
