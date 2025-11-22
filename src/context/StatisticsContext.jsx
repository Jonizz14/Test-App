import React, { createContext, useContext, useState, useCallback } from 'react';

const StatisticsContext = createContext();

export const useStatistics = () => {
  const context = useContext(StatisticsContext);
  if (!context) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }
  return context;
};

export const StatisticsProvider = ({ children }) => {
  const [statisticsUpdateTrigger, setStatisticsUpdateTrigger] = useState(0);

  const triggerStatisticsUpdate = useCallback((updateType = 'test_created') => {
    console.log(`Statistics update triggered: ${updateType}`);
    setStatisticsUpdateTrigger(prev => prev + 1);
    
    // Store update type in localStorage for cross-component communication
    localStorage.setItem('lastStatisticsUpdate', JSON.stringify({
      type: updateType,
      timestamp: new Date().toISOString()
    }));
  }, []);

  const getLastUpdate = useCallback(() => {
    const update = localStorage.getItem('lastStatisticsUpdate');
    return update ? JSON.parse(update) : null;
  }, []);

  const value = {
    statisticsUpdateTrigger,
    triggerStatisticsUpdate,
    getLastUpdate,
  };

  return (
    <StatisticsContext.Provider value={value}>
      {children}
    </StatisticsContext.Provider>
  );
};