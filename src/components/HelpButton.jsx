import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/HelpButton.css';

const HelpButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on these paths
  const allowedPaths = ['/', '/login', '/contact'];
  
  if (!allowedPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <div className="help-button-container">
      <div className="help-btn" onClick={() => navigate('/welcome')}>
        <div className="help-icon-box">
          <span className="help-icon">?</span>
        </div>
        <span className="help-text">Nimadirga tushunmadingizmi?</span>
      </div>
    </div>
  );
};

export default HelpButton;
