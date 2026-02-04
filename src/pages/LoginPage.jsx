import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UnbanModal from '../components/UnbanModal';
import Layout from '../components/Layout';
import '../styles/Login.css';
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  // Dynamic Island State
  const [islandContent, setIslandContent] = useState(null);
  const [islandActive, setIslandActive] = useState(false);

  const { login, currentUser, isAuthenticated, isBanned, isUserCached } = useAuth();
  const navigate = useNavigate();
  const [bannedUser, setBannedUser] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser && !isBanned) {
      const roles = {
        head_admin: '/headadmin',
        admin: '/admin',
        teacher: '/teacher',
        student: '/student',
        seller: '/seller',
        content_manager: '/content-manager'
      };
      navigate(roles[currentUser.role] || '/', { replace: true });
    }
  }, [isAuthenticated, currentUser, isBanned, navigate]);

  const triggerIsland = (type, message, duration = 4000) => {
    setIslandContent({ type, message });
    setIslandActive(true);
    if (type !== 'loading') {
      setTimeout(() => setIslandActive(false), duration);
    }
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...loginData, [name]: value };

    if (name === 'email' && value === 'sellerkatya2010@test.com') {
      newFormData.password = 'sellerkatya2010@test.com';
    }
    setLoginData(newFormData);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBannedUser(null);
    triggerIsland('loading', t('login.systemLogin'));

    try {
      if (isUserCached(loginData.email)) {
        triggerIsland('loading', t('login.loadingData'));
        await new Promise(r => setTimeout(r, 1500));
      }

      const user = await login(loginData.email, loginData.password);

      if (user?.is_banned) {
        setBannedUser(user);
        setIslandActive(false);
        return;
      }

      triggerIsland('success', t('login.welcome'));
      await new Promise(r => setTimeout(r, 1500));

    } catch (err) {
      triggerIsland('error', err.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={`login-page-modern ${isEntering ? 'entering' : ''}`}>
        {/* Dynamic Island */}
        <div className={`dynamic-island-container-login ${islandActive ? 'active' : ''} ${islandContent?.type || ''}`}>
          <div className="island-content-login">
            {islandContent?.type === 'loading' ? (
              <div className="island-spinner-login"></div>
            ) : (
              <span className="material-symbols-outlined">
                {islandContent?.type === 'error' ? 'warning' : islandContent?.type === 'success' ? 'check_circle' : 'info'}
              </span>
            )}
            <span className="island-message-login">{islandContent?.message}</span>
          </div>
        </div>

        <div className="login-visual-bg-modern">
          <div className="blob-modern blob-1-modern"></div>
          <div className="blob-modern blob-2-modern"></div>
        </div>

        <div className="login-card-wrapper-modern">
          <div className="login-card-modern glass-effect-modern">
            <div className="login-card-header-modern">

              <h1>{t('login.title')}</h1>
              <p>{t('login.subtitle')}</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="modern-login-form-content">
              <div className="modern-input-group-field">
                <label>{t('login.idOrEmail')}</label>
                <div className="input-wrapper-modern">
                  <input
                    type="text"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder={t('login.idPlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="modern-input-group-field">
                <label>{t('login.password')}</label>
                <div className="input-wrapper-modern">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="visibility-toggle-modern"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit-btn-modern" disabled={loading}>
                {loading ? (
                  <div className="btn-loader-modern">
                    <div className="spinner-modern"></div>
                    <span>{t('login.loggingIn')}</span>
                  </div>
                ) : (
                  <span>{t('login.login')}</span>
                )}
              </button>
            </form>

            <button className="minimal-back-btn-modern" onClick={() => navigate('/')}>
              {t('login.backHome')}
            </button>
          </div>
        </div>

        <UnbanModal
          open={isBanned || !!bannedUser}
          user={bannedUser || currentUser}
          onClose={() => setBannedUser(null)}
        />
      </div>
    </Layout>
  );
};

export default LoginPage;
