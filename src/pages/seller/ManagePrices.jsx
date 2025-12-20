import React, { useState, useEffect } from 'react';
import { Typography, Button, Input, Alert, Switch, Tabs, Table, Space } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, StarOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import 'antd/dist/reset.css';

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
      setSuccessMessage('Narx muvaffaqiyatli saqlandi');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Saqlashda xatolik yuz berdi');
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <Typography.Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
            Narxlarni boshqarish
          </Typography.Title>
          <Typography.Text style={{ fontSize: '18px', color: '#64748b' }}>
            Premium obuna va yulduz paketlari narxlarini tahrirlang
          </Typography.Text>
        </div>
        {editingId && (
          <Button icon={<CloseOutlined />} onClick={handleCancel} size="large">
            Bekor
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '16px' }}>
        <Tabs
          activeKey={activeTab.toString()}
          onChange={(key) => setActiveTab(parseInt(key))}
          items={[
            { key: '0', label: '💎 Premium Obunalar' },
            { key: '1', label: '⭐ Yulduz Paketlari' },
          ]}
        />
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert
          message={successMessage}
          type="success"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Pricing Table */}
      <Table
        dataSource={activeTab === 0 ? pricing : starPackages}
        loading={loading}
        columns={activeTab === 0 ? [
          { title: 'Obuna turi', dataIndex: 'plan_name', key: 'plan_name' },
          {
            title: 'Asl narx ($)',
            dataIndex: 'original_price',
            key: 'original_price',
            render: (text, record) => editingId === record.id ? (
              <Input
                type="number"
                value={editData.original_price}
                onChange={(e) => handleInputChange('original_price', parseFloat(e.target.value))}
                style={{ width: '100px' }}
              />
            ) : (
              `$${text}`
            )
          },
          {
            title: 'Chegirma narx ($)',
            dataIndex: 'discounted_price',
            key: 'discounted_price',
            render: (text, record) => editingId === record.id ? (
              <Input
                type="number"
                value={editData.discounted_price}
                onChange={(e) => handleInputChange('discounted_price', parseFloat(e.target.value))}
                style={{ width: '100px' }}
              />
            ) : (
              `$${text}`
            )
          },
          {
            title: 'Chegirma (%)',
            dataIndex: 'discount_percentage',
            key: 'discount_percentage',
            render: (text, record) => editingId === record.id ? (
              <Input
                type="number"
                value={editData.discount_percentage}
                onChange={(e) => handleInputChange('discount_percentage', parseInt(e.target.value))}
                style={{ width: '80px' }}
              />
            ) : (
              `${text}%`
            )
          },
          {
            title: 'Faol',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active, record) => editingId === record.id ? (
              <Switch
                checked={editData.is_active}
                onChange={(checked) => handleInputChange('is_active', checked)}
              />
            ) : (
              <Switch checked={active} disabled />
            )
          },
          {
            title: 'Amallar',
            key: 'actions',
            render: (_, record) => editingId === record.id ? (
              <Space>
                <Button 
                  icon={<SaveOutlined />} 
                  onClick={handleSave} 
                  type="primary"
                  style={{ width: '120px', fontSize: '14px' }}
                >Saqlash</Button>
              </Space>
            ) : (
              <Space>
                <Button 
                  icon={<EditOutlined />} 
                  onClick={() => handleEdit(record)}
                  style={{ width: '120px', fontSize: '14px' }}
                >Tahrirlash</Button>
              </Space>
            ),
          },
        ] : [
          {
            title: 'Yulduzlar soni',
            dataIndex: 'stars',
            key: 'stars',
            render: (stars) => (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <StarOutlined style={{ marginRight: '4px', color: '#f59e0b' }} />
                <span>{stars} yulduz</span>
              </div>
            )
          },
          {
            title: 'Asl narx ($)',
            dataIndex: 'original_price',
            key: 'original_price',
            render: (text, record) => editingId === record.id ? (
              <Input
                type="number"
                value={editData.original_price}
                onChange={(e) => handleInputChange('original_price', parseFloat(e.target.value))}
                style={{ width: '100px' }}
              />
            ) : (
              `$${text}`
            )
          },
          {
            title: 'Chegirma narx ($)',
            dataIndex: 'discounted_price',
            key: 'discounted_price',
            render: (text, record) => editingId === record.id ? (
              <Input
                type="number"
                value={editData.discounted_price}
                onChange={(e) => handleInputChange('discounted_price', parseFloat(e.target.value))}
                style={{ width: '100px' }}
              />
            ) : (
              `$${text}`
            )
          },
          {
            title: 'Chegirma (%)',
            dataIndex: 'discount_percentage',
            key: 'discount_percentage',
            render: (text, record) => editingId === record.id ? (
              <Input
                type="number"
                value={editData.discount_percentage}
                onChange={(e) => handleInputChange('discount_percentage', parseInt(e.target.value))}
                style={{ width: '80px' }}
              />
            ) : (
              `${text}%`
            )
          },
          {
            title: 'Mashhur',
            dataIndex: 'is_popular',
            key: 'is_popular',
            render: (popular, record) => editingId === record.id ? (
              <Switch
                checked={editData.is_popular}
                onChange={(checked) => handleInputChange('is_popular', checked)}
              />
            ) : (
              popular ? 'Ha' : 'Yo\'q'
            )
          },
          {
            title: 'Faol',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active, record) => editingId === record.id ? (
              <Switch
                checked={editData.is_active}
                onChange={(checked) => handleInputChange('is_active', checked)}
              />
            ) : (
              <Switch checked={active} disabled />
            )
          },
          {
            title: 'Amallar',
            key: 'actions',
            render: (_, record) => editingId === record.id ? (
              <Space>
                <Button 
                  icon={<SaveOutlined />} 
                  onClick={handleSave} 
                  type="primary"
                  style={{ width: '120px', fontSize: '14px' }}
                >Saqlash</Button>
              </Space>
            ) : (
              <Space>
                <Button 
                  icon={<EditOutlined />} 
                  onClick={() => handleEdit(record)}
                  style={{ width: '120px', fontSize: '14px' }}
                >Tahrirlash</Button>
              </Space>
            ),
          },
        ]}
        rowKey="id"
        locale={{
          emptyText: activeTab === 0 ? 'Narxlar mavjud emas' : 'Yulduz paketlari mavjud emas',
        }}
      />
    </div>
  );
};

export default ManagePrices;