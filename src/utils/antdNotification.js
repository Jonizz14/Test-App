import { message, notification } from 'antd';

// Success notification
export const showSuccess = (content, duration = 3) => {
  message.success({
    content,
    duration,
    style: {
      marginTop: '20px',
    },
  });
};

// Error notification
export const showError = (content, duration = 4) => {
  message.error({
    content,
    duration,
    style: {
      marginTop: '20px',
    },
  });
};

// Warning notification
export const showWarning = (content, duration = 3) => {
  message.warning({
    content,
    duration,
    style: {
      marginTop: '20px',
    },
  });
};

// Info notification
export const showInfo = (content, duration = 3) => {
  message.info({
    content,
    duration,
    style: {
      marginTop: '20px',
    },
  });
};

// Global notification (appears at top-right)
export const showNotification = (type, title, description, duration = 4.5) => {
  notification[type]({
    message: title,
    description,
    duration,
    placement: 'topRight',
    style: {
      marginTop: '50px',
    },
  });
};

// Success notification
export const showNotificationSuccess = (title, description, duration = 4.5) => {
  showNotification('success', title, description, duration);
};

// Error notification
export const showNotificationError = (title, description, duration = 4.5) => {
  showNotification('error', title, description, duration);
};

// Warning notification
export const showNotificationWarning = (title, description, duration = 4.5) => {
  showNotification('warning', title, description, duration);
};

// Info notification
export const showNotificationInfo = (title, description, duration = 4.5) => {
  showNotification('info', title, description, duration);
};