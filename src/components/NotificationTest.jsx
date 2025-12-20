import React from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { createAdminNotification, createAdminRegistrationNotification } from '../utils/notificationService';
import { showSuccess } from '../utils/antdNotification';

const { Title, Text } = Typography;

const NotificationTest = () => {
  const addTestNotification = () => {
    // Create a test admin notification
    const testAdmin = {
      id: 999,
      name: 'Test Admin',
      email: 'test@example.com',
      organization: 'Test Organization'
    };

    createAdminNotification(testAdmin, 'basic');
    showSuccess('Test notification added! Check the notification bell.');
  };

  const addRegistrationNotification = () => {
    // Create a test registration notification
    const testAdmin = {
      id: 998,
      name: 'New Admin',
      email: 'newadmin@example.com',
      organization: 'New Org'
    };

    createAdminRegistrationNotification(testAdmin);
    showSuccess('Test registration notification added! Check the notification bell.');
  };

  const clearNotifications = () => {
    localStorage.removeItem('notifications');
    showSuccess('All notifications cleared!');
  };

  return (
    <Card
      style={{
        marginBottom: '16px',
        border: '1px solid #d9d9d9',
        borderRadius: '8px'
      }}
      styles={{ body: { padding: '16px' } }}
    >
      <Title level={5} style={{ marginBottom: '16px', color: '#1f2937' }}>
        Notification Test (For Development)
      </Title>
      <Space wrap size="small">
        <Button 
          variant="outlined" 
          size="small" 
          onClick={addTestNotification}
        >
          Add Plan Notification
        </Button>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={addRegistrationNotification}
        >
          Add Registration Notification
        </Button>
        <Button 
          variant="outlined" 
          size="small" 
          danger
          onClick={clearNotifications}
        >
          Clear All
        </Button>
      </Space>
    </Card>
  );
};

export default NotificationTest;