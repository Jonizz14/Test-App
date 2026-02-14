import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import apiService from "../data/apiService";
import "../styles/Home.css";
import { useSavedItems } from "../context/SavedItemsContext";
import { useTranslation } from "react-i18next";
import { useSettings } from "../context/SettingsContext";
import AuroraHero from "../components/Aurora/AuroraHero";

const Home = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const { t } = useTranslation();

  const videoRef = React.useRef(null);

  // Check if coming from onboarding to skip animation
  const [skipAnimation] = useState(() => {
    const shouldSkip = sessionStorage.getItem('skipHomeAnimation') === 'true';
    if (shouldSkip) {
      sessionStorage.removeItem('skipHomeAnimation');
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);

  // SEO Optimization & Structured Data
  useEffect(() => {
    document.title = "Examify Prep - Zamonaviy Ta'lim Platformasi";

    // Helper to set meta tag
    const setMeta = (name, content) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMeta('description', "Examify Prep - maktab o'quvchilari va o'qituvchilari uchun maxsus testlar, tahlillar va qulay boshqaruv tizimi.");
    setMeta('keywords', "testlar, maktab, o'quvchi, o'qituvchi, ta'lim, examify, onlayn test, O'zbekiston ta'lim");
    setMeta('og:title', "Examify Prep - Kelajagingizni shu yerdan boshlang");
    setMeta('og:description', "Zamonaviy va qulay ta'lim platformasi.");
    setMeta('og:image', "/og-image.jpg");
    setMeta('author', 'Examify Team');

    // JSON-LD Structured Data for Google
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Examify Prep",
      "url": window.location.origin,
      "description": "Zamonaviy ta'lim platformasi",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${window.location.origin}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    let script = document.getElementById('structured-data');
    if (!script) {
      script = document.createElement('script');
      script.id = 'structured-data';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(structuredData);
  }, []);

  // Animation Logic - Trigger on scroll for all sections
  useEffect(() => {
    if (skipAnimation) {
      const sections = document.querySelectorAll('section');
      sections.forEach(section => section.classList.add('in-view'));
      return;
    }

    const observerOptions = {
      threshold: 0.4,
      rootMargin: '0px 0px -150px 0px'
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
  }, [skipAnimation]);
  // Fullpage scroll snap — one scroll = one section
  useEffect(() => {
    const getSnapTargets = () => {
      const hero = document.querySelector('.hero-section');
      const containers = document.querySelectorAll('.sticky-section-container');
      const targets = [];
      if (hero) targets.push(hero);
      containers.forEach(c => targets.push(c));
      return targets;
    };

    let currentIndex = 0;
    let isScrolling = false;
    let accumulatedDelta = 0;
    let deltaTimeout;
    const SCROLL_THRESHOLD = 30; // lower threshold for responsiveness
    const COOLDOWN = 1000; // stricter cooldown

    // Initial sync
    const updateCurrentIndex = () => {
      const targets = getSnapTargets();
      const scrollY = window.scrollY;
      // Find the section that covers the middle of the screen
      for (let i = targets.length - 1; i >= 0; i--) {
        if (scrollY >= targets[i].offsetTop - window.innerHeight / 2) {
          currentIndex = i;
          break;
        }
      }
    };
    // Run once on mount
    setTimeout(updateCurrentIndex, 100);

    const snapTo = (index) => {
      const targets = getSnapTargets();
      if (index < 0 || index >= targets.length) return;
      
      isScrolling = true;
      currentIndex = index;
      targets[index].scrollIntoView({ behavior: 'smooth' });
      
      setTimeout(() => {
        isScrolling = false;
        accumulatedDelta = 0;
      }, COOLDOWN);
    };

    const handleWheel = (e) => {
      // If currently animating a snap, block all wheel input to prevent skipping
      if (isScrolling) {
        e.preventDefault();
        return;
      }

      accumulatedDelta += e.deltaY;
      clearTimeout(deltaTimeout);
      deltaTimeout = setTimeout(() => { accumulatedDelta = 0; }, 150);

      // We only intervene if threshold is met
      if (Math.abs(accumulatedDelta) > SCROLL_THRESHOLD) {
        const targets = getSnapTargets();
        const maxIndex = targets.length - 1;
        
        // Use current tracked index, but valid it lightly against scroll pos if idle
        // (logic: if user used scrollbar, we need to re-sync)
        if (!isScrolling) updateCurrentIndex();

        if (accumulatedDelta > 0) {
          // Scrolling DOWN
          if (currentIndex < maxIndex) {
            e.preventDefault(); // Lock scroll
            snapTo(currentIndex + 1);
          } else {
            // At last section (Stats)
            // Allow natural scroll to footer (don't preventDefault)
            // But if we are visibly continuously scrolling, user might want to go to footer.
            // No strict snap here.
          }
        } else {
          // Scrolling UP
          if (currentIndex > 0) {
            e.preventDefault(); // Lock scroll
            snapTo(currentIndex - 1);
          } else {
            // At top (Hero) - limit bounce
            // e.preventDefault(); 
          }
        }
        accumulatedDelta = 0;
      } else {
        // Small movements - if we are in "snap mode", usually we lock everything
        // unless we are at the very bottom.
        // For now, let small non-triggering scrolls be preventDefaulted if typically problematic?
        // No, let them be, native scroll handles small jitters or touchpad intent better.
      }
    };

    // Touch logic (simplified for swipe)
    let touchStartY = 0;
    const handleTouchStart = (e) => touchStartY = e.touches[0].clientY;
    
    const handleTouchEnd = (e) => {
      if (isScrolling) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      
      if (Math.abs(diff) > 50) {
        updateCurrentIndex(); // Re-sync
        const targets = getSnapTargets();
        
        if (diff > 0) { // Swipe UP (Scroll Down)
          if (currentIndex < targets.length - 1) {
            snapTo(currentIndex + 1);
          }
        } else { // Swipe DOWN (Scroll Up)
          if (currentIndex > 0) {
            snapTo(currentIndex - 1);
          }
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(deltaTimeout);
    };
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

  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Layout>
      {/* Hero Section - Using Aurora for a premium feel */}
      <AuroraHero className="hero-section">
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
      </AuroraHero>

      {/* Sticky Scroll Sections - each slides over the previous */}
      <div className="home-sticky-wrapper">
        {/* Users Section */}
        <div className="sticky-section-container">
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
                    </div>
                    {settings?.features?.homeSaveButton && (
                      <button className="save-info-btn" onClick={(e) => handleSaveInfo(e, role)} title={t('home.save')}>
                        <span className="material-symbols-outlined">content_copy</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Features Section */}
        <div className="sticky-section-container">
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
                      <picture>
                        <source srcSet="/banner/inf1.webp" type="image/webp" />
                        <img
                          src="/banner/inf1.png"
                          alt="Analysis"
                          className="feature-img"
                          width="750"
                          height="500"
                          loading="lazy"
                        />
                      </picture>
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
                      <picture>
                        <source srcSet="/banner/inf2.webp" type="image/webp" />
                        <img
                          src="/banner/inf2.png"
                          alt="Security"
                          className="feature-img"
                          width="750"
                          height="500"
                          loading="lazy"
                        />
                      </picture>
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
                      <picture>
                        <source srcSet="/banner/inf3.webp" type="image/webp" />
                        <img
                          src="/banner/inf3.png"
                          alt="Flexibility"
                          className="feature-img"
                          width="750"
                          height="500"
                          loading="lazy"
                        />
                      </picture>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Statistics Section */}
        <div className="sticky-section-container">
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
        </div>
      </div>

    </Layout>
  );
};

export default Home;

