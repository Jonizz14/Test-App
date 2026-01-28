import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../data/apiService';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const [settings, setSettings] = useState({
    header: {
      messages: true,
      storage: true,
      search: true,
      language: true
    },
    welcome: {
      steps: [true, true, true, true, true, true, true, true, true]
    },
    features: {
      textSelection: true,
      homeSaveButton: true,
      flyerAnimation: true
    }
  });
  const [loading, setLoading] = useState(true);

  // Load settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiService.getSiteSettings();
        // Map backend model to frontend context structure
        setSettings({
          header: {
            messages: data.header_messages,
            storage: data.header_storage,
            search: data.header_search,
            language: data.header_language
          },
          welcome: {
            steps: data.welcome_steps || [true, true, true, true, true, true, true, true, true]
          },
          features: {
            textSelection: data.feature_text_selection,
            homeSaveButton: data.feature_home_save_button,
            flyerAnimation: data.feature_flyer_animation
          }
        });
      } catch (e) {
        console.error('Failed to fetch settings from backend', e);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateBackend = async (data) => {
    if (!isAuthenticated || currentUser?.role !== 'head_admin') return;
    try {
      await apiService.updateSiteSettings(data);
    } catch (e) {
      console.error('Failed to update settings in backend', e);
    }
  };

  const updateHeaderSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      header: {
        ...prev.header,
        [key]: value
      }
    }));
    updateBackend({ [`header_${key}`]: value });
  };

  const updateFeatureSetting = (key, value) => {
    // Frontend key is camelCase, backend field is snake_case with feature_ prefix
    const backendKey = `feature_${key.replace(/([A-Z])/g, "_$1").toLowerCase()}`;
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value
      }
    }));
    updateBackend({ [backendKey]: value });
  };

  const updateWelcomeStep = (index, value) => {
    setSettings(prev => {
      const newSteps = [...prev.welcome.steps];
      newSteps[index] = value;
      const updated = {
        ...prev,
        welcome: {
          ...prev.welcome,
          steps: newSteps
        }
      };
      updateBackend({ welcome_steps: newSteps });
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateHeaderSetting, updateWelcomeStep, updateFeatureSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};
