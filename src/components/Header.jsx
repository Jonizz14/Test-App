import React from 'react';
import '../styles/Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="layout-container">
        <div>
          <div className="layout-content-container">
            {/* Logo */}
            <div className="logo-section">
              <div className="logo-icon">
                <span className="material-symbols-outlined">school</span>
              </div>
              <h2 className="logo-text">Examify</h2>
            </div>
            
            {/* Desktop Menu */}
            <nav className="nav-desktop">
              <div className="nav-links">
                <a className="nav-link" href="#">Xususiyatlar</a>
                <a className="nav-link" href="#">Narxlar</a>
                <a className="nav-link" href="#">Bog'lanish</a>
              </div>
              <div className="nav-buttons">
                <button className="btn-secondary">Kirish</button>
                <button className="btn-primary">Ro'yxatdan o'tish</button>
              </div>
            </nav>
            
            {/* Mobile Menu Button */}
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