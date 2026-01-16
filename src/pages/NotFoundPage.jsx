import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import '../styles/NotFound.css';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <Layout>
      <div className={`not-found-container ${isVisible ? 'in-view' : ''}`}>
        <div className="not-found-bg-glitch"></div>
        
        <div className="not-found-content">
          <div className="not-found-eye">
            <span className="material-symbols-outlined">visibility_off</span>
          </div>
          
          <h1 className="not-found-code">404</h1>
          
          <div className="not-found-text">
            <h2 className="not-found-title">SAHIFA TOPILMADI</h2>
            <p className="not-found-description">
              Siz qidirayotgan sahifa koinotda adashib qoldi yoki hech qachon mavjud bo'lmagan. 
              Ehtimol, u administrativ ravishda o'chirilgan bo'lishi ham mumkin.
            </p>
          </div>

          <div className="not-found-actions">
            <button className="btn-brutalist primary" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>ORQAGA</span>
            </button>
            <button className="btn-brutalist outline" onClick={() => navigate('/')}>
              <span className="material-symbols-outlined">home</span>
              <span>BOSH SAHIFA</span>
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="brutalist-decor circle-1"></div>
        <div className="brutalist-decor square-1"></div>
        <div className="brutalist-decor cross-1">+</div>
        <div className="brutalist-decor cross-2">+</div>
      </div>
    </Layout>
  );
};

export default NotFoundPage;