// Notification service for managing notifications across the app

export const createAdminNotification = (adminData, planType) => {
  const notification = {
    id: `admin-plan-${adminData.id}-${Date.now()}`,
    type: 'admin_plan_selection',
    title: 'Yangi Admin Tarif Tanladi',
    message: `Admin ${adminData.name} (${adminData.email}) ${planType} tarifini tanladi. Tasdiqlash kerak.`,
    adminId: adminData.id,
    adminName: adminData.name,
    adminEmail: adminData.email,
    planType: planType,
    organization: adminData.organization || 'Noma\'lum',
    createdAt: new Date().toISOString(),
    isRead: false
  };

  // Store in localStorage
  const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  existingNotifications.push(notification);
  localStorage.setItem('notifications', JSON.stringify(existingNotifications));

  return notification;
};

export const createAdminRegistrationNotification = (adminData) => {
  const notification = {
    id: `admin-reg-${adminData.id}-${Date.now()}`,
    type: 'admin_registration',
    title: 'Yangi Admin Ro\'yxatdan O\'tdi',
    message: `Yangi admin ${adminData.name} (${adminData.email}) ro'yxatdan o'tdi.`,
    adminId: adminData.id,
    adminName: adminData.name,
    adminEmail: adminData.email,
    organization: adminData.organization || 'Noma\'lum',
    createdAt: new Date().toISOString(),
    isRead: false
  };

  // Store in localStorage
  const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  existingNotifications.push(notification);
  localStorage.setItem('notifications', JSON.stringify(existingNotifications));

  return notification;
};

export const getNotificationsForUser = (user) => {
  if (!user) return [];
  
  const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  
  if (user.role === 'head_admin') {
    // Head admin gets all admin-related notifications
    return allNotifications.filter(n => n.type === 'admin_registration' || n.type === 'admin_plan_selection');
  } else if (user.role === 'admin') {
    // Regular admin gets notifications for their students and events
    return allNotifications.filter(n => n.adminId === user.id || n.studentId === user.id);
  } else {
    // Students and teachers get their specific notifications
    return allNotifications.filter(n => n.studentId === user.id || n.teacherId === user.id);
  }
};

export const markNotificationAsRead = (notificationId) => {
  const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  const updatedNotifications = allNotifications.map(n =>
    n.id === notificationId ? { ...n, isRead: true } : n
  );
  localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
};

export const getUnreadCount = (user) => {
  const notifications = getNotificationsForUser(user);
  return notifications.filter(n => !n.isRead).length;
};