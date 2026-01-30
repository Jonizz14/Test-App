import React, { createContext, useContext, useState } from 'react';

const SavedItemsContext = createContext();

export const SavedItemsProvider = ({ children }) => {
  const [savedItems, setSavedItems] = React.useState(() => {
    // Initial state from localStorage
    const saved = localStorage.getItem('examify_saved_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync with localStorage on change
  React.useEffect(() => {
    localStorage.setItem('examify_saved_items', JSON.stringify(savedItems));
  }, [savedItems]);

  const saveItem = (item) => {
    setSavedItems(prev => {
      if (prev.find(i => i.id === item.id)) {
        return prev.map(i => i.id === item.id ? { ...i, ...item, date: new Date().toISOString() } : i);
      }
      return [{ ...item, id: item.id || Date.now(), date: new Date().toISOString() }, ...prev];
    });
  };

  const addNote = () => {
    const newNote = {
      id: Date.now(),
      title: '',
      description: '',
      icon: 'description',
      date: new Date().toISOString(),
      isNote: true
    };
    setSavedItems(prev => [newNote, ...prev]);
    return newNote.id;
  };

  const updateNote = (id, updates) => {
    setSavedItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates, date: new Date().toISOString() } : item
    ));
  };

  const removeItem = (id) => {
    setSavedItems(prev => prev.filter(item => item.id !== id));
  };

  const clearItems = () => {
    setSavedItems([]);
  };

  const toggleSidebar = (state) => {
    setIsSidebarOpen(prev => typeof state === 'boolean' ? state : !prev);
  };

  return (
    <SavedItemsContext.Provider value={{
      savedItems,
      saveItem,
      removeItem,
      clearItems,
      isSidebarOpen,
      toggleSidebar,
      addNote,
      updateNote
    }}>
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
