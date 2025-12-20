import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="layout-container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section">
            <div className="footer-brand">
              <span className="material-symbols-outlined text-primary">
                school
              </span>
              <span className="text-gray-900 font-bold">Examify</span>
            </div>
            <p className="text-gray-500">
              Sergeli ixtisoslashtirilgan maktab uchun ishlab chiqilgan test tizimi.
            </p>
          </div>

          {/* Quick Links Section */}
          <div className="footer-section">
            <h4>TEZ HAVOLALAR</h4>
            <a onClick={() => navigate('/')}>Bosh sahifa</a>
            <a href="https://sergelitim.uz" target="_blank" rel="noopener noreferrer">Maktab web sahifasi</a>
            <a onClick={() => navigate('/contact')}>Bog'lanish</a>
          </div>

          {/* Contact Section */}
          <div className="footer-section">
            <h4>BOG'LANISH</h4>
            <p className="text-gray-500">
              Sergeli tumani, Toshkent shahri
            </p>
            <p className="text-gray-500">
              +998 90 123 45 67
            </p>
            <p className="text-gray-500">
              info@sergelitim.uz
            </p>
          </div>

          {/* School Info Section */}
          <div className="footer-section">
            <h4>MAKTAB HAQIDA</h4>
            <p className="text-gray-500">
              Sergeli ixtisoslashtirilgan maktab - zamonaviy ta'lim dasturlarini amalga oshiruvchi muassasa.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
