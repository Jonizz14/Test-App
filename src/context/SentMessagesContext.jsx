import React, { createContext, useContext, useState, useEffect } from 'react';

const SentMessagesContext = createContext();

export const SentMessagesProvider = ({ children }) => {
  const [sentMessages, setSentMessages] = useState(() => {
    // Initial state from localStorage
    const saved = localStorage.getItem('examify_sent_messages');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync with localStorage on change
  useEffect(() => {
    localStorage.setItem('examify_sent_messages', JSON.stringify(sentMessages));
  }, [sentMessages]);

  const addMessage = (message) => {
    // message: { id, name, subject, message, date }
    setSentMessages(prev => [message, ...prev]);
  };

  const removeMessage = (id) => {
    setSentMessages(prev => prev.filter(m => m.id !== id));
  };

  const clearMessages = () => {
    setSentMessages([]);
  };

  return (
    <SentMessagesContext.Provider value={{ sentMessages, addMessage, removeMessage, clearMessages }}>
      {children}
    </SentMessagesContext.Provider>
  );
};

export const useSentMessages = () => {
  const context = useContext(SentMessagesContext);
  if (!context) {
    throw new Error('useSentMessages must be used within a SentMessagesProvider');
  }
  return context;
};
