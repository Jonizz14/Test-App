import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import apiService from "../data/apiService";
import "../styles/Home.css";
import { useSavedItems } from "../context/SavedItemsContext";
import { useTranslation } from "react-i18next";
import { useSettings } from "../context/SettingsContext";
import ReactECharts from 'echarts-for-react';

const Home = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const { t } = useTranslation();

  const videoRef = React.useRef(null);
  const [skipAnimation, setSkipAnimation] = useState(false);

  // Check if coming from onboarding to skip animation
  useEffect(() => {
    const shouldSkip = sessionStorage.getItem('skipHomeAnimation') === 'true';
    if (shouldSkip) {
      setSkipAnimation(true);
      sessionStorage.removeItem('skipHomeAnimation');
    }
  }, []);

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

  // Animation Logic - Trigger on scroll, but only once per section
  useEffect(() => {
    // Skip all animations if coming from onboarding
    if (skipAnimation) {
      const sections = document.querySelectorAll('section');
      sections.forEach(section => section.classList.add('in-view'));
      return;
    }

    const observerOptions = {
      threshold: 0.3,
      rootMargin: '0px 0px -100px 0px'
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
      {/* Hero Section - Full Screen Video */}
      <section className="hero-section">
        <div className="video-background">
          {isDesktop && (
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="/banner/inf1.png"
              aria-hidden="true"
            >
              <source src="/Export-Typeface-Animator (2).mp4" type="video/mp4" />
            </video>
          )}
          {/* Static background for mobile or while video loads */}
          {!isDesktop && <div className="mobile-hero-bg"></div>}
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

      {/* Analytics Section - New ECharts Section */}
      <section className="analytics-section">
        <div className="section-container">
          <div className="section-header">
            <h2>{t('home.analytics.title', 'Platforma Tahlili')}</h2>
            <p>{t('home.analytics.desc', 'Saytning qisqacha statistikasi')}</p>
          </div>

          <div className="charts-grid">
            <div className="chart-item">
              <h3>{t('home.analytics.users', 'Foydalanuvchilar')}</h3>
              <ReactECharts
                option={{
                  animationDuration: 2500,
                  animationEasing: 'cubicOut',
                  tooltip: { trigger: 'item' },
                  legend: { bottom: '5%', left: 'center' },
                  series: [
                    {
                      name: 'Foydalanuvchilar',
                      type: 'pie',
                      radius: ['35%', '65%'],
                      center: ['50%', '45%'],
                      avoidLabelOverlap: false,
                      itemStyle: {
                        borderRadius: 0,
                        borderColor: '#fff',
                        borderWidth: 2
                      },
                      label: { show: false, position: 'center' },
                      emphasis: {
                        label: { show: true, fontSize: 20, fontWeight: 'bold' }
                      },
                      labelLine: { show: false },
                      data: [
                        { value: stats?.students_count || 0, name: 'O\'quvchilar', itemStyle: { color: '#3b82f6' } },
                        { value: stats?.teachers_count || 0, name: 'O\'qituvchilar', itemStyle: { color: '#10b981' } }
                      ]
                    }
                  ]
                }}
                style={{ height: '220px' }}
              />
            </div>

            <div className="chart-item">
              <h3>{t('home.analytics.activity', 'Platforma Faolligi')}</h3>
              <ReactECharts
                option={{
                  animationDuration: 2500,
                  animationEasing: 'cubicOut',
                  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                  xAxis: [
                    {
                      type: 'category',
                      data: ['Testlar', 'Urinishlar', 'Savollar'],
                      axisTick: { alignWithLabel: true }
                    }
                  ],
                  yAxis: [{ type: 'value' }],
                  series: [
                    {
                      name: 'Soni',
                      type: 'bar',
                      barWidth: '60%',
                      data: [
                        { value: stats?.tests_count || 0, itemStyle: { color: '#f59e0b' } },
                        { value: stats?.attempts_count || 0, itemStyle: { color: '#8b5cf6' } },
                        { value: (stats?.tests_count || 0) * 15, itemStyle: { color: '#ec4899' } }
                      ]
                    }
                  ]
                }}
                style={{ height: '220px' }}
              />
            </div>

            {/* Third chart for diversity */}
            <div className="chart-item wide-chart">
              <h3>{t('home.analytics.growth', 'Oylik Yaratilgan Testlar')}</h3>
              <ReactECharts
                option={{
                  animationDuration: 2500,
                  animationEasing: 'cubicOut',
                  xAxis: {
                    type: 'category',
                    data: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul'],
                    boundaryGap: false
                  },
                  yAxis: {
                    type: 'value'
                  },
                  series: [
                    {
                      name: 'Yaratilgan Testlar',
                      data: [120, 132, 191, 234, 190, 330, 310],
                      type: 'line',
                      areaStyle: { color: 'rgba(245, 158, 11, 0.2)' },
                      lineStyle: { color: '#f59e0b', width: 3 },
                      itemStyle: { color: '#f59e0b' },
                      smooth: true
                    }
                  ],
                  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                  tooltip: { trigger: 'axis' }
                }}
                style={{ height: '220px' }}
              />
            </div>

          </div>
        </div>
      </section>


    </Layout>
  );
};

export default Home;
