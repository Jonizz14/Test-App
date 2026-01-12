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
      <div className="animate__animated animate__fadeIn" style={{ padding: '40px 0' }}>
        {/* Header */}
        <div className="animate__animated animate__fadeInDown" style={{ marginBottom: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
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
              Narxlarni sozlash
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
              Narxlar & Paketlar
            </Title>
            <div style={{ 
              width: '80px', 
              height: '10px', 
              backgroundColor: '#000', 
              margin: '24px 0' 
            }}></div>
            <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
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
                height: '50px',
                padding: '0 24px'
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
              boxShadow: '8px 8px 0px #000',
              fontWeight: 900,
              marginBottom: '32px',
              backgroundColor: '#fff'
            }}
          />
        )}

        {/* Tabs */}
        <div className="animate__animated animate__fadeInUp" style={{ marginBottom: '32px' }}>
          <Tabs
            activeKey={activeTab.toString()}
            onChange={(key) => setActiveTab(parseInt(key))}
            tabBarStyle={{ marginBottom: 0 }}
            items={[
              { 
                key: '0', 
                label: <span style={{ fontWeight: 900, textTransform: 'uppercase', padding: '0 16px' }}>💎 Premium Obunalar</span> 
              },
              { 
                key: '1', 
                label: <span style={{ fontWeight: 900, textTransform: 'uppercase', padding: '0 16px' }}>⭐ Yulduz Paketlari</span> 
              },
            ]}
          />
        </div>

        {/* Pricing Table Section */}
        <div className="animate__animated animate__fadeInUpBig" style={{ 
          border: '4px solid #000', 
          boxShadow: '12px 12px 0px #000', 
          backgroundColor: '#fff',
          overflow: 'hidden'
        }}>
          <Table
            dataSource={activeTab === 0 ? pricing : starPackages}
            loading={loading}
            pagination={false}
            columns={activeTab === 0 ? [
              { 
                title: 'OBUNA TURI', 
                dataIndex: 'plan_name', 
                key: 'plan_name',
                render: (name) => <Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>{name}</Text>
              },
              {
                title: 'ASL NARX ($)',
                dataIndex: 'original_price',
                key: 'original_price',
                render: (text, record) => editingId === record.id ? (
                  <Input
                    type="number"
                    value={editData.original_price}
                    onChange={(e) => handleInputChange('original_price', parseFloat(e.target.value))}
                    style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, width: '100px' }}
                  />
                ) : (
                  <Text style={{ fontWeight: 700 }}>{text}</Text>
                )
              },
              {
                title: 'CHEGIRMA NARX ($)',
                dataIndex: 'discounted_price',
                key: 'discounted_price',
                render: (text, record) => editingId === record.id ? (
                  <Input
                    type="number"
                    value={editData.discounted_price}
                    onChange={(e) => handleInputChange('discounted_price', parseFloat(e.target.value))}
                    style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, width: '100px' }}
                  />
                ) : (
                  <Text style={{ fontWeight: 900, color: '#000' }}>{text}</Text>
                )
              },
              {
                title: 'CHEGIRMA (%)',
                dataIndex: 'discount_percentage',
                key: 'discount_percentage',
                render: (text, record) => editingId === record.id ? (
                  <Input
                    type="number"
                    value={editData.discount_percentage}
                    onChange={(e) => handleInputChange('discount_percentage', parseInt(e.target.value))}
                    style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, width: '80px' }}
                  />
                ) : (
                  <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900, backgroundColor: '#000', color: '#fff' }}>{text}%</Tag>
                )
              },
              {
                title: 'HOLAT',
                dataIndex: 'is_active',
                key: 'is_active',
                render: (active, record) => editingId === record.id ? (
                  <Switch
                    checked={editData.is_active}
                    onChange={(checked) => handleInputChange('is_active', checked)}
                  />
                ) : (
                  <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800, color: '#000', backgroundColor: active ? '#fff' : '#eee' }}>
                    {active ? 'FAOL' : 'O\'CHIK'}
                  </Tag>
                )
              },
              {
                title: 'AMALLAR',
                key: 'actions',
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
                      height: '42px',
                      width: '150px',
                      padding: '0 20px'
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
                      height: '42px',
                      width: '150px',
                      padding: '0 20px'
                    }}
                  >TAHRIRLASH</Button>
                ),
              },
            ] : [
              {
                title: 'YULDUZLAR',
                dataIndex: 'stars',
                key: 'stars',
                render: (stars) => (
                  <Space>
                    <StarOutlined style={{ color: '#000', fontWeight: 900 }} />
                    <Text style={{ fontWeight: 900 }}>{stars} YULDUZ</Text>
                  </Space>
                )
              },
              {
                title: 'ASL NARX ($)',
                dataIndex: 'original_price',
                key: 'original_price',
                render: (text, record) => editingId === record.id ? (
                  <Input
                    type="number"
                    value={editData.original_price}
                    onChange={(e) => handleInputChange('original_price', parseFloat(e.target.value))}
                    style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, width: '100px' }}
                  />
                ) : (
                  <Text style={{ fontWeight: 700 }}>{text}</Text>
                )
              },
              {
                title: 'CHEGIRMA NARX ($)',
                dataIndex: 'discounted_price',
                key: 'discounted_price',
                render: (text, record) => editingId === record.id ? (
                  <Input
                    type="number"
                    value={editData.discounted_price}
                    onChange={(e) => handleInputChange('discounted_price', parseFloat(e.target.value))}
                    style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, width: '100px' }}
                  />
                ) : (
                  <Text style={{ fontWeight: 900 }}>{text}</Text>
                )
              },
              {
                title: 'CHEGIRMA (%)',
                dataIndex: 'discount_percentage',
                key: 'discount_percentage',
                render: (text, record) => editingId === record.id ? (
                  <Input
                    type="number"
                    value={editData.discount_percentage}
                    onChange={(e) => handleInputChange('discount_percentage', parseInt(e.target.value))}
                    style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, width: '80px' }}
                  />
                ) : (
                  <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900, backgroundColor: '#000', color: '#fff' }}>{text}%</Tag>
                )
              },
              {
                title: 'MASHHUR',
                dataIndex: 'is_popular',
                key: 'is_popular',
                render: (popular, record) => editingId === record.id ? (
                  <Switch
                    checked={editData.is_popular}
                    onChange={(checked) => handleInputChange('is_popular', checked)}
                  />
                ) : (
                  <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800, backgroundColor: popular ? '#000' : '#fff', color: popular ? '#fff' : '#000' }}>
                    {popular ? 'HA' : 'YO\'Q'}
                  </Tag>
                )
              },
              {
                title: 'HOLAT',
                dataIndex: 'is_active',
                key: 'is_active',
                render: (active, record) => editingId === record.id ? (
                  <Switch
                    checked={editData.is_active}
                    onChange={(checked) => handleInputChange('is_active', checked)}
                  />
                ) : (
                  <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800, backgroundColor: active ? '#fff' : '#eee' }}>
                    {active ? 'FAOL' : 'O\'CHIK'}
                  </Tag>
                )
              },
              {
                title: 'AMALLAR',
                key: 'actions',
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
                      height: '42px',
                      width: '150px',
                      padding: '0 20px'
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
                      height: '42px',
                      width: '150px',
                      padding: '0 20px'
                    }}
                  >TAHRIRLASH</Button>
                ),
              },
            ]}
            rowKey="id"
            locale={{
              emptyText: activeTab === 0 ? 'NARXLAR MAVJUD EMAS' : 'YULDUZ PAKETLARI MAVJUD EMAS',
            }}
            scroll={{ x: 1000 }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ManagePrices;