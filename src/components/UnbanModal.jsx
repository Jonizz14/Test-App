import React, { useState } from 'react';
import {
  Modal,
  Input,
  Button,
  Typography,
  Space,
  Alert,
  Divider,
} from 'antd';
import {
  LockOutlined,
  KeyOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

const UnbanModal = ({ open, onClose }) => {
  const [code, setCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { unbanWithCode, logout } = useAuth();
  const navigate = useNavigate();

  const handleCodeChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 3) {
        const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
        if (nextInput) setTimeout(() => nextInput.focus(), 10);
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.querySelector(`input[data-index="${index - 1}"]`);
      if (prevInput) setTimeout(() => prevInput.focus(), 10);
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      setError('Iltimos, to\'liq 4 ta raqamli kodni kiriting');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await unbanWithCode(fullCode);
      onClose();
    } catch (error) {
      setError('Noto\'g\'ri unban kodi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <Modal
      open={open}
      closable={false}
      footer={null}
      width={500}
      styles={{
        content: {
          border: '6px solid #000',
          borderRadius: 0,
          boxShadow: '15px 15px 0px #000',
          padding: 0
        }
      }}
    >
      <div style={{ backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#000', color: '#fff', padding: '40px 20px' }}>
          <LockOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Profil Bloklangan</Title>
        </div>

        <div style={{ padding: '40px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <KeyOutlined style={{ fontSize: '24px' }} />
              <Text style={{ fontWeight: 900, fontSize: '18px', textTransform: 'uppercase' }}>Unban Kodi</Text>
            </div>
            
            <Text style={{ fontWeight: 600, color: '#666' }}>
              Profilingizni ochish uchun 4 ta raqamli maxsus kodni kiriting
            </Text>

            <Divider style={{ borderTop: '4px solid #000' }} />

            {error && <Alert message={error} type="error" showIcon style={{ border: '2px solid #000', fontWeight: 800, borderRadius: 0 }} />}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', margin: '20px 0' }}>
              {[0, 1, 2, 3].map((index) => (
                <Input
                  key={index}
                  data-index={index}
                  value={code[index]}
                  onChange={(e) => handleCodeChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  style={{
                    width: '60px',
                    height: '80px',
                    textAlign: 'center',
                    fontSize: '32px',
                    fontWeight: 900,
                    border: '4px solid #000',
                    borderRadius: 0,
                    backgroundColor: '#fafafa'
                  }}
                  maxLength={1}
                />
              ))}
            </div>

            <Button
              type="primary"
              size="large"
              block
              loading={isLoading}
              onClick={handleSubmit}
              disabled={code.some(digit => !digit)}
              style={{
                height: '60px',
                backgroundColor: '#000',
                color: '#fff',
                fontWeight: 900,
                fontSize: '18px',
                borderRadius: 0,
                border: '4px solid #000'
              }}
            >
              PROFILNI OCHISH
            </Button>

            <div style={{ margin: '16px 0', fontWeight: 900, color: '#999' }}>YOKI</div>

            <Button
              size="large"
              block
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                height: '60px',
                fontWeight: 800,
                borderRadius: 0,
                border: '3px solid #000'
              }}
            >
              TIZIMDAN CHIQISH
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default UnbanModal;