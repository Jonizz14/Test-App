import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const defaultSettings = {
      header: {
        messages: true,
        storage: true,
        search: true,
        language: true
      },
      welcome: {
        steps: [true, true, true, true, true, true]
      },
      features: {
        textSelection: true,
        homeSaveButton: true,
        flyerAnimation: true
      }
    };

    const savedSettings = localStorage.getItem('appSettings');
    if (!savedSettings) return defaultSettings;

    try {
      const parsed = JSON.parse(savedSettings);
      // Deep merge with defaults to ensure new properties exist
      return {
        header: { ...defaultSettings.header, ...parsed.header },
        welcome: { ...defaultSettings.welcome, ...parsed.welcome },
        features: { ...defaultSettings.features, ...parsed.features }
      };
    } catch (e) {
      console.error('Failed to parse settings', e);
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  const updateHeaderSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      header: {
        ...prev.header,
        [key]: value
      }
    }));
  };

  const updateFeatureSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value
      }
    }));
  };

  const updateWelcomeStep = (index, value) => {
    setSettings(prev => {
      const newSteps = [...prev.welcome.steps];
      newSteps[index] = value;
      return {
        ...prev,
        welcome: {
          ...prev.welcome,
          steps: newSteps
        }
      };
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateHeaderSetting, updateWelcomeStep, updateFeatureSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};
