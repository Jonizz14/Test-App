import React, { useState } from 'react';
import {
  Modal,
  Input,
  Button,
  Typography,
  Space,
  Alert,
} from 'antd';
import {
  WarningOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

const TestUnbanModal = ({
  open,
  onUnbanSuccess,
  onUnbanFail,
  unbanCode,
  setUnbanCode,
  unbanError,
  handleUnbanSubmit
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unbanCode.trim()) return;
    setIsLoading(true);
    const success = await handleUnbanSubmit(unbanCode.trim());
    setIsLoading(false);
    if (success) {
      onUnbanSuccess();
    } else {
      onUnbanFail();
    }
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
      <div style={{ textAlign: 'center' }}>
        <div style={{ backgroundColor: '#000', color: '#fff', padding: '30px' }}>
          <Space direction="vertical">
            <WarningOutlined style={{ fontSize: '40px' }} />
            <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>Ogohlantirishlar Tugadi!</Title>
            <Text style={{ color: '#fff', fontWeight: 700 }}>Testni davom ettirish uchun kodni kiriting</Text>
          </Space>
        </div>

        <div style={{ padding: '30px' }}>
          <Paragraph style={{ fontWeight: 600, color: '#333', marginBottom: '24px' }}>
            Siz 3 ta ogohlantirish oldingiz. Testni davom ettirish uchun quyidagi kodni kiriting.
          </Paragraph>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ width: '20px', height: '20px', backgroundColor: '#000' }} />
            ))}
          </div>

          {unbanError && <Alert message={unbanError} type="error" style={{ border: '2px solid #000', fontWeight: 800, borderRadius: 0, marginBottom: '24px' }} />}

          <form onSubmit={handleSubmit}>
            <Input
              autoFocus
              size="large"
              placeholder="4 TA RAQAM"
              value={unbanCode}
              onChange={(e) => setUnbanCode(e.target.value)}
              maxLength={4}
              style={{
                height: '70px',
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: 900,
                letterSpacing: '0.4em',
                border: '4px solid #000',
                borderRadius: 0,
                marginBottom: '24px',
                fontFamily: 'monospace'
              }}
            />

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isLoading}
              disabled={!unbanCode.trim()}
              style={{
                height: '60px',
                backgroundColor: '#000',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 900,
                borderRadius: 0,
                border: '4px solid #000'
              }}
            >
              TESTNI DAVOM ETTIRISH
            </Button>
          </form>

          <Text style={{ display: 'block', marginTop: '24px', color: '#999', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}>
            KODNI ADMIN PANELDAN OLISHINGIZ MUMKIN
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default TestUnbanModal;