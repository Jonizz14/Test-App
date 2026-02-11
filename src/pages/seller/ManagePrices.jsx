import React, { useState, useEffect } from 'react';
import 'animate.css';
import { Typography, Button, Input, Alert, Switch, Tabs, Table, Space, ConfigProvider, Tag } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, StarOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text, Paragraph } = Typography;

const ManagePrices = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [pricing, setPricing] = useState([]);
  const [starPackages, setStarPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pricingData, starData] = await Promise.all([
        apiService.get('/pricing/'),
        apiService.get('/star-packages/')
      ]);
      setPricing(pricingData.results || pricingData || []);
      setStarPackages(starData.results || starData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      original_price: item.original_price,
      discounted_price: item.discounted_price,
      discount_percentage: item.discount_percentage,
      is_active: item.is_active,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async () => {
    try {
      const endpoint = activeTab === 0 ? `/pricing/${editingId}/` : `/star-packages/${editingId}/`;
      await apiService.patch(endpoint, editData);
      await loadData();
      setEditingId(null);
      setEditData({});
      setSuccessMessage('Saqlandi');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 0,
          colorPrimary: '#000',
        },
      }}
    >
      <div className="animate__animated animate__fadeIn" style={{ padding: '32px 0' }}>
        {/* Header */}
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
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
              Narxlarni sozlash
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
              Narxlar & Paketlar
            </Title>
            <div style={{
              width: '70px',
              height: '9px',
              backgroundColor: '#000',
              margin: '20px 0'
            }}></div>
            <Paragraph style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
              Premium obuna va yulduz paketlari narxlarini markaziy boshqaruv orqali tahrirlang.
            </Paragraph>
          </div>

          {editingId && (
            <Button
              icon={<CloseOutlined />}
              onClick={handleCancel}
              style={{
                borderRadius: 0,
                border: '3px solid #000',
                fontWeight: 900,
                height: '48px',
                alignSelf: 'flex-start',
                padding: '0 20px'
              }}
            >
              BEKOR QILISH
            </Button>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert
            message={successMessage.toUpperCase()}
            type="success"
            showIcon
            style={{
              borderRadius: 0,
              border: '3px solid #000',
              boxShadow: '6px 6px 0px #000',
              fontWeight: 900,
              marginBottom: '32px',
              backgroundColor: '#fff'
            }}
          />
        )}

        {/* Tabs */}
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '28px' }}>
          <Tabs
            activeKey={activeTab.toString()}
            onChange={(key) => setActiveTab(parseInt(key))}
            tabBarStyle={{ marginBottom: 0 }}
            items={[
              {
                key: '0',
                label: <span style={{ fontWeight: 900, textTransform: 'uppercase', padding: '0 14px', fontSize: '13px' }}>💎 Premium Obunalar</span>
              },
              {
                key: '1',
                label: <span style={{ fontWeight: 900, textTransform: 'uppercase', padding: '0 14px', fontSize: '13px' }}>⭐ Yulduz Paketlari</span>
              },
            ]}
          />
        </div>

        {/* Pricing Table Section */}
        <div className="animate__animated animate__fadeIn" style={{
          border: '3px solid #000',
          boxShadow: '10px 10px 0px #000',
          backgroundColor: '#fff',
          overflow: 'auto'
        }}>
          <Table
            dataSource={activeTab === 0 ? pricing : starPackages}
            loading={loading}
            pagination={false}
            scroll={{ x: 800 }}
            columns={activeTab === 0 ? [
              {
                title: 'OBUNA TURI',
                dataIndex: 'plan_name',
                key: 'plan_name',
                width: 120,
                render: (name) => <Text style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '12px' }}>{name}</Text>
              },
              {
                title: 'ASL NARX ($)',
                dataIndex: 'original_price',
                key: 'original_price',
                width: 90,
                render: (text, record) => editingId === record.id ? (
                  <Input
                    type="number"
                    value={editData.original_price}
                    onChange={(e) => handleInputChange('original_price', parseFloat(e.target.value))}
                    style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, width: '90px' }}
                  />
                ) : (
                  <Text style={{ fontWeight: 700, fontSize: '13px' }}>{text}</Text>
                )
              },
              {
                title: 'CHEGIRMA NARX ($)',
                dataIndex: 'discounted_price',
                key: 'discounted_price',
                width: 100,
                render: (text, record) => editingId === record.id ? (
                  <Input
                    type="number"
                    value={editData.discounted_price}
                    onChange={(e) => handleInputChange('discounted_price', parseFloat(e.target.value))}
                    style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, width: '90px' }}
                  />
                ) : (
                  <Text style={{ fontWeight: 900, color: '#000', fontSize: '13px' }}>{text}</Text>
                )
              },
              {
                title: 'CHEGIRMA (%)',
                dataIndex: 'discount_percentage',
                key: 'discount_percentage',
                width: 80,
                render: (text, record) => editingId === record.id ? (
                  <Input
                    type="number"
                    value={editData.discount_percentage}
                    onChange={(e) => handleInputChange('discount_percentage', parseInt(e.target.value))}
                    style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, width: '70px' }}
                  />
                ) : (
                  <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900, backgroundColor: '#000', color: '#fff', fontSize: '11px' }}>{text}%</Tag>
                )
              },
              {
                title: 'HOLAT',
                dataIndex: 'is_active',
                key: 'is_active',
                width: 80,
                render: (active, record) => editingId === record.id ? (
                  <Switch
                    checked={editData.is_active}
                    onChange={(checked) => handleInputChange('is_active', checked)}
                  />
                ) : (
                  <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800, color: '#000', backgroundColor: active ? '#fff' : '#eee', fontSize: '11px' }}>
                    {active ? 'FAOL' : "O'CHIK"}
                  </Tag>
                )
              },
              {
                title: 'AMALLAR',
                key: 'actions',
                width: 130,
                render: (_, record) => editingId === record.id ? (
                  <Button
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    style={{
                      borderRadius: 0,
                      backgroundColor: '#000',
                      color: '#fff',
                      fontWeight: 900,
                      border: 'none',
                      height: '38px',
                      padding: '0 16px',
                      fontSize: '12px'
                    }}
                  >SAQLASH</Button>
                ) : (
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                    style={{
                      borderRadius: 0,
                      border: '2px solid #000',
                      fontWeight: 900,
                      height: '38px',
                      padding: '0 16px',
                      fontSize: '12px'
                    }}
                  >TAHRIRLASH</Button>
                ),
              },
            ] : [
              {
                title: 'YULDUZLAR',
                dataIndex: 'stars',
                key: 'stars',
                width: 90,
                render: (stars) => (
                  <Space>
                    <StarOutlined style={{ color: '#000', fontWeight: 900, fontSize: '14px' }} />
                    <Text style={{ fontWeight: 900, fontSize: '12px' }}>{stars} YULDUZ</Text>
                  </Space>
                )
              },
              {
                title: 'ASL NARX ($)',
                dataIndex: 'original_price',
                key: 'original_price',
                width: 90,
                render: (text, record) => editingId === record.id ? (
                  <Input
                    type="number"
                    value={editData.original_price}
                    onChange={(e) => handleInputChange('original_price', parseFloat(e.target.value))}
                    style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, width: '90px' }}
                  />
                ) : (
                  <Text style={{ fontWeight: 700, fontSize: '13px' }}>{text}</Text>
                )
              },
              {
                title: 'CHEGIRMA NARX ($)',
                dataIndex: 'discounted_price',
                key: 'discounted_price',
                width: 100,
                render: (text, record) => editingId === record.id ? (
                  <Input
                    type="number"
                    value={editData.discounted_price}
                    onChange={(e) => handleInputChange('discounted_price', parseFloat(e.target.value))}
                    style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, width: '90px' }}
                  />
                ) : (
                  <Text style={{ fontWeight: 900, fontSize: '13px' }}>{text}</Text>
                )
              },
              {
                title: 'CHEGIRMA (%)',
                dataIndex: 'discount_percentage',
                key: 'discount_percentage',
                width: 80,
                render: (text, record) => editingId === record.id ? (
                  <Input
                    type="number"
                    value={editData.discount_percentage}
                    onChange={(e) => handleInputChange('discount_percentage', parseInt(e.target.value))}
                    style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, width: '70px' }}
                  />
                ) : (
                  <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900, backgroundColor: '#000', color: '#fff', fontSize: '11px' }}>{text}%</Tag>
                )
              },
              {
                title: 'HOLAT',
                dataIndex: 'is_active',
                key: 'is_active',
                width: 80,
                render: (active, record) => editingId === record.id ? (
                  <Switch
                    checked={editData.is_active}
                    onChange={(checked) => handleInputChange('is_active', checked)}
                  />
                ) : (
                  <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800, backgroundColor: active ? '#fff' : '#eee', fontSize: '11px' }}>
                    {active ? 'FAOL' : "O'CHIK"}
                  </Tag>
                )
              },
              {
                title: 'AMALLAR',
                key: 'actions',
                width: 130,
                render: (_, record) => editingId === record.id ? (
                  <Button
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    style={{
                      borderRadius: 0,
                      backgroundColor: '#000',
                      color: '#fff',
                      fontWeight: 900,
                      border: 'none',
                      height: '38px',
                      padding: '0 16px',
                      fontSize: '12px'
                    }}
                  >SAQLASH</Button>
                ) : (
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                    style={{
                      borderRadius: 0,
                      border: '2px solid #000',
                      fontWeight: 900,
                      height: '38px',
                      padding: '0 16px',
                      fontSize: '12px'
                    }}
                  >TAHRIRLASH</Button>
                ),
              },
            ]}
            rowKey="id"
            locale={{
              emptyText: activeTab === 0 ? 'NARXLAR MAVJUD EMAS' : 'YULDUZ PAKETLARI MAVJUD EMAS',
            }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ManagePrices;
