import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);

  // Set loading state for a specific key
  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  // Set multiple loading states at once
  const setMultipleLoading = useCallback((states) => {
    setLoadingStates(prev => ({
      ...prev,
      ...states
    }));
  }, []);

  // Get loading state for a specific key
  const isLoading = useCallback((key) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  // Check if any loading is happening
  const hasAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  // Global loading controls
  const setGlobalLoadingState = useCallback((isLoading) => {
    setGlobalLoading(isLoading);
  }, []);

  // Clear all loading states
  const clearLoadingStates = useCallback(() => {
    setLoadingStates({});
    setGlobalLoading(false);
  }, []);

  // Get specific loading states for common operations
  const getOperationLoading = useCallback((operation) => {
    return isLoading(`operation_${operation}`);
  }, [isLoading]);

  // Set loading for specific operations
  const setOperationLoading = useCallback((operation, isLoading) => {
    setLoading(`operation_${operation}`, isLoading);
  }, [setLoading]);

  const value = {
    // State
    loadingStates,
    globalLoading,
    
    // Single loading operations
    setLoading,
    isLoading,
    hasAnyLoading,
    
    // Multiple loading operations
    setMultipleLoading,
    
    // Global loading
    setGlobalLoading: setGlobalLoadingState,
    
    // Clear operations
    clearLoadingStates,
    
    // Operation-specific helpers
    getOperationLoading,
    setOperationLoading,
    
    // Predefined operation keys
    operations: {
      AUTH: 'auth',
      USER_DATA: 'user_data',
      TESTS: 'tests',
      QUESTIONS: 'questions',
      SESSIONS: 'sessions',
      ATTEMPTS: 'attempts',
      USERS: 'users',
      STATISTICS: 'statistics',
      PREMIUM: 'premium',
      PRICING: 'pricing',
      GIFTS: 'gifts',
      CONTACT: 'contact'
    }
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};