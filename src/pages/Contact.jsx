import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import apiService from "../data/apiService";
import { useAuth } from "../context/AuthContext";
// import { showSuccess, showError } from "../utils/antdNotification"; // Unused but kept for reference if needed later
import { useSentMessages } from "../context/SentMessagesContext";
import "../styles/Contact.css";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import AuroraHero from "../components/Aurora/AuroraHero";
import 'leaflet/dist/leaflet.css';

const Contact = () => {
  const _navigate = useNavigate();
  const { currentUser: _currentUser } = useAuth();
  const { addMessage } = useSentMessages();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const messageData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    try {
      setIsSubmitting(true);
      const _response = await apiService.submitContactMessage(messageData);

      // Get button rect for animation start
      const rect = e.target.querySelector('button').getBoundingClientRect();

      // Create flying element
      const flyer = document.createElement('div');
      flyer.className = 'flyer-icon';
      flyer.innerHTML = `<span class="material-symbols-outlined">send</span>`;
      flyer.style.left = `${rect.left + rect.width / 2 - 25}px`;
      flyer.style.top = `${rect.top + rect.height / 2 - 25}px`;
      document.body.appendChild(flyer);

      // Save locally as well
      addMessage({
        id: Date.now(),
        ...messageData,
        date: new Date().toISOString()
      });

      // Animation sequence
      setTimeout(() => {
        const target = document.getElementById('header-message-icon');
        const targetRect = target?.getBoundingClientRect();

        if (targetRect) {
          flyer.style.left = `${targetRect.left + (targetRect.width / 2) - 25}px`;
          flyer.style.top = `${targetRect.top + (targetRect.height / 2) - 25}px`;
          flyer.style.transform = 'scale(0.88) rotate(0deg)';
        }
      }, 100);

      setTimeout(() => {
        flyer.style.opacity = '0';
        flyer.style.transform = 'scale(0) rotate(180deg)';
        flyer.style.filter = 'blur(10px) brightness(1.5)';
      }, 850);

      setTimeout(() => {
        if (document.body.contains(flyer)) {
          document.body.removeChild(flyer);
        }

        // Trigger header notification
        window.dispatchEvent(new CustomEvent('itemSaved', {
          detail: { title: String(t('contact.successSent')), icon: 'send', isFullMessage: true }
        }));
      }, 1300);

      // Reset form
      e.target.reset();

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation Logic - Trigger on scroll
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15, // more sensitive for sticky layout
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('section');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  // Fullpage scroll snap logic — identical to Home.jsx
  useEffect(() => {
    const getSnapTargets = () => {
      const hero = document.querySelector('.contact-modern-hero');
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
    const SCROLL_THRESHOLD = 30;
    const COOLDOWN = 1000;

    const updateCurrentIndex = () => {
      const targets = getSnapTargets();
      const scrollY = window.scrollY;
      for (let i = targets.length - 1; i >= 0; i--) {
        if (scrollY >= targets[i].offsetTop - window.innerHeight / 2) {
          currentIndex = i;
          break;
        }
      }
    };
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
      if (isScrolling) {
        e.preventDefault();
        return;
      }
      accumulatedDelta += e.deltaY;
      clearTimeout(deltaTimeout);
      deltaTimeout = setTimeout(() => { accumulatedDelta = 0; }, 150);

      if (Math.abs(accumulatedDelta) > SCROLL_THRESHOLD) {
        const targets = getSnapTargets();
        const maxIndex = targets.length - 1;
        if (!isScrolling) updateCurrentIndex();

        if (accumulatedDelta > 0) {
          if (currentIndex < maxIndex) {
            e.preventDefault();
            snapTo(currentIndex + 1);
          }
        } else {
          if (currentIndex > 0) {
            e.preventDefault();
            snapTo(currentIndex - 1);
          }
        }
        accumulatedDelta = 0;
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => touchStartY = e.touches[0].clientY;
    const handleTouchEnd = (e) => {
      if (isScrolling) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      if (Math.abs(diff) > 50) {
        updateCurrentIndex();
        const targets = getSnapTargets();
        if (diff > 0) {
          if (currentIndex < targets.length - 1) snapTo(currentIndex + 1);
        } else {
          if (currentIndex > 0) snapTo(currentIndex - 1);
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

  return (
    <Layout>
      <div className="modern-contact-page">
        {/* Hero Section */}
        <AuroraHero className="contact-modern-hero">
          <div className="section-container">
            <h1>{t('contact.heroTitle')}</h1>
            <p className="description">{t('contact.heroDesc')}</p>
          </div>
        </AuroraHero>

        <div className="home-sticky-wrapper">
          {/* Section 2: Form Section - Now DARK as requested */}
          <div className="sticky-section-container">
            <section className="contact-modern-form-section dark-section">
              <div className="section-container">
                <div className="split-layout">
                  <div className="split-content">
                    <h2>{t('contact.formTitle')}</h2>
                    <form className="minimal-form" onSubmit={handleSubmit}>
                      <div className="input-row">
                        <input type="text" name="name" placeholder={t('contact.namePlaceholder')} required />
                        <input type="email" name="email" placeholder={t('contact.emailPlaceholder')} required />
                      </div>
                      <input type="tel" name="phone" placeholder={t('contact.phonePlaceholder')} />
                      <div className={`custom-select-wrapper dark ${dropdownOpen ? 'open' : ''}`}>
                        <div className="custom-select-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                          <span>{subject ? t(`contact.subjects.${subject}`) : t('contact.selectSubject')}</span>
                          <span className="material-symbols-outlined custom-arrow">expand_more</span>
                        </div>
                        <ul className="custom-options">
                          {['technical', 'billing', 'feature', 'other'].map(opt => (
                            <li
                              key={opt}
                              className={`custom-option ${subject === opt ? 'selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSubject(opt);
                                setDropdownOpen(false);
                              }}
                            >
                              {t(`contact.subjects.${opt}`)}
                            </li>
                          ))}
                        </ul>
                        <input
                          type="text"
                          name="subject"
                          value={subject}
                          required
                          style={{ opacity: 0, width: 1, height: 1, position: 'absolute', bottom: 0, left: 0, zIndex: -1 }}
                          onChange={() => { }}
                        />
                      </div>
                      <textarea name="message" placeholder={t('contact.messagePlaceholder')} rows="4" required></textarea>
                      <button type="submit" className="btn-modern-submit" disabled={isSubmitting}>
                        {isSubmitting ? t('contact.sending') : t('contact.send')}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Section 3: Info Grid Section */}
          <div className="sticky-section-container">
            <section className="stats-section dark-section">
              <div className="section-container">
                <div className="stats-header">
                  <h2>{t('contact.ourAddress')}</h2>
                </div>
                <div className="contact-map-split">
                  <div className="stats-grid-large">
                    <div className="stat-box" onClick={() => window.open('tel:+998901234567')} style={{ cursor: 'pointer' }}>
                      <span className="stat-label">{t('contact.phone')}</span>
                      <span className="stat-number">+998 90 123 45 67</span>
                    </div>
                    <div className="stat-box" onClick={() => window.open('mailto:info@examify.uz')} style={{ cursor: 'pointer' }}>
                      <span className="stat-label">{t('contact.email')}</span>
                      <span className="stat-number">info@examify.uz</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">{t('contact.address')}</span>
                      <span className="stat-number">{t('contact.addressText')}</span>
                    </div>
                  </div>

                  <div className="map-container custom-map-style">
                    <MapContainer center={[41.210458, 69.221518]} zoom={17} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <CircleMarker center={[41.210458, 69.221518]} radius={10} pathOptions={{ color: 'white', fillColor: '#ef4444', fillOpacity: 1 }}>
                        <Popup>
                          Sergeli ixtisoslashtirilgan maktab <br /> Nilufar ko'chasi 63.
                        </Popup>
                      </CircleMarker>
                    </MapContainer>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;