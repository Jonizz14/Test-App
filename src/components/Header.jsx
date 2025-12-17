import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="layout-container">
        <div>
          <div className="layout-content-container">
            <div className="logo-section">
              <div className="logo-icon">
                <span className="material-symbols-outlined">school</span>
              </div>
              <h2 className="logo-text">Examify</h2>
            </div>
            
            <nav className="nav-desktop">
              <div className="nav-links">
                <a className="nav-link" href="#">Xususiyatlar</a>
                <a className="nav-link" href="#">Narxlar</a>
                <a className="nav-link" href="#">Bog'lanish</a>
              </div>
              <div className="nav-buttons">
                <button className="btn-secondary" onClick={() => navigate('/login')}>Kirish</button>
                <button className="btn-primary" onClick={() => navigate('/login')}>Ro'yxatdan o'tish</button>
              </div>
            </nav>
            
            <div className="mobile-menu-btn">
              <button className="menu-icon-btn">
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;