import React, { useState, useLayoutEffect } from 'react';
import { ThemeContext } from './ThemeContext';

// Helper function to get initial theme (runs synchronously before render)
const getInitialTheme = () => {
    if (typeof window === 'undefined') return false;
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme === 'dark' || (!savedTheme && prefersDark);
};

export const ThemeProvider = ({ children }) => {
    // Initialize with computed value to avoid setState in effect
    const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

    // Use useLayoutEffect to apply theme class before paint (this is side-effect on external system, not state)
    useLayoutEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
