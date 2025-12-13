import { useState, useEffect } from 'react';

export const useCountdown = (expiryDate) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiryDate) {
      setTimeLeft(null);
      setIsExpired(false);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryDate).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        return;
      }

      setTimeLeft(Math.floor(difference / 1000)); // Convert to seconds
      setIsExpired(false);
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  const formatTime = (seconds) => {
    if (seconds === null || seconds <= 0) {
      return 'Vaqt tugagan';
    }

    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days} kun ${hours} soat ${minutes} daqiqa ${secs} soniya`;
    } else if (hours > 0) {
      return `${hours} soat ${minutes} daqiqa ${secs} soniya`;
    } else if (minutes > 0) {
      return `${minutes} daqiqa ${secs} soniya`;
    } else {
      return `${secs} soniya`;
    }
  };

  return {
    timeLeft,
    isExpired,
    formattedTime: formatTime(timeLeft)
  };
};