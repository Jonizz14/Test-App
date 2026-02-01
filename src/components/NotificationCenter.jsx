import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Dropdown,
  Typography,
  Tag,
  Empty,
} from 'antd';
import {
  BellOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getNotificationsForUser, markNotificationAsRead } from '../utils/notificationService';

const { Text, Title } = Typography;

const NotificationCenter = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Use useMemo for initial state computation to avoid setState in effect
  const initialNotifications = useMemo(() => {
    if (currentUser) {
      return getNotificationsForUser(currentUser);
    }
    return [];
  }, [currentUser]);

  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = useMemo(() =>
    notifications.filter(n => !n.isRead).length,
    [notifications]
  );

  const markAsRead = (notificationId) => {
    markNotificationAsRead(notificationId);
    // Reload notifications
    if (currentUser) {
      const userNotifications = getNotificationsForUser(currentUser);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.isRead).length);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    // Navigate based on notification type
    if (notification.type === 'lesson_reminder') {
      navigate('/student/lessons');
    } else if (notification.type === 'admin_registration' || notification.type === 'admin_plan_selection') {
      // Navigate to head admin manage admins page
      navigate('/headadmin/admins');
    }
  };

  const notificationMenu = (
    <div style={{
      width: 450,
      maxHeight: 500,
      overflowY: 'auto',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #f0f0f0',
        borderRadius: '8px 8px 0 0'
      }}>
        <Title level={5} style={{ margin: 0, color: '#1f2937' }}>
          Bildirishnomalar
        </Title>
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Bildirishnomalar yo'q"
          />
        </div>
      ) : (
        <>
          {notifications.slice(0, 10).map((notification, index) => (
            <div key={notification.id}>
              <div
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: notification.isRead ? 'transparent' : '#f0f8ff',
                  cursor: 'pointer',
                  borderBottom: index < notifications.slice(0, 10).length - 1 ? '1px solid #f0f0f0' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!notification.isRead) {
                    e.target.style.backgroundColor = '#e6f7ff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = notification.isRead ? 'transparent' : '#f0f8ff';
                }}
              >
                <div style={{ width: '100%', wordWrap: 'break-word' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      minWidth: 0
                    }}>
                      {notification.type === 'admin_registration' || notification.type === 'admin_plan_selection' ? (
                        <BankOutlined
                          style={{
                            marginRight: '8px',
                            color: '#faad14',
                            fontSize: '16px'
                          }}
                        />
                      ) : (
                        <BankOutlined
                          style={{
                            marginRight: '8px',
                            color: '#1890ff',
                            fontSize: '16px'
                          }}
                        />
                      )}
                      <Text
                        strong
                        style={{
                          fontSize: '14px',
                          lineHeight: 1.2,
                          color: '#1f2937',
                          margin: 0
                        }}
                      >
                        {notification.title}
                      </Text>
                    </div>
                    {!notification.isRead && (
                      <Tag
                        color={notification.type === 'admin_registration' || notification.type === 'admin_plan_selection' ? 'orange' : 'blue'}
                        size="small"
                        style={{ marginLeft: '8px', fontSize: '10px', height: '20px', lineHeight: '18px' }}
                      >
                        Yangi
                      </Tag>
                    )}
                  </div>

                  <Text
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      lineHeight: 1.3,
                      display: 'block',
                      marginBottom: '4px'
                    }}
                  >
                    {notification.message}
                  </Text>

                  <Text
                    type="secondary"
                    style={{ fontSize: '11px' }}
                  >
                    {new Date(notification.createdAt).toLocaleDateString('uz-UZ')} •
                    {notification.type === 'admin_registration' || notification.type === 'admin_plan_selection'
                      ? notification.adminName
                      : notification.teacherName}
                  </Text>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {notifications.length > 10 && (
        <div style={{
          padding: '12px 16px',
          textAlign: 'center',
          borderTop: '1px solid #f0f0f0'
        }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Ko'proq bildirishnomalar...
          </Text>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={notificationMenu}
      trigger={['click']}
      placement="bottomRight"
    >
      <Button
        type="text"
        icon={
          <Badge count={unreadCount} size="small">
            <BellOutlined style={{ fontSize: '18px', color: '#ffffff' }} />
          </Badge>
        }
        style={{
          marginRight: '8px',
          height: '40px',
          width: '40px',
          padding: 0
        }}
      />
    </Dropdown>
  );
};

export default NotificationCenter;