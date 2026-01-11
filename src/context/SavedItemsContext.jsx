import React, { createContext, useContext, useState } from 'react';

const SavedItemsContext = createContext();

export const SavedItemsProvider = ({ children }) => {
  const [savedItems, setSavedItems] = React.useState(() => {
    // Initial state from localStorage
    const saved = localStorage.getItem('examify_saved_items');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync with localStorage on change
  React.useEffect(() => {
    localStorage.setItem('examify_saved_items', JSON.stringify(savedItems));
  }, [savedItems]);

  const saveItem = (item) => {
    setSavedItems(prev => {
      // Robust check to avoid duplicates in rapid succession
      if (prev.find(i => i.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeItem = (id) => {
    setSavedItems(prev => prev.filter(item => item.id !== id));
  };

  const clearItems = () => {
    setSavedItems([]);
  };

  return (
    <SavedItemsContext.Provider value={{ savedItems, saveItem, removeItem, clearItems }}>
      {children}
    </SavedItemsContext.Provider>
  );
};

export const useSavedItems = () => {
  const context = useContext(SavedItemsContext);
  if (!context) {
    throw new Error('useSavedItems must be used within a SavedItemsProvider');
  }
  return context;
};
