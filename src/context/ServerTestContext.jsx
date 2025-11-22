import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../data/apiService';
import { useAuth } from './AuthContext';

const ServerTestContext = createContext();

export const useServerTest = () => {
  const context = useContext(ServerTestContext);
  if (!context) {
    throw new Error('useServerTest must be used within a ServerTestProvider');
  }
  return context;
};

export const ServerTestProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [currentSession, setCurrentSession] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Timer effect
  useEffect(() => {
    let timer;

    if (currentSession && sessionStarted && timeRemaining > 0) {
      timer = setTimeout(() => {
        const newTimeRemaining = Math.max(0, timeRemaining - 1);
        setTimeRemaining(newTimeRemaining);

        // Auto-expire session when time runs out
        if (newTimeRemaining === 0) {
          handleSessionExpired();
        }
      }, 1000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [currentSession, sessionStarted, timeRemaining]);

  const startTestSession = useCallback(async (testId) => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionData = await apiService.startSession(testId);

      setCurrentSession(sessionData);
      setTimeRemaining(sessionData.time_remaining);
      setSessionStarted(true);
      setIsLoading(false);

      return sessionData;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start test session');
      setIsLoading(false);
      throw err;
    }
  }, []);

  const continueTestSession = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionData = await apiService.getSession(sessionId);

      setCurrentSession(sessionData);
      setTimeRemaining(sessionData.time_remaining);
      setSessionStarted(true);
      setIsLoading(false);

      return sessionData;
    } catch (err) {
      if (err.response?.status === 410) {
        // Session expired
        setError('Test session has expired');
        setCurrentSession(null);
        setSessionStarted(false);
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.error || 'Test already completed');
        setCurrentSession(null);
        setSessionStarted(false);
      } else {
        setError(err.response?.data?.error || 'Failed to continue test session');
      }
      setIsLoading(false);
      throw err;
    }
  }, []);

  const updateAnswers = useCallback(async (answers) => {
    if (!currentSession) return;

    try {
      await apiService.updateSessionAnswers(currentSession.session_id, answers);
    } catch (err) {
      console.error('Failed to update answers:', err);
      // Don't throw error for answer updates to avoid disrupting test flow
    }
  }, [currentSession]);

  const submitTest = useCallback(async () => {
    if (!currentSession) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiService.completeSession(currentSession.session_id);

      // Clear session state
      setCurrentSession(null);
      setTimeRemaining(0);
      setSessionStarted(false);
      setIsLoading(false);

      return result;
    } catch (err) {
      if (err.response?.status === 410) {
        setError('Test session has expired');
        setCurrentSession(null);
        setSessionStarted(false);
      } else {
        setError(err.response?.data?.error || 'Failed to submit test');
      }
      setIsLoading(false);
      throw err;
    }
  }, [currentSession]);

  const handleSessionExpired = useCallback(async () => {
    if (!currentSession) return;

    try {
      // Auto-submit the test when time expires
      const result = await submitTest();
      console.log('Test auto-submitted due to time expiry:', result);
    } catch (err) {
      console.error('Failed to auto-submit expired test:', err);
      // Even if auto-submit fails, clear the session
      setCurrentSession(null);
      setTimeRemaining(0);
      setSessionStarted(false);
    }
  }, [currentSession, submitTest]);

  const checkActiveSession = useCallback(async (testId) => {
    if (!currentUser) return null;

    try {
      const sessions = await apiService.get(`/sessions/?student=${currentUser.id}&test=${testId}&active_only=true`);
      
      if (sessions && sessions.length > 0) {
        const activeSession = sessions[0];
        setCurrentSession(activeSession);
        setTimeRemaining(activeSession.time_remaining);
        setSessionStarted(true);
        return activeSession;
      }
      
      return null;
    } catch (err) {
      console.error('Failed to check active session:', err);
      return null;
    }
  }, [currentUser]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setTimeRemaining(0);
    setSessionStarted(false);
    setError(null);
  }, []);

  const value = {
    // State
    currentSession,
    timeRemaining,
    isLoading,
    error,
    sessionStarted,

    // Actions
    startTestSession,
    continueTestSession,
    updateAnswers,
    submitTest,
    checkActiveSession,
    clearSession,
    formatTime,

    // Computed
    isSessionActive: currentSession?.is_active || false,
    hasTimeRemaining: timeRemaining > 0,
  };

  return (
    <ServerTestContext.Provider value={value}>
      {children}
    </ServerTestContext.Provider>
  );
};

export default ServerTestProvider;