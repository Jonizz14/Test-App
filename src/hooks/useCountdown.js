import { useState, useEffect, useMemo, useCallback } from 'react';

// Helper to calculate time left
const calculateTimeRemaining = (expiryDate) => {
  if (!expiryDate) return { timeLeft: null, isExpired: false };

  const now = new Date().getTime();
  const expiry = new Date(expiryDate).getTime();
  const difference = expiry - now;

  if (difference <= 0) {
    return { timeLeft: 0, isExpired: true };
  }

  return { timeLeft: Math.floor(difference / 1000), isExpired: false };
};

export const useCountdown = (expiryDate, onExpire) => {
  // Initialize with computed value
  const initialState = useMemo(() => calculateTimeRemaining(expiryDate), [expiryDate]);
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [isExpired, setIsExpired] = useState(initialState.isExpired);

  // Memoize the onExpire callback
  const handleExpire = useCallback(() => {
    if (onExpire) {
      onExpire();
    }
  }, [onExpire]);

  useEffect(() => {
    if (!expiryDate) {
      return;
    }

    const tick = () => {
      const { timeLeft: newTimeLeft, isExpired: newIsExpired } = calculateTimeRemaining(expiryDate);

      setTimeLeft(newTimeLeft);

      if (newIsExpired && !isExpired) {
        setIsExpired(true);
        handleExpire();
      } else if (!newIsExpired && isExpired) {
        setIsExpired(false);
      }
    };

    // Update every second
    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, [expiryDate, handleExpire, isExpired]);

  const formatTime = useCallback((seconds) => {
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
  }, []);

  return {
    timeLeft,
    isExpired,
    formattedTime: formatTime(timeLeft)
  };
};