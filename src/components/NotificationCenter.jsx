import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const NotificationCenter = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  const loadNotifications = () => {
    if (currentUser) {
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const userNotifications = allNotifications.filter(n => n.studentId === currentUser.id);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.isRead).length);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser, loadNotifications]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = (notificationId) => {
    const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updatedNotifications = allNotifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    loadNotifications();
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    handleClose();
    // Navigate based on notification type
    if (notification.type === 'lesson_reminder') {
      navigate('/student/lessons');
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ mr: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 400, maxHeight: 500 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Bildirishnomalar
          </Typography>
        </Box>

        {notifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="Bildirishnomalar yo'q" />
          </MenuItem>
        ) : (
          notifications.slice(0, 10).map((notification, index) => (
            <Box key={notification.id}>
              <MenuItem
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                  py: 2
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center">
                      <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        {notification.title}
                      </Typography>
                    </Box>
                    {!notification.isRead && (
                      <Chip label="Yangi" size="small" color="primary" />
                    )}
                  </Box>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {notification.message}
                  </Typography>

                  <Typography variant="caption" color="textSecondary">
                    {new Date(notification.createdAt).toLocaleDateString('uz-UZ')} • {notification.teacherName}
                  </Typography>
                </Box>
              </MenuItem>
              {index < notifications.slice(0, 10).length - 1 && <Divider />}
            </Box>
          ))
        )}

        {notifications.length > 10 && (
          <MenuItem disabled sx={{ justifyContent: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              Ko'proq bildirishnomalar...
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;