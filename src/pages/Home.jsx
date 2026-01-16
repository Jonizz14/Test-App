import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import apiService from "../data/apiService";
import "../styles/Home.css";
import { useSavedItems } from "../context/SavedItemsContext";
import { useTranslation } from "react-i18next";
import { useSettings } from "../context/SettingsContext";

const Home = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const { t } = useTranslation();

  const videoRef = React.useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        } else {
          entry.target.classList.remove('in-view');
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('section');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.getPublicStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };
    fetchStats();
  }, []);

  const scrollToSection = (className) => {
    const element = document.querySelector(className);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { savedItems, saveItem } = useSavedItems();

  const handleSaveInfo = (e, role) => {
    e.stopPropagation();

    // Check if duplicate before running any animation or logic
    if (savedItems.find(i => i.id === role.id)) {
      window.dispatchEvent(new CustomEvent('saveError', { 
        detail: { message: t('home.alreadySaved'), icon: 'warning' } 
      }));
      return;
    }
    // 2. Flyer Animation logic
    if (settings?.features?.flyerAnimation) {
      // Get start position
      const rect = e.currentTarget.getBoundingClientRect();
      
      // Create flying element immediately
      const flyer = document.createElement('div');
      flyer.className = 'flyer-icon';
      flyer.innerHTML = `<span class="material-symbols-outlined">${role.icon}</span>`;
      flyer.style.left = `${rect.left + rect.width / 2 - 25}px`;
      flyer.style.top = `${rect.top + rect.height / 2 - 25}px`;
      document.body.appendChild(flyer);

      // Wait a moment for the header layout to calculate the NEW position of the bin
      setTimeout(() => {
        const target = document.getElementById('header-storage-bin');
        const targetRect = target?.getBoundingClientRect();

        if (targetRect) {
          flyer.style.left = `${targetRect.left + (targetRect.width / 2) - 25}px`;
          flyer.style.top = `${targetRect.top + (targetRect.height / 2) - 25}px`;
          flyer.style.transform = 'scale(0.88) rotate(0deg)';
        }
      }, 100);

      // Beautiful Disappearance: Implode into the bin
      setTimeout(() => {
        flyer.style.opacity = '0';
        flyer.style.transform = 'scale(0) rotate(180deg)';
        flyer.style.filter = 'blur(10px) brightness(1.5)';
      }, 850);

      // Cleanup and trigger notification
      setTimeout(() => {
        if (document.body.contains(flyer)) {
          document.body.removeChild(flyer);
        }
        
        // Dispatch custom event for Header notification
        window.dispatchEvent(new CustomEvent('itemSaved', { detail: role }));
      }, 1300);
    } else {
      // If no animation, dispatch immediately
      window.dispatchEvent(new CustomEvent('itemSaved', { detail: role }));
    }

    // 1. Save immediately
    saveItem(role);
  };

  const rolesData = [
    {
      id: 'student',
      icon: 'school',
      title: t('home.roles.student.title'),
      description: t('home.roles.student.desc'),
      details: t('home.roles.student.details', { returnObjects: true })
    },
    {
      id: 'teacher',
      icon: 'cast_for_education',
      title: t('home.roles.teacher.title'),
      description: t('home.roles.teacher.desc'),
      details: t('home.roles.teacher.details', { returnObjects: true })
    },
    {
      id: 'admin',
      icon: 'admin_panel_settings',
      title: t('home.roles.admin.title'),
      description: t('home.roles.admin.desc'),
      details: t('home.roles.admin.details', { returnObjects: true })
    }
  ];

  return (
    <Layout>
      {/* Hero Section - Full Screen Video */}
      <section className="hero-section">
        <div className="video-background">
          <video ref={videoRef} autoPlay loop muted playsInline>
            <source src="/Export-Typeface-Animator (2).mp4" type="video/mp4" />
          </video>
          <div className="overlay"></div>
        </div>
        
        <div className="hero-content">
          <h1>{t('home.heroTitle')}</h1>
          <p>{t('home.heroSubtitle')}</p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={() => navigate('/login')}>
              {t('home.start')}
            </button>
            <button className="btn-hero-outline" onClick={() => scrollToSection('.users-section')}>
              {t('home.moreInfo')}
            </button>
          </div>
        </div>
      </section>

      {/* Users Section - Full Screen */}
      <section className="users-section">
        <div className="section-container">
          <div className="section-header">
            <h2>{t('home.forWhom')}</h2>
            <p>{t('home.forWhomDesc')}</p>
          </div>
          
          <div className="roles-showcase">
            {rolesData.map(role => (
              <div key={role.id} className="role-item">
                <div className="role-content">
                  <div className="role-icon">
                    <span className="material-symbols-outlined">{role.icon}</span>
                  </div>
                  <h3>{role.title}</h3>
                  <p>{role.description}</p>
                  <div className="role-details">
                    <ul>
                      {role.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                  {settings?.features?.homeSaveButton && (
                    <button className="save-info-btn" onClick={(e) => handleSaveInfo(e, role)}>
                      <span className="material-symbols-outlined">content_copy</span>
                      <span>{t('home.save')}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Modern Cards */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2>{t('home.tech')}</h2>
            <p>{t('home.techDesc')}</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-content">
                <div className="feature-icon">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <h3>{t('home.features.analytics.title')}</h3>
                <p>{t('home.features.analytics.desc')}</p>
                <div className="feature-visual">
                  <img src="/banner/inf1.png" alt="Analysis" className="feature-img" />
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-content">
                <div className="feature-icon">
                  <span className="material-symbols-outlined">security</span>
                </div>
                <h3>{t('home.features.security.title')}</h3>
                <p>{t('home.features.security.desc')}</p>
                <div className="feature-visual">
                  <img src="/banner/inf2.png" alt="Security" className="feature-img" />
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-content">
                <div className="feature-icon">
                  <span className="material-symbols-outlined">devices</span>
                </div>
                <h3>{t('home.features.flexibility.title')}</h3>
                <p>{t('home.features.flexibility.desc')}</p>
                <div className="feature-visual">
                   <img src="/banner/inf3.png" alt="Flexibility" className="feature-img" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section - Full Screen */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-header">
             <h2>{t('home.stats')}</h2>
          </div>
          
          <div className="stats-grid-large">
            <div className="stat-box">
              <span className="stat-number">{stats?.tests_count || 1500}+</span>
              <span className="stat-label">{t('home.statsLabels.tests')}</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats?.students_count || 800}+</span>
              <span className="stat-label">{t('home.statsLabels.students')}</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats?.teachers_count || 50}+</span>
              <span className="stat-label">{t('home.statsLabels.teachers')}</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats?.attempts_count || 12000}+</span>
              <span className="stat-label">{t('home.statsLabels.attempts')}</span>
            </div>
          </div>
        </div>
      </section>


    </Layout>
  );
};

export default Home;
