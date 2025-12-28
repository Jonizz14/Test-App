import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/SettingsButton.css';

const SettingsButton = () => {
  const [showMenu, setShowMenu] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <>
      {/* Settings Button */}
      <button
        className={`settings-button ${showMenu ? 'active' : ''}`}
        onClick={() => setShowMenu(!showMenu)}
        aria-label="Settings"
      >
        <span className="material-symbols-outlined">settings</span>
      </button>

      {/* Settings Menu */}
      <div ref={menuRef} className={`settings-menu ${showMenu ? 'open' : ''}`}>
        <button
          className="settings-menu-item"
          onClick={() => {
            toggleTheme();
          }}
        >
          <span className="material-symbols-outlined">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </>
  );
};

export default SettingsButton;