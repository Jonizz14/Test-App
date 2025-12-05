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

  useEffect(() => {
    if (currentUser) {
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const userNotifications = allNotifications.filter(n => n.studentId === currentUser.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifications(userNotifications);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnreadCount(userNotifications.filter(n => !n.isRead).length);
    }
  }, [currentUser]);

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
    // Reload notifications
    if (currentUser) {
      const userNotifications = updatedNotifications.filter(n => n.studentId === currentUser.id);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.isRead).length);
    }
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
          sx: { width: 450, maxHeight: 600, overflow: 'auto' }
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
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
                  py: 1.5,
                  px: 2
                }}
              >
                <Box sx={{ width: '100%', wordWrap: 'break-word' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Box display="flex" alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                      <SchoolIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.2rem' }} />
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                        {notification.title}
                      </Typography>
                    </Box>
                    {!notification.isRead && (
                      <Chip label="Yangi" size="small" color="primary" sx={{ ml: 1, fontSize: '0.7rem', height: '20px' }} />
                    )}
                  </Box>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5, fontSize: '0.85rem', lineHeight: 1.3 }}>
                    {notification.message}
                  </Typography>

                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
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