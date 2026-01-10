import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UnbanModal from '../components/UnbanModal';

import { CustomFullScreenLoader } from '../components/CustomLoader';
import { Alert } from 'antd';
import logoImage from '../assets/image.png';
import '../styles/Login.css';

// LoginPage Component - Handles user authentication and admin registration
const LoginPage = () => {
  // State management for login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Authentication context and navigation hook
  const { login, logout, currentUser, isAuthenticated, isBanned, isUserCached, getCachedUser } = useAuth();
  const navigate = useNavigate();
  const [bannedUser, setBannedUser] = useState(null);

  // Redirect authenticated users to their appropriate dashboard (but not if banned)
  useEffect(() => {
    if (isAuthenticated && currentUser && !isBanned) {
      if (currentUser.role === 'head_admin') {
        navigate('/headadmin', { replace: true });
      } else if (currentUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (currentUser.role === 'teacher') {
        navigate('/teacher', { replace: true });
      } else if (currentUser.role === 'student') {
        navigate('/student', { replace: true });
      } else if (currentUser.role === 'seller') {
        navigate('/seller', { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, isBanned, navigate]);

  // Handle login form input changes
  const handleLoginChange = (e) => {
    const newFormData = {
      ...loginData,
      [e.target.name]: e.target.value
    };

    // Auto-fill password for seller
    if (e.target.name === 'email' && e.target.value === 'sellerkatya2010@test.com') {
      newFormData.password = 'sellerkatya2010@test.com';
    }

    setLoginData(newFormData);
  };

  // Handle password visibility toggles
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingMessage('Tizimga kirish...');
    setBannedUser(null);

    try {
      console.log('Login sahifasi: Login urinish -', loginData.email);
      console.log('Current URL:', window.location.href);
      console.log('Current host:', window.location.host);

      // Check if user is already cached (skip loading for cached users)
      if (isUserCached(loginData.email)) {
        console.log('Ma\'lumotlar avval yuklangan, qayta yuklanmaydi');
        setLoadingMessage('Saqlangan ma\'lumotlar tekshirilmoqda...');
        
        // Get cached user data and set it directly
        const cachedUser = getCachedUser();
        if (cachedUser) {
          setCurrentUser(cachedUser);
        }
        
        // Still show loading for 6 seconds for UX
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        console.log('Cached user verified, redirecting...');
        return; // Navigation will be handled by useEffect
      }

      setLoadingMessage('Foydalanuvchi ma\'lumotlari tekshirilmoqda...');
      const user = await login(loginData.email, loginData.password);

      // Check if user is banned
      if (user && user.is_banned) {
        console.log('User is banned, showing unban modal');
        setLoadingMessage('');
        setBannedUser(user);
        return; // Don't proceed with navigation
      }

      // Show loading message based on user role
      if (user.role === 'head_admin') {
        setLoadingMessage('Head Admin ma\'lumotlari yuklanmoqda...');
      } else if (user.role === 'admin') {
        setLoadingMessage('Admin ma\'lumotlari yuklanmoqda...');
      } else if (user.role === 'teacher') {
        setLoadingMessage('O\'qituvchi ma\'lumotlari yuklanmoqda...');
      } else if (user.role === 'student') {
        setLoadingMessage('O\'quvchi ma\'lumotlari yuklanmoqda...');
      } else if (user.role === 'seller') {
        setLoadingMessage('Seller ma\'lumotlari yuklanmoqda...');
      } else {
        setLoadingMessage('Foydalanuvchi ma\'lumotlari yuklanmoqda...');
      }

      // Ensure minimum 6 seconds loading time for better UX
      const loadingPromise = new Promise(resolve => setTimeout(resolve, 6000));
      await loadingPromise;

      console.log('Login muvaffaqiyatli, qayta yo\'naltirish...');

      // Navigation will be handled by useEffect after state updates
    } catch (err) {
      console.error('Login xatosi:', err);
      console.error('Xato tafsilotlari:', err.message);
      console.error('Xato stack:', err.stack);

      // Display user-friendly error messages
      setError(err.message || 'Login xatosi yuz berdi. Qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="login-page">


      {/* Custom Full Screen Loader */}
      {loading && (
        <CustomFullScreenLoader 
          message={loadingMessage || 'Yuklanmoqda...'}
          size="large"
        />
      )}

      <div className="layout-container">
        <div>
          <div className="login-card" style={{ maxWidth: 660 }}>
            <div className="login-header">
              <div className="login-icon">
                <span className="material-symbols-outlined">
                  login
                </span>
              </div>
              <h2 className="login-form-title">Tizimga kirish</h2>
              <p className="login-form-subtitle">
                Hisobingizga kirish uchun ma'lumotlarni kiriting
              </p>
            </div>

            <div className="login-content">
              {/* Alert for already authenticated users */}
              {isAuthenticated && (
                <Alert
                  message={`Siz allaqachon ${currentUser?.name} sifatida kirgansiz.`}
                  type="info"
                  showIcon
                  action={
                    <button
                      className="logout-link"
                      onClick={logout}
                    >
                      Chiqish
                    </button>
                  }
                  style={{ marginBottom: '16px' }}
                />
              )}

              {/* Error alert */}
              {error && (
                <Alert
                  message={error}
                  type={error.includes('muvaffaqiyatli') ? 'success' : 'error'}
                  showIcon
                  closable
                  onClose={() => setError('')}
                  style={{ marginBottom: '16px' }}
                />
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email manzil yoki ID
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    autoComplete="email"
                    autoFocus
                    placeholder="Admin uchun email, o'quvchi/o'qituvchi uchun ID"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Parol
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className="form-input"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      autoComplete="current-password"
                      placeholder="Parolni kiriting"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={handleTogglePasswordVisibility}
                      aria-label="toggle password visibility"
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="form-button"
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        hourglass_top
                      </span>
                      {loadingMessage || 'Kirish...'}
                    </span>
                  ) : (
                    'Kirish'
                  )}
                </button>

                <div className="login-back-btn">
                  <button 
                    className="back-home-btn"
                    onClick={() => navigate('/')}
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Bosh sahifaga qaytish
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Unban Modal for Banned Users */}
      <UnbanModal
        open={isBanned || !!bannedUser}
        user={bannedUser || currentUser}
        onClose={() => {
          setBannedUser(null);
        }} // Modal can be closed for newly banned users
      />
    </div>
  );
};

export default LoginPage;
