import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Typography,
  Space,
  Radio,
  Card,
  Tag,
  Divider,
} from 'antd';
import {
  StarOutlined,
} from '@ant-design/icons';
import apiService from '../data/apiService';

const { Text, Title } = Typography;

const PremiumModal = ({ open, onClose, student, onConfirm }) => {
  const [pricing, setPricing] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadPricing();
    }
  }, [open]);

  const loadPricing = async () => {
    try {
      const pricingData = await apiService.get('/pricing/');
      const activePricing = pricingData.results ? pricingData.results.filter(p => p.is_active) : pricingData.filter(p => p.is_active);
      setPricing(activePricing);
      if (activePricing.length > 0) {
        setSelectedPlan(activePricing[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load pricing:', error);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const selectedPricing = pricing.find(p => p.id.toString() === selectedPlan);
      await onConfirm(student.id, selectedPricing);
      onClose();
    } catch (error) {
      console.error('Failed to grant premium:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPlan = () => {
    return pricing.find(p => p.id.toString() === selectedPlan);
  };

  return (
    <Modal
      title={
        <Space>
          <StarOutlined style={{ color: '#000' }} />
          <Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>Premium berish: {student?.name}</Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800 }}>BEKOR QILISH</Button>,
        <Button 
          key="confirm" 
          type="primary" 
          loading={loading} 
          onClick={handleConfirm} 
          style={{ borderRadius: 0, border: '2px solid #000', backgroundColor: '#000', color: '#fff', fontWeight: 900 }}
        >
          PREMIUM BERISH
        </Button>
      ]}
      width={600}
      styles={{
        content: {
          border: '6px solid #000',
          borderRadius: 0,
          boxShadow: '15px 15px 0px #000',
        }
      }}
    >
      <div style={{ padding: '20px 0' }}>
        <Text style={{ display: 'block', marginBottom: '24px', fontWeight: 600, color: '#666' }}>
          O'quvchiga premium berish uchun obuna muddatini tanlang:
        </Text>

        <Radio.Group 
          value={selectedPlan} 
          onChange={(e) => setSelectedPlan(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {pricing.map((plan) => (
              <Card
                key={plan.id}
                hoverable={false}
                onClick={() => setSelectedPlan(plan.id.toString())}
                style={{
                  borderRadius: 0,
                  border: selectedPlan === plan.id.toString() ? '4px solid #000' : '2px solid #eee',
                  transition: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedPlan === plan.id.toString() ? '#fff' : '#fafafa'
                }}
                styles={{ body: { padding: '20px' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Radio value={plan.id.toString()} style={{ transform: 'scale(1.2)' }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ display: 'block', fontWeight: 900, fontSize: '16px', textTransform: 'uppercase' }}>{plan.plan_name}</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <Text style={{ fontWeight: 900, fontSize: '20px', color: '#000' }}>${plan.discounted_price}</Text>
                      <Text style={{ color: '#999', textDecoration: 'line-through' }}>${plan.original_price}</Text>
                      <div style={{ 
                        backgroundColor: '#000', 
                        color: '#fff', 
                        padding: '2px 8px', 
                        fontWeight: 900, 
                        fontSize: '10px' 
                      }}>
                        {plan.discount_percentage}% CHEGIRMA
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </Radio.Group>

        {getSelectedPlan() && (
          <div style={{ 
            marginTop: '32px', 
            padding: '16px', 
            border: '2px solid #000', 
            backgroundColor: '#eee',
            fontWeight: 800
          }}>
            TANLANGAN: {getSelectedPlan().plan_name.toUpperCase()} — ${getSelectedPlan().discounted_price}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PremiumModal;