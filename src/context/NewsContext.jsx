import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../data/apiService';

const NewsContext = createContext();

export const NewsProvider = ({ children }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = async () => {
    try {
      setLoading(true);
      // Use public list for general viewing, or admin list if logged in?
      // For now, let's use public list as it's accessible to everyone
      const data = await apiService.getPublicNews();
      setNews(data);
    } catch (err) {
      console.error('Failed to fetch news', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const addNews = async (newsItem) => {
    try {
      // Create FormData if media is involved (though frontend might handle it)
      // If newsItem is plain object, convert to FormData locally if needed or let apiService handle it
      // For simplicity here, we assume newsItem is prepared or we handle simple JSON if no file
      
      let payload = newsItem;
      // Note: ManageNews.jsx creates an object with base64 for preview, but backend expects File object usually.
      // We need to ensure ManageNews sends FormData if it has a file.
      
      const response = await apiService.createNews(payload);
      setNews(prev => [response, ...prev]);
      return response;
    } catch (err) {
      console.error('Failed to add news', err);
      throw err;
    }
  };

  const deleteNews = async (id) => {
    try {
      await apiService.deleteNews(id);
      setNews(prev => prev.filter(item => item.id !== id));
    } catch (err) {
       console.error('Failed to delete news', err);
       throw err;
    }
  };

  const updateNews = async (id, updatedData) => {
    try {
      const response = await apiService.updateNews(id, updatedData);
      setNews(prev => prev.map(item => item.id === id ? response : item));
      return response;
    } catch (err) {
      console.error('Failed to update news', err);
      throw err;
    }
  };

  return (
    <NewsContext.Provider value={{ news, loading, error, addNews, deleteNews, updateNews, refreshNews: fetchNews }}>
      {children}
    </NewsContext.Provider>
  );
};

export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};
