import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import '../styles/NotFound.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="not-found-hero">
        <div className="layout-container">
          <div className="not-found-content">
            <h1 className="not-found-code">404</h1>
            <h2 className="not-found-title">Sahifa topilmadi</h2>
            <p className="not-found-description">
              Uzr, siz qidirayotgan sahifa mavjud emas yoki o'chirilgan bo'lishi mumkin. 
              Iltimos, manzilni tekshiring yoki bosh sahifaga qayting.
            </p>
            <div className="not-found-actions">
              <button className="back-btn" onClick={() => navigate(-1)}>
                <span className="material-symbols-outlined">arrow_back</span>
                Orqaga
              </button>
              <button className="home-btn" onClick={() => navigate('/')}>
                <span className="material-symbols-outlined">home</span>
                Bosh sahifa
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundPage;