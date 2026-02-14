import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Aurora from '../components/Aurora/Aurora';
import '../styles/NotFound.css';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="not-found-wrapper" style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Aurora Background Layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }}>
        <Aurora
          colorStops={['#00d2ff', '#3a7bd5', '#00d2ff']}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      {/* Content Layer - Explicitly above Aurora */}
      <div className="not-found-container" style={{
        position: 'relative',
        zIndex: 10,
        backgroundColor: 'transparent'
      }}>
        <div className="not-found-content" style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '4rem',
          borderRadius: '32px'
        }}>
          <div className="not-found-eye">
            <span className="material-symbols-outlined">visibility_off</span>
          </div>

          <h1 className="not-found-code" style={{
            color: '#FFFFFF',
            fontSize: 'clamp(8rem, 20vw, 15rem)',
            fontWeight: '900',
            margin: '0',
            opacity: 1,
            zIndex: 100
          }}>404</h1>

          <div className="not-found-text" style={{ marginTop: '1rem' }}>
            <h2 style={{
              color: '#FFFFFF',
              fontSize: '3.5rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              margin: '0',
              letterSpacing: '0.15em',
              opacity: 1
            }}>
              NOT FOUND
            </h2>
          </div>

          <div className="not-found-actions" style={{
            display: 'flex',
            gap: '1.5rem',
            marginTop: '3.5rem',
            justifyContent: 'center'
          }}>
            <button className="btn-brutalist primary" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>{t('notFound.back', 'ORQAGA')}</span>
            </button>
            <button className="btn-brutalist outline" onClick={() => navigate('/')}>
              <span className="material-symbols-outlined">home</span>
              <span>{t('notFound.home', 'HOME')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
