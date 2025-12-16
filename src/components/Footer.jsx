import React from "react";
import "../styles/Footer.css";

const Footer = () => {
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
              Zamonaviy ta'limni biz bilan quring. Oson, tez va ishonchli.
            </p>
          </div>

          {/* Product Section */}
          <div className="footer-section">
            <h4>MAHSULOT</h4>
            <a href="#">Xususiyatlar</a>
            <a href="#">Narxlar</a>
            <a href="#">Yangiliklar</a>
          </div>

          {/* Help Section */}
          <div className="footer-section">
            <h4>YORDAM</h4>
            <a href="#">Markaz</a>
            <a href="#">Qo'llanma</a>
            <a href="#">Bog'lanish</a>
          </div>

          {/* Social Section */}
          <div className="footer-section">
            <h4>IJTIMOIY TARMOQLAR</h4>
            <div className="footer-social">
              <a className="footer-social-link" href="#">
                <span className="material-symbols-outlined">public</span>
              </a>
              <a className="footer-social-link" href="#">
                <span className="material-symbols-outlined">mail</span>
              </a>
              <a className="footer-social-link" href="#">
                <span className="material-symbols-outlined">call</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
