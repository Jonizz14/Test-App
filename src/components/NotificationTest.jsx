import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { createAdminNotification, createAdminRegistrationNotification } from '../utils/notificationService';

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
    alert('Test notification added! Check the notification bell.');
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
    alert('Test registration notification added! Check the notification bell.');
  };

  const clearNotifications = () => {
    localStorage.removeItem('notifications');
    alert('All notifications cleared!');
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Notification Test (For Development)</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={addTestNotification}
          sx={{ fontSize: '0.8rem' }}
        >
          Add Plan Notification
        </Button>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={addRegistrationNotification}
          sx={{ fontSize: '0.8rem' }}
        >
          Add Registration Notification
        </Button>
        <Button 
          variant="outlined" 
          size="small" 
          color="error"
          onClick={clearNotifications}
          sx={{ fontSize: '0.8rem' }}
        >
          Clear All
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationTest;