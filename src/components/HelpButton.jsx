import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/HelpButton.css';

const HelpButton = ({ onClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Show only on public facing pages
  const allowedPaths = ['/', '/login', '/contact', '/updates'];

  if (!allowedPaths.includes(location.pathname)) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/welcome');
    }
  };

  return (
    <div className="help-button-container">
      <div className="help-btn" onClick={handleClick}>
        <div className="help-icon-box">
          <span className="help-icon">?</span>
        </div>
        <span className="help-text">Nimadirga tushunmadingizmi?</span>
      </div>
    </div>
  );
};

export default HelpButton;
